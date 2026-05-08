'use client';

import { Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';

export default function HamburgerButton() {
  const { toggle } = useSidebar();
  return (
    <button
      onClick={toggle}
      className="hamburger"
      aria-label="Open menu"
    >
      <Menu size={16} />
    </button>
  );
}
