
'use client';

import { useEffect, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import AppHeader from '@/components/layout/AppHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Languages, Volume2, Mic, Settings, History, FileText, Globe, HelpCircle, Info } from 'lucide-react';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-background">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="p-4">
            <Link href="/translate" className="flex items-center gap-2">
              <Globe className="h-7 w-7 text-primary md:h-6 md:w-6" />
              <h2 className="font-headline text-lg font-semibold text-primary group-data-[collapsible=icon]:hidden">LinguaGhana</h2>
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/translate'}
                  tooltip={{content: "Translator", side: "right", align: "center"}}
                >
                  <Link href="/translate">
                    <Languages className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Translator</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/summary'}
                  tooltip={{content: "AI Summarizer", side: "right", align: "center"}}
                >
                  <Link href="/summary">
                    <FileText className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Summarizer</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/tts'}
                  tooltip={{content: "Text-to-Speech", side: "right", align: "center"}}
                >
                  <Link href="/tts">
                    <Volume2 className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Text-to-Speech</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/vot'}
                  tooltip={{content: "Voice-to-Text", side: "right", align: "center"}}
                >
                  <Link href="/vot">
                    <Mic className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Voice-to-Text</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/history'}
                  tooltip={{content: "Activity History", side: "right", align: "center"}}
                >
                  <Link href="/history">
                    <History className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">History</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/help'}
                  tooltip={{content: "Help Center", side: "right", align: "center"}}
                >
                  <Link href="/help">
                    <HelpCircle className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Help</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/about'}
                  tooltip={{content: "About LinguaGhana", side: "right", align: "center"}}
                >
                  <Link href="/about">
                    <Info className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">About</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === '/settings'}
                  tooltip={{content: "Settings", side: "right", align: "center"}}
                >
                  <Link href="/settings">
                    <Settings className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
          <footer className="py-4 text-center text-sm text-muted-foreground border-t">
            © {new Date().getFullYear()} LinguaGhana. All rights reserved.
          </footer>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

    