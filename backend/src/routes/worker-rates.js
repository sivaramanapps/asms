const express = require('express');
const { pool } = require('../database');
const { authenticateToken, requireCompanyAccess } = require('../middleware/auth');
const router = express.Router();

// Get worker-specific rates
router.get('/worker/:workerId',
  authenticateToken,
  async (req, res) => {
  try {
    const { workerId } = req.params;

    const query = `
      SELECT 
        wwtr.*,
        wt.code, wt.name, wt.piece_rate as default_rate, wt.unit_name
      FROM worker_work_type_rates wwtr
      JOIN work_types wt ON wwtr.work_type_id = wt.id
      WHERE wwtr.worker_id = $1
      ORDER BY wt.code
    `;

    const result = await pool.query(query, [workerId]);

    res.json({
      success: true,
      data: {
        rates: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get worker rates error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get worker rates'
    });
  }
});

// Set worker-specific rate
router.post('/worker/:workerId/work-type/:workTypeId',
  authenticateToken,
  requireCompanyAccess('admin'),
  async (req, res) => {
  try {
    const { workerId, workTypeId } = req.params;
    const { customRate, notes } = req.body;

    const upsertQuery = `
      INSERT INTO worker_work_type_rates (worker_id, work_type_id, custom_rate, notes)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (worker_id, work_type_id) 
      DO UPDATE SET custom_rate = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(upsertQuery, [workerId, workTypeId, customRate, notes]);

    res.json({
      success: true,
      message: 'Worker rate set successfully',
      data: { rate: result.rows[0] }
    });

  } catch (error) {
    console.error('Set worker rate error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to set worker rate'
    });
  }
});

// Delete worker-specific rate
router.delete('/worker/:workerId/work-type/:workTypeId',
  authenticateToken,
  requireCompanyAccess('admin'),
  async (req, res) => {
  try {
    const { workerId, workTypeId } = req.params;

    const deleteQuery = 'DELETE FROM worker_work_type_rates WHERE worker_id = $1 AND work_type_id = $2';
    await pool.query(deleteQuery, [workerId, workTypeId]);

    res.json({
      success: true,
      message: 'Worker rate removed successfully'
    });

  } catch (error) {
    console.error('Delete worker rate error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete worker rate'
    });
  }
});

module.exports = router;