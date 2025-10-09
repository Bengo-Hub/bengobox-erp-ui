// Procurement related routes
export const procurementRoutes = [
    // Procurement Dashboard
    {
        path: '/procurement',
        name: 'procurementDashboard',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/dashboards/procurementDashboard.vue')
    },
    //requsition routes
    {
        path: '/procurement/requisitions/ProcurementRequisitions',
        name: 'Requisitions',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/procurement/requisitions/ProcurementRequisitions.vue')
    },
    //purchase orders routes
    {
        path: '/procurement/orders/PurchaseOrders',
        name: 'PurchaseOrders',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/procurement/orders/PurchaseOrders.vue')
    },
    //purchasing routes
    {
        path: '/procurement/purchasing/Purchases',
        name: 'Purchases',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/procurement/purchasing/Purchases.vue')
    },
    {
        path: '/procurement/purchasing/PurchaseReturns',
        name: 'PurchaseReturns',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/procurement/purchasing/PurchaseReturns.vue')
    },
    {
        path: '/procurement/suppliers/Suppliers',
        name: 'Suppliers',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/procurement/suppliers/Suppliers.vue')
    },
    {
        path: '/procurement/contracts',
        name: 'Contracts',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/procurement/contracts/Contracts.vue')
    },
    {
        path: '/procurement/supplier-performance',
        name: 'SupplierPerformance',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/procurement/supplier-performance/SupplierPerformance.vue')
    }
];
