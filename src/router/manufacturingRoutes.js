export const manufacturingRoutes = [
    {
        path: '/manufacturing/dashboard',
        name: 'manufacturing-dashboard',
        component: () => import('@/views/pages/dashboards/ManufacturingDashboard.vue'),
        meta: {
            breadcrumb: [{ label: 'Home', url: '/' }, { label: 'Manufacturing', url: '/manufacturing/dashboard' }, { label: 'Dashboard' }],
            requiresAuth: true
        }
    },
    {
        path: '/manufacturing/formulas',
        name: 'manufacturing-formulas',
        component: () => import('@/views/pages/manufacturing/formulas/FormulasList.vue'),
        meta: {
            breadcrumb: [{ label: 'Home', url: '/' }, { label: 'Manufacturing', url: '/manufacturing/dashboard' }, { label: 'Formulas' }],
            requiresAuth: true
        }
    },
    {
        path: '/manufacturing/formulas/new',
        name: 'manufacturing-formula-new',
        component: () => import('@/views/pages/manufacturing/formulas/FormulaForm.vue'),
        meta: {
            breadcrumb: [{ label: 'Home', url: '/' }, { label: 'Manufacturing', url: '/manufacturing/dashboard' }, { label: 'Formulas', url: '/manufacturing/formulas' }, { label: 'New Formula' }],
            requiresAuth: true
        }
    },
    {
        path: '/manufacturing/formulas/:id',
        name: 'manufacturing-formula-edit',
        component: () => import('@/views/pages/manufacturing/formulas/FormulaForm.vue'),
        meta: {
            breadcrumb: [{ label: 'Home', url: '/' }, { label: 'Manufacturing', url: '/manufacturing/dashboard' }, { label: 'Formulas', url: '/manufacturing/formulas' }, { label: 'Edit Formula' }],
            requiresAuth: true
        },
        props: true
    },
    {
        path: '/manufacturing/batches',
        name: 'manufacturing-batches',
        component: () => import('@/views/pages/manufacturing/batches/BatchesList.vue'),
        meta: {
            breadcrumb: [{ label: 'Home', url: '/' }, { label: 'Manufacturing', url: '/manufacturing/dashboard' }, { label: 'Production Batches' }],
            requiresAuth: true
        }
    },
    {
        path: '/manufacturing/batches/new',
        name: 'manufacturing-batch-new',
        component: () => import('@/views/pages/manufacturing/batches/BatchForm.vue'),
        meta: {
            breadcrumb: [{ label: 'Home', url: '/' }, { label: 'Manufacturing', url: '/manufacturing/dashboard' }, { label: 'Production Batches', url: '/manufacturing/batches' }, { label: 'New Production Batch' }],
            requiresAuth: true
        }
    },
    {
        path: '/manufacturing/batches/:id',
        name: 'manufacturing-batch-details',
        component: () => import('@/views/pages/manufacturing/batches/BatchDetails.vue'),
        meta: {
            breadcrumb: [{ label: 'Home', url: '/' }, { label: 'Manufacturing', url: '/manufacturing/dashboard' }, { label: 'Production Batches', url: '/manufacturing/batches' }, { label: 'Batch Details' }],
            requiresAuth: true
        },
        props: true
    },
    {
        path: '/manufacturing/quality-checks',
        name: 'manufacturing-quality-checks',
        component: () => import('@/views/pages/manufacturing/quality/QualityChecksList.vue'),
        meta: {
            breadcrumb: [{ label: 'Home', url: '/' }, { label: 'Manufacturing', url: '/manufacturing/dashboard' }, { label: 'Quality Checks' }],
            requiresAuth: true
        }
    },
    {
        path: '/manufacturing/analytics',
        name: 'manufacturing-analytics',
        component: () => import('@/views/pages/manufacturing/analytics/AnalyticsDashboard.vue'),
        meta: {
            breadcrumb: [{ label: 'Home', url: '/' }, { label: 'Manufacturing', url: '/manufacturing/dashboard' }, { label: 'Analytics' }],
            requiresAuth: true
        }
    },
    {
        path: '/manufacturing/material-forecasting',
        name: 'manufacturing-material-forecasting',
        component: () => import('@/views/pages/manufacturing/analytics/MaterialForecasting.vue'),
        meta: {
            breadcrumb: [{ label: 'Home', url: '/' }, { label: 'Manufacturing', url: '/manufacturing/dashboard' }, { label: 'Material Forecasting' }],
            requiresAuth: true
        }
    }
];
