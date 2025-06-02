'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    // This state should ideally not be reached due to the redirect,
    // but it's a fallback.
    return null; 
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} LinguaGhana. All rights reserved.
      </footer>
    </div>
  );
}
