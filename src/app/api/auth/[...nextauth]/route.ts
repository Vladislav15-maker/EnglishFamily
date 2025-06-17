
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByUsernameForAuth } from '@/lib/store';
import bcrypt from 'bcryptjs';
import type { UserForAuth } from '@/lib/types';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Vladislav" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const user = await getUserByUsernameForAuth(credentials.username);

        if (user && user.password_hash && bcrypt.compareSync(credentials.password, user.password_hash)) {
          // Return an object that will be stored in the JWT
          return {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role,
            // email: user.email // if you have email in your UserForAuth type
          };
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt', // Using JSON Web Tokens for session strategy
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist the user id and role to the token right after signin
      if (user) {
        token.id = user.id;
        token.role = (user as any).role; // Cast user to any if role is not directly on User type from next-auth
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as ('teacher' | 'student');
        (session.user as any).username = token.username as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/', // Redirect users to / (login page) if they need to sign in
  },
  secret: process.env.NEXTAUTH_SECRET, // A secret to sign and encrypt tokens
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
