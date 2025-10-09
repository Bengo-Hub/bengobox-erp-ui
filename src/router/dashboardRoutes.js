// Dashboard related routes - Only general dashboards remain
export const dashboardRoutes = [
    {
        path: '/',
        name: 'executiveDashboard',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/dashboards/executiveDashboard.vue')
    },
    {
        path: '/analytics',
        name: 'analytics',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/dashboards/analytics.vue')
    }
];
