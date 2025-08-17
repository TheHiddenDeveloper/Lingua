
'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Languages, Volume2, Mic, FileText } from 'lucide-react';

const mainNavItems = [
  { href: '/translate', label: 'Translator', icon: Languages },
  { href: '/summary', label: 'Summarizer', icon: FileText },
  { href: '/tts', label: 'Text-to-Speech', icon: Volume2 },
  { href: '/vot', label: 'Voice-to-Text', icon: Mic },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, initialLoad } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!initialLoad && !user) {
      router.push('/login');
    }
  }, [user, initialLoad, router]);

  if (initialLoad) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
       <div className="flex min-h-screen items-center justify-center bg-background">
         <p>Redirecting to login...</p>
         <LoadingSpinner size="lg" />
      </div>
    );
  }

  const activeTabValue = mainNavItems.find(item => pathname.startsWith(item.href))?.href || (pathname.startsWith('/settings') || pathname.startsWith('/history') || pathname.startsWith('/help') || pathname.startsWith('/about') ? '' : '/translate');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />

      {!(pathname.startsWith('/settings') || pathname.startsWith('/history') || pathname.startsWith('/help') || pathname.startsWith('/about')) && (
        <div className="hidden md:block border-b sticky top-16 z-30 bg-background/95 backdrop-blur-lg">
          <Tabs value={activeTabValue} className="container mx-auto">
            <TabsList className="grid w-full grid-cols-4 h-auto sm:h-12 bg-transparent p-0">
              {mainNavItems.map((item) => (
                <TabsTrigger
                  key={item.href}
                  value={item.href}
                  asChild
                  className="py-2.5 sm:py-3 data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none hover:bg-muted/50 transition-colors duration-150"
                >
                  <Link href={item.href} className="flex items-center justify-center gap-2 text-sm">
                    <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    {item.label}
                  </Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      )}

      <main className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8 overflow-y-auto mt-2">
        {children}
      </main>

      <footer className="py-4 text-center text-xs sm:text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} Polyglot. All rights reserved.
      </footer>
    </div>
  );
}
