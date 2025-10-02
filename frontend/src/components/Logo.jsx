import React from 'react';

function Logo({ size = 'md', showText = true, companyName = null, logoUrl = null }) {
  const sizes = {
    sm: { icon: '2rem', text: '1rem' },
    md: { icon: '3rem', text: '1.5rem' },
    lg: { icon: '4rem', text: '2rem' }
  };

  const currentSize = sizes[size];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      gap: 'var(--space-sm)'
    }}>
      {logoUrl ? (
        <img 
          src={logoUrl} 
          alt={companyName || 'Company Logo'} 
          style={{ 
            height: currentSize.icon,
            objectFit: 'contain',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
        />
      ) : (
        <div style={{ 
          fontSize: currentSize.icon,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
        }}>
          ⏱️
        </div>
      )}
      {showText && (
        <div style={{ 
          fontSize: currentSize.text, 
          fontWeight: '700',
          letterSpacing: '-0.025em',
          textAlign: 'center'
        }}>
          {companyName || 'ASMS'}
        </div>
      )}
    </div>
  );
}

export default Logo;