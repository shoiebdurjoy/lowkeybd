'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../features/auth/AuthContext';

export default function CommandPalette() {
  const { isAuthenticated, user, isModerator, logout } = useAuth();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Toggle palette open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setActiveIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Build the list of commands
  const commands: Array<{
    id: string;
    label: string;
    description: string;
    icon: string;
    action: () => void;
    show: boolean;
  }> = [
    {
      id: 'home',
      label: 'Home Feed',
      description: 'Go to your personalized main feed',
      icon: '🏠',
      action: () => { router.push('/'); setIsOpen(false); },
      show: true,
    },
    {
      id: 'communities',
      label: 'Communities Directory',
      description: 'Browse all community hubs',
      icon: '🏢',
      action: () => { router.push('/communities'); setIsOpen(false); },
      show: true,
    },
    {
      id: 'create-community',
      label: 'Create Community Hub',
      description: 'Launch a new community hub',
      icon: '✨',
      action: () => { router.push('/communities/create'); setIsOpen(false); },
      show: isAuthenticated,
    },
    {
      id: 'create-post',
      label: 'Create Post',
      description: 'Write a new post or ask a question',
      icon: '📝',
      action: () => { router.push('/posts/create'); setIsOpen(false); },
      show: isAuthenticated,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      description: 'View your alerts and activity',
      icon: '🔔',
      action: () => { router.push('/notifications'); setIsOpen(false); },
      show: isAuthenticated,
    },
    {
      id: 'profile',
      label: 'My Profile',
      description: 'View your public profile and reputation',
      icon: '👤',
      action: () => { router.push(`/${user?.username}`); setIsOpen(false); },
      show: isAuthenticated && !!user,
    },
    {
      id: 'admin',
      label: 'Admin Dashboard',
      description: 'Manage reports, users, feature flags, and audit logs',
      icon: '⚙️',
      action: () => { router.push('/admin'); setIsOpen(false); },
      show: isModerator,
    },
    {
      id: 'theme',
      label: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      icon: '🌓',
      action: () => {
        const isDark = document.documentElement.classList.contains('dark');
        const nextTheme = isDark ? 'light' : 'dark';
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          localStorage.setItem('theme', 'dark');
        } else {
          document.documentElement.classList.add('light');
          document.documentElement.classList.remove('dark');
          localStorage.setItem('theme', 'light');
        }
        // Force header component reload or event dispatch
        window.dispatchEvent(new Event('storage'));
        setIsOpen(false);
      },
      show: true,
    },
    {
      id: 'login',
      label: 'Login',
      description: 'Sign into your account',
      icon: '🔑',
      action: () => { router.push('/login'); setIsOpen(false); },
      show: !isAuthenticated,
    },
    {
      id: 'register',
      label: 'Register',
      description: 'Create a new account',
      icon: '📝',
      action: () => { router.push('/register'); setIsOpen(false); },
      show: !isAuthenticated,
    },
    {
      id: 'logout',
      label: 'Logout',
      description: 'Sign out of your session',
      icon: '🚪',
      action: () => { logout(); setIsOpen(false); },
      show: isAuthenticated,
    },
  ];

  const visibleCommands = commands.filter((c) => c.show);

  // Filter commands by search string
  const filteredCommands = visibleCommands.filter(
    (c) =>
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  // Add a dynamic "Search on site" command if text is entered
  const showSearchOption = search.trim().length > 0;
  const searchCommandIndex = filteredCommands.length;

  const totalOptions = filteredCommands.length + (showSearchOption ? 1 : 0);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % totalOptions);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex === searchCommandIndex && showSearchOption) {
        // Trigger site search
        router.push(`/search?q=${encodeURIComponent(search.trim())}`);
        setIsOpen(false);
      } else if (filteredCommands[activeIndex]) {
        filteredCommands[activeIndex].action();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cmd-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 15vh;
          animation: cmdFadeIn 0.2s ease;
        }

        @keyframes cmdFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .cmd-palette {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 600px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          animation: cmdSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes cmdSlideDown {
          from { transform: translateY(-20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }

        .cmd-search-box {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #edf2f7;
        }

        .cmd-search-icon {
          font-size: 1.25rem;
          margin-right: 12px;
          color: #a0aec0;
        }

        .cmd-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 1.05rem;
          font-weight: 500;
          color: #1a202c;
          background: transparent;
        }

        .cmd-input::placeholder {
          color: #a0aec0;
        }

        .cmd-list {
          max-height: 380px;
          overflow-y: auto;
          padding: 8px;
        }

        .cmd-item {
          display: flex;
          align-items: center;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          user-select: none;
          outline: none;
        }

        .cmd-item:hover, .cmd-item.active {
          background: #f7fafc;
        }

        .cmd-item.active {
          background: rgba(255, 65, 108, 0.05);
        }

        .cmd-item-icon {
          font-size: 1.25rem;
          margin-right: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #edf2f7;
          transition: all 0.2s;
        }

        .cmd-item.active .cmd-item-icon {
          background: rgba(255, 65, 108, 0.1);
          color: #FF416C;
        }

        .cmd-item-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .cmd-item-label {
          font-size: 0.92rem;
          font-weight: 700;
          color: #2d3748;
          transition: color 0.15s;
        }

        .cmd-item.active .cmd-item-label {
          color: #FF416C;
        }

        .cmd-item-desc {
          font-size: 0.78rem;
          color: #718096;
          margin-top: 2px;
        }

        .cmd-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          border-top: 1px solid #edf2f7;
          background: #f8fafc;
          font-size: 0.78rem;
          color: #a0aec0;
          font-weight: 600;
        }

        .cmd-shortcuts {
          display: flex;
          gap: 12px;
        }

        .cmd-key {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.7rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          color: #718096;
        }

        /* Dark mode overrides */
        .dark .cmd-palette {
          background: #111;
          border-color: #222;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }

        .dark .cmd-search-box {
          border-bottom-color: #222;
        }

        .dark .cmd-input {
          color: white;
        }

        .dark .cmd-item:hover, .dark .cmd-item.active {
          background: #1a1a1a;
        }

        .dark .cmd-item.active {
          background: rgba(255, 65, 108, 0.1);
        }

        .dark .cmd-item-icon {
          background: #222;
        }

        .dark .cmd-item.active .cmd-item-icon {
          background: rgba(255, 65, 108, 0.2);
        }

        .dark .cmd-item-label {
          color: #e2e8f0;
        }

        .dark .cmd-item.active .cmd-item-label {
          color: #FF416C;
        }

        .dark .cmd-item-desc {
          color: #a0aec0;
        }

        .dark .cmd-footer {
          border-top-color: #222;
          background: #0a0a0a;
          color: #4a5568;
        }

        .dark .cmd-key {
          background: #1a1a1a;
          border-color: #333;
          color: #a0aec0;
        }
      `}} />
      <div className="cmd-overlay" onClick={() => setIsOpen(false)}>
        <div className="cmd-palette" ref={containerRef} onClick={(e) => e.stopPropagation()}>
          <div className="cmd-search-box">
            <span className="cmd-search-icon">🔍</span>
            <input
              type="text"
              className="cmd-input"
              placeholder="Type a command or search query..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveIndex(0); }}
              onKeyDown={handleKeyDown}
              ref={inputRef}
              aria-label="Command palette input"
            />
          </div>

          <div className="cmd-list" role="listbox">
            {filteredCommands.map((c, idx) => (
              <div
                key={c.id}
                className={`cmd-item ${activeIndex === idx ? 'active' : ''}`}
                onClick={c.action}
                onMouseEnter={() => setActiveIndex(idx)}
                role="option"
                aria-selected={activeIndex === idx}
              >
                <div className="cmd-item-icon">{c.icon}</div>
                <div className="cmd-item-content">
                  <span className="cmd-item-label">{c.label}</span>
                  <span className="cmd-item-desc">{c.description}</span>
                </div>
              </div>
            ))}

            {showSearchOption && (
              <div
                className={`cmd-item ${activeIndex === searchCommandIndex ? 'active' : ''}`}
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(search.trim())}`);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(searchCommandIndex)}
                role="option"
                aria-selected={activeIndex === searchCommandIndex}
              >
                <div className="cmd-item-icon">🔍</div>
                <div className="cmd-item-content">
                  <span className="cmd-item-label">Search for &quot;{search}&quot;</span>
                  <span className="cmd-item-desc">Perform site-wide search for this query</span>
                </div>
              </div>
            )}

            {totalOptions === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#a0aec0', fontSize: '0.88rem', fontWeight: 600 }}>
                No commands matching &quot;{search}&quot; found
              </div>
            )}
          </div>

          <div className="cmd-footer">
            <div className="cmd-shortcuts">
              <span>Navigate: <span className="cmd-key">↑</span> <span className="cmd-key">↓</span></span>
              <span>Select: <span className="cmd-key">Enter</span></span>
              <span>Close: <span className="cmd-key">Esc</span></span>
            </div>
            <span>LowKeyBD Command Menu</span>
          </div>
        </div>
      </div>
    </>
  );
}
