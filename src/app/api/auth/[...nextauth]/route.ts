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
          return null;
        }

        const inputPassword = credentials.password.trim(); 

        try {
          const user = await getUserByUsernameForAuth(credentials.username);
          console.log('[NextAuth] User fetched from DB for authorize:', user?.username, 'Role:', user?.role);

          if (user && user.password_hash) {
            console.log('[NextAuth] Credentials Password for comparison (trimmed):', `"${inputPassword}"`, `(type: ${typeof inputPassword}, length: ${inputPassword.length})`);
            console.log('[NextAuth] User Password Hash from DB:', `"${user.password_hash}"`, `(type: ${typeof user.password_hash}, length: ${user.password_hash.length})`);

            // --- ПРЯМОЙ ТЕСТ BCRYPT ---
            const testPassword = "password123";
            const testHashFromLog = "$2a$10$SgG7.6qF6U.GzF0hA6uHn.X0bXvL4Q8/6Qj5B0xO2KzGq/rS.9LqK";
            console.log('[NextAuth] HARDCODED TEST - Test Password:', `"${testPassword}"`, `(type: ${typeof testPassword}, length: ${testPassword.length})`);
            console.log('[NextAuth] HARDCODED TEST - Test Hash:', `"${testHashFromLog}"`, `(type: ${typeof testHashFromLog}, length: ${testHashFromLog.length})`);
            
            let hardcodedTestResult = false;
            try {
                hardcodedTestResult = bcrypt.compareSync(testPassword, testHashFromLog);
            } catch (e: any) {
                console.error('[NextAuth] Error during hardcoded bcrypt.compareSync:', e.message, e.stack);
            }
            console.log(`[NextAuth] HARDCODED BCRYPT TEST ("${testPassword}" vs "${testHashFromLog}"): ${hardcodedTestResult}`);
            // --- КОНЕЦ ПРЯМОГО ТЕСТА BCRYPT ---

            console.log('[NextAuth] Comparing password for user:', user.username);
            let isPasswordCorrect = false;
            try {
                isPasswordCorrect = bcrypt.compareSync(inputPassword, user.password_hash);
            } catch (e: any) {
                console.error('[NextAuth] Error during user password bcrypt.compareSync:', e.message, e.stack);
            }
            console.log('[NextAuth] Password correct (using inputPassword and user.password_hash):', isPasswordCorrect);

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
            console.log('[NextAuth] User not found or password_hash missing for username:', credentials.username);
            return null;
          }
        } catch (error) {
          console.error('[NextAuth] Error in authorize function:', error);
          return null;
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
        console.log('[NextAuth] JWT callback, user present:', (user as any).username, 'Token role:', token.role);
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
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
