'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../src/features/auth/AuthContext';

export default function Home() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h1>Welcome to LowKeyBD</h1>
      <p style={{ marginTop: '20px', fontSize: '1.2rem' }}>
        The Bangladeshi tech community platform.
      </p>
      
      <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #eee', borderRadius: '8px' }}>
        {isAuthenticated ? (
          <div>
            <h2>Hello, {user?.username}!</h2>
            <p style={{ margin: '10px 0' }}>Status: {user?.isVerified ? 'Verified' : 'Unverified'}</p>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <Link href={`/${user?.username}`} style={{ padding: '10px 15px', background: '#333', color: 'white', borderRadius: '4px' }}>
                View Profile
              </Link>
              <Link href="/profile/edit" style={{ padding: '10px 15px', background: '#666', color: 'white', borderRadius: '4px' }}>
                Edit Profile
              </Link>
              <button onClick={logout} style={{ padding: '10px 15px', background: 'red', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2>You are not logged in.</h2>
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <Link href="/login" style={{ padding: '10px 15px', background: '#333', color: 'white', borderRadius: '4px' }}>
                Login
              </Link>
              <Link href="/register" style={{ padding: '10px 15px', background: '#666', color: 'white', borderRadius: '4px' }}>
                Register
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
