
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
        console.log('[NextAuth] Authorize function called with credentials:', credentials?.username);
        if (!credentials?.username || !credentials?.password) {
          console.error('[NextAuth] Missing username or password');
          return null;
        }

        try {
          const user = await getUserByUsernameForAuth(credentials.username);
          console.log('[NextAuth] User fetched from DB:', user?.username, 'Role:', user?.role);

          if (user && user.password_hash) {
            console.log('[NextAuth] Comparing password for user:', user.username);
            const isPasswordCorrect = bcrypt.compareSync(credentials.password, user.password_hash);
            console.log('[NextAuth] Password correct:', isPasswordCorrect);

            if (isPasswordCorrect) {
              console.log('[NextAuth] Authentication successful for:', user.username);
              return {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
              };
            } else {
              console.log('[NextAuth] Incorrect password for user:', user.username);
              return null;
            }
          } else {
            console.log('[NextAuth] User not found or password_hash missing for:', credentials.username);
            return null;
          }
        } catch (error) {
          console.error('[NextAuth] Error in authorize function:', error);
          // Выбрасываем ошибку, чтобы NextAuth обработал ее как серверную ошибку
          // Это может помочь отобразить более конкретную ошибку или залогировать ее правильно.
          throw new Error('Server error during authorization.');
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
        console.log('[NextAuth] JWT callback, user present:', user.username, 'Token role:', token.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as ('teacher' | 'student');
        (session.user as any).username = token.username as string;
        console.log('[NextAuth] Session callback, session user:', (session.user as any).username, 'Role:', (session.user as any).role);
      }
      return session;
    }
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Включаем debug логи для разработки
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
