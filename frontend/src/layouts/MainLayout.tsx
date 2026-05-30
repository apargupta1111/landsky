import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex overflow-hidden">
      <Sidebar />
      {/* On mobile, sidebar is fixed/overlay so main takes full width */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-30 min-w-0">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[80px] md:blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-secondary/5 dark:bg-secondary/10 rounded-full blur-[100px] md:blur-[150px]" />
        </div>

        <Topbar />

        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 z-10 scrollbar-hide">
          {children}
        </div>
      </main>
    </div>
  );
}
