export const financeRoutes = [
    {
        path: '/finance',
        name: 'finance',
        component: () => import('@/views/pages/dashboards/financeDashboard.vue'),
        meta: { requiresAuth: true, title: 'Finance Dashboard' }
    },
    {
        path: '/finance/accounts',
        name: 'finance-accounts',
        component: () => import('@/views/pages/finance/accounts/Accounts.vue'),
        meta: { requiresAuth: true, title: 'Accounts Management' }
    },
    {
        path: '/finance/vouchers',
        name: 'finance-vouchers',
        component: () => import('@/views/pages/finance/vouchers/Vouchers.vue'),
        meta: { requiresAuth: true, title: 'Voucher Management' }
    },
    {
        path: '/finance/billing',
        name: 'finance-billing',
        component: () => import('@/views/pages/finance/billing/BillingDocuments.vue'),
        meta: { requiresAuth: true, title: 'Billing Documents' }
    },
    {
        path: '/finance/taxes',
        name: 'finance-taxes',
        component: () => import('@/views/pages/finance/taxes/Taxes.vue'),
        meta: { requiresAuth: true, title: 'Tax Management' }
    },
    {
        path: '/finance/payments',
        name: 'finance-payments',
        component: () => import('@/views/pages/finance/payments/Payments.vue'),
        meta: { requiresAuth: true, title: 'Payment Management' }
    },
    {
        path: '/finance/expenses',
        name: 'finance-expenses',
        component: () => import('@/views/pages/finance/expenses/Expenses.vue'),
        meta: { requiresAuth: true, title: 'Expense Management' }
    },
    {
        path: '/finance/expense-categories',
        name: 'finance-expense-categories',
        component: () => import('@/views/pages/finance/expenses/ExpenseCategories.vue'),
        meta: { requiresAuth: true, title: 'Expense Categories' }
    },
    {
        path: '/finance/budgets',
        name: 'finance-budgets',
        component: () => import('@/views/pages/finance/budgets/Budgets.vue'),
        meta: { requiresAuth: true, title: 'Budget Management' }
    },
    {
        path: '/finance/budgets/:id',
        name: 'finance-budget-detail',
        component: () => import('@/views/pages/finance/budgets/BudgetDetail.vue'),
        meta: { requiresAuth: true, title: 'Budget Details' }
    },
    {
        path: '/finance/cashflow',
        name: 'finance-cashflow',
        component: () => import('@/views/pages/finance/cashflow/CashFlowSummary.vue'),
        meta: { requiresAuth: true, title: 'Cash Flow Summary' }
    },
    {
        path: '/finance/cashflow/trial-balance',
        name: 'finance-trial-balance',
        component: () => import('@/views/pages/finance/cashflow/trialBalance.vue'),
        meta: { requiresAuth: true, title: 'Trial Balance' }
    },
    {
        path: '/finance/cashflow/balance-sheet',
        name: 'finance-balance-sheet',
        component: () => import('@/views/pages/finance/cashflow/balanceSheet.vue'),
        meta: { requiresAuth: true, title: 'Balance Sheet' }
    },
    {
        path: '/finance/cashflow/list-accounts',
        name: 'finance-list-accounts',
        component: () => import('@/views/pages/finance/cashflow/listAccounts.vue'),
        meta: { requiresAuth: true, title: 'List Accounts' }
    },
    {
        path: '/finance/cashflow/cash-flow',
        name: 'finance-cash-flow',
        component: () => import('@/views/pages/finance/cashflow/cashFlow.vue'),
        meta: { requiresAuth: true, title: 'Cash Flow' }
    },
    {
        path: '/finance/cashflow/profit',
        name: 'finance-profit',
        component: () => import('@/views/pages/finance/cashflow/profit.vue'),
        meta: { requiresAuth: true, title: 'Profit & Loss' }
    },
    {
        path: '/finance/reconciliation',
        name: 'finance-reconciliation',
        component: () => import('@/views/pages/finance/reconciliation/BankStatements.vue'),
        meta: { requiresAuth: true, title: 'Bank Reconciliation' }
    },
    {
        path: '/finance/analytics',
        name: 'finance-analytics',
        component: () => import('@/components/finance/analytics/FinancialAnalytics.vue'),
        meta: { requiresAuth: true, title: 'Financial Analytics' }
    }
];
