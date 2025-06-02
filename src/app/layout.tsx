
import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { TextSizeProvider } from '@/contexts/TextSizeContext';
import { ThemeProvider } from '@/contexts/ThemeContext'; // Import ThemeProvider

export const metadata: Metadata = {
  title: 'LinguaGhana - Translate Ghanaian Languages',
  description: 'Real-time translation for Twi, Ga, Dagbani, Ewe and English with voice support and AI summaries.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <TextSizeProvider>
            <ThemeProvider> {/* Wrap with ThemeProvider */}
              {children}
              <Toaster />
            </ThemeProvider>
          </TextSizeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
