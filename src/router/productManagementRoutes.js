//product management routes
export const productManagementRoutes = [
    {
        path: '/ecommerce/products/ManageProducts',
        name: 'manage-products',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/ecommerce/products/ManageProducts.vue')
    },
    //ManageProductDependencies
    {
        path: '/ecommerce/products/ManageProductDependencies',
        name: 'manage-product-dependencies',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/ecommerce/products/ManageProductDependencies.vue')
    }
];
