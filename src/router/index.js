import permissionMiddleware from '@/middleware/permission';
import routes from '@/router/routes';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(import.meta.env.VITE_BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    // Check authentication first
    if (to.matched.some((record) => record.meta.requiresAuth) && !sessionStorage.getItem('isAuthenticated')) {
        next('/auth/login');
        return;
    }

    // Check permissions
    permissionMiddleware(to, from, next);
});

export default router;
