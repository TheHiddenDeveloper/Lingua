
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useState, type FormEvent, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTextSize } from '@/contexts/TextSizeContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Loader2, User, Palette, Accessibility } from 'lucide-react';

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
    <div className="container mx-auto p-4 md:p-6 flex flex-col gap-4 md:gap-6">
      <div className="text-center md:text-left mb-4 md:mb-6">
        <h1 className="font-headline text-2xl sm:text-3xl md:text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm sm:text-base">Manage your account and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="md:col-span-1 md:sticky md:top-20 hidden md:block">
          <Card className="card-animated">
            <CardHeader><CardTitle className="text-lg">Navigation</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' })}><User className="mr-2 h-4 w-4" />Profile</Button>
              <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => document.getElementById('appearance')?.scrollIntoView({ behavior: 'smooth' })}><Palette className="mr-2 h-4 w-4" />Appearance</Button>
              <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => document.getElementById('accessibility')?.scrollIntoView({ behavior: 'smooth' })}><Accessibility className="mr-2 h-4 w-4" />Accessibility</Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6 md:space-y-8">
          <Card id="profile" className="card-animated">
            <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
              <CardTitle className="text-lg sm:text-xl">Profile</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Manage your personal information.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4">
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" disabled={authLoading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} readOnly disabled />
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Button type="submit" disabled={authLoading} className="w-full sm:w-auto btn-animated">
                    {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={handlePasswordChange} disabled={authLoading} className="w-full sm:w-auto btn-animated">
                     {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Change Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Separator className="md:hidden my-4" /> 

          <Card id="appearance" className="card-animated">
            <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
              <CardTitle className="text-lg sm:text-xl">Appearance</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Customize the look and feel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4">
              <div className="space-y-2">
                <Label htmlFor="theme-settings" className="text-sm font-medium">Theme</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger id="theme-settings" className="w-full sm:w-[200px]"><SelectValue placeholder="Select theme" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs sm:text-sm text-muted-foreground">Choose your preferred theme.</p>
              </div>
            </CardContent>
          </Card>

          <Separator className="md:hidden my-4" />

          <Card id="accessibility" className="card-animated">
            <CardHeader className="px-4 sm:px-6 pt-4 pb-2">
              <CardTitle className="text-lg sm:text-xl">Accessibility</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Adjust for better accessibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 sm:px-6 pb-4">
               <div className="space-y-2">
                <Label htmlFor="text-size-settings" className="text-sm font-medium">Text Size</Label>
                 <Select value={textSize} onValueChange={(value) => setTextSize(value as 'text-size-sm' | 'text-size-md' | 'text-size-lg')}>
                  <SelectTrigger id="text-size-settings" className="w-full sm:w-[200px]"><SelectValue placeholder="Select text size" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-size-sm">Small</SelectItem>
                    <SelectItem value="text-size-md">Medium (Default)</SelectItem>
                    <SelectItem value="text-size-lg">Large</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs sm:text-sm text-muted-foreground">Adjust application-wide text size.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
