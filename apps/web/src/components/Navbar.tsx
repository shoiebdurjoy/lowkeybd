'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../features/auth/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="navbar-header">
      <style dangerouslySetInnerHTML={{ __html: `
        .navbar-header {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.8);
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          transition: background 0.3s, border-color 0.3s;
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-logo {
          font-size: 1.4rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
        }

        .navbar-logo span {
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          -webkit-text-fill-color: white;
          padding: 2px 6px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 800;
        }

        .navbar-menu {
          display: flex;
          align-items: center;
          gap: 24px;
          list-style: none;
        }

        .navbar-link {
          font-size: 0.95rem;
          font-weight: 600;
          color: #4a5568;
          text-decoration: none;
          padding: 6px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .navbar-link:hover {
          color: #FF416C;
          background: rgba(255, 65, 108, 0.05);
        }

        .navbar-link.active {
          color: #FF416C;
          background: rgba(255, 65, 108, 0.08);
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-greeting {
          font-size: 0.9rem;
          color: #718096;
          font-weight: 500;
        }

        .user-name-link {
          font-weight: 700;
          color: #2d3748;
          text-decoration: none;
          transition: color 0.2s;
        }

        .user-name-link:hover {
          color: #FF416C;
        }

        .btn-auth {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-login {
          background: transparent;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }

        .btn-login:hover {
          background: #f7fafc;
          border-color: #cbd5e0;
        }

        .btn-register {
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          box-shadow: 0 4px 10px rgba(255, 65, 108, 0.15);
        }

        .btn-register:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 14px rgba(255, 65, 108, 0.25);
        }

        .btn-logout {
          background: #edf2f7;
          color: #718096;
          font-weight: 600;
          padding: 8px 14px;
        }

        .btn-logout:hover {
          background: #fed7d7;
          color: #c53030;
        }

        @media (max-width: 768px) {
          .navbar-menu {
            gap: 12px;
          }
          .navbar-link {
            font-size: 0.85rem;
            padding: 4px 8px;
          }
          .user-greeting {
            display: none;
          }
        }

        @media (prefers-color-scheme: dark) {
          .navbar-header {
            background: rgba(10, 10, 10, 0.8);
            border-bottom-color: rgba(34, 34, 34, 0.8);
          }
          .navbar-link {
            color: #a0aec0;
          }
          .navbar-link:hover {
            color: #fff;
            background: rgba(255, 255, 255, 0.05);
          }
          .navbar-link.active {
            color: #FF416C;
            background: rgba(255, 65, 108, 0.12);
          }
          .user-greeting {
            color: #a0aec0;
          }
          .user-name-link {
            color: #e2e8f0;
          }
          .user-name-link:hover {
            color: #FF416C;
          }
          .btn-login {
            color: #e2e8f0;
            border-color: #2d3748;
          }
          .btn-login:hover {
            background: #1a1a1a;
          }
          .btn-logout {
            background: #1a1a1a;
            color: #a0aec0;
          }
          .btn-logout:hover {
            background: rgba(229, 62, 62, 0.15);
            color: #fc8181;
          }
        }
      `}} />
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          LowKeyBD <span>DHAKA</span>
        </Link>

        {!isLoading && (
          <>
            <nav>
              <ul className="navbar-menu">
                <li>
                  <Link href="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/communities" className={`navbar-link ${isActive('/communities') ? 'active' : ''}`}>
                    Communities
                  </Link>
                </li>
                {isAuthenticated && (
                  <>
                    <li>
                      <Link href="/communities/create" className={`navbar-link ${isActive('/communities/create') ? 'active' : ''}`}>
                        Create Hub
                      </Link>
                    </li>
                    <li>
                      <Link href="/posts/create" className={`navbar-link ${isActive('/posts/create') ? 'active' : ''}`}>
                        Create Post
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>

            <div className="navbar-actions">
              {isAuthenticated ? (
                <>
                  <span className="user-greeting">
                    Hub member:{' '}
                    <Link href={`/${user?.username}`} className="user-name-link">
                      u/{user?.username}
                    </Link>
                  </span>
                  <Link href={`/${user?.username}`} className="navbar-link">
                    My Profile
                  </Link>
                  <button onClick={logout} className="btn-auth btn-logout">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="btn-auth btn-login">
                    Login
                  </Link>
                  <Link href="/register" className="btn-auth btn-register">
                    Register
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
