'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserProfile {
  username: string;
  createdAt: string;
  profile?: {
    bio?: string | null;
    locationText?: string | null;
    reputationScore: number;
    contributionCount: number;
  } | null;
}

export default function UserProfilePage({ params }: { params: { username: string } }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState('');
  
  const username = params.username;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/v1/users/${username}`);
        if (!res.ok) {
          throw new Error('User not found');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error fetching profile');
      }
    };
    if (username) {
      fetchProfile();
    }
  }, [username]);

  if (error) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <h2 style={{ color: '#e53e3e', marginBottom: '16px' }}>Error loading profile</h2>
        <p style={{ color: '#718096', marginBottom: '24px' }}>{error}</p>
        <Link href="/" style={{ color: '#FF416C', fontWeight: 700, textDecoration: 'underline' }}>← Back to Home</Link>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ padding: '120px 20px', textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#718096' }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div className="profile-page-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .profile-page-wrapper {
          min-height: calc(100vh - 70px);
          background: #f7fafc;
          padding: 40px 20px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }

        .profile-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #eaeaea;
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
          width: 100%;
          max-width: 640px;
          padding: 40px;
          transition: all 0.3s;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
        }

        .profile-avatar {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          color: white;
          font-size: 2.2rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          text-transform: uppercase;
          box-shadow: 0 4px 15px rgba(255, 65, 108, 0.2);
        }

        .profile-title-group h1 {
          font-size: 1.6rem;
          font-weight: 900;
          color: #1a202c;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .profile-joined {
          font-size: 0.85rem;
          color: #a0aec0;
          font-weight: 500;
        }

        .profile-bio {
          font-size: 1rem;
          line-height: 1.6;
          color: #4a5568;
          background: #f8fafc;
          padding: 16px 20px;
          border-radius: 10px;
          border-left: 4px solid #FF416C;
          margin-bottom: 32px;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-item {
          background: #f8fafc;
          border: 1px solid #edf2f7;
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .stat-label {
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #a0aec0;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 1.4rem;
          font-weight: 900;
          color: #2d3748;
        }

        .profile-info-list {
          border-top: 1px solid #edf2f7;
          padding-top: 24px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 0.9rem;
          color: #4a5568;
        }

        .info-row strong {
          color: #718096;
        }

        .dark {
          .profile-page-wrapper {
            background: #0a0a0a;
          }
          .profile-card {
            background: #111;
            border-color: #222;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          }
          .profile-title-group h1 {
            color: #fff;
          }
          .profile-bio {
            background: #1a1a1a;
            color: #cbd5e0;
          }
          .stat-item {
            background: #1a1a1a;
            border-color: #222;
          }
          .stat-value {
            color: #e2e8f0;
          }
          .info-row {
            color: #cbd5e0;
          }
          .profile-info-list {
            border-top-color: #222;
          }
        }
      `}} />

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {profile.username.slice(0, 2)}
          </div>
          <div className="profile-title-group">
            <h1>u/{profile.username}</h1>
            <span className="profile-joined">
              Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>

        {profile.profile?.bio ? (
          <p className="profile-bio">&ldquo;{profile.profile.bio}&rdquo;</p>
        ) : (
          <p className="profile-bio" style={{ fontStyle: 'italic', color: '#a0aec0', borderLeftColor: '#cbd5e0' }}>
            No bio provided yet.
          </p>
        )}

        <div className="profile-stats-grid">
          <div className="stat-item">
            <div className="stat-label">Reputation</div>
            <div className="stat-value" style={{ color: '#FF416C' }}>
              {profile.profile?.reputationScore ?? 0}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Contributions</div>
            <div className="stat-value">
              {profile.profile?.contributionCount ?? 0}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Location</div>
            <div className="stat-value" style={{ fontSize: '0.85rem', paddingTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.profile?.locationText || 'Global'}
            </div>
          </div>
        </div>

        <div className="profile-info-list">
          <div className="info-row">
            <strong>Location Status</strong>
            <span>{profile.profile?.locationText || 'Not specified'}</span>
          </div>
          <div className="info-row">
            <strong>Status</strong>
            <span style={{ color: '#38a169', fontWeight: 'bold' }}>Active Member</span>
          </div>
        </div>
      </div>
    </div>
  );
}
