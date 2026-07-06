'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../src/features/auth/AuthContext';
import { Post, Comment, POST_TYPE_LABELS, POST_TYPE_COLORS } from '../../../src/features/content/types';

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { isAuthenticated, user } = useAuth();
  const { id } = React.use(params);
  const router = useRouter();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment form state
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Edit post state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/v1/posts/${id}`);
      if (!res.ok) {
        throw new Error('Post not found');
      }
      const data = await res.json();
      setPost(data);
      setEditTitle(data.title);
      setEditContent(data.content);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/v1/posts/${id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch {
      // comments failing silently is ok
    }
  }, [id]);

  useEffect(() => {
    const loadAll = async () => {
      await Promise.all([fetchPost(), fetchComments()]);
      setIsLoading(false);
    };
    void loadAll();
  }, [fetchPost, fetchComments]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    setCommentError('');

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3001/api/v1/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newComment.trim(),
          ...(replyTo && { parentId: replyTo.id }),
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to post comment');
      }

      setNewComment('');
      setReplyTo(null);
      await fetchComments();
    } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3001/api/v1/posts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete post');
      }

      if (post?.community?.slug) {
        router.push(`/c/${post.community.slug}`);
      } else {
        router.push('/communities');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3001/api/v1/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to update post');
      }

      await fetchPost();
      setIsEditing(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`http://localhost:3001/api/v1/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete comment');
      }

      await fetchComments();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const isPostAuthor = user && post && user.username === post.author.username;
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'system-ui, sans-serif' }}>
        Loading post...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'system-ui, sans-serif' }}>
        <h2>Post not found</h2>
        <p>{error}</p>
        <Link href="/communities" style={{ color: '#FF416C' }}>← Back to Communities</Link>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .page-wrapper {
          font-family: var(--font-geist-sans), system-ui, sans-serif;
          background: #f7fafc;
          min-height: 100vh;
          padding: 30px 20px 60px;
        }
        .main-container {
          max-width: 860px;
          margin: 0 auto;
        }
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          color: #a0aec0;
          margin-bottom: 24px;
        }
        .breadcrumb a {
          color: #718096;
          font-weight: 500;
          text-decoration: none;
        }
        .breadcrumb a:hover {
          color: #FF416C;
        }
        .post-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          padding: 36px;
          margin-bottom: 28px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        .post-header {
          margin-bottom: 20px;
        }
        .post-meta-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          color: #a0aec0;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .type-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
          color: white;
        }
        .author-link {
          font-weight: 600;
          color: #4a5568;
          text-decoration: none;
        }
        .author-link:hover {
          color: #FF416C;
        }
        .community-link {
          padding: 2px 8px;
          background: #f0f3f6;
          border-radius: 4px;
          font-weight: 600;
          color: #4a5568;
          text-decoration: none;
        }
        .community-link:hover {
          background: #e2e8f0;
        }
        .post-title {
          font-size: 1.75rem;
          font-weight: 800;
          color: #1a202c;
          line-height: 1.35;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
        }
        .post-content {
          font-size: 1rem;
          color: #4a5568;
          line-height: 1.8;
          white-space: pre-wrap;
        }
        .post-actions-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #f0f3f6;
        }
        .vote-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 14px;
          border-radius: 20px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          color: #4a5568;
        }
        .vote-btn:hover {
          background: #edf2f7;
        }
        .post-stat {
          font-size: 0.85rem;
          color: #a0aec0;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .edit-actions {
          margin-left: auto;
          display: flex;
          gap: 10px;
        }
        .edit-btn {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid #e2e8f0;
          background: transparent;
          color: #4a5568;
          transition: all 0.2s;
        }
        .edit-btn:hover {
          background: #edf2f7;
        }
        .delete-btn {
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border: 1.5px solid #fed7d7;
          background: transparent;
          color: #c53030;
          transition: all 0.2s;
        }
        .delete-btn:hover {
          background: #fff5f5;
        }
        .edit-form {
          margin-top: 20px;
        }
        .edit-input {
          width: 100%;
          padding: 10px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a202c;
          background: #f8fafc;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          margin-bottom: 12px;
        }
        .edit-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          color: #1a202c;
          background: #f8fafc;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          min-height: 180px;
          resize: vertical;
          line-height: 1.6;
        }
        .edit-input:focus, .edit-textarea:focus {
          border-color: #FF416C;
          background: #fff;
        }
        .save-btn {
          padding: 8px 20px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          margin-right: 10px;
        }
        .cancel-btn {
          padding: 8px 20px;
          border-radius: 8px;
          background: transparent;
          color: #718096;
          font-weight: 600;
          font-size: 0.9rem;
          border: 1.5px solid #e2e8f0;
          cursor: pointer;
        }
        .comments-section h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 20px;
          letter-spacing: -0.01em;
        }
        .comment-form {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.02);
        }
        .comment-form-label {
          font-weight: 600;
          font-size: 0.88rem;
          color: #4a5568;
          margin-bottom: 8px;
          display: block;
        }
        .comment-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.92rem;
          color: #1a202c;
          background: #f8fafc;
          outline: none;
          font-family: inherit;
          box-sizing: border-box;
          min-height: 100px;
          resize: vertical;
          line-height: 1.6;
          transition: border-color 0.2s;
        }
        .comment-textarea:focus {
          border-color: #FF416C;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.08);
        }
        .reply-banner {
          padding: 8px 12px;
          background: #f0f9ff;
          border-radius: 6px;
          font-size: 0.85rem;
          color: #2b6cb0;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .cancel-reply {
          font-size: 0.8rem;
          color: #a0aec0;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
        }
        .submit-comment-btn {
          margin-top: 12px;
          padding: 10px 22px;
          border-radius: 8px;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 3px 10px rgba(255, 65, 108, 0.2);
        }
        .submit-comment-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .submit-comment-btn:disabled {
          background: #cbd5e0;
          box-shadow: none;
          cursor: not-allowed;
        }
        .comment-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 16px;
        }
        .comment-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 0.85rem;
          color: #718096;
        }
        .comment-author {
          font-weight: 700;
          color: #2d3748;
          text-decoration: none;
        }
        .comment-author:hover {
          color: #FF416C;
        }
        .comment-content {
          font-size: 0.95rem;
          color: #4a5568;
          line-height: 1.7;
          white-space: pre-wrap;
        }
        .comment-actions {
          display: flex;
          gap: 12px;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #f7fafc;
        }
        .comment-action-btn {
          font-size: 0.82rem;
          color: #a0aec0;
          background: none;
          border: none;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          transition: color 0.2s, background 0.2s;
          font-family: inherit;
        }
        .comment-action-btn:hover {
          color: #4a5568;
          background: #f7fafc;
        }
        .comment-action-btn.danger:hover {
          color: #c53030;
          background: #fff5f5;
        }
        .replies-container {
          margin-top: 12px;
          margin-left: 24px;
          padding-left: 16px;
          border-left: 2px solid #e2e8f0;
        }
        .reply-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 14px 18px;
          margin-top: 12px;
        }
        .error-msg {
          padding: 10px 14px;
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 8px;
          color: #c53030;
          font-size: 0.88rem;
          margin-bottom: 12px;
        }
        .login-prompt {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          color: #718096;
          margin-bottom: 24px;
          font-size: 0.95rem;
        }
        .login-link {
          color: #FF416C;
          font-weight: 700;
          text-decoration: underline;
        }

        @media (prefers-color-scheme: dark) {
          .page-wrapper {
            background: #0a0a0a;
          }
          .post-card, .comment-card, .comment-form, .login-prompt {
            background: #111;
            border-color: #222;
          }
          .post-title {
            color: #fff;
          }
          .post-content, .comment-content {
            color: #d1d5db;
          }
          .post-actions-row, .comment-actions {
            border-top-color: #222;
          }
          .vote-btn {
            background: #1a1a1a;
            border-color: #333;
            color: #e2e8f0;
          }
          .vote-btn:hover {
            background: #222;
          }
          .author-link, .comment-author {
            color: #e2e8f0;
          }
          .community-link {
            background: #1a1a1a;
            color: #e2e8f0;
          }
          .comments-section h2 {
            color: #fff;
          }
          .comment-textarea, .edit-input, .edit-textarea {
            background: #1a1a1a;
            border-color: #333;
            color: #fff;
          }
          .edit-btn {
            color: #e2e8f0;
            border-color: #333;
          }
          .breadcrumb a {
            color: #a0aec0;
          }
          .reply-card {
            background: #1a1a1a;
          }
        }
      `}} />

      <div className="main-container">
        <div className="breadcrumb">
          <Link href="/communities">Communities</Link>
          {post.community && (
            <>
              <span>›</span>
              <Link href={`/c/${post.community.slug}`}>{post.community.name}</Link>
            </>
          )}
          <span>›</span>
          <span style={{ color: '#1a202c' }}>Post</span>
        </div>

        {/* Post Card */}
        <div className="post-card">
          {!isEditing ? (
            <>
              <div className="post-header">
                <div className="post-meta-row">
                  <span
                    className="type-badge"
                    style={{ backgroundColor: POST_TYPE_COLORS[post.type] }}
                  >
                    {POST_TYPE_LABELS[post.type]}
                  </span>
                  <span>
                    by{' '}
                    <Link href={`/${post.author.username}`} className="author-link">
                      u/{post.author.username}
                    </Link>
                  </span>
                  <span>· {timeAgo(post.createdAt)}</span>
                  {post.community && (
                    <>
                      <span>in</span>
                      <Link href={`/c/${post.community.slug}`} className="community-link">
                        c/{post.community.slug}
                      </Link>
                    </>
                  )}
                </div>

                <h1 className="post-title">{post.title}</h1>
                <p className="post-content">{post.content}</p>
              </div>

              <div className="post-actions-row">
                <button className="vote-btn">🔺 {post.upvotes}</button>
                <button className="vote-btn">🔻 {post.downvotes}</button>
                <div className="post-stat">💬 {post.commentCount} comments</div>
                <div className="post-stat">👁 {post.viewCount} views</div>
                {isPostAuthor && (
                  <div className="edit-actions">
                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                      ✏️ Edit
                    </button>
                    <button className="delete-btn" onClick={handleDeletePost}>
                      🗑 Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="edit-form">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="edit-input"
                placeholder="Post title"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="edit-textarea"
                placeholder="Post content"
              />
              <div style={{ marginTop: '12px' }}>
                <button
                  className="save-btn"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(post.title);
                    setEditContent(post.content);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="comments-section">
          <h2>💬 {comments.length} Comment{comments.length !== 1 ? 's' : ''}</h2>

          {/* Comment Form */}
          {isAuthenticated ? (
            <div className="comment-form">
              {replyTo && (
                <div className="reply-banner">
                  <span>↩️ Replying to @{replyTo.username}</span>
                  <button className="cancel-reply" onClick={() => setReplyTo(null)}>
                    Cancel reply ✕
                  </button>
                </div>
              )}
              <label className="comment-form-label">
                {replyTo ? 'Your reply' : 'Write a comment'}
              </label>
              {commentError && <div className="error-msg">⚠️ {commentError}</div>}
              <form onSubmit={handleSubmitComment}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="comment-textarea"
                  maxLength={10000}
                  required
                />
                <button
                  type="submit"
                  className="submit-comment-btn"
                  disabled={isSubmittingComment || !newComment.trim()}
                >
                  {isSubmittingComment ? 'Posting...' : replyTo ? '↩️ Post Reply' : '💬 Post Comment'}
                </button>
              </form>
            </div>
          ) : (
            <div className="login-prompt">
              <Link href="/login" className="login-link">Log in</Link> or{' '}
              <Link href="/register" className="login-link">Sign up</Link> to join the discussion
            </div>
          )}

          {/* Comments List */}
          {comments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <div className="comment-header">
                <Link href={`/${comment.author.username}`} className="comment-author">
                  @{comment.author.username}
                </Link>
                <span>· {timeAgo(comment.createdAt)}</span>
                {comment.score > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#48bb78', fontWeight: 600 }}>
                    +{comment.score}
                  </span>
                )}
              </div>
              <p className="comment-content">{comment.content}</p>
              <div className="comment-actions">
                {isAuthenticated && (
                  <button
                    className="comment-action-btn"
                    onClick={() => setReplyTo({ id: comment.id, username: comment.author.username })}
                  >
                    ↩️ Reply
                  </button>
                )}
                {user && user.username === comment.author.username && (
                  <button
                    className="comment-action-btn danger"
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    🗑 Delete
                  </button>
                )}
              </div>

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="replies-container">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="reply-card">
                      <div className="comment-header">
                        <Link href={`/${reply.author.username}`} className="comment-author">
                          @{reply.author.username}
                        </Link>
                        <span>· {timeAgo(reply.createdAt)}</span>
                      </div>
                      <p className="comment-content">{reply.content}</p>
                      {user && user.username === reply.author.username && (
                        <div className="comment-actions">
                          <button
                            className="comment-action-btn danger"
                            onClick={() => handleDeleteComment(reply.id)}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#a0aec0', fontSize: '0.95rem' }}>
              No comments yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
