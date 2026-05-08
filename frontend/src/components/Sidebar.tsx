'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authAxios } from '../lib/authAxios'; // adjust path as needed

import {
  LayoutDashboard, PlusCircle, GraduationCap,
  BookOpen, Sun, Moon, Clock, Sparkles, X, LogOut,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';

const API = process.env.NEXT_PUBLIC_API_URL;

interface RecentAssignment {
  _id: string;
  title: string;
  createdAt: string;
}

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/setup', label: 'New Assignment', icon: PlusCircle },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const path = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [recent, setRecent] = useState<RecentAssignment[]>([]);
  const [user, setUser] = useState<any>(null);


useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return;

  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try { setUser(JSON.parse(storedUser)); } catch {}
  }
}, []);

  // Re-fetch recent assignments and close sidebar on route change
  useEffect(() => {
    onClose();

    const token = localStorage.getItem('token');
    if (!token) return;

    authAxios().get(`${API}/assignments`)
      .then((res) => setRecent((res.data.data || []).slice(0, 5)))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'T';

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${open ? 'visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${open ? 'open' : ''}`}>

        {/* Logo */}
        <div style={{
          padding: '18px 16px 14px',
          borderBottom: '1px solid var(--sb-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <GraduationCap size={16} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sb-text-hi)', lineHeight: 1.2 }}>
                GradeAI
              </div>
              <div style={{ fontSize: 11, color: 'var(--sb-text)', marginTop: 1 }}>
                Evaluation Platform
              </div>
            </div>
          </Link>

          {/* Close button — visible on mobile only */}
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: 6,
              background: 'transparent', border: '1px solid var(--sb-border)',
              cursor: 'pointer', color: 'var(--sb-text)',
              flexShrink: 0,
            }}
            className="sidebar-close-btn"
          >
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          <p style={{
            fontSize: 10, fontWeight: 600, color: 'var(--sb-text)',
            letterSpacing: '.08em', textTransform: 'uppercase',
            padding: '0 8px 8px',
            opacity: 0.6,
          }}>
            Menu
          </p>

          {navItems.map((item) => {
            const active = path === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '8px 10px', borderRadius: 7,
                  background: active ? 'var(--sb-active-bg)' : 'transparent',
                  color: active ? 'var(--sb-active)' : 'var(--sb-text)',
                  fontSize: 13.5, fontWeight: active ? 600 : 400,
                  transition: 'all .12s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--sb-text-hi)';
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    (e.currentTarget as HTMLElement).style.background = 'transparent';
                    (e.currentTarget as HTMLElement).style.color = 'var(--sb-text)';
                  }
                }}
                >
                  <item.icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {active && (
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: 'var(--sb-active)', flexShrink: 0,
                    }} />
                  )}
                </div>
              </Link>
            );
          })}

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--sb-border)', margin: '12px 4px' }} />

          {/* Recent */}
          <p style={{
            fontSize: 10, fontWeight: 600, color: 'var(--sb-text)',
            letterSpacing: '.08em', textTransform: 'uppercase',
            padding: '0 8px 8px',
            opacity: 0.6,
          }}>
            Recent
          </p>

          {recent.length === 0 ? (
            <div style={{
              padding: '10px 10px', borderRadius: 7,
              border: '1px dashed var(--sb-border)',
              display: 'flex', alignItems: 'center', gap: 8,
              color: 'var(--sb-text)', fontSize: 12, opacity: 0.6,
            }}>
              <BookOpen size={12} />
              No assignments yet
            </div>
          ) : (
            recent.map((a) => (
              <Link key={a._id} href={`/results?id=${a._id}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 1 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 7,
                  color: 'var(--sb-text)', fontSize: 12.5,
                  transition: 'all .12s', cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover)';
                  (e.currentTarget as HTMLElement).style.color = 'var(--sb-text-hi)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = 'var(--sb-text)';
                }}
                >
                  <Clock size={11} style={{ flexShrink: 0, opacity: 0.5 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {a.title}
                  </span>
                </div>
              </Link>
            ))
          )}
        </nav>

        Bottom
        <div style={{ padding: '10px', borderTop: '1px solid var(--sb-border)' }}>
          {/* Theme toggle */}
          <button onClick={toggle} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            width: '100%', padding: '7px 10px', borderRadius: 7,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--sb-text)', fontSize: 13,
            fontFamily: 'inherit', transition: 'all .12s',
            marginBottom: 2,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--sb-hover)';
            (e.currentTarget as HTMLElement).style.color = 'var(--sb-text-hi)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--sb-text)';
          }}
          aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={14} strokeWidth={1.8} /> : <Moon size={14} strokeWidth={1.8} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>

          {/* Logout */}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            width: '100%', padding: '7px 10px', borderRadius: 7,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--sb-text)', fontSize: 13,
            fontFamily: 'inherit', transition: 'all .12s',
            marginBottom: 10,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--danger-light)';
            (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--sb-text)';
          }}
          aria-label="Logout"
          >
            <LogOut size={14} strokeWidth={1.8} />
            Logout
          </button>

          {/* User */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '8px 10px', borderRadius: 8,
            background: 'var(--sb-surface)',
            border: '1px solid var(--sb-border)',
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
            }}>
              {userInitial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--sb-text-hi)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Teacher'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--sb-active)' }}>
                {user?.role || 'teacher'}
              </div>
            </div>
            <Sparkles size={11} color="var(--sb-active)" style={{ opacity: 0.7 }} />
          </div>
        </div>
      </aside>
    </>
  );
}
