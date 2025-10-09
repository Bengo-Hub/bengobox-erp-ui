//inventory routes.js
export const inventoryRoutes = [
    // Inventory Dashboard
    {
        path: '/inventory',
        name: 'inventoryDashboard',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/dashboards/inventoryDashboard.vue')
    },
    {
        path: '/inventory/ManageStock',
        name: 'manage-stock',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/inventory/ManageStock.vue')
    },
    {
        path: '/inventory/StockTransfers',
        name: 'manage-stock-transfer',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/inventory/StockTransfers.vue')
    },
    // Asset Management
    {
        path: '/inventory/assets/AssetDashboard',
        name: 'asset-dashboard',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/inventory/AssetDashboard.vue')
    },
    {
        path: '/inventory/assets',
        name: 'asset-management',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/inventory/Assets.vue')
    },
    {
        path: '/inventory/assets/categories',
        name: 'asset-categories',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/inventory/AssetCategories.vue')
    },
    {
        path: '/inventory/assets/transfers',
        name: 'asset-transfers',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/inventory/AssetTransfers.vue')
    },
    {
        path: '/inventory/assets/maintenance',
        name: 'asset-maintenance',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/inventory/AssetMaintenance.vue')
    }
];
