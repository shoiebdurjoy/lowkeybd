'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/features/auth/AuthContext';
import { Post, POST_TYPE_LABELS, POST_TYPE_COLORS } from '../src/features/content/types';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const router = useRouter();

  useEffect(() => {
    async function fetchGlobalFeed() {
      try {
        const res = await fetch('http://localhost:3001/api/v1/posts');
        if (!res.ok) {
          throw new Error('Failed to load global feed');
        }
        const data = await res.json();
        setPosts(data);
      } catch (err: unknown) {
        setFeedError(err instanceof Error ? err.message : 'Error fetching posts');
      } finally {
        setIsFeedLoading(false);
      }
    }
    void fetchGlobalFeed();
  }, []);

  if (isLoading) {
    return <div style={{ padding: '80px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>Loading LowKeyBD Dhaka...</div>;
  }

  return (
    <div className="home-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .home-wrapper {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          background: #f7fafc;
          min-height: 100vh;
          padding: 40px 20px;
        }

        .home-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2.5fr 1fr;
          gap: 30px;
        }

        @media (max-width: 900px) {
          .home-container {
            grid-template-columns: 1fr;
          }
        }

        .hero-section {
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          border-radius: 20px;
          padding: 40px;
          color: white;
          margin-bottom: 30px;
          box-shadow: 0 10px 30px rgba(255, 65, 108, 0.15);
          position: relative;
          overflow: hidden;
        }

        .hero-section::after {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 300px;
          height: 300px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          pointer-events: none;
        }

        .hero-title {
          font-size: 2.4rem;
          font-weight: 900;
          letter-spacing: -0.04em;
          margin-bottom: 12px;
          line-height: 1.2;
        }

        .hero-subtitle {
          font-size: 1.15rem;
          opacity: 0.9;
          font-weight: 500;
          max-width: 600px;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .hero-actions {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .btn-hero {
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }

        .btn-hero-primary {
          background: white;
          color: #FF416C;
          box-shadow: 0 4px 15px rgba(0,0,0,0.06);
        }

        .btn-hero-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }

        .btn-hero-secondary {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(4px);
        }

        .btn-hero-secondary:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }

        .feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
        }

        .feed-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #1a202c;
          letter-spacing: -0.02em;
          margin: 0;
        }

        .post-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.01);
          transition: all 0.2s ease;
          text-decoration: none;
          display: block;
          cursor: pointer;
        }

        .post-card:hover {
          border-color: #cbd5e0;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.04);
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

        .post-community:hover {
          background: #e2e8f0;
          color: #FF416C;
        }

        .post-title {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 10px;
          line-height: 1.4;
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
          border-top: 1px solid #f7fafc;
          padding-top: 12px;
        }

        .post-footer span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .sidebar-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.01);
        }

        .sidebar-card-title {
          font-size: 1.1rem;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 15px;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 10px;
          letter-spacing: -0.01em;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 12px;
          border-radius: 8px;
          color: #4a5568;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .sidebar-link:hover {
          background: rgba(255, 65, 108, 0.05);
          color: #FF416C;
          border-color: rgba(255, 65, 108, 0.1);
        }

        .guideline-item {
          font-size: 0.88rem;
          color: #4a5568;
          line-height: 1.5;
          margin-bottom: 12px;
          display: flex;
          gap: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 40px;
          background: #fff;
          border: 2px dashed #e2e8f0;
          border-radius: 16px;
          color: #718096;
        }

        .dark {
          .home-wrapper {
            background: #0a0a0a;
          }
          .post-card, .sidebar-card {
            background: #111;
            border-color: #222;
          }
          .feed-title, .sidebar-card-title, .post-title {
            color: #fff;
          }
          .feed-header {
            border-bottom-color: #222;
          }
          .sidebar-card-title {
            border-bottom-color: #222;
          }
          .post-meta, .post-footer {
            color: #a0aec0;
          }
          .post-excerpt, .guideline-item, .sidebar-link {
            color: #cbd5e0;
          }
          .post-community {
            background: #1a1a1a;
            color: #cbd5e0;
          }
          .post-footer {
            border-top-color: #222;
          }
          .empty-state {
            background: #111;
            border-color: #333;
          }
        }
      `}} />

      <div className="home-container">
        {/* Main Feed Content */}
        <div className="feed-column">
          <div className="hero-section">
            <h1 className="hero-title">Discover Local Tech Knowledge</h1>
            <p className="hero-subtitle">
              LowKeyBD is the local hub for Bangladeshi software engineers, designers, and builders. Join hubs, share recommendations, check local warnings, and connect.
            </p>
            <div className="hero-actions">
              {isAuthenticated ? (
                <>
                  <Link href="/posts/create" className="btn-hero btn-hero-primary">
                    ✍️ Share an Insight
                  </Link>
                  <Link href="/communities/create" className="btn-hero btn-hero-secondary">
                    🏢 Create a New Hub
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/register" className="btn-hero btn-hero-primary">
                    👋 Join LowKeyBD Dhaka
                  </Link>
                  <Link href="/login" className="btn-hero btn-hero-secondary">
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="feed-header">
            <h2 className="feed-title">🔥 Trending Discussions</h2>
          </div>

          {isFeedLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>Loading feed...</div>
          ) : feedError ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#e53e3e' }}>⚠️ Failed to load feed: {feedError}</div>
          ) : posts.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💡</div>
              <h3 style={{ marginBottom: '8px' }}>No posts yet</h3>
              <p style={{ marginBottom: '20px' }}>Be the first to start a conversation in Dhaka tech!</p>
              {isAuthenticated && (
                <Link href="/posts/create" className="btn-hero btn-hero-primary" style={{ background: '#FF416C', color: 'white' }}>
                  ✍️ Create first post
                </Link>
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
                  <span
                    className="post-type-badge"
                    style={{ backgroundColor: POST_TYPE_COLORS[post.type] }}
                  >
                    {POST_TYPE_LABELS[post.type]}
                  </span>
                  {post.community && (
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
                  <span>🔺 {post.upvotes} Upvotes</span>
                  <span>💬 {post.commentCount} Comments</span>
                  <span>👁 {post.viewCount} Views</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-card">
            <h3 className="sidebar-card-title">Explore LowKeyBD</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link href="/communities" className="sidebar-link">
                <span>👥 Communities Directory</span>
                <span>→</span>
              </Link>
              {isAuthenticated && (
                <>
                  <Link href="/communities/create" className="sidebar-link">
                    <span>🏢 Create a New Hub</span>
                    <span>→</span>
                  </Link>
                  <Link href="/posts/create" className="sidebar-link">
                    <span>✍️ Create a Post</span>
                    <span>→</span>
                  </Link>
                  <Link href={`/${user?.username}`} className="sidebar-link">
                    <span>👤 My Profile</span>
                    <span>→</span>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="sidebar-card">
            <h3 className="sidebar-card-title">Dhaka Hub Rules</h3>
            <div>
              <div className="guideline-item">
                <span>🇧🇩</span>
                <span>Focus discussions on tech and software engineering relevance to Bangladesh/Dhaka.</span>
              </div>
              <div className="guideline-item">
                <span>🤝</span>
                <span>Be respectful, supportive, and collaborate constructively.</span>
              </div>
              <div className="guideline-item">
                <span>🔍</span>
                <span>Provide tags/types appropriately: Recommendations vs Warnings.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
