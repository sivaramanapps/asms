import React, { useState, useEffect } from 'react';
import api from '../../services/api';

function ManualEntry({ workers, companyId, onUpdate }) {
  const [formData, setFormData] = useState({
    workerId: '',
    workDate: new Date().toISOString().split('T')[0],
    workType: 'hourly',
    hoursWorked: '',
    piecesCompleted: '',
    workTypeId: '',
    notes: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [workTypes, setWorkTypes] = useState([]);
  const [workTypeSearch, setWorkTypeSearch] = useState('');
  const [showWorkTypeDropdown, setShowWorkTypeDropdown] = useState(false);

  const activeWorkers = workers.filter(w => w.status === 'active');
  const selectedWorker = workers.find(w => w.id === formData.workerId);
  const selectedWorkType = workTypes.find(wt => wt.id === formData.workTypeId);

  const filteredWorkers = activeWorkers.filter(w => 
    w.worker_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWorkTypes = workTypes.filter(wt =>
  wt.code.toLowerCase().includes(workTypeSearch.toLowerCase()) ||
  wt.name.toLowerCase().includes(workTypeSearch.toLowerCase())
  );
  useEffect(() => {
    loadWorkTypes();
  }, []);

  const loadWorkTypes = async () => {
    try {
      const response = await api.getWorkTypes(companyId);
      setWorkTypes(response.data.work_types);
    } catch (err) {
      console.error('Failed to load work types:', err);
    }
  };

  const handleWorkerSelect = (worker) => {
    setFormData({ ...formData, workerId: worker.id });
    setSearchTerm(`${worker.worker_code} - ${worker.full_name}`);
    setShowDropdown(false);
  };

  const clearWorkerSelection = () => {
    setFormData({ ...formData, workerId: '' });
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const workLogData = {
        companyId,
        workerId: formData.workerId,
        workDate: formData.workDate,
        workType: formData.workType,
        hoursWorked: parseFloat(formData.hoursWorked) || 0,
        piecesCompleted: parseInt(formData.piecesCompleted) || 0,
        workTypeId: formData.workTypeId || null,
        notes: formData.notes
      };

      const result = await api.createWorkLog(workLogData);
      setMessage({ 
        type: 'success', 
        text: `Work log created! Earnings: ₹${result.data.work_log.total_earnings}` 
      });
      
      // Reset form
      setFormData({
        workerId: '',
        workDate: new Date().toISOString().split('T')[0],
        workType: 'hourly',
        hoursWorked: '',
        piecesCompleted: '',
        workTypeId: '',
        notes: ''
      });
      setSearchTerm('');
      
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
          Manual Work Entry
        </h2>
        <p style={{ marginTop: 'var(--space-xs)', fontSize: '0.875rem', color: 'var(--gray-600)' }}>
          Record attendance for any work type - hourly, piece rate, or mixed
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 'var(--space-sm)',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--gray-700)'
            }}>
              Worker *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  setFormData({ ...formData, workerId: '' });
                }}
                onClick={() => setShowDropdown(true)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => {
                  setTimeout(() => setShowDropdown(false), 200);
                }}
                placeholder="Search worker..."
                required={!formData.workerId}
                className="input"
                style={{ paddingRight: searchTerm ? '3rem' : '1rem' }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearWorkerSelection}
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
              {showDropdown && filteredWorkers.length > 0 && (
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
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleWorkerSelect(worker);
                      }}
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
                        <span className={`badge badge-${worker.worker_type.replace('_', '-')}`}>
                          {worker.worker_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedWorker && (
            <div className="alert alert-info" style={{ marginBottom: 'var(--space-lg)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div style={{ fontSize: '0.875rem' }}>
                <strong>Default Rates:</strong> Hourly: ₹{selectedWorker.base_hourly_rate} | Piece: ₹{selectedWorker.base_piece_rate}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--space-sm)',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-700)'
              }}>
                Work Date *
              </label>
              <input
                type="date"
                value={formData.workDate}
                onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                required
                className="input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--space-sm)',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--gray-700)'
              }}>
                Work Type *
              </label>
              <select
                value={formData.workType}
                onChange={(e) => setFormData({ ...formData, workType: e.target.value, workTypeId: '' })}
                required
                className="input"
              >
                <option value="hourly">Hourly</option>
                <option value="piece">Piece Rate</option>
                <option value="mixed">Mixed (Hourly + Piece)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            {(formData.workType === 'hourly' || formData.workType === 'mixed') && (
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 'var(--space-sm)',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--gray-700)'
                }}>
                  Hours Worked
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hoursWorked}
                  onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
                  placeholder="8.0"
                  className="input"
                />
              </div>
            )}

            {(formData.workType === 'piece' || formData.workType === 'mixed') && (
              <>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 'var(--space-sm)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Product/Work Type
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={workTypeSearch}
                      onChange={(e) => {
                        setWorkTypeSearch(e.target.value);
                        setShowWorkTypeDropdown(true);
                        if (!e.target.value) {
                          setFormData({ ...formData, workTypeId: '' });
                        }
                      }}
                      onClick={() => setShowWorkTypeDropdown(true)}
                      onFocus={() => setShowWorkTypeDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => setShowWorkTypeDropdown(false), 200);
                      }}
                      placeholder="Search product or work type..."
                      className="input"
                      style={{ paddingRight: workTypeSearch ? '3rem' : '1rem' }}
                    />
                    {workTypeSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setWorkTypeSearch('');
                          setFormData({ ...formData, workTypeId: '' });
                        }}
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
                    {showWorkTypeDropdown && filteredWorkTypes.length > 0 && (
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
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setWorkTypeSearch('');
                            setFormData({ ...formData, workTypeId: '' });
                            setShowWorkTypeDropdown(false);
                          }}
                          style={{
                            padding: 'var(--space-md)',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--gray-100)',
                            transition: 'background-color var(--transition-fast)',
                            fontStyle: 'italic',
                            color: 'var(--gray-600)'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--gray-50)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                        >
                          Use Worker Default Rate
                        </div>
                        {filteredWorkTypes.map(workType => (
                          <div
                            key={workType.id}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, workTypeId: workType.id });
                              setWorkTypeSearch(`${workType.code} - ${workType.name}`);
                              setShowWorkTypeDropdown(false);
                            }}
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
                              {workType.code} - {workType.name}
                            </div>
                            <div style={{ fontSize: '0.813rem', color: 'var(--gray-600)', marginTop: '2px' }}>
                              ₹{workType.piece_rate} per {workType.unit_name}
                              {workType.description && ` • ${workType.description}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 'var(--space-sm)',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--gray-700)'
                  }}>
                    Pieces Completed
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.piecesCompleted}
                    onChange={(e) => setFormData({ ...formData, piecesCompleted: e.target.value })}
                    placeholder="50"
                    className="input"
                  />
                </div>
              </>
            )}            
          </div>

          {selectedWorkType && (
            <div className="alert alert-info" style={{ marginBottom: 'var(--space-lg)' }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div style={{ fontSize: '0.875rem' }}>
                <strong>{selectedWorkType.name}</strong><br/>
                Rate: ₹{selectedWorkType.piece_rate} per {selectedWorkType.unit_name}
                {selectedWorkType.description && <div style={{ marginTop: '4px', opacity: 0.9 }}>{selectedWorkType.description}</div>}
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
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows="3"
              placeholder="Additional details about this work entry..."
              className="input"
              style={{
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
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
                Creating...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Create Work Log
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ManualEntry;