import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

interface AuthFormWrapperProps {
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthFormWrapper({ title, description, children }: AuthFormWrapperProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-blue-100 dark:to-slate-900 p-4 sm:p-6">
      <Card className="w-full max-w-md shadow-2xl rounded-lg">
        <CardHeader className="text-center p-6">
          <div className="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Globe size={32} />
          </div>
          <CardTitle className="font-headline text-2xl sm:text-3xl">{title}</CardTitle>
          <CardDescription className="text-sm sm:text-base">{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
