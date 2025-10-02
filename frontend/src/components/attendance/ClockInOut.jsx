import React, { useState } from 'react';
import api from '../../services/api';

function ClockInOut({ workers, companyId, onUpdate }) {
  const [selectedWorker, setSelectedWorker] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const activeWorkers = workers.filter(w => w.status === 'active');
  
  const filteredWorkers = activeWorkers.filter(w => 
    w.worker_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedWorkerObj = workers.find(w => w.id === selectedWorker);

  const handleWorkerSelect = (worker) => {
    setSelectedWorker(worker.id);
    setSearchTerm(`${worker.worker_code} - ${worker.full_name}`);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    setSelectedWorker('');
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleClockIn = async () => {
    if (!selectedWorker) {
      setMessage({ type: 'error', text: 'Please select a worker' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await api.clockIn(selectedWorker, companyId, notes);
      setMessage({ type: 'success', text: 'Clocked in successfully!' });
      setNotes('');
      clearSelection();
      onUpdate();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!selectedWorker) {
      setMessage({ type: 'error', text: 'Please select a worker' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await api.clockOut(selectedWorker, companyId, notes);
      setMessage({ 
        type: 'success', 
        text: `Clocked out! Hours: ${result.data.work_log.hours_worked}, Earnings: ₹${result.data.work_log.total_earnings}` 
      });
      setNotes('');
      clearSelection();
      onUpdate();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--gray-900)' }}>
          Clock In / Clock Out
        </h2>
        <p style={{ marginTop: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          Quick attendance tracking for hourly workers
        </p>
      </div>

      <div className="card-body">
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.type === 'success' ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {message.text}
          </div>
        )}

        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 'var(--space-sm)',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--gray-700)'
          }}>
            Search Worker
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
                setSelectedWorker('');
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Type worker code or name..."
              className="input"
              style={{ paddingRight: searchTerm ? '3rem' : '1rem' }}
            />
            {searchTerm && (
              <button
                onClick={clearSelection}
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
            {showDropdown && filteredWorkers.length > 0 && searchTerm && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '2px solid var(--gray-200)',
                borderTop: 'none',
                borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                maxHeight: '240px',
                overflowY: 'auto',
                zIndex: 10,
                boxShadow: 'var(--shadow-lg)',
                marginTop: '-2px'
              }}>
                {filteredWorkers.map(worker => (
                  <div
                    key={worker.id}
                    onClick={() => handleWorkerSelect(worker)}
                    style={{
                      padding: 'var(--space-md)',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--gray-100)',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-50)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <div style={{ fontWeight: '600', color: 'var(--gray-900)' }}>
                      {worker.worker_code} - {worker.full_name}
                    </div>
                    <div style={{ fontSize: '0.813rem', color: 'var(--gray-600)', marginTop: '2px' }}>
                      {worker.worker_type} • ₹{worker.base_hourly_rate}/hr
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedWorkerObj && (
          <div className="alert alert-info" style={{ marginBottom: 'var(--space-xl)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {selectedWorkerObj.full_name} ({selectedWorkerObj.worker_code})
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                Type: {selectedWorkerObj.worker_type} | Hourly: ₹{selectedWorkerObj.base_hourly_rate} | Piece: ₹{selectedWorkerObj.base_piece_rate}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 'var(--space-sm)',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: 'var(--gray-700)'
          }}>
            Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Morning shift, extra hours, etc..."
            className="input"
          />
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-md)' 
        }}>
          <button
            onClick={handleClockIn}
            disabled={loading || !selectedWorker}
            className="btn btn-success btn-lg"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Clock In
          </button>
          <button
            onClick={handleClockOut}
            disabled={loading || !selectedWorker}
            className="btn btn-danger btn-lg"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
            </svg>
            Clock Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClockInOut;