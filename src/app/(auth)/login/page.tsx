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

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/translate');
    }
  }, [user, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await login(data);
    } catch (error: any) {
      form.setError('root', { message: error.message || 'Login failed. Please try again.' });
    }
  };

  if (user) {
     // Or a loading spinner while redirecting
    return <div className="flex min-h-screen items-center justify-center"><p>Redirecting...</p></div>;
  }

  return (
    <AuthFormWrapper title="LinguaGhana Login" description="Access your translations and learning tools.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
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
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
          )}
          <Button type="submit" className="w-full btn-animated" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthFormWrapper>
  );
}
