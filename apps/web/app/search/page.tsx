'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Post, POST_TYPE_LABELS, POST_TYPE_COLORS } from '../../src/features/content/types';

interface SearchCommunity {
  id: string;
  name: string;
  slug: string;
  description: string;
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

  useEffect(() => {
    async function performSearch() {
      if (!query.trim()) {
        setPosts([]);
        setHubs([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const res = await fetch(`http://localhost:3001/api/v1/search?q=${encodeURIComponent(query)}`);
        if (!res.ok) {
          throw new Error('Search failed');
        }
        const data = await res.json();
        setPosts(data.posts || []);
        setHubs(data.communities || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An error occurred during search');
      } finally {
        setIsLoading(false);
      }
    }

    void performSearch();
  }, [query]);

  return (
    <div className="search-container">
      <div className="search-header">
        <h1 className="search-title">
          Search results for: <span style={{ color: '#FF416C' }}>&ldquo;{query}&rdquo;</span>
        </h1>
        <p className="search-subtitle">
          Found {posts.length} posts and {hubs.length} hubs
        </p>
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
        <div className="loading-state">Searching LowKeyBD database...</div>
      ) : activeTab === 'posts' ? (
        <div className="results-list">
          {posts.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
              <h3>No posts match your search</h3>
              <p>Try using different keywords or search for a hub instead.</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="post-card"
                onClick={() => router.push(`/posts/${post.id}`)}
              >
                <div className="post-meta">
                  <span
                    className="post-type-badge"
                    style={{ backgroundColor: POST_TYPE_COLORS[post.type] }}
                  >
                    {POST_TYPE_LABELS[post.type]}
                  </span>
                  {post.community?.slug && (
                    <Link
                      href={`/c/${post.community.slug}`}
                      className="post-community"
                      onClick={(e) => e.stopPropagation()}
                    >
                      c/{post.community.slug}
                    </Link>
                  )}
                  <span>
                    Posted by <span className="post-author">u/{post.author.username}</span> &bull; {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="post-title">{post.title}</h3>
                <p className="post-excerpt">{post.content}</p>
                <div className="post-footer">
                  <span>🔺 {post.score} score</span>
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
                <p className="hub-description">{hub.description || 'Welcome to this Bangladeshi knowledge hub!'}</p>
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
          margin-bottom: 32px;
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
        }

        @media (prefers-color-scheme: dark) {
          .search-wrapper {
            background: #0a0a0a;
          }
          .post-card, .hub-card, .empty-state {
            background: #111;
            border-color: #222;
          }
          .search-title, .tab-btn.active, .post-title, .hub-name {
            color: #fff;
          }
          .post-community {
            background: #1a1a1a;
            color: #cbd5e0;
          }
          .post-meta, .post-footer, .search-subtitle {
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
