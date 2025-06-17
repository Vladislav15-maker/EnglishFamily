
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { getUserByUsernameForAuth } from '@/lib/store';
import bcrypt from 'bcryptjs';
// import type { UserForAuth } from '@/lib/types'; // Не используется напрямую здесь

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
          return null; // Важно возвращать null при ошибке
        }

        try {
          const user = await getUserByUsernameForAuth(credentials.username);
          console.log('[NextAuth] User fetched from DB for authorize:', user?.username, 'Role:', user?.role);

          if (user && user.password_hash) {
            console.log('[NextAuth] Credentials Password being compared:', `"${credentials.password}"`);
            console.log('[NextAuth] User Password Hash from DB:', `"${user.password_hash}"`);
            console.log('[NextAuth] Comparing password for user:', user.username);

            const isPasswordCorrect = bcrypt.compareSync(credentials.password, user.password_hash);
            console.log('[NextAuth] Password correct:', isPasswordCorrect);

            if (isPasswordCorrect) {
              console.log('[NextAuth] Authentication successful for:', user.username);
              // Возвращаем объект пользователя, который будет сохранен в токене
              return {
                id: user.id, // Убедитесь, что id это строка
                name: user.name,
                username: user.username,
                role: user.role,
                // email: user.email, // если email есть и нужен
              };
            } else {
              console.log('[NextAuth] Incorrect password for user:', user.username);
              return null;
            }
          } else {
            console.log('[NextAuth] User not found or password_hash missing for username:', credentials.username);
            return null;
          }
        } catch (error) {
          console.error('[NextAuth] Error in authorize function:', error);
          // Можно выбросить ошибку или вернуть null
          // throw new Error('Server error during authorization.');
          return null; // Безопаснее вернуть null, чтобы NextAuth обработал это как CredentialsSignin
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // user объект передается только при первом входе после успешной authorize
      if (user) {
        token.id = user.id; // user.id уже должен быть строкой из authorize
        token.role = (user as any).role; // (user as any) чтобы NextAuth не ругался на кастомные поля
        token.username = (user as any).username;
        console.log('[NextAuth] JWT callback, user present:', (user as any).username, 'Token role:', token.role);
      }
      return token;
    },
    async session({ session, token }) {
      // token - это то, что вернул jwt callback
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as ('teacher' | 'student');
        (session.user as any).username = token.username as string;
        // (session.user as any).email = token.email as string; // если email есть
        console.log('[NextAuth] Session callback, session user:', (session.user as any).username, 'Role:', (session.user as any).role);
      }
      return session;
    }
  },
  pages: {
    signIn: '/', // Redirect users to the root page for sign-in
    // error: '/auth/error', // (optional) custom error page
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
