'use client';

import React, { useEffect, useState } from 'react';

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
  
  // Need to unwrap params in Next 15+ if it's treated as a Promise, but in 14 it's sync.
  // We'll assume simple usage here.
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
    return <div style={{ padding: '50px', textAlign: 'center', color: 'red' }}>{error}</div>;
  }

  if (!profile) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading profile...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
      <h1>{profile.username}&apos;s Profile</h1>
      {profile.profile?.bio && <p style={{ marginTop: '20px', fontSize: '1.2rem' }}>&ldquo;{profile.profile.bio}&rdquo;</p>}
      <ul style={{ marginTop: '20px', listStyleType: 'none', padding: 0 }}>
        <li><strong>Location:</strong> {profile.profile?.locationText || 'Not specified'}</li>
        <li><strong>Reputation:</strong> {profile.profile?.reputationScore || 0}</li>
        <li><strong>Contributions:</strong> {profile.profile?.contributionCount || 0}</li>
        <li><strong>Joined:</strong> {new Date(profile.createdAt).toLocaleDateString()}</li>
      </ul>
    </div>
  );
}
