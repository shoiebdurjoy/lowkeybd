'use client';
import { API_URL } from '../../../src/lib/config';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../src/features/auth/AuthContext';

export default function CreateCommunityPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/communities/create');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    // Auto-generate slug: lowercase, replace spaces/special chars with hyphens
    const generatedSlug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('You must be logged in to create a community.');
      }

      const res = await fetch(`${API_URL}/api/v1/communities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          slug,
          description: description || undefined,
          avatarUrl: avatarUrl || undefined,
          bannerUrl: bannerUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create community');
      }

      router.push(`/c/${data.slug}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="container">
      <style dangerouslySetInnerHTML={{ __html: `
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }
        .header {
          margin-bottom: 30px;
        }
        .title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #1a202c;
        }
        .subtitle {
          color: #718096;
          margin-top: 5px;
          font-size: 0.95rem;
        }
        .form-card {
          background: #fff;
          border: 1px solid #eaeaea;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
        }
        .form-group {
          margin-bottom: 20px;
        }
        .label {
          display: block;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 8px;
          color: #4a5568;
        }
        .input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
          background: #fcfcfc;
        }
        .input:focus {
          border-color: #FF416C;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.1);
        }
        .textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.2s ease;
          min-height: 120px;
          resize: vertical;
          background: #fcfcfc;
        }
        .textarea:focus {
          border-color: #FF416C;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.1);
        }
        .help-text {
          font-size: 0.8rem;
          color: #a0aec0;
          margin-top: 5px;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 15px rgba(255, 65, 108, 0.2);
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 65, 108, 0.3);
        }
        .submit-btn:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
          box-shadow: none;
        }
        .error-msg {
          padding: 12px 16px;
          background: #fff5f5;
          border: 1px solid #fed7d7;
          border-radius: 8px;
          color: #c53030;
          font-size: 0.9rem;
          margin-bottom: 20px;
          font-weight: 500;
        }
        .nav-link {
          color: #FF416C;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 25px;
        }

        .dark {
          .title {
            color: #fff;
          }
          .form-card {
            background: #111;
            border-color: #222;
          }
          .label {
            color: #cbd5e0;
          }
          .input, .textarea {
            background: #1a1a1a;
            border-color: #333;
            color: #fff;
          }
          .input:focus, .textarea:focus {
            background: #111;
          }
          .error-msg {
            background: rgba(229, 62, 62, 0.1);
            border-color: rgba(229, 62, 62, 0.2);
            color: #fc8181;
          }
        }
      `}} />

      <Link href="/communities" className="nav-link">
        &larr; Back to Communities
      </Link>

      <div className="header">
        <h1 className="title">Create a Community</h1>
        <p className="subtitle">Start a hub for your city, campus, topic, or professional circle.</p>
      </div>

      <div className="form-card">
        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Community Name</label>
            <input
              type="text"
              placeholder="e.g., Travel Bangladesh or DU Tech Club"
              value={name}
              onChange={handleNameChange}
              required
              className="input"
            />
            <p className="help-text">Choose a descriptive, clean name.</p>
          </div>

          <div className="form-group">
            <label className="label">Community Slug (URL path)</label>
            <input
              type="text"
              placeholder="e.g., travel-bangladesh"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              required
              className="input"
            />
            <p className="help-text">This is the unique URL suffix, e.g., lowkeybd.com/c/slug</p>
          </div>

          <div className="form-group">
            <label className="label">Description</label>
            <textarea
              placeholder="What is this community about? Tell members what they can expect."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="textarea"
            />
          </div>

          <div className="form-group">
            <label className="label">Avatar Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="input"
            />
          </div>

          <div className="form-group">
            <label className="label">Banner Image URL (Optional)</label>
            <input
              type="url"
              placeholder="https://example.com/banner.jpg"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              className="input"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="submit-btn">
            {isSubmitting ? 'Creating community...' : 'Create Community'}
          </button>
        </form>
      </div>
    </div>
  );
}
