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
        wl.entry_number, wl.created_at,
        w.id as worker_id, w.worker_code, w.full_name,
        w.worker_type, w.base_hourly_rate, w.base_piece_rate,
        u.full_name as entered_by
      FROM work_logs wl
      JOIN workers w ON wl.worker_id = w.id
      LEFT JOIN users u ON wl.entry_by = u.id
      WHERE wl.company_id = $1 AND wl.work_date = $2
      ORDER BY w.worker_code ASC, wl.created_at ASC
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

// Create work log entry (no duplicate prevention - allow multiple entries)
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

    // Calculate earnings
    let calculatedHours = 0;
    let calculatedPieces = 0;
    let calculatedHourlyRate = 0;
    let calculatedPieceRate = 0;
    let overtimeHours = 0;
    let totalEarnings = 0;

    if (workType === 'hourly' || workType === 'mixed') {
      calculatedHours = parseFloat(hoursWorked) || 0;
      calculatedHourlyRate = parseFloat(hourlyRate) || parseFloat(worker.base_hourly_rate) || 0;
      
      // Calculate overtime (over 8 hours)
      if (calculatedHours > 8) {
        overtimeHours = calculatedHours - 8;
        totalEarnings += 8 * calculatedHourlyRate;
        totalEarnings += overtimeHours * calculatedHourlyRate * parseFloat(worker.overtime_multiplier || 1.5);
      } else {
        totalEarnings += calculatedHours * calculatedHourlyRate;
      }
    }

    if (workType === 'piece' || workType === 'mixed') {
      calculatedPieces = parseInt(piecesCompleted) || 0;
      calculatedPieceRate = parseFloat(pieceRate) || parseFloat(worker.base_piece_rate) || 0;
      totalEarnings += calculatedPieces * calculatedPieceRate;
    }

    // Insert work log (allow multiple entries per day)
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

// Update work log
router.put('/:logId',
  authenticateToken,
  requireCompanyAccess('manager'),
  auditLog('UPDATE_WORK_LOG', 'work_log'),
  async (req, res) => {
  try {
    const { logId } = req.params;
    const {
      workType,
      clockIn,
      clockOut,
      hoursWorked,
      piecesCompleted,
      pieceRate,
      hourlyRate,
      notes
    } = req.body;

    // Get existing work log
    const existingQuery = `
      SELECT wl.*, w.overtime_multiplier 
      FROM work_logs wl
      JOIN workers w ON wl.worker_id = w.id
      WHERE wl.id = $1 AND wl.company_id = $2
    `;
    const existingResult = await pool.query(existingQuery, [logId, req.companyId]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work log not found'
      });
    }

    const workLog = existingResult.rows[0];

    // Recalculate earnings
    let calculatedHours = parseFloat(hoursWorked) || 0;
    let calculatedPieces = parseInt(piecesCompleted) || 0;
    let calculatedHourlyRate = parseFloat(hourlyRate) || parseFloat(workLog.hourly_rate) || 0;
    let calculatedPieceRate = parseFloat(pieceRate) || parseFloat(workLog.piece_rate) || 0;
    let overtimeHours = 0;
    let totalEarnings = 0;

    if (workType === 'hourly' || workType === 'mixed') {
      if (calculatedHours > 8) {
        overtimeHours = calculatedHours - 8;
        totalEarnings += 8 * calculatedHourlyRate;
        totalEarnings += overtimeHours * calculatedHourlyRate * parseFloat(workLog.overtime_multiplier || 1.5);
      } else {
        totalEarnings += calculatedHours * calculatedHourlyRate;
      }
    }

    if (workType === 'piece' || workType === 'mixed') {
      totalEarnings += calculatedPieces * calculatedPieceRate;
    }

    // Update work log
    const updateQuery = `
      UPDATE work_logs 
      SET work_type = $1, clock_in = $2, clock_out = $3,
          hours_worked = $4, pieces_completed = $5, piece_rate = $6, 
          hourly_rate = $7, overtime_hours = $8, total_earnings = $9,
          notes = $10, updated_at = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [
      workType, clockIn, clockOut,
      calculatedHours, calculatedPieces, calculatedPieceRate,
      calculatedHourlyRate, overtimeHours, totalEarnings,
      notes, logId
    ]);

    res.json({
      success: true,
      message: 'Work log updated successfully',
      data: { work_log: result.rows[0] }
    });

  } catch (error) {
    console.error('Update work log error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update work log'
    });
  }
});

// Delete work log
router.delete('/:logId',
  authenticateToken,
  requireCompanyAccess('admin'),
  auditLog('DELETE_WORK_LOG', 'work_log'),
  async (req, res) => {
  try {
    const { logId } = req.params;

    const deleteQuery = 'DELETE FROM work_logs WHERE id = $1 AND company_id = $2 RETURNING *';
    const result = await pool.query(deleteQuery, [logId, req.companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Work log not found'
      });
    }

    res.json({
      success: true,
      message: 'Work log deleted successfully'
    });

  } catch (error) {
    console.error('Delete work log error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete work log'
    });
  }
});

module.exports = router;