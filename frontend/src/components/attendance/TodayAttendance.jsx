import React, { useState } from 'react';
import api from '../../services/api';

function TodayAttendance({ attendance, onRefresh }) {
  const [expandedWorkers, setExpandedWorkers] = useState({});
  const [editingLog, setEditingLog] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(false);

  // Group attendance by worker
  const groupedAttendance = attendance.reduce((acc, log) => {
    if (!acc[log.worker_id]) {
      acc[log.worker_id] = {
        worker_id: log.worker_id,
        worker_code: log.worker_code,
        full_name: log.full_name,
        worker_type: log.worker_type,
        logs: []
      };
    }
    acc[log.worker_id].logs.push(log);
    return acc;
  }, {});

  const workers = Object.values(groupedAttendance);

  const toggleWorker = (workerId) => {
    setExpandedWorkers(prev => ({
      ...prev,
      [workerId]: !prev[workerId]
    }));
  };

  const handleEdit = (log) => {
    setEditingLog(log.id);
    setEditForm({
      workType: log.work_type,
      hoursWorked: log.hours_worked || '',
      piecesCompleted: log.pieces_completed || '',
      notes: log.notes || ''
    });
  };

  const handleSaveEdit = async (logId) => {
    setLoading(true);
    try {
      await api.request(`/api/work-logs/${logId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      setEditingLog(null);
      onRefresh();
    } catch (err) {
      alert('Failed to update: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this work log?')) return;
    
    setLoading(true);
    try {
      await api.request(`/api/work-logs/${logId}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async (logId) => {
    setLoading(true);
    try {
      await api.request(`/api/attendance/clock-out/${logId}`, {
        method: 'POST',
        body: JSON.stringify({ companyId: attendance[0]?.company_id })
      });
      onRefresh();
    } catch (err) {
      alert('Failed to clock out: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
            Today's Attendance
          </h2>
          <p style={{ marginTop: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
            {workers.length} workers, {attendance.length} total entries
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="btn btn-secondary"
        >
          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Refresh
        </button>
      </div>

      {workers.length === 0 ? (
        <div style={{ 
          padding: 'var(--space-2xl)',
          textAlign: 'center',
          color: 'var(--gray-500)'
        }}>
          <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor" style={{ margin: '0 auto var(--space-md)' }}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          <p style={{ fontSize: '1.125rem', fontWeight: '500' }}>No attendance records for today</p>
          <p style={{ fontSize: '0.875rem', marginTop: 'var(--space-sm)' }}>Start tracking by clocking in workers or adding manual entries</p>
        </div>
      ) : (
        <div>
          {workers.map((worker) => {
            const totalHours = worker.logs.reduce((sum, log) => sum + parseFloat(log.hours_worked || 0), 0);
            const totalPieces = worker.logs.reduce((sum, log) => sum + parseInt(log.pieces_completed || 0), 0);
            const totalEarnings = worker.logs.reduce((sum, log) => sum + parseFloat(log.total_earnings || 0), 0);
            const isExpanded = expandedWorkers[worker.worker_id];

            return (
              <div key={worker.worker_id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                {/* Worker Summary Row */}
                <div 
                  onClick={() => toggleWorker(worker.worker_id)}
                  style={{
                    padding: 'var(--space-lg)',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 60px',
                    gap: 'var(--space-md)',
                    alignItems: 'center',
                    backgroundColor: isExpanded ? 'var(--gray-50)' : 'white',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? 'var(--gray-50)' : 'white'}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: 'var(--space-xs)', color: 'var(--gray-900)' }}>
                      {worker.worker_code} - {worker.full_name}
                    </div>
                    <span className={`badge badge-${worker.worker_type.replace('_', '-')}`}>
                      {worker.worker_type.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Entries</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                      {worker.logs.length}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Hours</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--success)' }}>
                      {totalHours.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Pieces</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--warning)' }}>
                      {totalPieces}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', marginBottom: '2px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Earnings</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--gray-900)' }}>
                      ₹{totalEarnings.toFixed(0)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '1.25rem' }}>
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ backgroundColor: 'var(--gray-50)', padding: 'var(--space-lg)' }}>
                    {worker.logs.map((log, idx) => (
                      <div key={log.id} className="card" style={{
                        marginBottom: idx < worker.logs.length - 1 ? 'var(--space-md)' : 0,
                        border: '1px solid var(--gray-200)'
                      }}>
                        <div style={{ padding: 'var(--space-md)' }}>
                          {editingLog === log.id ? (
                            // Edit Mode
                            <div>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px', color: 'var(--gray-700)' }}>Type</label>
                                  <select
                                    value={editForm.workType}
                                    onChange={(e) => setEditForm({...editForm, workType: e.target.value})}
                                    className="input"
                                    style={{ padding: 'var(--space-sm)' }}
                                  >
                                    <option value="hourly">Hourly</option>
                                    <option value="piece">Piece</option>
                                    <option value="mixed">Mixed</option>
                                  </select>
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px', color: 'var(--gray-700)' }}>Hours</label>
                                  <input
                                    type="number"
                                    step="0.5"
                                    value={editForm.hoursWorked}
                                    onChange={(e) => setEditForm({...editForm, hoursWorked: e.target.value})}
                                    className="input"
                                    style={{ padding: 'var(--space-sm)' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', marginBottom: '4px', color: 'var(--gray-700)' }}>Pieces</label>
                                  <input
                                    type="number"
                                    value={editForm.piecesCompleted}
                                    onChange={(e) => setEditForm({...editForm, piecesCompleted: e.target.value})}
                                    className="input"
                                    style={{ padding: 'var(--space-sm)' }}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                <button
                                  onClick={() => handleSaveEdit(log.id)}
                                  disabled={loading}
                                  className="btn btn-success btn-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingLog(null)}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // View Mode
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--gray-700)' }}>
                                    Entry #{idx + 1}
                                  </span>
                                  <span className={`badge badge-${log.work_type}`}>
                                    {log.work_type}
                                  </span>
                                  {log.clock_in && !log.clock_out && (
                                    <span style={{
                                      padding: '4px 8px',
                                      borderRadius: 'var(--radius-md)',
                                      fontSize: '0.75rem',
                                      fontWeight: '600',
                                      background: 'var(--success-light)',
                                      color: 'var(--success)',
                                      animation: 'pulse 2s infinite'
                                    }}>
                                      Active
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-md)', fontSize: '0.875rem' }}>
                                  {log.clock_in && (
                                    <div>
                                      <span style={{ color: 'var(--gray-600)' }}>In: </span>
                                      <strong>{new Date(log.clock_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
                                    </div>
                                  )}
                                  {log.clock_out && (
                                    <div>
                                      <span style={{ color: 'var(--gray-600)' }}>Out: </span>
                                      <strong>{new Date(log.clock_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong>
                                    </div>
                                  )}
                                  <div>
                                    <span style={{ color: 'var(--gray-600)' }}>Hours: </span>
                                    <strong>{log.hours_worked || '0.00'}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--gray-600)' }}>Pieces: </span>
                                    <strong>{log.pieces_completed || '0'}</strong>
                                  </div>
                                  <div>
                                    <span style={{ color: 'var(--gray-600)' }}>Earnings: </span>
                                    <strong style={{ color: 'var(--success)' }}>₹{parseFloat(log.total_earnings || 0).toFixed(2)}</strong>
                                  </div>
                                </div>
                                {log.notes && (
                                  <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.813rem', color: 'var(--gray-600)', fontStyle: 'italic' }}>
                                    {log.notes}
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginLeft: 'var(--space-lg)' }}>
                                {log.clock_in && !log.clock_out && (
                                  <button
                                    onClick={() => handleClockOut(log.id)}
                                    disabled={loading}
                                    className="btn btn-danger btn-sm"
                                  >
                                    Clock Out
                                  </button>
                                )}
                                <button
                                  onClick={() => handleEdit(log)}
                                  className="btn btn-primary btn-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(log.id)}
                                  disabled={loading}
                                  className="btn btn-secondary btn-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Grand Total */}
          <div style={{
            padding: 'var(--space-xl)',
            background: 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '4px' }}>GRAND TOTAL</div>
              <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                {attendance.length} entries • {workers.length} workers
              </div>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: '700' }}>
              ₹{attendance.reduce((sum, r) => sum + parseFloat(r.total_earnings || 0), 0).toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodayAttendance;