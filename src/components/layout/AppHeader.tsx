
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe, LogOut, Settings as SettingsIcon, TextIcon, PanelLeft } from 'lucide-react'; 
import { useTextSize } from '@/contexts/TextSizeContext';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { textSize, setTextSize } = useTextSize();
  const { isMobile } = useSidebar(); // Get sidebar context

  const handleTextSizeChange = (newSize: 'text-size-sm' | 'text-size-md' | 'text-size-lg') => {
    setTextSize(newSize);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm"> {/* z-index adjusted for sidebar */}
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
           {/* Show SidebarTrigger only on desktop if sidebar is not offcanvas, or always on mobile */}
           {/* Logic moved to AppLayout for primary mobile trigger */}
           <div className="hidden md:block"> {/* Desktop trigger */}
             <SidebarTrigger asChild> 
                <Button variant="ghost" size="icon" aria-label="Toggle sidebar">
                    <PanelLeft className="h-5 w-5" />
                </Button>
             </SidebarTrigger>
           </div>
          <Link href="/translate" className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-primary" />
            <span className="font-headline text-xl font-semibold hidden sm:inline">LinguaGhana</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Adjust text size">
                <TextIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Text Size</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleTextSizeChange('text-size-sm')} className={textSize === 'text-size-sm' ? 'bg-accent text-accent-foreground' : ''}>
                Small
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTextSizeChange('text-size-md')} className={textSize === 'text-size-md' ? 'bg-accent text-accent-foreground' : ''}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTextSizeChange('text-size-lg')} className={textSize === 'text-size-lg' ? 'bg-accent text-accent-foreground' : ''}>
                Large
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} data-ai-hint="person avatar" />
                    <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/settings" passHref legacyBehavior>
                  <DropdownMenuItem>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="outline" className="btn-animated">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
