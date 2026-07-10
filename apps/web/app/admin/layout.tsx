'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../src/features/auth/AuthContext';

const ADMIN_NAV = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/reports', label: 'Reports', icon: '🚩' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: '📋' },
  { href: '/admin/feature-flags', label: 'Feature Flags', icon: '🏁' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isModerator, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (isLoading) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#718096' }}>Loading...</div>;
  }

  if (!isAdmin && !isModerator) {
    router.push('/');
    return null;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-layout {
          display: flex;
          min-height: calc(100vh - 70px);
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }

        .admin-sidebar {
          width: 260px;
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
          padding: 24px 0;
          flex-shrink: 0;
        }

        .admin-sidebar-title {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #a0aec0;
          padding: 0 20px;
          margin-bottom: 12px;
        }

        .admin-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          font-size: 0.92rem;
          font-weight: 600;
          color: #4a5568;
          text-decoration: none;
          transition: all 0.15s ease;
          border-left: 3px solid transparent;
        }

        .admin-nav-item:hover {
          background: rgba(255, 65, 108, 0.04);
          color: #FF416C;
        }

        .admin-nav-item.active {
          background: rgba(255, 65, 108, 0.06);
          color: #FF416C;
          border-left-color: #FF416C;
          font-weight: 700;
        }

        .admin-nav-icon {
          font-size: 1.1rem;
        }

        .admin-content {
          flex: 1;
          padding: 32px 40px;
          background: #ffffff;
          overflow-x: auto;
        }

        .dark {
          .admin-sidebar {
            background: #0a0a0a;
            border-right-color: #1a1a1a;
          }
          .admin-sidebar-title { color: #4a5568; }
          .admin-nav-item { color: #a0aec0; }
          .admin-nav-item:hover {
            background: rgba(255, 65, 108, 0.08);
            color: #FF416C;
          }
          .admin-nav-item.active {
            background: rgba(255, 65, 108, 0.1);
            color: #FF416C;
          }
          .admin-content {
            background: #111;
          }
        }

        @media (max-width: 768px) {
          .admin-layout {
            flex-direction: column;
          }
          .admin-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #e2e8f0;
            padding: 12px 0;
          }
          .admin-content {
            padding: 20px;
          }
        }
      `}} />
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-title">Administration</div>
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </aside>
        <main className="admin-content">
          {children}
        </main>
      </div>
    </>
  );
}
