/**
 * Role-Based Access Control (RBAC) Service
 * PERF-35: Implement comprehensive RBAC system
 *
 * Features:
 * - Hierarchical role management
 * - Granular permission system
 * - Resource-based access control
 * - Permission inheritance
 * - Dynamic policy evaluation
 * - Audit logging for access decisions
 */

// Permission actions
const Actions = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  EXECUTE: 'execute',
  MANAGE: 'manage',
  ADMIN: 'admin'
};

// Resource types
const Resources = {
  USER: 'user',
  ROLE: 'role',
  PROJECT: 'project',
  TASK: 'task',
  DOCUMENT: 'document',
  REPORT: 'report',
  SETTINGS: 'settings',
  AUDIT_LOG: 'audit_log',
  API_KEY: 'api_key',
  WEBHOOK: 'webhook'
};

// Default role hierarchy (higher index = more permissions)
const RoleHierarchy = {
  GUEST: 0,
  VIEWER: 1,
  MEMBER: 2,
  CONTRIBUTOR: 3,
  EDITOR: 4,
  MODERATOR: 5,
  MANAGER: 6,
  ADMIN: 7,
  SUPER_ADMIN: 8
};

class Permission {
  constructor(resource, action, conditions = {}) {
    this.resource = resource;
    this.action = action;
    this.conditions = conditions;
    this.id = `${resource}:${action}`;
  }

  matches(resource, action) {
    const resourceMatch = this.resource === '*' || this.resource === resource;
    const actionMatch = this.action === '*' || this.action === action;
    return resourceMatch && actionMatch;
  }

  toString() {
    return this.id;
  }
}

class Role {
  constructor(name, options = {}) {
    this.name = name;
    this.displayName = options.displayName || name;
    this.description = options.description || '';
    this.permissions = new Set();
    this.inheritedRoles = new Set();
    this.level = options.level || RoleHierarchy[name] || 0;
    this.isSystem = options.isSystem || false;
    this.metadata = options.metadata || {};
  }

  addPermission(permission) {
    if (permission instanceof Permission) {
      this.permissions.add(permission);
    } else {
      this.permissions.add(new Permission(permission.resource, permission.action, permission.conditions));
    }
    return this;
  }

  removePermission(permissionId) {
    for (const perm of this.permissions) {
      if (perm.id === permissionId) {
        this.permissions.delete(perm);
        return true;
      }
    }
    return false;
  }

  inherit(role) {
    if (role instanceof Role) {
      this.inheritedRoles.add(role.name);
    } else {
      this.inheritedRoles.add(role);
    }
    return this;
  }

  getAllPermissions(roleRegistry) {
    const allPermissions = new Set(this.permissions);

    for (const roleName of this.inheritedRoles) {
      const inheritedRole = roleRegistry.get(roleName);
      if (inheritedRole) {
        for (const perm of inheritedRole.getAllPermissions(roleRegistry)) {
          allPermissions.add(perm);
        }
      }
    }

    return allPermissions;
  }

  hasPermission(resource, action, roleRegistry) {
    for (const permission of this.getAllPermissions(roleRegistry)) {
      if (permission.matches(resource, action)) {
        return true;
      }
    }
    return false;
  }

  toJSON() {
    return {
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      level: this.level,
      permissions: Array.from(this.permissions).map(p => p.id),
      inheritedRoles: Array.from(this.inheritedRoles),
      isSystem: this.isSystem,
      metadata: this.metadata
    };
  }
}

class Policy {
  constructor(name, options = {}) {
    this.name = name;
    this.description = options.description || '';
    this.effect = options.effect || 'allow'; // 'allow' or 'deny'
    this.resources = options.resources || [];
    this.actions = options.actions || [];
    this.conditions = options.conditions || [];
    this.priority = options.priority || 0;
  }

  evaluate(context) {
    // Check resource match
    const resourceMatch = this.resources.length === 0 ||
      this.resources.includes('*') ||
      this.resources.includes(context.resource);

    // Check action match
    const actionMatch = this.actions.length === 0 ||
      this.actions.includes('*') ||
      this.actions.includes(context.action);

    if (!resourceMatch || !actionMatch) {
      return null; // Policy doesn't apply
    }

    // Evaluate conditions
    for (const condition of this.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return null; // Condition not met
      }
    }

    return this.effect;
  }

  evaluateCondition(condition, context) {
    const { field, operator, value } = condition;
    const contextValue = this.getNestedValue(context, field);

    switch (operator) {
      case 'equals':
        return contextValue === value;
      case 'notEquals':
        return contextValue !== value;
      case 'contains':
        return Array.isArray(contextValue) ? contextValue.includes(value) : String(contextValue).includes(value);
      case 'in':
        return Array.isArray(value) && value.includes(contextValue);
      case 'notIn':
        return Array.isArray(value) && !value.includes(contextValue);
      case 'greaterThan':
        return contextValue > value;
      case 'lessThan':
        return contextValue < value;
      case 'matches':
        return new RegExp(value).test(contextValue);
      case 'isOwner':
        return context.user && context.resourceOwnerId === context.user.id;
      case 'inGroup':
        return context.user && context.user.groups && context.user.groups.includes(value);
      case 'hasAttribute':
        return contextValue !== undefined && contextValue !== null;
      default:
        return false;
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current && current[key], obj);
  }
}

class RBACService {
  constructor() {
    this.roles = new Map();
    this.policies = [];
    this.userRoles = new Map();
    this.resourcePermissions = new Map();
    this.auditLog = [];
    this.maxAuditLogSize = 10000;

    this.initializeDefaultRoles();
  }

  initializeDefaultRoles() {
    // Guest role - minimal access
    const guest = new Role('GUEST', {
      displayName: 'Guest',
      description: 'Unauthenticated user with minimal access',
      level: 0,
      isSystem: true
    });

    // Viewer role - read-only access
    const viewer = new Role('VIEWER', {
      displayName: 'Viewer',
      description: 'Can view resources but not modify',
      level: 1,
      isSystem: true
    });
    viewer.addPermission(new Permission(Resources.PROJECT, Actions.READ));
    viewer.addPermission(new Permission(Resources.TASK, Actions.READ));
    viewer.addPermission(new Permission(Resources.DOCUMENT, Actions.READ));

    // Member role - basic participation
    const member = new Role('MEMBER', {
      displayName: 'Member',
      description: 'Standard team member with basic permissions',
      level: 2,
      isSystem: true
    });
    member.inherit(viewer);
    member.addPermission(new Permission(Resources.TASK, Actions.CREATE));
    member.addPermission(new Permission(Resources.TASK, Actions.UPDATE, { ownOnly: true }));
    member.addPermission(new Permission(Resources.DOCUMENT, Actions.CREATE));

    // Contributor role - enhanced member
    const contributor = new Role('CONTRIBUTOR', {
      displayName: 'Contributor',
      description: 'Can contribute and collaborate on projects',
      level: 3,
      isSystem: true
    });
    contributor.inherit(member);
    contributor.addPermission(new Permission(Resources.TASK, Actions.UPDATE));
    contributor.addPermission(new Permission(Resources.DOCUMENT, Actions.UPDATE));

    // Editor role - content management
    const editor = new Role('EDITOR', {
      displayName: 'Editor',
      description: 'Can edit and manage content',
      level: 4,
      isSystem: true
    });
    editor.inherit(contributor);
    editor.addPermission(new Permission(Resources.TASK, Actions.DELETE));
    editor.addPermission(new Permission(Resources.DOCUMENT, Actions.DELETE));
    editor.addPermission(new Permission(Resources.REPORT, Actions.CREATE));

    // Moderator role - community management
    const moderator = new Role('MODERATOR', {
      displayName: 'Moderator',
      description: 'Can moderate content and users',
      level: 5,
      isSystem: true
    });
    moderator.inherit(editor);
    moderator.addPermission(new Permission(Resources.USER, Actions.READ));
    moderator.addPermission(new Permission(Resources.USER, Actions.UPDATE, { scope: 'limited' }));

    // Manager role - project management
    const manager = new Role('MANAGER', {
      displayName: 'Manager',
      description: 'Can manage projects and team members',
      level: 6,
      isSystem: true
    });
    manager.inherit(moderator);
    manager.addPermission(new Permission(Resources.PROJECT, Actions.CREATE));
    manager.addPermission(new Permission(Resources.PROJECT, Actions.UPDATE));
    manager.addPermission(new Permission(Resources.PROJECT, Actions.DELETE));
    manager.addPermission(new Permission(Resources.REPORT, Actions.READ));
    manager.addPermission(new Permission(Resources.REPORT, Actions.MANAGE));

    // Admin role - administrative access
    const admin = new Role('ADMIN', {
      displayName: 'Administrator',
      description: 'Full administrative access',
      level: 7,
      isSystem: true
    });
    admin.inherit(manager);
    admin.addPermission(new Permission(Resources.USER, Actions.MANAGE));
    admin.addPermission(new Permission(Resources.ROLE, Actions.READ));
    admin.addPermission(new Permission(Resources.SETTINGS, Actions.READ));
    admin.addPermission(new Permission(Resources.SETTINGS, Actions.UPDATE));
    admin.addPermission(new Permission(Resources.AUDIT_LOG, Actions.READ));
    admin.addPermission(new Permission(Resources.API_KEY, Actions.MANAGE));
    admin.addPermission(new Permission(Resources.WEBHOOK, Actions.MANAGE));

    // Super Admin role - unrestricted access
    const superAdmin = new Role('SUPER_ADMIN', {
      displayName: 'Super Administrator',
      description: 'Unrestricted system access',
      level: 8,
      isSystem: true
    });
    superAdmin.addPermission(new Permission('*', '*'));

    // Register all roles
    [guest, viewer, member, contributor, editor, moderator, manager, admin, superAdmin]
      .forEach(role => this.roles.set(role.name, role));
  }

  // Role Management
  createRole(name, options = {}) {
    if (this.roles.has(name)) {
      throw new Error(`Role "${name}" already exists`);
    }

    const role = new Role(name, options);
    this.roles.set(name, role);
    this.logAudit('role_created', { roleName: name, options });
    return role;
  }

  getRole(name) {
    return this.roles.get(name);
  }

  updateRole(name, updates) {
    const role = this.roles.get(name);
    if (!role) {
      throw new Error(`Role "${name}" not found`);
    }

    if (role.isSystem && updates.isSystem === false) {
      throw new Error('Cannot modify system role');
    }

    Object.assign(role, updates);
    this.logAudit('role_updated', { roleName: name, updates });
    return role;
  }

  deleteRole(name) {
    const role = this.roles.get(name);
    if (!role) {
      throw new Error(`Role "${name}" not found`);
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system role');
    }

    this.roles.delete(name);
    this.logAudit('role_deleted', { roleName: name });
    return true;
  }

  // User Role Assignment
  assignRole(userId, roleName, options = {}) {
    const role = this.roles.get(roleName);
    if (!role) {
      throw new Error(`Role "${roleName}" not found`);
    }

    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, new Map());
    }

    const userRoleMap = this.userRoles.get(userId);
    userRoleMap.set(roleName, {
      assignedAt: Date.now(),
      expiresAt: options.expiresAt || null,
      scope: options.scope || 'global',
      resourceId: options.resourceId || null,
      assignedBy: options.assignedBy || null
    });

    this.logAudit('role_assigned', { userId, roleName, options });
    return true;
  }

  revokeRole(userId, roleName) {
    const userRoleMap = this.userRoles.get(userId);
    if (!userRoleMap || !userRoleMap.has(roleName)) {
      return false;
    }

    userRoleMap.delete(roleName);
    this.logAudit('role_revoked', { userId, roleName });
    return true;
  }

  getUserRoles(userId, options = {}) {
    const userRoleMap = this.userRoles.get(userId);
    if (!userRoleMap) {
      return [];
    }

    const now = Date.now();
    const roles = [];

    for (const [roleName, assignment] of userRoleMap) {
      // Check expiration
      if (assignment.expiresAt && assignment.expiresAt < now) {
        continue;
      }

      // Check scope
      if (options.resourceId && assignment.scope === 'resource') {
        if (assignment.resourceId !== options.resourceId) {
          continue;
        }
      }

      roles.push({
        role: this.roles.get(roleName),
        assignment
      });
    }

    return roles;
  }

  getHighestRole(userId) {
    const roles = this.getUserRoles(userId);
    if (roles.length === 0) {
      return this.roles.get('GUEST');
    }

    return roles.reduce((highest, current) => {
      return current.role.level > highest.role.level ? current : highest;
    }).role;
  }

  // Permission Checking
  hasPermission(userId, resource, action, context = {}) {
    const startTime = Date.now();

    // Get user roles
    const userRoles = this.getUserRoles(userId, { resourceId: context.resourceId });

    // Check each role for permission
    for (const { role } of userRoles) {
      if (role.hasPermission(resource, action, this.roles)) {
        this.logAccessDecision(userId, resource, action, true, startTime, context);
        return true;
      }
    }

    // Evaluate policies
    const policyResult = this.evaluatePolicies({
      user: context.user || { id: userId },
      resource,
      action,
      ...context
    });

    if (policyResult !== null) {
      const allowed = policyResult === 'allow';
      this.logAccessDecision(userId, resource, action, allowed, startTime, context);
      return allowed;
    }

    this.logAccessDecision(userId, resource, action, false, startTime, context);
    return false;
  }

  can(userId, action, resource, context = {}) {
    return this.hasPermission(userId, resource, action, context);
  }

  cannot(userId, action, resource, context = {}) {
    return !this.hasPermission(userId, resource, action, context);
  }

  // Policy Management
  addPolicy(policy) {
    if (!(policy instanceof Policy)) {
      policy = new Policy(policy.name, policy);
    }
    this.policies.push(policy);
    this.policies.sort((a, b) => b.priority - a.priority);
    this.logAudit('policy_added', { policyName: policy.name });
    return policy;
  }

  removePolicy(policyName) {
    const index = this.policies.findIndex(p => p.name === policyName);
    if (index !== -1) {
      this.policies.splice(index, 1);
      this.logAudit('policy_removed', { policyName });
      return true;
    }
    return false;
  }

  evaluatePolicies(context) {
    for (const policy of this.policies) {
      const result = policy.evaluate(context);
      if (result !== null) {
        return result;
      }
    }
    return null;
  }

  // Resource-level permissions
  setResourcePermission(resourceType, resourceId, userId, permissions) {
    const key = `${resourceType}:${resourceId}`;
    if (!this.resourcePermissions.has(key)) {
      this.resourcePermissions.set(key, new Map());
    }
    this.resourcePermissions.get(key).set(userId, permissions);
    this.logAudit('resource_permission_set', { resourceType, resourceId, userId, permissions });
  }

  getResourcePermission(resourceType, resourceId, userId) {
    const key = `${resourceType}:${resourceId}`;
    const resourcePerms = this.resourcePermissions.get(key);
    return resourcePerms ? resourcePerms.get(userId) : null;
  }

  // Audit Logging
  logAudit(action, details) {
    const entry = {
      timestamp: Date.now(),
      action,
      details
    };

    this.auditLog.push(entry);

    if (this.auditLog.length > this.maxAuditLogSize) {
      this.auditLog = this.auditLog.slice(-this.maxAuditLogSize / 2);
    }
  }

  logAccessDecision(userId, resource, action, allowed, startTime, context) {
    this.logAudit('access_decision', {
      userId,
      resource,
      action,
      allowed,
      duration: Date.now() - startTime,
      context: {
        resourceId: context.resourceId,
        ip: context.ip,
        userAgent: context.userAgent
      }
    });
  }

  getAuditLog(options = {}) {
    let logs = [...this.auditLog];

    if (options.action) {
      logs = logs.filter(l => l.action === options.action);
    }

    if (options.userId) {
      logs = logs.filter(l => l.details.userId === options.userId);
    }

    if (options.since) {
      logs = logs.filter(l => l.timestamp >= options.since);
    }

    if (options.limit) {
      logs = logs.slice(-options.limit);
    }

    return logs;
  }

  // Utility Methods
  getAllRoles() {
    return Array.from(this.roles.values()).map(r => r.toJSON());
  }

  getAllPolicies() {
    return this.policies.map(p => ({
      name: p.name,
      description: p.description,
      effect: p.effect,
      resources: p.resources,
      actions: p.actions,
      priority: p.priority
    }));
  }

  exportConfig() {
    return {
      roles: this.getAllRoles(),
      policies: this.getAllPolicies()
    };
  }

  importConfig(config) {
    if (config.roles) {
      for (const roleData of config.roles) {
        if (!roleData.isSystem) {
          const role = new Role(roleData.name, roleData);
          for (const permId of roleData.permissions || []) {
            const [resource, action] = permId.split(':');
            role.addPermission(new Permission(resource, action));
          }
          for (const inheritedRole of roleData.inheritedRoles || []) {
            role.inherit(inheritedRole);
          }
          this.roles.set(role.name, role);
        }
      }
    }

    if (config.policies) {
      for (const policyData of config.policies) {
        this.addPolicy(new Policy(policyData.name, policyData));
      }
    }
  }
}

// Create singleton instance
const rbacService = new RBACService();

export {
  rbacService,
  RBACService,
  Role,
  Permission,
  Policy,
  Actions,
  Resources,
  RoleHierarchy
};

export default rbacService;
