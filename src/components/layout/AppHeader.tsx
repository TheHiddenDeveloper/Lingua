
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Globe, LogOut, Settings as SettingsIcon, TextIcon, Menu, History, HelpCircle, Info, Languages, FileText, Volume2, Mic } from 'lucide-react';
import { useTextSize } from '@/contexts/TextSizeContext';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const mainNavItems = [
  { href: '/translate', label: 'Translator', icon: Languages },
  { href: '/summary', label: 'Summarizer', icon: FileText },
  { href: '/tts', label: 'Text-to-Speech', icon: Volume2 },
  { href: '/vot', label: 'Voice-to-Text', icon: Mic },
];

const secondaryNavItems = [
  { href: '/history', label: 'History', icon: History },
  { href: '/help', label: 'Help', icon: HelpCircle },
  { href: '/about', label: 'About', icon: Info },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

const allNavItemsForMobile = [...mainNavItems, ...secondaryNavItems];

export default function AppHeader() {
  const { user, logout } = useAuth();
  const { textSize, setTextSize } = useTextSize();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const handleTextSizeChange = (newSize: 'text-size-sm' | 'text-size-md' | 'text-size-lg') => {
    setTextSize(newSize);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left side: Mobile Menu Trigger and Logo */}
        <div className="flex items-center gap-2">
          {/* Mobile Menu Trigger */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 sm:w-80 p-0 flex flex-col">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2 text-lg">
                     <Globe className="h-6 w-6 text-primary" />
                     Polyglot
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex-1 flex flex-col p-4 space-y-1 overflow-y-auto">
                  {allNavItemsForMobile.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-medium hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                          pathname.startsWith(item.href) ? "bg-muted text-primary" : "text-foreground"
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <item.icon className={cn("h-5 w-5", pathname.startsWith(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link href="/translate" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
            <Globe className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="font-headline text-lg sm:text-xl font-semibold hidden sm:inline">Polyglot</span>
          </Link>
        </div>

        {/* Right side: Desktop Icon Buttons and User Menu */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Desktop Icon Buttons for secondary navigation */}
          <nav className="hidden md:flex items-center gap-0.5">
            {secondaryNavItems.map(item => (
              <TooltipProvider key={item.href} delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      className={cn(pathname.startsWith(item.href) && "bg-accent text-accent-foreground")}
                    >
                      <Link href={item.href} aria-label={item.label}>
                        <item.icon className="h-5 w-5" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </nav>

          <div className="hidden md:block h-6 border-l mx-1 sm:mx-2"></div>


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
                <Button variant="ghost" className="relative h-8 w-8 sm:h-9 sm:w-9 rounded-full">
                  <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} data-ai-hint="person avatar" />
                    <AvatarFallback>{user.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
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
            <Button asChild variant="outline" size="sm" className="btn-animated">
              <Link href="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
