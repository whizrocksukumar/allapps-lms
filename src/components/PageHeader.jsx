import React from 'react';

export default function PageHeader({ title, actions }) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem'
        }}>
            <h1 style={{
                margin: 0,
                color: '#0176d3',
                fontSize: '1.75rem',
                fontWeight: 600
            }}>
                {title}
            </h1>
            <div style={{
                display: 'flex',
                gap: '0.75rem',
                flexWrap: 'wrap',
                alignItems: 'center'
            }}>
                {actions}
            </div>
        </div>
    );
}
