'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, Notification } from '../../src/features/notifications/NotificationsContext';
import { useAuth } from '../../src/features/auth/AuthContext';

interface Preferences {
  newCommentInApp: boolean;
  newCommentEmail: boolean;
  newReplyInApp: boolean;
  newReplyEmail: boolean;
  newMentionInApp: boolean;
  newMentionEmail: boolean;
}

export default function NotificationsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'preferences'>('all');
  const [prefs, setPrefs] = useState<Preferences>({
    newCommentInApp: true,
    newCommentEmail: true,
    newReplyInApp: true,
    newReplyEmail: true,
    newMentionInApp: true,
    newMentionEmail: true,
  });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsUpdating, setPrefsUpdating] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(false);

  // Fetch preferences
  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchPrefs() {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const res = await fetch('http://localhost:3001/api/v1/notifications/preferences', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setPrefs({
            newCommentInApp: data.newCommentInApp,
            newCommentEmail: data.newCommentEmail,
            newReplyInApp: data.newReplyInApp,
            newReplyEmail: data.newReplyEmail,
            newMentionInApp: data.newMentionInApp,
            newMentionEmail: data.newMentionEmail,
          });
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
      } finally {
        setPrefsLoading(false);
      }
    }

    void fetchPrefs();
  }, [isAuthenticated]);

  // Update a single preference field
  const handlePrefChange = async (field: keyof Preferences, value: boolean) => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const updatedPrefs = { ...prefs, [field]: value };
    setPrefs(updatedPrefs);
    setPrefsUpdating(true);
    setPrefsSuccess(false);

    try {
      const res = await fetch('http://localhost:3001/api/v1/notifications/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedPrefs),
      });

      if (res.ok) {
        setPrefsSuccess(true);
        setTimeout(() => setPrefsSuccess(false), 2000);
      } else {
        // Rollback on failure
        setPrefs(prefs);
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
      setPrefs(prefs);
    } finally {
      setPrefsUpdating(false);
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.readAt) {
      await markAsRead(notif.id);
    }

    // Redirect user to the corresponding post
    if (notif.entityType === 'POST') {
      router.push(`/posts/${notif.entityId}`);
    }
  };

  if (authLoading) {
    return <div className="notif-loading">Verifying authentication...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="notif-container">
        <div className="notif-empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔒</div>
          <h2>Please log in</h2>
          <p>You need to log in to view your notifications.</p>
          <button onClick={() => router.push('/login')} className="btn-login-redirect">
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notif-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .notif-wrapper {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          background: #f7fafc;
          min-height: 100vh;
          padding: 40px 20px;
        }

        .notif-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .notif-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .notif-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: #1a202c;
          letter-spacing: -0.02em;
        }

        .btn-mark-all {
          padding: 8px 16px;
          font-size: 0.88rem;
          font-weight: 700;
          color: #FF416C;
          background: rgba(255, 65, 108, 0.05);
          border: 1px dashed rgba(255, 65, 108, 0.3);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-mark-all:hover {
          background: rgba(255, 65, 108, 0.1);
          border-color: #FF416C;
        }

        .notif-tabs {
          display: flex;
          gap: 12px;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 24px;
        }

        .tab-btn {
          padding: 12px 20px;
          font-size: 0.95rem;
          font-weight: 700;
          color: #718096;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          outline: none;
          margin-bottom: -2px;
        }

        .tab-btn:hover {
          color: #FF416C;
        }

        .tab-btn.active {
          color: #FF416C;
          border-bottom-color: #FF416C;
        }

        .notif-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .notif-card {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .notif-card:hover {
          border-color: #cbd5e0;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }

        .notif-card.unread {
          background: rgba(255, 65, 108, 0.02);
          border-color: rgba(255, 65, 108, 0.2);
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          background: #FF416C;
          border-radius: 50%;
          position: absolute;
          top: 20px;
          right: 20px;
        }

        .notif-icon {
          font-size: 1.5rem;
          line-height: 1;
        }

        .notif-content {
          flex: 1;
        }

        .notif-card-title {
          font-weight: 800;
          color: #1a202c;
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        .notif-card-body {
          color: #4a5568;
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 6px;
        }

        .notif-time {
          font-size: 0.78rem;
          color: #a0aec0;
          font-weight: 500;
        }

        .notif-empty-state {
          text-align: center;
          padding: 60px 40px;
          background: white;
          border: 2px dashed #e2e8f0;
          border-radius: 16px;
          color: #718096;
        }

        .btn-login-redirect {
          margin-top: 16px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          border-radius: 8px;
          font-weight: 700;
          border: none;
          cursor: pointer;
        }

        /* Preferences Section */
        .prefs-container {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px;
        }

        .prefs-section-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 8px;
        }

        .prefs-section-subtitle {
          font-size: 0.88rem;
          color: #718096;
          margin-bottom: 24px;
        }

        .pref-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid #edf2f7;
        }

        .pref-row:last-child {
          border-bottom: none;
        }

        .pref-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .pref-title {
          font-weight: 700;
          color: #2d3748;
          font-size: 0.95rem;
        }

        .pref-description {
          font-size: 0.82rem;
          color: #718096;
          font-weight: 500;
        }

        .pref-toggles {
          display: flex;
          gap: 20px;
        }

        .pref-toggle-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          color: #4a5568;
          cursor: pointer;
        }

        .pref-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }

        .prefs-status-bar {
          margin-top: 20px;
          min-height: 24px;
          display: flex;
          align-items: center;
          font-size: 0.88rem;
          font-weight: 600;
        }

        .success-text {
          color: #38a169;
        }

        .updating-text {
          color: #718096;
        }

        .notif-loading {
          text-align: center;
          padding: 80px;
          color: #718096;
          font-weight: 500;
        }

        @media (prefers-color-scheme: dark) {
          .notif-wrapper {
            background: #0a0a0a;
          }
          .notif-card, .prefs-container, .notif-empty-state {
            background: #111;
            border-color: #222;
          }
          .notif-title, .prefs-section-title, .pref-title, .notif-card-title, .tab-btn.active {
            color: #fff;
          }
          .notif-card-body, .pref-toggle-label {
            color: #cbd5e0;
          }
          .pref-description, .pref-row, .notif-time, .notif-tabs {
            border-color: #222;
          }
          .notif-card.unread {
            background: rgba(255, 65, 108, 0.05);
            border-color: rgba(255, 65, 108, 0.3);
          }
        }
      `}} />

      <div className="notif-container">
        <div className="notif-header">
          <h1 className="notif-title">Notifications</h1>
          {activeTab === 'all' && notifications.length > 0 && (
            <button onClick={markAllAsRead} className="btn-mark-all">
              ✓ Mark all as read
            </button>
          )}
        </div>

        <div className="notif-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            🔔 Feed ({unreadCount})
          </button>
          <button
            className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Preferences
          </button>
        </div>

        {activeTab === 'all' ? (
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty-state">
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✨</div>
                <h2>You&apos;re all caught up!</h2>
                <p>No notifications at the moment. We&apos;ll alert you when updates roll in!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notif-card ${!notif.readAt ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notif-icon">
                    {notif.type === 'NEW_COMMENT' ? '💬' : notif.type === 'NEW_REPLY' ? '↩️' : '🔔'}
                  </div>
                  <div className="notif-content">
                    <h3 className="notif-card-title">{notif.title}</h3>
                    <p className="notif-card-body">{notif.body}</p>
                    <span className="notif-time">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {!notif.readAt && <div className="unread-dot" />}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="prefs-container">
            <h2 className="prefs-section-title">Notification Settings</h2>
            <p className="prefs-section-subtitle">
              Manage how and where you want to be notified about updates on LowKeyBD.
            </p>

            {prefsLoading ? (
              <div className="notif-loading">Loading preferences...</div>
            ) : (
              <>
                <div className="pref-row">
                  <div className="pref-info">
                    <span className="pref-title">Comments on my posts</span>
                    <span className="pref-description">
                      Notify me when someone posts a comment on one of my threads.
                    </span>
                  </div>
                  <div className="pref-toggles">
                    <label className="pref-toggle-label">
                      <input
                        type="checkbox"
                        checked={prefs.newCommentInApp}
                        onChange={(e) => handlePrefChange('newCommentInApp', e.target.checked)}
                        className="pref-checkbox"
                      />
                      In-App
                    </label>
                    <label className="pref-toggle-label">
                      <input
                        type="checkbox"
                        checked={prefs.newCommentEmail}
                        onChange={(e) => handlePrefChange('newCommentEmail', e.target.checked)}
                        className="pref-checkbox"
                      />
                      Email
                    </label>
                  </div>
                </div>

                <div className="pref-row">
                  <div className="pref-info">
                    <span className="pref-title">Replies to my comments</span>
                    <span className="pref-description">
                      Notify me when someone replies directly to a comment I wrote.
                    </span>
                  </div>
                  <div className="pref-toggles">
                    <label className="pref-toggle-label">
                      <input
                        type="checkbox"
                        checked={prefs.newReplyInApp}
                        onChange={(e) => handlePrefChange('newReplyInApp', e.target.checked)}
                        className="pref-checkbox"
                      />
                      In-App
                    </label>
                    <label className="pref-toggle-label">
                      <input
                        type="checkbox"
                        checked={prefs.newReplyEmail}
                        onChange={(e) => handlePrefChange('newReplyEmail', e.target.checked)}
                        className="pref-checkbox"
                      />
                      Email
                    </label>
                  </div>
                </div>

                <div className="pref-row">
                  <div className="pref-info">
                    <span className="pref-title">Mentions</span>
                    <span className="pref-description">
                      Notify me when someone tags my username in a thread or comment.
                    </span>
                  </div>
                  <div className="pref-toggles">
                    <label className="pref-toggle-label">
                      <input
                        type="checkbox"
                        checked={prefs.newMentionInApp}
                        onChange={(e) => handlePrefChange('newMentionInApp', e.target.checked)}
                        className="pref-checkbox"
                      />
                      In-App
                    </label>
                    <label className="pref-toggle-label">
                      <input
                        type="checkbox"
                        checked={prefs.newMentionEmail}
                        onChange={(e) => handlePrefChange('newMentionEmail', e.target.checked)}
                        className="pref-checkbox"
                      />
                      Email
                    </label>
                  </div>
                </div>

                <div className="prefs-status-bar">
                  {prefsUpdating && <span className="updating-text">Saving preferences...</span>}
                  {prefsSuccess && <span className="success-text">✓ Preferences saved!</span>}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
