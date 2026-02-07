/**
 * Authorization Middleware
 * PERF-35: RBAC Authorization middleware for Express.js
 */

import rbacService from '../auth/RBACService';

/**
 * Create authorization middleware
 * @param {string} resource - Resource type
 * @param {string} action - Action to authorize
 * @param {Object} options - Middleware options
 */
export const authorize = (resource, action, options = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      }

      const context = {
        user: req.user,
        resourceId: req.params.id || options.resourceId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        method: req.method,
        path: req.path,
        ...options.context
      };

      // Check resource ownership if specified
      if (options.checkOwnership) {
        const resourceOwnerId = await options.getOwnerId(req);
        context.resourceOwnerId = resourceOwnerId;
      }

      const allowed = rbacService.hasPermission(userId, resource, action, context);

      if (!allowed) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `You don't have permission to ${action} this ${resource}`
        });
      }

      // Attach permission info to request for downstream use
      req.authorization = {
        resource,
        action,
        context,
        roles: rbacService.getUserRoles(userId)
      };

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authorization check failed'
      });
    }
  };
};

/**
 * Require specific role(s)
 * @param {...string} roles - Required role names
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const userRoles = rbacService.getUserRoles(userId);
    const userRoleNames = userRoles.map(r => r.role.name);

    const hasRequiredRole = roles.some(role => userRoleNames.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Require minimum role level
 * @param {string} minRole - Minimum required role
 */
export const requireRoleLevel = (minRole) => {
  return (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    const highestRole = rbacService.getHighestRole(userId);
    const minRoleObj = rbacService.getRole(minRole);

    if (!minRoleObj) {
      return res.status(500).json({
        error: 'Configuration Error',
        message: 'Invalid role configuration'
      });
    }

    if (highestRole.level < minRoleObj.level) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Minimum required role level: ${minRole}`
      });
    }

    next();
  };
};

/**
 * Owner or role middleware - allows access if user owns resource or has required role
 */
export const ownerOrRole = (getOwnerId, ...roles) => {
  return async (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    // Check ownership
    try {
      const ownerId = await getOwnerId(req);
      if (ownerId === userId) {
        return next();
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }

    // Check roles
    const userRoles = rbacService.getUserRoles(userId);
    const userRoleNames = userRoles.map(r => r.role.name);
    const hasRequiredRole = roles.some(role => userRoleNames.includes(role));

    if (hasRequiredRole) {
      return next();
    }

    return res.status(403).json({
      error: 'Forbidden',
      message: 'You must be the owner or have the required role'
    });
  };
};

export default { authorize, requireRole, requireRoleLevel, ownerOrRole };
