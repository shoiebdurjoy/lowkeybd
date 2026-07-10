'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../src/features/auth/AuthContext';
import { CommunityDetail } from '../../../src/features/communities/types';
import { Post, POST_TYPE_LABELS, POST_TYPE_COLORS } from '../../../src/features/content/types';

export default function CommunityDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { isAuthenticated } = useAuth();
  const { slug } = React.use(params);
  const router = useRouter();

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchCommunityData = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch community details
      const commRes = await fetch(`http://localhost:3001/api/v1/communities/${slug}`, {
        headers,
      });

      if (!commRes.ok) {
        throw new Error('Community not found');
      }

      const commData = await commRes.json();
      setCommunity(commData);

      // Fetch community posts
      const postsRes = await fetch(`http://localhost:3001/api/v1/communities/${slug}/posts`);
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setPosts(postsData);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load community');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchCommunityData();
    }
  }, [slug, fetchCommunityData]);

  const handleJoinLeave = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?redirect=/c/${slug}`;
      return;
    }

    if (!community) return;

    setIsActionLoading(true);
    const isJoined = !!community.membership;
    const endpoint = `http://localhost:3001/api/v1/communities/${slug}/${isJoined ? 'leave' : 'join'}`;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Action failed');
      }

      // Refresh community details to update membership state and count
      await fetchCommunityData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return <div className="container loading">Loading local hub...</div>;
  }

  if (error || !community) {
    return (
      <div className="container error-container">
        <h2>Failed to load community</h2>
        <p>{error || 'This community does not exist or has been removed.'}</p>
        <Link href="/communities" className="back-link-plain">
          ← Back to Directory
        </Link>
      </div>
    );
  }

  const isJoined = !!community.membership;

  return (
    <div className="wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .wrapper {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          background: #f7fafc;
          min-height: 100vh;
        }
        .banner {
          height: 220px;
          background: ${
            community.bannerUrl
              ? `url(${community.bannerUrl}) center/cover no-repeat`
              : 'linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%)'
          };
          position: relative;
        }
        .banner-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.15);
        }
        .main-container {
          max-width: 1000px;
          margin: -60px auto 0;
          padding: 0 20px 60px;
          position: relative;
          z-index: 10;
        }
        .profile-section {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          padding: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          flex-wrap: wrap;
          gap: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.02);
        }
        .meta-info {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .comm-avatar {
          width: 96px;
          height: 96px;
          border-radius: 16px;
          background: #f0f3f6;
          border: 4px solid #fff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 2.2rem;
          color: #4a5568;
          overflow: hidden;
          flex-shrink: 0;
        }
        .comm-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .comm-details {
          margin-top: 10px;
        }
        .comm-title {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #1a202c;
        }
        .comm-slug {
          font-size: 0.95rem;
          color: #a0aec0;
          font-weight: 500;
        }
        .stats {
          display: flex;
          gap: 20px;
          margin-top: 10px;
          font-size: 0.9rem;
          color: #718096;
        }
        .stat-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .action-section {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .join-btn {
          padding: 12px 30px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        .join-btn.join {
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 65, 108, 0.2);
        }
        .join-btn.leave {
          background: #edf2f7;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }
        .join-btn:hover {
          transform: translateY(-1px);
        }
        .join-btn:disabled {
          background: #cbd5e0;
          color: #a0aec0;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        .create-post-btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 2px solid #FF416C;
          background: transparent;
          color: #FF416C;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .create-post-btn:hover {
          background: #FF416C;
          color: white;
          transform: translateY(-1px);
        }
        .content-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 30px;
          margin-top: 30px;
        }
        @media (max-width: 800px) {
          .content-grid {
            grid-template-columns: 1fr;
          }
        }
        .feed-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .feed-section h2 {
          font-size: 1.3rem;
          font-weight: 800;
          color: #1a202c;
          letter-spacing: -0.01em;
          margin: 0;
        }
        .post-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
          transition: all 0.2s ease;
          text-decoration: none;
          display: block;
          cursor: pointer;
        }
        .post-card:hover {
          border-color: #cbd5e0;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.05);
        }
        .post-meta {
          font-size: 0.8rem;
          color: #a0aec0;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
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
        .post-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .post-excerpt {
          font-size: 0.92rem;
          color: #4a5568;
          line-height: 1.6;
          margin-bottom: 16px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
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
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 24px;
          height: fit-content;
        }
        .sidebar-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 15px;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 10px;
        }
        .sidebar-desc {
          font-size: 0.9rem;
          color: #4a5568;
          line-height: 1.5;
        }
        .back-link {
          color: #fff;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(4px);
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
          border: 1px solid rgba(255,255,255,0.1);
          position: absolute;
          top: 20px;
          left: 20px;
          z-index: 20;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 0.2s ease;
          text-decoration: none;
        }
        .back-link:hover {
          background: rgba(0, 0, 0, 0.6);
        }
        .back-link-plain {
          color: #FF416C;
          font-weight: 600;
          text-decoration: underline;
        }
        .role-badge {
          padding: 3px 8px;
          background: #ebf8ff;
          color: #2b6cb0;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .loading, .error-container {
          max-width: 600px;
          margin: 100px auto;
          text-align: center;
          padding: 20px;
        }
        .empty-state {
          text-align: center;
          padding: 50px 40px;
          background: #fff;
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          color: #718096;
        }
        .empty-state h3 {
          font-size: 1.1rem;
          margin-bottom: 10px;
          color: #4a5568;
        }

        .dark {
          .wrapper {
            background: #0a0a0a;
          }
          .profile-section, .post-card, .sidebar {
            background: #111;
            border-color: #222;
          }
          .comm-title, .feed-section h2, .post-title, .sidebar-title {
            color: #fff;
          }
          .comm-slug {
            color: #718096;
          }
          .stats, .post-meta, .post-footer, .sidebar-desc {
            color: #a0aec0;
          }
          .post-excerpt, .post-author {
            color: #e2e8f0;
          }
          .join-btn.leave {
            background: #2d3748;
            color: #e2e8f0;
            border-color: #4a5568;
          }
          .role-badge {
            background: rgba(43, 108, 176, 0.15);
            color: #90cdf4;
          }
          .post-footer {
            border-top-color: #222;
          }
          .sidebar-title {
            border-bottom-color: #222;
          }
          .empty-state {
            background: #111;
            border-color: #333;
          }
          .empty-state h3 {
            color: #e2e8f0;
          }
        }
      `}} />

      <div className="banner">
        <Link href="/communities" className="back-link">
          ← Communities
        </Link>
        <div className="banner-overlay"></div>
      </div>

      <div className="main-container">
        <div className="profile-section">
          <div className="meta-info">
            <div className="comm-avatar">
              {community.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={community.avatarUrl} alt={community.name} className="comm-avatar-img" />
              ) : (
                community.name.substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="comm-details">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 className="comm-title">{community.name}</h1>
                {community.membership?.role && (
                  <span className="role-badge">{community.membership.role}</span>
                )}
              </div>
              <p className="comm-slug">c/{community.slug}</p>
              <div className="stats">
                <div className="stat-item">
                  👥 <strong>{community._count?.members || 0}</strong> members
                </div>
                <div className="stat-item">
                  📝 <strong>{community._count?.posts || 0}</strong> posts
                </div>
              </div>
            </div>
          </div>

          <div className="action-section">
            {isAuthenticated && isJoined && (
              <Link
                href={`/posts/create?communityId=${community.id}&communitySlug=${slug}`}
                className="create-post-btn"
              >
                ✍️ Create Post
              </Link>
            )}
            <button
              onClick={handleJoinLeave}
              disabled={isActionLoading}
              className={`join-btn ${isJoined ? 'leave' : 'join'}`}
            >
              {isActionLoading
                ? 'Processing...'
                : isJoined
                ? 'Leave Hub'
                : 'Join Hub'}
            </button>
          </div>
        </div>

        <div className="content-grid">
          <div className="feed-section">
            <div className="feed-header">
              <h2>Community Feed</h2>
            </div>

            {posts.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📭</div>
                <h3>No posts yet</h3>
                <p>Be the first to start a discussion in this community!</p>
                {isAuthenticated && isJoined && (
                  <Link
                    href={`/posts/create?communityId=${community.id}&communitySlug=${slug}`}
                    className="create-post-btn"
                    style={{ marginTop: '16px', display: 'inline-flex' }}
                  >
                    ✍️ Write the first post
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
                    <span>
                      Posted by <span className="post-author">u/{post.author.username}</span>
                      {' '}· {new Date(post.createdAt).toLocaleDateString()}
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

          <div className="sidebar">
            <h3 className="sidebar-title">About Community</h3>
            <p className="sidebar-desc">
              {community.description || 'Welcome to this local Bangladesh knowledge hub! Start discussions and learn together.'}
            </p>
            {!isAuthenticated && (
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '0.85rem', color: '#a0aec0', marginBottom: '10px' }}>
                  Join to participate in discussions
                </p>
                <Link href="/register" className="create-post-btn" style={{ width: '100%', justifyContent: 'center', boxSizing: 'border-box', textAlign: 'center' }}>
                  Sign up free
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
