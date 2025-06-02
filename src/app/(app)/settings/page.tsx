
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
import { useTheme } from '@/contexts/ThemeContext'; // Import useTheme
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUserProfile, sendPasswordReset, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { textSize, setTextSize } = useTextSize();
  const { theme, setTheme } = useTheme(); // Use theme context

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
    try {
      await updateUserProfile({ displayName });
      // Toast for success is handled within AuthContext
    } catch (error: any) {
      // Toast for error is handled within AuthContext, but can be caught here for specific UI changes if needed
    }
  };

  const handlePasswordChange = async () => {
    if (!user || !sendPasswordReset) {
       toast({ title: 'Error', description: 'User not available for password reset.', variant: 'destructive' });
      return;
    }
    try {
      await sendPasswordReset();
      // Toast for success/info is handled within AuthContext
    } catch (error: any) {
      // Toast for error is handled within AuthContext
    }
  };
  
  const handleThemeChange = (selectedTheme: string) => {
     setTheme(selectedTheme as 'light' | 'dark' | 'system');
     // No toast needed here as the theme change is visual
  };

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col gap-8">
      <div className="text-center md:text-left">
        <h1 className="font-headline text-3xl md:text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1 sticky top-20">
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" onClick={() => document.getElementById('profile')?.scrollIntoView({ behavior: 'smooth' })}>
                Profile
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => document.getElementById('appearance')?.scrollIntoView({ behavior: 'smooth' })}>
                Appearance
              </Button>
              <Button variant="ghost" className="w-full justify-start" onClick={() => document.getElementById('accessibility')?.scrollIntoView({ behavior: 'smooth' })}>
                Accessibility
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card id="profile">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input 
                    id="displayName" 
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Your Name"
                    disabled={authLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} readOnly disabled />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" disabled={authLoading}>
                    {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={handlePasswordChange} disabled={authLoading}>
                     {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Separator />

          <Card id="appearance">
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select value={theme} onValueChange={handleThemeChange}>
                  <SelectTrigger id="theme" className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose your preferred theme. &apos;System&apos; will match your operating system&apos;s preference.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Separator />

          <Card id="accessibility">
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
              <CardDescription>Adjust settings for better accessibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="text-size">Text Size</Label>
                 <Select 
                    value={textSize} 
                    onValueChange={(value) => setTextSize(value as 'text-size-sm' | 'text-size-md' | 'text-size-lg')}
                  >
                  <SelectTrigger id="text-size" className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select text size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-size-sm">Small</SelectItem>
                    <SelectItem value="text-size-md">Medium (Default)</SelectItem>
                    <SelectItem value="text-size-lg">Large</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Adjust the application-wide text size. This control is also available in the header.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
