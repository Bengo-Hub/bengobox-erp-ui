// Settings related routes
export const settingsRoutes = [
    {
        path: '/settings/approvals',
        name: 'approvalSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/approvals.vue')
    },
    {
        path: '/settings/integrations/kra',
        name: 'kraSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/integrations/KRASettings.vue')
    },
    {
        path: '/settings/business',
        name: 'businessSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/business.vue')
    },
    {
        path: '/settings/payroll/formulas',
        name: 'payrollFormulas',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/Formulas.vue')
    },
    {
        path: '/settings/payroll/formulas/:id',
        name: 'payrollFormulaDetail',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/FormulaDetail.vue'),
        props: true
    },
    {
        path: '/settings/payroll/components',
        name: 'payrollComponents',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/Components.vue')
    },
    {
        path: '/settings/payroll/scheduled',
        name: 'scheduledPayslips',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/payroll/ScheduledPayslips.vue')
    },
    {
        path: '/settings/finance/taxes',
        name: 'taxSettings',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/finance/Taxes.vue')
    },
    {
        path: '/settings/hrm/appraisals/configuration',
        name: 'hrmAppraisalConfiguration',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/settings/hrm/AppraisalConfiguration.vue')
    }
];
