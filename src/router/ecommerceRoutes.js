// Ecommerce and POS related routes
export const ecommerceRoutes = [
    // POS Dashboard
    {
        path: '/pos',
        name: 'POSDashboard',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/dashboards/POSDashboard.vue')
    },
    // Admin/Management routes (require authentication)
    {
        path: '/ecommerce/pos/pointOfSale',
        name: 'pointOfSale',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/ecommerce/pos/pointOfSale.vue')
    },
    {
        path: '/ecommerce/pos/Sales',
        name: 'Sales',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/ecommerce/pos/Sales.vue')
    },
    {
        path: '/ecommerce/pos/saleReturns',
        name: 'saleReturns',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/ecommerce/pos/saleReturns.vue')
    },
    {
        path: '/ecommerce/pos/OpenRegister',
        name: 'openregister',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/ecommerce/pos/OpenRegister.vue')
    },

    ////////////////////////////// online shop //////////////////////////////
    // Public routes - these don't require authentication to view
    {
        path: '/ecommerce/shop',
        component: () => import('@/views/pages/ecommerce/Shop.vue'),
        name: 'shop',
        meta: { requiresAuth: false, isShopRoute: true }
    },
    {
        path: '/ecommerce/shop/category/:categoryId',
        component: () => import('@/views/pages/ecommerce/products/ProductListing.vue'),
        name: 'product-category',
        meta: { requiresAuth: false, isShopRoute: true }
    },
    {
        path: '/ecommerce/shop/product/:id',
        component: () => import('@/views/pages/ecommerce/products/ProductDetail.vue'),
        name: 'product-detail',
        meta: { requiresAuth: false, isShopRoute: true }
    },

    // Routes that may be viewed publicly but might require auth for certain actions
    {
        path: '/ecommerce/shop/cart',
        component: () => import('@/views/pages/ecommerce/ShoppingCart.vue'),
        name: 'shopping-cart',
        meta: { requiresAuth: false, isShopRoute: true, checkAuthForActions: true }
    },

    // Routes that should redirect to login if not authenticated
    {
        path: '/ecommerce/shop/checkout',
        component: () => import('@/views/pages/ecommerce/Checkout.vue'),
        name: 'checkout',
        meta: { requiresAuth: true, isShopRoute: true }
    },
    {
        path: '/ecommerce/shop/order-success',
        component: () => import('@/views/pages/ecommerce/OrderSuccess.vue'),
        name: 'order-success',
        meta: { requiresAuth: true, isShopRoute: true }
    },

    // User account pages - require authentication
    {
        path: '/ecommerce/shop/account',
        component: () => import('@/views/pages/users/UserAccount.vue'),
        name: 'user-account',
        meta: { requiresAuth: true, isShopRoute: true }
    },
    // Removing these routes as they're now tabs within UserAccount.vue
    // {
    //     path: '/ecommerce/shop/orders',
    //     component: () => import('@/views/pages/ecommerce/user/Orders.vue'),
    //     name: 'user-orders',
    //     meta: { requiresAuth: true, isShopRoute: true }
    // },
    {
        path: '/ecommerce/shop/wishlist',
        component: () => import('@/views/pages/ecommerce/user/Wishlist.vue'),
        name: 'user-wishlist',
        meta: { requiresAuth: true, isShopRoute: true }
    },
    // Add order tracking route
    {
        path: '/ecommerce/shop/order-tracking',
        component: () => import('@/views/pages/ecommerce/OrderTracking.vue'),
        name: 'order-tracking',
        meta: { requiresAuth: true, isShopRoute: true }
    },
    // search routes
    {
        path: '/products',
        name: 'shop-products',
        meta: { requiresAuth: false, isShopRoute: true },
        component: () => import('@/views/pages/ecommerce/products/ProductListing.vue'),
        props: (route) => ({ searchQuery: route.query.search })
    }
];
