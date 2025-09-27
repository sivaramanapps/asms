const express = require('express');
const { pool } = require('../database');
const { authenticateToken, requireCompanyAccess } = require('../middleware/auth');
const router = express.Router();

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Worker routes are working!'
  });
});

// Get all workers for a company (simplified)
router.get('/company/:companyId', 
  authenticateToken, 
  requireCompanyAccess(), 
  async (req, res) => {
  try {
    const { companyId } = req.params;

    const query = `
      SELECT 
        id, worker_code, full_name, phone, worker_type, 
        base_hourly_rate, base_piece_rate, status, joined_date
      FROM workers 
      WHERE company_id = $1 
      ORDER BY worker_code ASC
    `;

    const result = await pool.query(query, [companyId]);

    res.json({
      success: true,
      data: {
        workers: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get workers error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get workers'
    });
  }
});

// Get single worker details
router.get('/:workerId', 
  authenticateToken,
  async (req, res) => {
  try {
    const { workerId } = req.params;

    const query = `
      SELECT 
        w.*, c.display_name as company_name
      FROM workers w
      JOIN companies c ON w.company_id = c.id
      WHERE w.id = $1
    `;

    const result = await pool.query(query, [workerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    const worker = result.rows[0];

    // Check if user has access to this worker's company
    const hasAccess = req.user.companies.some(c => 
      c.companyId === worker.company_id && c.isActive
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this worker'
      });
    }

    res.json({
      success: true,
      data: { worker }
    });

  } catch (error) {
    console.error('Get worker error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get worker details'
    });
  }
});

module.exports = router;