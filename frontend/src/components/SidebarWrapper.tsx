'use client';

import Sidebar from './Sidebar';
import { useSidebar } from './SidebarContext';

export default function SidebarWrapper() {
  const { open, close } = useSidebar();
  return <Sidebar open={open} onClose={close} />;
}
