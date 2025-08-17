"use client";

import React, { createContext, useContext } from 'react';
import { SessionProvider as NextAuthSessionProvider, useSession } from 'next-auth/react';
import type { AppSession } from '@/lib/auth';

interface AuthContextValue {
  session: AppSession | null;
  isLoading: boolean;
  organizationId: string | null;
  userId: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  const authValue: AuthContextValue = {
    session: session as AppSession | null,
    isLoading,
    organizationId: (session as any)?.organizationId || null,
    userId: session?.user?.id || null,
  };

  // Show loading state during auth initialization
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </NextAuthSessionProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook specifically for getting organizationId with fallback
export function useOrganizationId(): string {
  const { organizationId, isLoading } = useAuth();
  
  // Return organizationId from session, fallback to seed org for development
  return organizationId || 'org_seed_1';
}

// Hook to check if user is authenticated
export function useIsAuthenticated(): boolean {
  const { session, isLoading } = useAuth();
  
  if (isLoading) return false;
  return !!session?.user;
}
