'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Post, POST_TYPE_LABELS, POST_TYPE_COLORS } from '../../src/features/content/types';

interface SearchCommunity {
  id: string;
  name: string;
  slug: string;
  description: string;
  avatarUrl?: string;
  createdAt: string;
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [activeTab, setActiveTab] = useState<'posts' | 'hubs'>('posts');
  const [posts, setPosts] = useState<Post[]>([]);
  const [hubs, setHubs] = useState<SearchCommunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deepSearch, setDeepSearch] = useState(false);

  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setPosts([]);
      setHubs([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const deepParam = deepSearch ? '&deep=true' : '';
      const res = await fetch(
        `http://localhost:3001/api/v1/search?q=${encodeURIComponent(query)}${deepParam}`,
      );
      if (!res.ok) {
        throw new Error('Search failed');
      }
      const data = await res.json();
      setPosts(Array.isArray(data.posts) ? data.posts : []);
      setHubs(Array.isArray(data.communities) ? data.communities : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred during search');
      setPosts([]);
      setHubs([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, deepSearch]);

  useEffect(() => {
    void performSearch();
  }, [performSearch]);

  // Helper: safe author name
  const getAuthorName = (post: Post): string => {
    if (post.author?.username) return post.author.username;
    return '[deleted user]';
  };

  // Helper: safe community slug
  const getCommunitySlug = (post: Post): string | null => {
    return post.community?.slug || null;
  };

  if (!query.trim()) {
    return (
      <div className="search-container">
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          <h3>Start searching LowKeyBD</h3>
          <p>Type a keyword in the search bar above to find posts and hubs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="search-container">
      <div className="search-header">
        <h1 className="search-title">
          Search results for: <span style={{ color: '#FF416C' }}>&ldquo;{query}&rdquo;</span>
        </h1>
        <p className="search-subtitle">
          Found {posts.length} post{posts.length !== 1 ? 's' : ''} and {hubs.length} hub{hubs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Deep Search Toggle */}
      <div className="deep-search-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={deepSearch}
            onChange={(e) => setDeepSearch(e.target.checked)}
            className="toggle-checkbox"
          />
          <span className="toggle-slider" />
          <span className="toggle-text">
            {deepSearch ? '🔬 Deep Search' : '⚡ Normal Search'}
          </span>
        </label>
        <span className="toggle-hint">
          {deepSearch
            ? 'Searching titles, content, comments, and replies'
            : 'Searching titles and hub names only'}
        </span>
      </div>

      {error && <div className="error-msg">⚠️ {error}</div>}

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📝 Posts ({posts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'hubs' ? 'active' : ''}`}
          onClick={() => setActiveTab('hubs')}
        >
          🏢 Hubs ({hubs.length})
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner" />
          <span>Searching LowKeyBD database...</span>
        </div>
      ) : activeTab === 'posts' ? (
        <div className="results-list">
          {posts.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
              <h3>No posts match your search</h3>
              <p>Try using different keywords or enable &ldquo;Deep Search&rdquo; to search inside post content and comments.</p>
              {!deepSearch && (
                <button
                  className="try-deep-btn"
                  onClick={() => setDeepSearch(true)}
                >
                  🔬 Try Deep Search
                </button>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="post-card"
                onClick={() => router.push(`/posts/${post.id}`)}
              >
                <div className="post-meta">
                  {post.type && POST_TYPE_COLORS[post.type] && (
                    <span
                      className="post-type-badge"
                      style={{ backgroundColor: POST_TYPE_COLORS[post.type] }}
                    >
                      {POST_TYPE_LABELS[post.type] || post.type}
                    </span>
                  )}
                  {getCommunitySlug(post) && (
                    <Link
                      href={`/c/${getCommunitySlug(post)}`}
                      className="post-community"
                      onClick={(e) => e.stopPropagation()}
                    >
                      c/{getCommunitySlug(post)}
                    </Link>
                  )}
                  <span>
                    Posted by <span className="post-author">u/{getAuthorName(post)}</span> &bull;{' '}
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <h3 className="post-title">{post.title || '[Untitled Post]'}</h3>
                {post.content && <p className="post-excerpt">{post.content}</p>}
                <div className="post-footer">
                  <span>🔺 {post.score ?? 0} score</span>
                  <span>💬 {post.commentCount ?? 0} comments</span>
                  <span>👁 View Post</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="hubs-grid">
          {hubs.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏢</div>
              <h3>No hubs match your search</h3>
              <p>Be the first to create a new hub matching this name!</p>
              <Link href="/communities/create" className="create-hub-btn">
                🏢 Create Hub
              </Link>
            </div>
          ) : (
            hubs.map((hub) => (
              <div
                key={hub.id}
                className="hub-card"
                onClick={() => router.push(`/c/${hub.slug}`)}
              >
                <h3 className="hub-name">c/{hub.slug}</h3>
                <p className="hub-description">
                  {hub.description || 'Welcome to this community hub!'}
                </p>
                <div className="hub-footer">
                  <span>🏢 View Hub →</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="search-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .search-wrapper {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          background: #f7fafc;
          min-height: 100vh;
          padding: 40px 20px;
        }

        .search-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .search-header {
          margin-bottom: 24px;
        }

        .search-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: #1a202c;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
        }

        .search-subtitle {
          font-size: 0.95rem;
          color: #718096;
          font-weight: 500;
        }

        /* Deep Search Toggle */
        .deep-search-toggle {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding: 14px 20px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }

        .toggle-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          user-select: none;
        }

        .toggle-checkbox {
          display: none;
        }

        .toggle-slider {
          width: 44px;
          height: 24px;
          background: #cbd5e0;
          border-radius: 12px;
          position: relative;
          transition: background 0.3s;
          flex-shrink: 0;
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          background: #fff;
          border-radius: 50%;
          transition: transform 0.3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }

        .toggle-checkbox:checked + .toggle-slider {
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
        }

        .toggle-checkbox:checked + .toggle-slider::before {
          transform: translateX(20px);
        }

        .toggle-text {
          font-weight: 700;
          font-size: 0.9rem;
          color: #1a202c;
        }

        .toggle-hint {
          font-size: 0.82rem;
          color: #a0aec0;
          font-weight: 500;
        }

        .tabs-container {
          display: flex;
          gap: 12px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 1px;
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

        .post-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.01);
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .post-card:hover {
          border-color: #cbd5e0;
          transform: translateY(-2px);
        }

        .post-meta {
          font-size: 0.8rem;
          color: #a0aec0;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .post-type-badge {
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          color: white;
        }

        .post-author {
          font-weight: 600;
          color: #4a5568;
        }

        .post-community {
          background: #edf2f7;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
          color: #4a5568;
          text-decoration: none;
        }

        .post-title {
          font-size: 1.2rem;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .post-excerpt {
          font-size: 0.95rem;
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 16px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .post-footer {
          display: flex;
          gap: 16px;
          font-size: 0.85rem;
          color: #718096;
        }

        .hubs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        .hub-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.01);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          flex-direction: column;
        }

        .hub-card:hover {
          border-color: #cbd5e0;
          transform: translateY(-2px);
        }

        .hub-name {
          font-size: 1.15rem;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 8px;
        }

        .hub-description {
          font-size: 0.9rem;
          color: #4a5568;
          line-height: 1.5;
          margin-bottom: 16px;
          flex: 1;
        }

        .hub-footer {
          font-size: 0.85rem;
          font-weight: 700;
          color: #FF416C;
        }

        .empty-state {
          text-align: center;
          padding: 60px 40px;
          background: #fff;
          border: 2px dashed #e2e8f0;
          border-radius: 16px;
          color: #718096;
        }

        .empty-state h3 {
          color: #2d3748;
          margin-bottom: 8px;
        }

        .create-hub-btn {
          margin-top: 16px;
          display: inline-flex;
          padding: 10px 20px;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          border-radius: 8px;
          font-weight: 700;
          text-decoration: none;
        }

        .try-deep-btn {
          margin-top: 16px;
          display: inline-flex;
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 8px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          transition: transform 0.15s;
        }

        .try-deep-btn:hover {
          transform: scale(1.03);
        }

        .error-msg {
          padding: 12px 16px;
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 8px;
          color: #c53030;
          font-size: 0.9rem;
          margin-bottom: 20px;
        }

        .loading-state {
          text-align: center;
          padding: 80px;
          color: #718096;
          font-weight: 500;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e2e8f0;
          border-top: 3px solid #FF416C;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .dark {
          .search-wrapper {
            background: #0a0a0a;
          }
          .post-card, .hub-card, .empty-state, .deep-search-toggle {
            background: #111;
            border-color: #222;
          }
          .search-title, .tab-btn.active, .post-title, .hub-name, .toggle-text {
            color: #fff;
          }
          .empty-state h3 {
            color: #e2e8f0;
          }
          .post-community {
            background: #1a1a1a;
            color: #cbd5e0;
          }
          .post-meta, .post-footer, .search-subtitle, .toggle-hint {
            color: #a0aec0;
          }
          .post-excerpt, .hub-description {
            color: #cbd5e0;
          }
          .tabs-container {
            border-bottom-color: #222;
          }
        }
      `}} />
      <Suspense fallback={<div className="loading-state">Loading search...</div>}>
        <SearchPageContent />
      </Suspense>
    </div>
  );
}
