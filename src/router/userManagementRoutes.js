// User Management related routes
export const userManagementRoutes = [
    {
        path: '/users/UserManagement',
        name: 'user-management',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/users/UserManagement.vue')
    },
    {
        path: '/users/usersList',
        name: 'user-list',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/users/usersList.vue')
    },
    {
        path: '/users/rolesPermissions',
        name: 'roles-permissions',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/users/rolesPermissions.vue')
    }
];
