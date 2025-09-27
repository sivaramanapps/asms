const { verifyToken, getUserWithRoles } = require('../auth');
const { pool } = require('../database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get fresh user data with roles
    const user = await getUserWithRoles(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found or inactive' 
      });
    }

    // Attach user to request
    req.user = user;
    next();

  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Middleware to check if user has access to company
const requireCompanyAccess = (requiredRole = null) => {
  return (req, res, next) => {
    try {
      const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company ID required' 
        });
      }

      // Check if user has access to this company
      const userCompany = req.user.companies.find(c => c.companyId === companyId && c.isActive);
      
      if (!userCompany) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied to this company' 
        });
      }

      // Check role if specified
      if (requiredRole) {
        const roleHierarchy = {
          'viewer': 1,
          'manager': 2, 
          'admin': 3,
          'vendor_admin': 4
        };

        const userRoleLevel = roleHierarchy[userCompany.role] || 0;
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

        if (userRoleLevel < requiredRoleLevel) {
          return res.status(403).json({ 
            success: false, 
            message: `Insufficient privileges. ${requiredRole} role required.` 
          });
        }
      }

      // Attach company info to request
      req.userCompany = userCompany;
      req.companyId = companyId;
      next();

    } catch (error) {
      console.error('Company access check error:', error.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Authorization check failed' 
      });
    }
  };
};

// Audit logging middleware
const auditLog = (action, entityType) => {
  return async (req, res, next) => {
    // Store original res.json to capture response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the action after successful response
      if (res.statusCode < 400) {
        logAuditEntry(req, action, entityType, data).catch(console.error);
      }
      originalJson.call(this, data);
    };
    
    next();
  };
};

// Helper function to log audit entries
const logAuditEntry = async (req, action, entityType, responseData) => {
  try {
    const query = `
      INSERT INTO audit_logs (
        company_id, user_id, action, entity_type, entity_id, 
        new_values, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const values = [
      req.companyId || null,
      req.user?.id || null,
      action,
      entityType,
      responseData?.data?.id || req.params.id || null,
      responseData ? JSON.stringify(responseData) : null,
      req.ip || req.connection?.remoteAddress,
      req.get('User-Agent')
    ];

    await pool.query(query, values);
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
};

module.exports = {
  authenticateToken,
  requireCompanyAccess,
  auditLog
};