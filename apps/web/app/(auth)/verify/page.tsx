'use client';
import { API_URL } from '../../../src/lib/config';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await fetch(`${API_URL}/api/v1/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      setMessage('Email verified successfully! You can now use all features.');
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>Verify Email</h1>
      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
        <input 
          type="text" 
          placeholder="Enter Verification Token" 
          value={token} 
          onChange={(e) => setToken(e.target.value)} 
          required 
          style={{ padding: '8px' }}
        />
        <button type="submit" style={{ padding: '10px', background: 'black', color: 'white', cursor: 'pointer' }}>Verify</button>
      </form>
    </div>
  );
}
