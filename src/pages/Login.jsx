import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Invalid email or password');
    } else {
      navigate('/clients');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f4f8',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Branding */}
      <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}>
          <div style={{
            width: 40,
            height: 40,
            background: '#0176d3',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-1px' }}>AA</span>
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a1a1a', letterSpacing: '-0.5px' }}>
            All<span style={{ color: '#0176d3' }}>Apps</span>
          </span>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
          Loan Management System
        </p>
      </div>

      {/* Card */}
      <div style={{
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: 400,
      }}>
        <h2 style={{ margin: '0 0 1.75rem', fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
          Sign in to your account
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.4rem' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.9375rem',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#0176d3'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '0.625rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: 8,
                fontSize: '0.9375rem',
                color: '#111827',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#0176d3'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '0.625rem 0.875rem',
              color: '#dc2626',
              fontSize: '0.875rem',
              marginBottom: '1.25rem',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.7rem',
              background: loading ? '#5aabee' : '#0176d3',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = '#0163b0'; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = '#0176d3'; }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>

      <p style={{ marginTop: '2rem', color: '#9ca3af', fontSize: '0.8125rem' }}>
        &copy; {new Date().getFullYear()} Whizrock. All rights reserved.
      </p>
    </div>
  );
}
