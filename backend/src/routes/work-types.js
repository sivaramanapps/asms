const express = require('express');
const { pool } = require('../database');
const { authenticateToken, requireCompanyAccess, auditLog } = require('../middleware/auth');
const router = express.Router();

// Get all work types for a company
router.get('/company/:companyId',
  authenticateToken,
  requireCompanyAccess(),
  async (req, res) => {
  try {
    const { companyId } = req.params;
    const { active } = req.query;

    let query = `
      SELECT * FROM work_types 
      WHERE company_id = $1
    `;
    
    const params = [companyId];
    
    if (active === 'true') {
      query += ' AND is_active = true';
    }
    
    query += ' ORDER BY code ASC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        work_types: result.rows,
        count: result.rows.length
      }
    });

  } catch (error) {
    console.error('Get work types error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get work types'
    });
  }
});

// Create work type
router.post('/company/:companyId',
  authenticateToken,
  requireCompanyAccess('admin'),
  auditLog('CREATE_WORK_TYPE', 'work_type'),
  async (req, res) => {
  try {
    const { companyId } = req.params;
    const { code, name, description, unitName, pieceRate } = req.body;

    if (!code || !name || !pieceRate) {
      return res.status(400).json({
        success: false,
        message: 'Code, name, and piece rate are required'
      });
    }

    const insertQuery = `
      INSERT INTO work_types (company_id, code, name, description, unit_name, piece_rate)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      companyId, code, name, description, unitName || 'piece', pieceRate
    ]);

    res.status(201).json({
      success: true,
      message: 'Work type created successfully',
      data: { work_type: result.rows[0] }
    });

  } catch (error) {
    console.error('Create work type error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message.includes('duplicate') ? 'Work type code already exists' : 'Failed to create work type'
    });
  }
});

module.exports = router;