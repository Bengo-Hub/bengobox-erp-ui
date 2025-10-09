# RBAC Integration Guide

## Overview

This guide explains how the Role-Based Access Control (RBAC) system works in the BengoERP frontend and how all components fit together without duplication.

## Architecture

### 1. Core Components

#### `usePermissions` Composable (`src/composables/usePermissions.js`)
- **Purpose**: Central permission management and state
- **Features**:
  - Permission checking functions (`hasPermission`, `hasAnyPermission`, `hasAllPermissions`)
  - CRUD operation helpers (`canCreate`, `canRead`, `canUpdate`, `canDelete`)
  - Category-based permission management
  - Module access control
  - Permission storage in localStorage

#### Permission Directive (`src/directives/permission.js`)
- **Purpose**: Template-level permission checking
- **Usage**: `v-permission="'view_payslip'"` or `v-permission="['view_payslip', 'change_payslip']"`
- **Features**: Automatically removes elements if user lacks permission

#### Permission Components
- **`PermissionWrapper`** (`src/components/common/PermissionWrapper.vue`): Wraps content with permission checks
- **`PermissionButton`** (`src/components/common/PermissionButton.vue`): Button with built-in permission logic

#### Permission Middleware (`src/middleware/permission.js`)
- **Purpose**: Route-level protection
- **Features**: Redirects unauthorized users to `/unauthorized` page

#### Permission Plugin (`src/plugins/permissions.js`)
- **Purpose**: Global registration of permission directive
- **Integration**: Registered in `main.js`

### 2. Integration Flow

```
User Login → Permissions Loaded → usePermissions Composable → UI Components
     ↓
Route Navigation → Permission Middleware → Access Control
     ↓
Template Rendering → Permission Directive → Element Visibility
```

## Usage Patterns

### 1. In Vue Components

```vue
<template>
  <!-- Using PermissionWrapper -->
  <PermissionWrapper permission="view_payslip">
    <div>Payslip content</div>
  </PermissionWrapper>

  <!-- Using PermissionButton -->
  <PermissionButton 
    permission="change_payslip" 
    label="Edit Payslip" 
    @click="editPayslip" 
  />

  <!-- Using directive -->
  <div v-permission="'view_payslip'">Payslip details</div>

  <!-- Multiple permissions (any) -->
  <div v-permission="['view_payslip', 'change_payslip']">Payslip actions</div>
</template>

<script setup>
import { usePermissions } from '@/composables/usePermissions';
import PermissionWrapper from '@/components/common/PermissionWrapper.vue';
import PermissionButton from '@/components/common/PermissionButton.vue';

const { hasPermission, canRead, canUpdate } = usePermissions();

// Programmatic permission checks
if (hasPermission('view_payslip')) {
  // Do something
}
</script>
```

### 2. In Routes

```javascript
// router/routes.js
{
  path: '/payroll',
  component: PayrollManagement,
  meta: {
    requiresAuth: true,
    permission: 'view_payslip'
  }
}
```

### 3. Permission Categories

The system organizes permissions into categories:

- **PAYROLL**: Payslips, payroll components, settings
- **HRM**: Employees, benefits, deductions, earnings
- **ATTENDANCE**: Attendance records, rules, overtime
- **LEAVE**: Leave management, holidays, entitlements
- **PERFORMANCE**: Appraisals, reviews, metrics
- **TRAINING**: Courses, enrollments, evaluations
- **RECRUITMENT**: Job postings, candidates
- **FINANCE**: Payments, expenses, transactions
- **TAX**: Tax management, rates, withholding
- **KRA**: KRA compliance and settings
- **SYSTEM**: Users, groups, permissions, branches

## Module Integration

### 1. Payslip Module (Already Implemented)
- Uses `PermissionWrapper` for content visibility
- Uses `PermissionButton` for action buttons
- Implements proper permission checks for all operations

### 2. Payroll Management Module (Already Implemented)
- Dashboard with permission-based stats
- Action cards with permission checks
- Data table with permission-based actions

### 3. Employee Management Module (Already Implemented)
- Employee listing with permission-based actions
- Stats cards with permission checks
- CRUD operations with proper permissions

## Best Practices

### 1. Permission Naming Convention
- Format: `{action}_{module}`
- Actions: `add`, `view`, `change`, `delete`
- Examples: `view_payslip`, `change_employee`, `add_benefits`

### 2. Component Usage
- Use `PermissionWrapper` for large content blocks
- Use `PermissionButton` for action buttons
- Use `v-permission` directive for simple elements
- Use `usePermissions` composable for programmatic checks

### 3. Route Protection
- Always add `permission` meta to protected routes
- Use middleware for automatic permission checking
- Provide fallback routes for unauthorized access

### 4. Performance Considerations
- Permissions are cached in localStorage
- Permission checks are reactive and efficient
- Components only re-render when permissions change

## Error Handling

### 1. Unauthorized Access
- Routes redirect to `/unauthorized` page
- Components show fallback content or hide elements
- Buttons become disabled or hidden

### 2. Missing Permissions
- Graceful degradation of UI
- Clear error messages for users
- Fallback to read-only mode when possible

## Testing

### 1. Permission Testing
```javascript
// Test permission checks
const { hasPermission, setPermissions } = usePermissions();

// Set test permissions
setPermissions(['view_payslip', 'change_payslip']);

// Test permission checks
expect(hasPermission('view_payslip')).toBe(true);
expect(hasPermission('delete_payslip')).toBe(false);
```

### 2. Component Testing
```javascript
// Test component visibility
const wrapper = mount(Component, {
  global: {
    plugins: [permissionsPlugin]
  }
});

// Test with different permissions
// ...
```

## Migration Guide

### 1. Existing Components
1. Import `usePermissions` composable
2. Import permission components (`PermissionWrapper`, `PermissionButton`)
3. Wrap content with appropriate permission components
4. Replace action buttons with `PermissionButton`
5. Add permission checks to computed properties

### 2. New Components
1. Always consider permission requirements during design
2. Use permission components from the start
3. Implement proper error handling for unauthorized access
4. Test with different permission sets

## Troubleshooting

### 1. Common Issues
- **Permission not working**: Check if permissions are loaded in localStorage
- **Component not hiding**: Verify permission string matches exactly
- **Route not protecting**: Ensure middleware is registered and route has permission meta

### 2. Debug Tools
- Check `localStorage.getItem('userPermissions')` for loaded permissions
- Use Vue DevTools to inspect permission state
- Check browser console for permission-related errors

## Future Enhancements

### 1. Planned Features
- Dynamic permission loading from API
- Permission inheritance and roles
- Advanced permission conditions
- Audit logging for permission checks

### 2. Performance Optimizations
- Permission caching strategies
- Lazy loading of permission components
- Optimized permission checking algorithms
