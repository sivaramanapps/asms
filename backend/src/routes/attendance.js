const express = require('express');
const { pool } = require('../database');
const { authenticateToken, requireCompanyAccess, auditLog } = require('../middleware/auth');
const router = express.Router();

// Clock in endpoint
router.post('/clock-in/:workerId',
  authenticateToken,
  requireCompanyAccess('manager'),
  auditLog('CLOCK_IN', 'work_log'),
  async (req, res) => {
  try {
    const { workerId } = req.params;
    const { companyId } = req;
    const { notes } = req.body;
    
    const today = new Date().toISOString().split('T')[0];

    // Check if worker exists
    const workerQuery = 'SELECT * FROM workers WHERE id = $1 AND company_id = $2';
    const workerResult = await pool.query(workerQuery, [workerId, companyId]);
    
    if (workerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Check if already clocked in today
    const existingQuery = 'SELECT id FROM work_logs WHERE worker_id = $1 AND work_date = $2';
    const existingResult = await pool.query(existingQuery, [workerId, today]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Worker already clocked in today'
      });
    }

    const worker = workerResult.rows[0];

    // Create work log entry
    const insertQuery = `
      INSERT INTO work_logs (
        company_id, worker_id, work_date, work_type, 
        clock_in, hourly_rate, entry_method, entry_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      companyId,
      workerId,
      today,
      'hourly',
      new Date(),
      worker.base_hourly_rate,
      'manual',
      req.user.id,
      notes || null
    ];

    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      success: true,
      message: 'Clocked in successfully',
      data: { work_log: result.rows[0] }
    });

  } catch (error) {
    console.error('Clock in error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to clock in'
    });
  }
});

// Clock out endpoint
router.post('/clock-out/:workerId',
  authenticateToken,
  requireCompanyAccess('manager'),
  auditLog('CLOCK_OUT', 'work_log'),
  async (req, res) => {
  try {
    const { workerId } = req.params;
    const { companyId } = req;
    const { notes } = req.body;
    
    const today = new Date().toISOString().split('T')[0];

    // Find today's work log
    const workLogQuery = `
      SELECT wl.*, w.base_hourly_rate, w.overtime_multiplier 
      FROM work_logs wl
      JOIN workers w ON wl.worker_id = w.id
      WHERE wl.worker_id = $1 AND wl.work_date = $2 AND wl.company_id = $3
    `;
    const workLogResult = await pool.query(workLogQuery, [workerId, today, companyId]);

    if (workLogResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No clock-in record found for today'
      });
    }

    const workLog = workLogResult.rows[0];

    if (workLog.clock_out) {
      return res.status(400).json({
        success: false,
        message: 'Already clocked out'
      });
    }

    const clockOut = new Date();
    const clockIn = new Date(workLog.clock_in);
    const hoursWorked = (clockOut - clockIn) / (1000 * 60 * 60); // Convert to hours
    
    let overtimeHours = 0;
    let totalEarnings = 0;

    if (hoursWorked > 8) {
      overtimeHours = hoursWorked - 8;
      totalEarnings = (8 * workLog.base_hourly_rate) + 
                     (overtimeHours * workLog.base_hourly_rate * workLog.overtime_multiplier);
    } else {
      totalEarnings = hoursWorked * workLog.base_hourly_rate;
    }

    // Update work log
    const updateQuery = `
      UPDATE work_logs 
      SET clock_out = $1, hours_worked = $2, overtime_hours = $3, 
          total_earnings = $4, notes = COALESCE($5, notes), updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      clockOut,
      hoursWorked.toFixed(2),
      overtimeHours.toFixed(2),
      totalEarnings.toFixed(2),
      notes,
      workLog.id
    ]);

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: { work_log: result.rows[0] }
    });

  } catch (error) {
    console.error('Clock out error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out'
    });
  }
});

// Get today's attendance for company
router.get('/today/:companyId',
  authenticateToken,
  requireCompanyAccess(),
  async (req, res) => {
  try {
    const { companyId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const query = `
      SELECT 
        wl.*,
        w.worker_code, w.full_name, w.worker_type
      FROM work_logs wl
      JOIN workers w ON wl.worker_id = w.id
      WHERE wl.company_id = $1 AND wl.work_date = $2
      ORDER BY w.worker_code
    `;

    const result = await pool.query(query, [companyId, today]);

    res.json({
      success: true,
      data: {
        date: today,
        attendance: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get today attendance error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance'
    });
  }
});

module.exports = router;