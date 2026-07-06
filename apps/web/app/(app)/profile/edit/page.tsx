'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../src/features/auth/AuthContext';
import { useRouter } from 'next/navigation';

export default function EditProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [bio, setBio] = useState('');
  const [locationText, setLocationText] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      // Fetch current profile data to populate the form
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  };

  if (isLoading || !user) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1>Edit Profile</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            style={{ width: '100%', padding: '8px', minHeight: '100px' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>Location</label>
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '10px', background: 'black', color: 'white', cursor: 'pointer' }}>
          Save Changes
        </button>
      </form>
    </div>
  );
}
