// Security related routes
export const securityRoutes = [
    {
        path: '/security/settings',
        name: 'security-settings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/security/settings.vue')
    },
    {
        path: '/security/backups',
        name: 'security-backups',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/security/backups.vue')
    }
];
