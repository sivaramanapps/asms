const express = require('express');
const { pool } = require('../database');
const { authenticateToken, requireCompanyAccess, auditLog } = require('../middleware/auth');
const router = express.Router();

// Get work logs for a specific date and company
router.get('/company/:companyId/date/:date',
  authenticateToken,
  requireCompanyAccess(),
  async (req, res) => {
  try {
    const { companyId, date } = req.params;

    const query = `
      SELECT 
        wl.id, wl.work_date, wl.work_type, wl.clock_in, wl.clock_out,
        wl.hours_worked, wl.pieces_completed, wl.piece_rate, wl.hourly_rate,
        wl.overtime_hours, wl.total_earnings, wl.entry_method, wl.notes,
        w.id as worker_id, w.worker_code, w.full_name,
        w.worker_type, w.base_hourly_rate, w.base_piece_rate,
        u.full_name as entered_by
      FROM work_logs wl
      JOIN workers w ON wl.worker_id = w.id
      LEFT JOIN users u ON wl.entry_by = u.id
      WHERE wl.company_id = $1 AND wl.work_date = $2
      ORDER BY w.worker_code ASC
    `;

    const result = await pool.query(query, [companyId, date]);

    res.json({
      success: true,
      data: {
        date: date,
        work_logs: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get work logs error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get work logs'
    });
  }
});

// Create work log entry
router.post('/entry',
  authenticateToken,
  requireCompanyAccess('manager'),
  auditLog('CREATE_WORK_LOG', 'work_log'),
  async (req, res) => {
  try {
    const {
      workerId,
      workDate,
      workType,
      clockIn,
      clockOut,
      hoursWorked,
      piecesCompleted,
      pieceRate,
      hourlyRate,
      notes
    } = req.body;

    const { companyId } = req;

    // Validation
    if (!workerId || !workDate || !workType) {
      return res.status(400).json({
        success: false,
        message: 'Worker ID, work date, and work type are required'
      });
    }

    // Get worker details
    const workerQuery = 'SELECT * FROM workers WHERE id = $1 AND company_id = $2';
    const workerResult = await pool.query(workerQuery, [workerId, companyId]);
    
    if (workerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    const worker = workerResult.rows[0];

    // Check for duplicate entry
    const existingQuery = 'SELECT id FROM work_logs WHERE worker_id = $1 AND work_date = $2';
    const existingResult = await pool.query(existingQuery, [workerId, workDate]);

    if (existingResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Work log already exists for this date'
      });
    }

    // Calculate earnings
    let calculatedHours = 0;
    let calculatedPieces = 0;
    let calculatedHourlyRate = 0;
    let calculatedPieceRate = 0;
    let overtimeHours = 0;
    let totalEarnings = 0;

    if (workType === 'hourly' || workType === 'mixed') {
      calculatedHours = hoursWorked || 0;
      calculatedHourlyRate = hourlyRate || worker.base_hourly_rate;
      
      // Calculate overtime (over 8 hours)
      if (calculatedHours > 8) {
        overtimeHours = calculatedHours - 8;
        totalEarnings += 8 * calculatedHourlyRate;
        totalEarnings += overtimeHours * calculatedHourlyRate * worker.overtime_multiplier;
      } else {
        totalEarnings += calculatedHours * calculatedHourlyRate;
      }
    }

    if (workType === 'piece' || workType === 'mixed') {
      calculatedPieces = piecesCompleted || 0;
      calculatedPieceRate = pieceRate || worker.base_piece_rate;
      totalEarnings += calculatedPieces * calculatedPieceRate;
    }

    // Insert work log
    const insertQuery = `
      INSERT INTO work_logs (
        company_id, worker_id, work_date, work_type, clock_in, clock_out,
        hours_worked, pieces_completed, piece_rate, hourly_rate,
        overtime_hours, total_earnings, entry_method, entry_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      companyId, workerId, workDate, workType, clockIn, clockOut,
      calculatedHours, calculatedPieces, calculatedPieceRate, calculatedHourlyRate,
      overtimeHours, totalEarnings, 'manual', req.user.id, notes
    ];

    const result = await pool.query(insertQuery, values);

    res.status(201).json({
      success: true,
      message: 'Work log created successfully',
      data: { work_log: result.rows[0] }
    });

  } catch (error) {
    console.error('Create work log error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create work log'
    });
  }
});

module.exports = router;