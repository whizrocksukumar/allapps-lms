// src/components/Navbar.jsx
import React from 'react';

const logoUrl = 'https://storage.googleapis.com/msgsndr/1JWftY3EO8g1C5Mo47fV/media/6599278f1ed1816b37ba68f4.png';

export default function Navbar({ onToggle }) {
  return (
    <nav style={{ height: '60px', background: '#181818', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
      <button onClick={onToggle} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, justifyContent: 'center' }}>
        <div style={{ fontWeight: 600 }}>All Apps LMS</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img src={logoUrl} alt="Whizrock" style={{ height: '24px', width: 'auto' }} />
        <div style={{ width: '36px', height: '36px', background: '#0176d3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>A</div>
      </div>
    </nav>
  );
}