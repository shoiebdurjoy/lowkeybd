'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../src/features/auth/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EditProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [bio, setBio] = useState('');
  const [locationText, setLocationText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/v1/users/${user.username}`);
          if (res.ok) {
            const data = await res.json();
            setBio(data.profile?.bio || '');
            setLocationText(data.profile?.locationText || '');
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('http://localhost:3001/api/v1/me/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bio, locationText }),
      });

      if (!res.ok) {
        throw new Error('Failed to update profile');
      }

      setMessage('Profile updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: '#718096', fontFamily: 'system-ui, sans-serif' }}>
        Loading profile configuration...
      </div>
    );
  }

  return (
    <div className="edit-profile-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .edit-profile-wrapper {
          min-height: calc(100vh - 70px);
          background: #f7fafc;
          padding: 40px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }

        .edit-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #eaeaea;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          width: 100%;
          max-width: 580px;
          padding: 40px;
          transition: all 0.3s;
        }

        .edit-title {
          font-size: 1.6rem;
          font-weight: 900;
          color: #1a202c;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }

        .edit-subtitle {
          font-size: 0.9rem;
          color: #718096;
          margin-bottom: 28px;
        }

        .alert-success {
          background: #f0fff4;
          border: 1px solid #c6f6d5;
          color: #38a169;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .alert-error {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          color: #c53030;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          margin-bottom: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
        }

        .form-label {
          font-size: 0.82rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #718096;
        }

        .form-input {
          padding: 10px 14px;
          border-radius: 8px;
          border: 1.5px solid #edf2f7;
          background: #f8fafc;
          font-size: 0.92rem;
          font-family: inherit;
          color: #2d3748;
          outline: none;
          transition: all 0.2s;
        }

        .form-input:focus {
          border-color: #FF416C;
          background: white;
          box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.1);
        }

        .form-textarea {
          padding: 12px 14px;
          border-radius: 8px;
          border: 1.5px solid #edf2f7;
          background: #f8fafc;
          font-size: 0.92rem;
          font-family: inherit;
          color: #2d3748;
          outline: none;
          min-height: 120px;
          resize: vertical;
          transition: all 0.2s;
        }

        .form-textarea:focus {
          border-color: #FF416C;
          background: white;
          box-shadow: 0 0 0 3px rgba(255, 65, 108, 0.1);
        }

        .btn-submit {
          padding: 12px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255, 65, 108, 0.25);
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .back-link {
          display: inline-block;
          font-size: 0.85rem;
          color: #718096;
          text-decoration: none;
          margin-bottom: 20px;
          font-weight: 600;
        }

        .back-link:hover {
          color: #FF416C;
        }

        .dark {
          .edit-profile-wrapper {
            background: #0a0a0a;
          }
          .edit-card {
            background: #111;
            border-color: #222;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          }
          .edit-title {
            color: #fff;
          }
          .form-input, .form-textarea {
            background: #1a1a1a;
            border-color: #333;
            color: #fff;
          }
          .form-input:focus, .form-textarea:focus {
            background: #0a0a0a;
          }
          .alert-success {
            background: rgba(56, 161, 105, 0.1);
            border-color: rgba(56, 161, 105, 0.2);
          }
          .alert-error {
            background: rgba(229, 62, 62, 0.1);
            border-color: rgba(229, 62, 62, 0.2);
            color: #feb2b2;
          }
        }
      `}} />

      <div className="edit-card">
        <Link href={`/${user.username}`} className="back-link">
          ← Back to Profile
        </Link>
        <h1 className="edit-title">Edit Profile</h1>
        <p className="edit-subtitle">Customize how you appear on LowKeyBD</p>

        {message && <div className="alert-success">{message}</div>}
        {error && <div className="alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="e.g. Dhaka, Bangladesh"
              className="form-input"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other members about yourself..."
              className="form-textarea"
              maxLength={1000}
            />
          </div>

          <button type="submit" className="btn-submit" disabled={isSaving}>
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
