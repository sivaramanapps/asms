import React, { useState } from 'react';
import api from '../services/api';
import Logo from './Logo';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vendor branding - can be configured
  const vendorConfig = {
    name: 'DigiGrow Solutions',
    logoUrl: null, // Set to image URL if you have a logo
    tagline: 'Attendance & Salary Management System',
    supportEmail: 'support@digigrow.in'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(email, password);
      onLoginSuccess(response.data.user);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--space-lg)'
    }}>
      <div className="card fade-in" style={{ 
        width: '100%',
        maxWidth: '440px',
        border: 'none'
      }}>
        {/* Header with Gradient */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
          padding: 'var(--space-2xl) var(--space-xl)',
          textAlign: 'center',
          color: 'white'
        }}>
          <Logo 
            size="lg" 
            showText={true}
            companyName={vendorConfig.name}
            logoUrl={vendorConfig.logoUrl}
          />
          <p style={{ 
            fontSize: '0.938rem',
            opacity: 0.9,
            fontWeight: '400',
            marginTop: 'var(--space-md)'
          }}>
            {vendorConfig.tagline}
          </p>
        </div>

        <div className="card-body" style={{ padding: 'var(--space-2xl)' }}>
          {error && (
            <div className="alert alert-error">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 'var(--space-lg)' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--space-sm)',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-700)'
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@clienta.com"
                required
                className="input"
                autoComplete="email"
              />
            </div>

            <div style={{ marginBottom: 'var(--space-xl)' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--space-sm)',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-700)'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="input"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
                  Signing in...
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div style={{ 
            marginTop: 'var(--space-xl)',
            padding: 'var(--space-lg)',
            backgroundColor: 'var(--gray-50)',
            borderRadius: 'var(--radius-lg)',
            textAlign: 'center'
          }}>
            <p style={{ 
              fontSize: '0.813rem', 
              color: 'var(--gray-600)',
              marginBottom: 'var(--space-sm)',
              fontWeight: '500'
            }}>
              Demo Account
            </p>
            <code style={{ 
              fontSize: '0.813rem',
              color: 'var(--primary)',
              fontWeight: '600',
              display: 'block'
            }}>
              admin@clienta.com / password123
            </code>
          </div>

          <div style={{ 
            marginTop: 'var(--space-lg)',
            textAlign: 'center',
            fontSize: '0.813rem',
            color: 'var(--gray-500)'
          }}>
            Need help? Contact {vendorConfig.supportEmail}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;