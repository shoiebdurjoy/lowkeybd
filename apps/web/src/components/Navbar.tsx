'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../features/auth/AuthContext';
import { useNotifications } from '../features/notifications/NotificationsContext';

export default function Navbar() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ text: string; type: 'post' | 'community'; id: string; slug?: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/v1/search/suggestions?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSuggestionClick = (sug: { text: string; type: 'post' | 'community'; id: string; slug?: string }) => {
    setSearchQuery('');
    setShowSuggestions(false);
    if (sug.type === 'community' && sug.slug) {
      router.push(`/c/${sug.slug}`);
    } else {
      router.push(`/posts/${sug.id}`);
    }
  };

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

        .notification-bell-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .notification-badge {
          background: #FF416C;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 0.72rem;
          font-weight: 800;
          line-height: 1;
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

        .navbar-search-wrapper {
          position: relative;
          width: 260px;
          margin: 0 16px;
        }

        .navbar-search-input {
          width: 100%;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #edf2f7;
          background: #edf2f7;
          font-size: 0.88rem;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }

        .navbar-search-input:focus {
          background: white;
          border-color: #cbd5e0;
          box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.15);
        }

        .search-suggestions-dropdown {
          position: absolute;
          top: 110%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          max-height: 250px;
          overflow-y: auto;
          z-index: 1100;
        }

        .suggestion-item {
          padding: 10px 16px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #4a5568;
          cursor: pointer;
          border-bottom: 1px solid #f7fafc;
          transition: background 0.15s;
          text-align: left;
        }

        .suggestion-item:hover {
          background: #f7fafc;
          color: #FF416C;
        }

        @media (prefers-color-scheme: dark) {
          .navbar-search-input {
            background: #1a1a1a;
            border-color: #2d3748;
            color: white;
          }
          .navbar-search-input:focus {
            background: #0a0a0a;
            border-color: #4a5568;
          }
          .search-suggestions-dropdown {
            background: #111;
            border-color: #222;
          }
          .suggestion-item {
            color: #cbd5e0;
            border-bottom-color: #1a1a1a;
          }
          .suggestion-item:hover {
            background: #1a1a1a;
          }
        }
      `}} />
      <div className="navbar-container">
        <Link href="/" className="navbar-logo">
          LowKeyBD <span>DHAKA</span>
        </Link>

        {!isLoading && (
          <>
            <div className="navbar-search-wrapper">
              <input
                type="text"
                placeholder="Search LowKeyBD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="navbar-search-input"
              />
              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions-dropdown">
                  {suggestions.map((sug) => (
                    <div
                      key={sug.id + sug.type}
                      onClick={() => handleSuggestionClick(sug)}
                      className="suggestion-item"
                    >
                      {sug.type === 'community' ? '🏢 ' : '📝 '}
                      {sug.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
                  <Link href="/notifications" className={`navbar-link notification-bell-link ${isActive('/notifications') ? 'active' : ''}`}>
                    🔔 {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>} Notifications
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
