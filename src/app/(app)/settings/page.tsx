
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="container mx-auto max-w-4xl p-4 md:p-6 space-y-8">
       <header className="text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold flex items-center justify-center gap-3">
          <Settings className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">
          Manage your account and application preferences.
        </p>
      </header>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <User className="w-7 h-7 mr-3 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Manage your personal information and security.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-base">Display Name</Label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" disabled={authLoading} className="text-base max-w-sm"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email</Label>
                <Input id="email" type="email" value={email} readOnly disabled className="text-base max-w-sm"/>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Palette className="w-7 h-7 mr-3 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the look and feel of the application.</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Accessibility className="w-7 h-7 mr-3 text-primary" />
              Accessibility
            </CardTitle>
            <CardDescription>Adjust settings for better usability.</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
