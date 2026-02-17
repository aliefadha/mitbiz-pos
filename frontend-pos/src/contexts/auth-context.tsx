import { createContext, useContext, type ReactNode } from 'react';
import { useSession, signOut as signOutAuth } from '../lib/auth-client';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: 'admin' | 'owner' | 'cashier' | undefined;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isLoading } = useSession();

  const logout = async () => {
    await signOutAuth();
  };

    return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        // @ts-ignore
        role: session?.user?.role as 'admin' | 'owner' | 'cashier' | undefined,
        isLoading,
        isAuthenticated: !!session,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
