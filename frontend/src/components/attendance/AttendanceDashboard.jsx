import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import ClockInOut from './ClockInOut';
import TodayAttendance from './TodayAttendance';
import ManualEntry from './ManualEntry';

function AttendanceDashboard({ user }) {
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clockinout');
  const [error, setError] = useState('');

  const companyId = user.companies[0]?.companyId;
  const companyName = user.companies[0]?.companyName;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [workersRes, attendanceRes] = await Promise.all([
        api.getWorkers(companyId),
        api.getTodayAttendance(companyId)
      ]);
      setWorkers(workersRes.data.workers);
      setAttendance(attendanceRes.data.attendance);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceUpdate = () => {
    loadData();
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 'var(--space-lg)'
      }}>
        <div className="spinner"></div>
        <p style={{ color: 'white', fontSize: '1.125rem', fontWeight: '500' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 'var(--space-2xl)' }}>
      {/* Modern Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 'var(--space-xl) var(--space-lg)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-lg)' }}>
            {/* Company Branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
              {/* Company Logo Placeholder */}
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: 'var(--radius-lg)',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.875rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                🏭
              </div>
              <div>
                <h1 style={{ 
                  margin: 0, 
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: 'white',
                  letterSpacing: '-0.025em'
                }}>
                  {companyName}
                </h1>
                <p style={{ 
                  margin: 'var(--space-xs) 0 0 0',
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: '400'
                }}>
                  {user.full_name} • {user.companies[0]?.role}
                </p>
              </div>
            </div>

            {/* Date & Stats */}
            <div style={{ 
              display: 'flex',
              gap: 'var(--space-xl)',
              alignItems: 'center'
            }}>
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                padding: 'var(--space-md) var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                color: 'white'
              }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '4px' }}>Today</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                padding: 'var(--space-md) var(--space-lg)',
                borderRadius: 'var(--radius-lg)',
                color: 'white'
              }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.9, marginBottom: '4px' }}>Workers</div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700' }}>
                  {workers.length} Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ maxWidth: '1400px', margin: 'var(--space-lg) auto', padding: '0 var(--space-lg)' }}>
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{
        background: 'white',
        boxShadow: 'var(--shadow-sm)',
        marginTop: '-1px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', gap: 'var(--space-sm)', padding: '0 var(--space-lg)', overflow: 'auto' }}>
          <button
            onClick={() => setActiveTab('clockinout')}
            className="btn"
            style={{
              padding: 'var(--space-lg)',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'clockinout' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'clockinout' ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: activeTab === 'clockinout' ? '700' : '500',
              borderRadius: 0,
              fontSize: '0.938rem'
            }}
          >
            Clock In/Out
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className="btn"
            style={{
              padding: 'var(--space-lg)',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'manual' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'manual' ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: activeTab === 'manual' ? '700' : '500',
              borderRadius: 0,
              fontSize: '0.938rem'
            }}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setActiveTab('today')}
            className="btn"
            style={{
              padding: 'var(--space-lg)',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'today' ? '3px solid var(--primary)' : '3px solid transparent',
              color: activeTab === 'today' ? 'var(--primary)' : 'var(--gray-600)',
              fontWeight: activeTab === 'today' ? '700' : '500',
              borderRadius: 0,
              fontSize: '0.938rem',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)'
            }}
          >
            Today's Attendance
            {attendance.length > 0 && (
              <span style={{
                background: 'var(--primary)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '700'
              }}>
                {attendance.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: 'var(--space-xl) auto', 
        padding: '0 var(--space-lg)' 
      }}>
        <div className="fade-in">
          {activeTab === 'clockinout' && (
            <ClockInOut 
              workers={workers} 
              companyId={companyId}
              onUpdate={handleAttendanceUpdate}
            />
          )}
          {activeTab === 'manual' && (
            <ManualEntry 
              workers={workers} 
              companyId={companyId}
              onUpdate={handleAttendanceUpdate}
            />
          )}
          {activeTab === 'today' && (
            <TodayAttendance 
              attendance={attendance}
              onRefresh={handleAttendanceUpdate}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default AttendanceDashboard;