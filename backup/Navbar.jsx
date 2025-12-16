// src/components/Navbar.jsx
import React from 'react';

export default function Navbar({ onToggle }) {
    return (
        <nav style={{ height: '60px', background: '#181818', color: '#fff', display: 'flex', alignItems: 'center', padding: '0 1.5rem', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
            <button onClick={onToggle} style={{ background: '#0176d3', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>☰</button>
            <div style={{ fontWeight: 600 }}>All Apps LMS</div>
            <div style={{ width: '36px', height: '36px', background: '#0176d3', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff' }}>A</div>
        </nav>
    );
}
