import axios from '@/utils/axiosConfig';

export const userManagementService = {
    // User Management
    getUsers: () => axios.get('/auth/listusers/'),
    getUser: (id) => axios.get(`/auth/listusers/${id}/`),
    createUser: (userData) => axios.post('/auth/listusers/', userData),
    updateUser: (id, userData) => axios.put(`/auth/listusers/${id}/`, userData),
    deleteUser: (id) => axios.delete(`/auth/listusers/${id}/`),
    activateUser: (id) => axios.post(`/auth/listusers/${id}/activate/`),
    deactivateUser: (id) => axios.post(`/auth/listusers/${id}/deactivate/`),
    resetPassword: (id) => axios.post(`/auth/listusers/${id}/reset-password/`),
    changePassword: (data) => axios.post('/auth/change-password/', data),

    // Role Management
    getRoles: () => axios.get('/auth/roles/'),
    getRole: (id) => axios.get(`/auth/roles/${id}/`),
    createRole: (roleData) => axios.post('/auth/roles/', roleData),
    updateRole: (id, roleData) => axios.put(`/auth/roles/${id}/`, roleData),
    deleteRole: (id) => axios.delete(`/auth/roles/${id}/`),
    assignRole: (userId, roleId) => axios.post(`/auth/listusers/${userId}/assign-role/${roleId}/`),
    removeRole: (userId, roleId) => axios.post(`/auth/listusers/${userId}/remove-role/${roleId}/`),

    // Permission Management
    getPermissions: () => axios.get('/auth/permissions/'),
    getPermission: (id) => axios.get(`/auth/permissions/${id}/`),
    createPermission: (permissionData) => axios.post('/auth/permissions/', permissionData),
    updatePermission: (id, permissionData) => axios.put(`/auth/permissions/${id}/`, permissionData),
    deletePermission: (id) => axios.delete(`/auth/permissions/${id}/`),
    assignPermission: (roleId, permissionId) => axios.post(`/auth/roles/${roleId}/assign-permission/${permissionId}/`),
    removePermission: (roleId, permissionId) => axios.post(`/auth/roles/${roleId}/remove-permission/${permissionId}/`),

    // Password Policy
    getPasswordPolicy: () => axios.get('/auth/password-policy/'),
    updatePasswordPolicy: (policyData) => axios.put('/auth/password-policy/', policyData),

    // Organization Settings (placeholder endpoints - may not exist in backend)
    getOrganization: () => Promise.resolve({ data: {} }),
    updateOrganization: (orgData) => Promise.resolve({ data: orgData }),
    uploadLogo: (formData) => Promise.resolve({ data: {} }),

    // Department Management (placeholder endpoints - may not exist in backend)
    getDepartments: () => Promise.resolve({ data: [] }),
    createDepartment: (deptData) => Promise.resolve({ data: deptData }),
    updateDepartment: (id, deptData) => Promise.resolve({ data: deptData }),
    deleteDepartment: (id) => Promise.resolve({ data: {} }),

    // Backup Management
    getBackups: () => axios.get('/auth/backups/'),
    createBackup: (type) => axios.post('/auth/backups/', { type }),
    restoreBackup: (id) => axios.post(`/auth/backups/${id}/restore/`),
    deleteBackup: (id) => axios.delete(`/auth/backups/${id}/`),
    getBackupConfig: () => axios.get('/auth/backups/config/'),
    updateBackupConfig: (configData) => axios.put('/auth/backups/config/', configData),
    scheduleBackup: (data) => axios.post('/auth/backups/schedule/', data),
    getBackupSchedule: () => axios.get('/auth/backups/schedule/'),
    updateBackupSchedule: (scheduleData) => axios.put('/auth/backups/schedule/', scheduleData),
    deleteBackupSchedule: (id) => axios.delete(`/auth/backups/schedule/${id}/`),

    // User Logs (these endpoints might not exist in backend, commenting for now)
    // getUserLogs: (params) => axios.get('/user-logs/', { params }),
    // getLoginHistory: (userId) => axios.get(`/users/${userId}/login-history/`),

    // Account Requests (these endpoints might not exist in backend, commenting for now)
    // getAccountRequests: () => axios.get('/account-requests/'),
    // approveAccountRequest: (id) => axios.post(`/account-requests/${id}/approve/`),
    // rejectAccountRequest: (id) => axios.post(`/account-requests/${id}/reject/`),

    // 2FA Management
    get2FAStatus: () => axios.get('/auth/security/2fa/'),
    setup2FA: () => axios.post('/auth/security/2fa/'),
    verify2FA: (verificationCode) => axios.post('/auth/security/2fa/verify/', { verification_code: verificationCode }),
    disable2FA: () => axios.post('/auth/security/2fa/disable/')
};
