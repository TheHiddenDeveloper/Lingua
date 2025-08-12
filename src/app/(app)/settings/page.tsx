
'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useState, type FormEvent, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTextSize } from '@/contexts/TextSizeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Loader2, User, Palette, Accessibility, Settings } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUserProfile, sendPasswordReset, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { textSize, setTextSize } = useTextSize();
  const { theme, setTheme } = useTheme();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !updateUserProfile) {
      toast({ title: 'Error', description: 'User not available for profile update.', variant: 'destructive' });
      return;
    }
    try { await updateUserProfile({ displayName }); } catch (error: any) { /* handled in AuthContext */ }
  };

  const handlePasswordChange = async () => {
    if (!user || !sendPasswordReset) {
       toast({ title: 'Error', description: 'User not available for password reset.', variant: 'destructive' });
      return;
    }
    try { await sendPasswordReset(); } catch (error: any) { /* handled in AuthContext */ }
  };

  const handleThemeChange = (selectedTheme: string) => {
     setTheme(selectedTheme as 'light' | 'dark' | 'system');
  };

  return (
    <div className="container mx-auto max-w-4xl p-4 md:p-6 space-y-8 md:space-y-12">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold flex items-center justify-center gap-3">
          <Settings className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">
          Manage your account and application preferences.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Left-side Navigation (for Desktop) */}
        <nav className="hidden md:block md:sticky md:top-24">
          <ul className="space-y-2">
            <li><Button variant="ghost" className="w-full justify-start text-base" onClick={() => document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' })}><User className="mr-3 h-5 w-5" />Profile</Button></li>
            <li><Button variant="ghost" className="w-full justify-start text-base" onClick={() => document.getElementById('appearance')?.scrollIntoView({ behavior: 'smooth' })}><Palette className="mr-3 h-5 w-5" />Appearance</Button></li>
            <li><Button variant="ghost" className="w-full justify-start text-base" onClick={() => document.getElementById('accessibility')?.scrollIntoView({ behavior: 'smooth' })}><Accessibility className="mr-3 h-5 w-5" />Accessibility</Button></li>
          </ul>
        </nav>

        {/* Right-side Content */}
        <div className="md:col-span-2 space-y-10">
          <section id="profile" className="p-6 rounded-lg border bg-muted/20">
            <h2 className="text-2xl font-bold flex items-center mb-4">
              <User className="w-7 h-7 mr-3 text-primary" />
              Profile
            </h2>
            <p className="text-muted-foreground mb-6">Manage your personal information and security.</p>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-base">Display Name</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" disabled={authLoading} className="text-base"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email</Label>
                <Input id="email" type="email" value={email} readOnly disabled className="text-base"/>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button type="submit" disabled={authLoading} className="btn-animated w-full sm:w-auto">
                  {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={handlePasswordChange} disabled={authLoading} className="btn-animated w-full sm:w-auto">
                   {authLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Change Password
                </Button>
              </div>
            </form>
          </section>

          <section id="appearance" className="p-6 rounded-lg border bg-muted/20">
            <h2 className="text-2xl font-bold flex items-center mb-4">
              <Palette className="w-7 h-7 mr-3 text-primary" />
              Appearance
            </h2>
            <p className="text-muted-foreground mb-6">Customize the look and feel of the application.</p>
            <div className="space-y-2">
              <Label htmlFor="theme-settings" className="text-base">Theme</Label>
              <Select value={theme} onValueChange={handleThemeChange}>
                <SelectTrigger id="theme-settings" className="w-full sm:w-[240px] text-base"><SelectValue placeholder="Select theme" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>

          <section id="accessibility" className="p-6 rounded-lg border bg-muted/20">
            <h2 className="text-2xl font-bold flex items-center mb-4">
              <Accessibility className="w-7 h-7 mr-3 text-primary" />
              Accessibility
            </h2>
            <p className="text-muted-foreground mb-6">Adjust settings for better usability.</p>
            <div className="space-y-2">
              <Label htmlFor="text-size-settings" className="text-base">Text Size</Label>
               <Select value={textSize} onValueChange={(value) => setTextSize(value as 'text-size-sm' | 'text-size-md' | 'text-size-lg')}>
                <SelectTrigger id="text-size-settings" className="w-full sm:w-[240px] text-base"><SelectValue placeholder="Select text size" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-size-sm">Small</SelectItem>
                  <SelectItem value="text-size-md">Medium (Default)</SelectItem>
                  <SelectItem value="text-size-lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
