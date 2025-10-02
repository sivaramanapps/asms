import React, { useState } from 'react';
import api from '../../services/api';

function TodayAttendance({ attendance, onRefresh }) {
  const [expandedWorkers, setExpandedWorkers] = useState({});
  const [editingLog, setEditingLog] = useState(null);
  const [editForm, setEditForm] = useState({});

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
    try {
      await api.request(`/api/work-logs/${logId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      setEditingLog(null);
      onRefresh();
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this work log?')) return;
    
    try {
      await api.request(`/api/work-logs/${logId}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleClockOut = async (logId) => {
    try {
      await api.request(`/api/attendance/clock-out/${logId}`, {
        method: 'POST',
        body: JSON.stringify({ companyId: attendance[0].company_id })
      });
      onRefresh();
    } catch (err) {
      alert('Failed to clock out: ' + err.message);
    }
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '1.5rem',
        borderBottom: '2px solid #e9ecef'
      }}>
        <h2 style={{ margin: 0, color: '#2c3e50' }}>Today's Attendance</h2>
        <button
          onClick={onRefresh}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
        >
          🔄 Refresh
        </button>
      </div>

      {workers.length === 0 ? (
        <p style={{ 
          color: '#6c757d', 
          textAlign: 'center', 
          padding: '3rem',
          fontSize: '1.125rem'
        }}>
          No attendance records for today
        </p>
      ) : (
        <div>
          {workers.map((worker) => {
            const totalHours = worker.logs.reduce((sum, log) => sum + parseFloat(log.hours_worked || 0), 0);
            const totalPieces = worker.logs.reduce((sum, log) => sum + parseInt(log.pieces_completed || 0), 0);
            const totalEarnings = worker.logs.reduce((sum, log) => sum + parseFloat(log.total_earnings || 0), 0);
            const isExpanded = expandedWorkers[worker.worker_id];

            return (
              <div key={worker.worker_id} style={{ borderBottom: '1px solid #e9ecef' }}>
                {/* Worker Summary Row */}
                <div 
                  onClick={() => toggleWorker(worker.worker_id)}
                  style={{
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 80px',
                    gap: '1rem',
                    alignItems: 'center',
                    backgroundColor: isExpanded ? '#f8f9fa' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isExpanded ? '#f8f9fa' : 'white'}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                      {worker.worker_code} - {worker.full_name}
                    </div>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      backgroundColor: 
                        worker.worker_type === 'company' ? '#d1ecf1' :
                        worker.worker_type === 'contract' ? '#d4edda' :
                        worker.worker_type === 'job_worker' ? '#fff3cd' :
                        '#fce4ec',
                      color:
                        worker.worker_type === 'company' ? '#0c5460' :
                        worker.worker_type === 'contract' ? '#155724' :
                        worker.worker_type === 'job_worker' ? '#856404' :
                        '#880e4f'
                    }}>
                      {worker.worker_type}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Entries</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#007bff' }}>
                      {worker.logs.length}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Hours</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#28a745' }}>
                      {totalHours.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Pieces</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ffc107' }}>
                      {totalPieces}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', color: '#6c757d' }}>Earnings</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#dc3545' }}>
                      ₹{totalEarnings.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '1.5rem' }}>
                    {isExpanded ? '▼' : '▶'}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ backgroundColor: '#f8f9fa', padding: '1rem 1.5rem' }}>
                    {worker.logs.map((log, idx) => (
                      <div key={log.id} style={{
                        backgroundColor: 'white',
                        padding: '1rem',
                        marginBottom: idx < worker.logs.length - 1 ? '0.75rem' : 0,
                        borderRadius: '8px',
                        border: '1px solid #dee2e6'
                      }}>
                        {editingLog === log.id ? (
                          // Edit Mode
                          <div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Hours</label>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={editForm.hoursWorked}
                                  onChange={(e) => setEditForm({...editForm, hoursWorked: e.target.value})}
                                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Pieces</label>
                                <input
                                  type="number"
                                  value={editForm.piecesCompleted}
                                  onChange={(e) => setEditForm({...editForm, piecesCompleted: e.target.value})}
                                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Type</label>
                                <select
                                  value={editForm.workType}
                                  onChange={(e) => setEditForm({...editForm, workType: e.target.value})}
                                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #ced4da', borderRadius: '4px' }}
                                >
                                  <option value="hourly">Hourly</option>
                                  <option value="piece">Piece</option>
                                  <option value="mixed">Mixed</option>
                                </select>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleSaveEdit(log.id)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingLog(null)}
                                style={{
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#6c757d',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer'
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
                                <div>
                                  <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Entry #{idx + 1}</span>
                                  <span style={{ margin: '0 0.5rem', color: '#dee2e6' }}>|</span>
                                  <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>{log.work_type}</span>
                                </div>
                                {log.clock_in && (
                                  <div>
                                    <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>In: </span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                      {new Date(log.clock_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                )}
                                {log.clock_out ? (
                                  <div>
                                    <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>Out: </span>
                                    <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                      {new Date(log.clock_out).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                ) : log.clock_in && (
                                  <button
                                    onClick={() => handleClockOut(log.id)}
                                    style={{
                                      padding: '0.25rem 0.75rem',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Clock Out
                                  </button>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem' }}>
                                <div>
                                  <span style={{ color: '#6c757d' }}>Hours: </span>
                                  <strong>{log.hours_worked || '0.00'}</strong>
                                </div>
                                <div>
                                  <span style={{ color: '#6c757d' }}>Pieces: </span>
                                  <strong>{log.pieces_completed || '0'}</strong>
                                </div>
                                <div>
                                  <span style={{ color: '#6c757d' }}>Earnings: </span>
                                  <strong style={{ color: '#28a745' }}>₹{parseFloat(log.total_earnings || 0).toFixed(2)}</strong>
                                </div>
                              </div>
                              {log.notes && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6c757d', fontStyle: 'italic' }}>
                                  {log.notes}
                                </div>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleEdit(log)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: '#007bff',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(log.id)}
                                style={{
                                  padding: '0.5rem 0.75rem',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.875rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Grand Total */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#2c3e50',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: '700',
            fontSize: '1.125rem'
          }}>
            <span>GRAND TOTAL ({attendance.length} entries, {workers.length} workers)</span>
            <span>₹{attendance.reduce((sum, r) => sum + parseFloat(r.total_earnings || 0), 0).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default TodayAttendance;