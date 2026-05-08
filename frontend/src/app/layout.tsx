import type { Metadata } from 'next';
import './globals.css';
import ThemeProvider from '@/components/ThemeProvider';
import { SidebarProvider } from '@/components/SidebarContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'GradeAI — Assignment Evaluator',
  description: 'AI-powered student assignment evaluation platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <SidebarProvider>
            <AppShell>
              {children}
            </AppShell>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
