'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Community } from '../../src/features/communities/types';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/v1/communities');
        if (!res.ok) {
          throw new Error('Failed to load communities');
        }
        const data = await res.json();
        setCommunities(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCommunities();
  }, []);

  const filteredCommunities = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="container">
      <style dangerouslySetInnerHTML={{ __html: `
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
          font-family: var(--font-geist-sans), system-ui, sans-serif;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 40px;
          flex-wrap: wrap;
          gap: 20px;
        }
        .title {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #FF4B2B 0%, #FF416C 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .subtitle {
          color: #666;
          margin-top: 5px;
          font-size: 1rem;
        }
        .create-btn {
          padding: 12px 24px;
          background: linear-gradient(135deg, #1f1f1f 0%, #111 100%);
          color: #fff;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
          display: inline-block;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
          background: linear-gradient(135deg, #333 0%, #222 100%);
        }
        .search-bar {
          width: 100%;
          padding: 14px 20px;
          border-radius: 12px;
          border: 1px solid #e0e0e0;
          font-size: 1rem;
          margin-bottom: 30px;
          background: #fafafa;
          transition: all 0.2s ease;
          outline: none;
        }
        .search-bar:focus {
          border-color: #FF416C;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(255, 65, 108, 0.1);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 25px;
        }
        .card {
          border: 1px solid #eaeaea;
          border-radius: 14px;
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
          position: relative;
          overflow: hidden;
          background: #fff;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }
        .card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
          border-color: #FF416C;
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 15px;
        }
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #4a5568;
          font-size: 1.2rem;
          border: 1px solid rgba(0,0,0,0.05);
          overflow: hidden;
          object-fit: cover;
        }
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .card-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #1a202c;
        }
        .card-slug {
          font-size: 0.8rem;
          color: #a0aec0;
          margin-top: 2px;
        }
        .card-body {
          font-size: 0.9rem;
          color: #4a5568;
          line-height: 1.5;
          margin-bottom: 20px;
          flex-grow: 1;
        }
        .card-footer {
          display: flex;
          gap: 15px;
          border-top: 1px solid #f7fafc;
          padding-top: 15px;
          font-size: 0.8rem;
          color: #718096;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .nav-link {
          color: #FF416C;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-bottom: 30px;
          transition: transform 0.2s ease;
        }
        .nav-link:hover {
          transform: translateX(-3px);
        }
        .loading, .error, .empty {
          text-align: center;
          padding: 60px 20px;
          font-size: 1.1rem;
          color: #718096;
        }
        .error {
          color: #e53e3e;
        }

        .dark {
          .card {
            background: #111;
            border-color: #222;
          }
          .card-title {
            color: #fff;
          }
          .card-body {
            color: #cbd5e0;
          }
          .card-footer {
            border-top-color: #222;
            color: #a0aec0;
          }
          .search-bar {
            background: #1a1a1a;
            border-color: #333;
            color: #fff;
          }
          .search-bar:focus {
            background: #111;
          }
          .create-btn {
            background: linear-gradient(135deg, #fff 0%, #eee 100%);
            color: #000;
          }
          .create-btn:hover {
            background: linear-gradient(135deg, #e1e1e1 0%, #d1d1d1 100%);
          }
        }
      `}} />

      <Link href="/" className="nav-link">
        &larr; Back to Home
      </Link>

      <div className="header">
        <div>
          <h1 className="title">Communities</h1>
          <p className="subtitle">Discover local hubs, campuses, and tech spaces across Bangladesh.</p>
        </div>
        <Link href="/communities/create" className="create-btn">
          Create Community
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search communities by name or topic..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />

      {isLoading ? (
        <div className="loading">Gathering local communities...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : filteredCommunities.length === 0 ? (
        <div className="empty">
          {search ? 'No matching communities found.' : 'No communities created yet. Be the first to start one!'}
        </div>
      ) : (
        <div className="grid">
          {filteredCommunities.map((c) => (
            <Link href={`/c/${c.slug}`} key={c.id}>
              <div className="card">
                <div>
                  <div className="card-header">
                    <div className="avatar">
                      {c.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c.avatarUrl} alt={c.name} className="avatar-img" />
                      ) : (
                        c.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h3 className="card-title">{c.name}</h3>
                      <p className="card-slug">c/{c.slug}</p>
                    </div>
                  </div>
                  <p className="card-body">
                    {c.description || 'No description provided for this community yet.'}
                  </p>
                </div>
                <div className="card-footer">
                  <span className="badge">
                    👥 {c._count?.members || 0} members
                  </span>
                  <span className="badge">
                    📝 {c._count?.posts || 0} posts
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
