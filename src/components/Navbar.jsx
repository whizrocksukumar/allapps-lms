// src/components/Navbar.jsx - CORRECTED
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Navbar({ onToggle }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user);
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav style={{
      height: '60px',
      background: '#ffffff',
      borderBottom: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      padding: '0 1.5rem',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      {/* Left: All Apps Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/allapps-logo.png" alt="All Apps LMS" style={{ height: '28px', width: 'auto' }} />
      </div>

      {/* Right: User Profile + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', color: '#181818', fontWeight: '500' }}>{user?.email || ''}</div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            background: '#0176d3',
            border: 'none',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '8px',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}
        >
          Sign Out
        </button>

        <div
          style={{
            width: '40px',
            height: '40px',
            background: '#0176d3',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '600',
            cursor: 'pointer'
          }}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          A
        </div>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div style={{
            position: 'absolute',
            top: '60px',
            right: '0',
            background: '#ffffff',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            minWidth: '150px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 101
          }}>
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#181818'
            }}>
              Profile
            </div>
            <div style={{
              padding: '0.75rem 1rem',
              borderBottom: '1px solid #f0f0f0',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#181818'
            }}>
              Settings
            </div>
            <div style={{
              padding: '0.75rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#dc3545',
              fontWeight: '500'
            }}>
              Logout
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}