
'use client';
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react';
import type { AuthenticatedUser } from '@/lib/types';
import type React from 'react';
import { createContext, useContext } from 'react';

interface AuthContextType {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  login: (credentials: Record<string, unknown>) => Promise<any>; // signIn from NextAuth
  logout: () => void; // signOut from NextAuth
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderInternalProps {
  children: React.ReactNode;
}

function AuthProviderInternal({ children }: AuthProviderInternalProps) {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  console.log('[AuthContext] Session status:', status, 'Session data:', session);


  // Adapt user from NextAuth session
  let adaptedUser: AuthenticatedUser | null = null;
  if (session && session.user) {
    const sessionUser = session.user as any; // Cast to any to access custom properties like id and role
    adaptedUser = {
      id: sessionUser.id,
      username: sessionUser.username || sessionUser.name || '', // Use username if available
      name: sessionUser.name || sessionUser.username || 'User',
      role: sessionUser.role || 'student', // Default to 'student' if role is not set
      email: sessionUser.email,
    };
    console.log('[AuthContext] Adapted user:', adaptedUser);
  } else if (!isLoading && !session) {
    console.log('[AuthContext] No active session, user is null.');
  }


  const loginFn = async (credentials: Record<string, unknown>) => {
    console.log('[AuthContext] loginFn called with credentials:', credentials?.username);
    // Call NextAuth's signIn. It returns a promise.
    // The redirect behavior is handled by NextAuth based on pages config or callbackUrl.
    const result = await signIn('credentials', { redirect: false, ...credentials });
    console.log('[AuthContext] signIn result:', result);
    if (result && result.error) {
        console.error('[AuthContext] signIn error:', result.error);
    }
    return result;
  };

  const logoutFn = () => {
    console.log('[AuthContext] logoutFn called');
    // Callback URL can be specified to redirect after sign out
    signOut({ callbackUrl: '/' });
  };

  return (
    <AuthContext.Provider value={{ user: adaptedUser, isLoading, login: loginFn, logout: logoutFn }}>
      {children}
    </AuthContext.Provider>
  );
}

// The main AuthProvider now wraps children in SessionProvider from NextAuth
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInternal>{children}</AuthProviderInternal>
    </SessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
