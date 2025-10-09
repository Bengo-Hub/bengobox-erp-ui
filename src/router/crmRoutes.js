// CRM related routes
export const crmRoutes = [
    // CRM Dashboard
    {
        path: '/crm',
        name: 'crmDashboard',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/dashboards/crmDashboard.vue')
    },
    {
        path: '/crm/customers',
        name: 'customers',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/crm/customers.vue')
    },
    {
        path: '/crm/leads',
        name: 'leads',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/crm/leads/Leads.vue')
    },
    {
        path: '/crm/pipeline/board',
        name: 'pipeline-board',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/crm/pipeline/PipelineBoard.vue')
    },
    {
        path: '/crm/pipeline/stages',
        name: 'pipeline-stages',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/crm/pipeline/PipelineStages.vue')
    },
    {
        path: '/crm/pipeline/deals',
        name: 'pipeline-deals',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/crm/pipeline/Deals.vue')
    },
    {
        path: '/crm/pipeline/opportunities',
        name: 'pipeline-opportunities',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/crm/pipeline/Opportunities.vue')
    }
];
