'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../src/features/auth/AuthContext';
import { PostType, POST_TYPE_LABELS } from '../../../src/features/content/types';

const POST_TYPES: PostType[] = [
  'DISCUSSION',
  'QUESTION',
  'RECOMMENDATION',
  'GUIDE',
  'REVIEW',
  'WARNING',
  'NEWS_DISCUSSION',
];

function CreatePostForm() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const communityId = searchParams.get('communityId');
  const communitySlug = searchParams.get('communitySlug');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<PostType>('DISCUSSION');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/posts/create');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3001/api/v1/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          type,
          ...(communityId && { communityId }),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create post');
      }

      const post = await res.json();

      // Redirect to post detail
      router.push(`/posts/${post.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="loading-state">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="form-container">
      <div className="page-header">
        <Link
          href={communitySlug ? `/c/${communitySlug}` : '/communities'}
          className="back-btn"
        >
          ← Back
        </Link>
        <div>
          <h1 className="page-title">Create a Post</h1>
          {communitySlug && (
            <p className="community-badge">Posting in c/{communitySlug}</p>
          )}
        </div>
      </div>

      <div className="form-card">
        <div className="tip-box">
          💡 Share local knowledge, ask questions, or start a discussion with your community.
        </div>

        {error && <div className="error-msg">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="post-type">
              Post Type
            </label>
            <div className="type-grid">
              {POST_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`type-option ${type === t ? 'selected' : ''}`}
                  onClick={() => setType(t)}
                >
                  {POST_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="post-title">
              Title <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <input
              id="post-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Write a clear, concise title..."
              maxLength={300}
              className="form-input"
              required
            />
            <div className={`char-count ${title.length > 270 ? 'warning' : ''}`}>
              {title.length}/300
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="post-content">
              Content <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <textarea
              id="post-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, questions, or insights with the community..."
              maxLength={50000}
              className="form-input form-textarea"
              required
            />
            <div className={`char-count ${content.length > 45000 ? 'warning' : ''}`}>
              {content.length}/50,000
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="submit-btn"
          >
            {isSubmitting ? 'Publishing...' : '🚀 Publish Post'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CreatePostPage() {
  return (
    <div className="page-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .page-wrapper {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          background: #f7fafc;
          min-height: 100vh;
          padding: 40px 20px;
        }
        .loading-state {
          text-align: center;
          padding: 80px;
          font-family: system-ui, sans-serif;
          color: #718096;
        }
        .form-container {
          max-width: 800px;
          margin: 0 auto;
        }
        .page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 32px;
        }
        .back-btn {
          padding: 8px 16px;
          border-radius: 8px;
          background: #edf2f7;
          color: #4a5568;
          font-weight: 600;
          font-size: 0.9rem;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
          text-decoration: none;
          white-space: nowrap;
        }
        .back-btn:hover {
          background: #e2e8f0;
        }
        .page-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #1a202c;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .community-badge {
          font-size: 0.85rem;
          color: #718096;
          font-weight: 500;
          margin: 4px 0 0;
        }
        .form-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          padding: 36px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        }
        .form-group {
          margin-bottom: 24px;
        }
        .form-label {
          display: block;
          font-weight: 600;
          font-size: 0.9rem;
          color: #2d3748;
          margin-bottom: 8px;
        }
        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 1rem;
          color: #1a202c;
          background: #f8fafc;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .form-input:focus {
          border-color: #FF416C;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.1);
        }
        .form-textarea {
          resize: vertical;
          min-height: 220px;
          line-height: 1.6;
        }
        .type-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 10px;
        }
        .type-option {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
          background: #f8fafc;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          color: #4a5568;
          transition: all 0.2s;
          text-align: left;
          font-family: inherit;
        }
        .type-option:hover {
          border-color: #cbd5e0;
          background: #edf2f7;
        }
        .type-option.selected {
          border-color: #FF416C;
          background: rgba(255, 65, 108, 0.05);
          color: #FF416C;
        }
        .char-count {
          font-size: 0.8rem;
          color: #a0aec0;
          text-align: right;
          margin-top: 5px;
        }
        .char-count.warning {
          color: #e53e3e;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          font-weight: 700;
          font-size: 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(255, 65, 108, 0.2);
          font-family: inherit;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 65, 108, 0.3);
        }
        .submit-btn:disabled {
          background: #cbd5e0;
          box-shadow: none;
          cursor: not-allowed;
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
        .tip-box {
          padding: 12px 16px;
          background: #ebf8ff;
          border: 1px solid #bee3f8;
          border-radius: 8px;
          color: #2b6cb0;
          font-size: 0.85rem;
          margin-bottom: 20px;
        }

        .dark {
          .page-wrapper {
            background: #0a0a0a;
          }
          .form-card {
            background: #111;
            border-color: #222;
          }
          .page-title {
            color: #fff;
          }
          .form-label {
            color: #e2e8f0;
          }
          .form-input {
            background: #1a1a1a;
            border-color: #333;
            color: #fff;
          }
          .form-input:focus {
            background: #1a1a1a;
          }
          .type-option {
            background: #1a1a1a;
            border-color: #333;
            color: #e2e8f0;
          }
          .type-option:hover {
            background: #222;
            border-color: #444;
          }
          .back-btn {
            background: #1a1a1a;
            border-color: #333;
            color: #e2e8f0;
          }
          .back-btn:hover {
            background: #222;
          }
          .tip-box {
            background: rgba(43, 108, 176, 0.1);
            border-color: rgba(43, 108, 176, 0.3);
          }
        }
      `}} />
      <Suspense fallback={<div className="loading-state">Loading...</div>}>
        <CreatePostForm />
      </Suspense>
    </div>
  );
}
