'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import SidebarWrapper from './SidebarWrapper';

const AUTH_ROUTES = ['/login', '/signup'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_ROUTES.includes(pathname);

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="app-layout">
      <SidebarWrapper />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
