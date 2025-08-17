
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import AuthFormWrapper from '@/components/auth/AuthFormWrapper';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup, signInWithGoogle, loading, user, initialLoad } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!initialLoad && user) {
      router.push('/translate');
    }
  }, [user, initialLoad, router]);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: SignupFormValues) => {
    try {
      await signup({ email: data.email, password: data.password });
    } catch (error: any) {
      form.setError('root', { message: error.message || 'Signup failed. Please try again.' });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({ title: 'Sign-Up Error', description: 'An unexpected error occurred during Google Sign-Up.', variant: 'destructive' });
    }
  };

  if (initialLoad) {
    return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /><p className="ml-4">Loading...</p></div>;
  }
  
  if (user) {
    return <div className="flex min-h-screen items-center justify-center"><LoadingSpinner size="lg" /><p className="ml-4">Redirecting...</p></div>;
  }

  return (
    <AuthFormWrapper title="Create Account" description="Join Polyglot and start translating.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
          )}
          <Button type="submit" className="w-full btn-animated" disabled={loading}>
            {loading ? <LoadingSpinner size="sm" className="mr-2"/> : null}
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
      </Form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            Or sign up with
          </span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full btn-animated"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        <Chrome className="mr-2 h-4 w-4" />
        Sign up with Google
      </Button>

      <p className="mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </AuthFormWrapper>
  );
}
