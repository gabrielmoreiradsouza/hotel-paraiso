'use client';

import React from 'react';

export const ContentManagerNavLink: React.FC = () => {
  return (
    <a
      href="/content-manager"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        margin: '4px 12px',
        borderRadius: '6px',
        color: '#c9a96e',
        textDecoration: 'none',
        fontSize: '13px',
        fontWeight: 500,
        border: '1px solid rgba(201, 169, 110, 0.3)',
        transition: 'all 0.15s',
      }}
      onMouseEnter={(e) => {
        (e.target as HTMLElement).style.background = 'rgba(201, 169, 110, 0.1)';
      }}
      onMouseLeave={(e) => {
        (e.target as HTMLElement).style.background = 'transparent';
      }}
    >
      📋 Gestão de Conteúdo
    </a>
  );
};
