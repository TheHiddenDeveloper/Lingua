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

const signupSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], // path of error
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { signup, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/translate');
    }
  }, [user, router]);
  
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
  
  if (user) {
    return <div className="flex min-h-screen items-center justify-center"><p>Redirecting...</p></div>;
  }

  return (
    <AuthFormWrapper title="Create Account" description="Join LinguaGhana and start translating.">
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
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
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
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </AuthFormWrapper>
  );
}
