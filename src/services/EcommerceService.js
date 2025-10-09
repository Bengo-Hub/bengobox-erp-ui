import axios from '@/utils/axiosConfig';

// Versioned base paths
const API_URL = '/ecommerce';
const ADDR_URL = '/addresses';

export const EcommerceService = {
    // Cart Management
    getCart(params = {}) {
        return axios.get(`${API_URL}/cart/cart/`, { params });
    },
    addToCart(cartData) {
        return axios.post(`${API_URL}/cart/cart/`, cartData);
    },
    updateCartItem(itemId, quantity) {
        return axios.put(`${API_URL}/cart/cart/${itemId}/`, { quantity });
    },
    removeFromCart(itemId) {
        return axios.delete(`${API_URL}/cart/cart/${itemId}/`);
    },
    clearCart() {
        return axios.delete(`${API_URL}/cart/cart/clear/`);
    },

    // Categories
    getMainCategories(params = {}) {
        return axios.get(`${API_URL}/product/categories/`, { params });
    },
    getSubCategories(parentId, params = {}) {
        return axios.get(`${API_URL}/product/categories/`, {
            params: { parent: parentId, ...params }
        });
    },
    getCategoryById(id) {
        return axios.get(`${API_URL}/product/categories/${id}/`);
    },

    // Products
    getProducts(params = {}) {
        return axios.get(`${API_URL}/product/products/`, { params });
    },
    getProductById(id) {
        return axios.get(`${API_URL}/product/products/${id}/`);
    },
    searchProducts(query, params = {}) {
        return axios.get(`${API_URL}/product/products/`, {
            params: { search: query, ...params }
        });
    },
    getProductsByCategory(categoryId, params = {}) {
        return axios.get(`${API_URL}/product/products/`, {
            params: { category: categoryId, ...params }
        });
    },

    // Orders
    getOrders(params = {}) {
        return axios.get(`${API_URL}/order/orders/`, { params });
    },
    getOrderById(id) {
        return axios.get(`${API_URL}/order/orders/${id}/`);
    },
    createOrder(orderData) {
        return axios.post(`${API_URL}/order/orders/`, orderData);
    },
    updateOrder(id, orderData) {
        return axios.put(`${API_URL}/order/orders/${id}/`, orderData);
    },
    cancelOrder(id, reason) {
        return axios.post(`${API_URL}/order/orders/${id}/cancel/`, { reason });
    },

    // Payment Methods (finance centralized)
    getPaymentMethods(params = {}) {
        return axios.get(`api/v1/finance/payment/methods/`, { params });
    },
    // Bank payment details (if provided by backend config)
    getBankPaymentDetails(params = {}) {
        return axios.get(`api/v1/finance/payment/methods/`, { params: { include_details: true, ...params } });
    },

    //stock inventory
    getStockInventory(params = {}) {
        return axios.get(`${API_URL}/stockinventory/stock/`, { params });
    },
    getStockInventoryById(id) {
        return axios.get(`${API_URL}/stockinventory/stock/${id}/`);
    },
    getStockInventoryByProductId(productId) {
        return axios.get(`${API_URL}/stockinventory/stock/`, {
            params: { product: productId }
        });
    },

    //units
    getUnits(params = {}) {
        return axios.get(`${API_URL}/stockinventory/units/`, { params });
    },

    // User Addresses (centralized addresses app)
    getUserAddresses(params = {}) {
        return axios.get(`${ADDR_URL}/addresses/`, { params });
    },
    getShippingAddresses() {
        return axios.get(`${ADDR_URL}/addresses/`, { params: { address_type: 'shipping' } });
    },
    getBillingAddresses() {
        return axios.get(`${ADDR_URL}/addresses/`, { params: { address_type: 'billing' } });
    },
    saveAddress(addressData) {
        return axios.post(`${ADDR_URL}/addresses/`, addressData);
    },
    updateAddress(addressId, addressData) {
        return axios.put(`${ADDR_URL}/addresses/${addressId}/`, addressData);
    },
    deleteAddress(addressId) {
        return axios.delete(`${ADDR_URL}/addresses/${addressId}/`);
    },
    // Backend provides a unified set_default action; use for either shipping/billing defaults
    setDefaultShippingAddress(addressId) {
        return axios.post(`${ADDR_URL}/addresses/${addressId}/set_default/`);
    },
    setDefaultBillingAddress(addressId) {
        return axios.post(`${ADDR_URL}/addresses/${addressId}/set_default/`);
    },
    validateAddress(addressId) {
        return axios.post(`${ADDR_URL}/addresses/${addressId}/validate_address/`);
    },

    // Delivery regions and pickup stations
    getDeliveryRegionsWithPickupStations(params = {}) {
        return axios.get(`${ADDR_URL}/delivery-regions/`, { params });
    },
    getPickupStationsByRegion(regionId, params = {}) {
        return axios.get(`${ADDR_URL}/delivery-regions/`, {
            params: { region: regionId, ...params }
        });
    },

    // Wishlist
    getWishlist(params = {}) {
        return axios.get(`${API_URL}/wishlist/`, { params });
    },
    addToWishlist(productId) {
        return axios.post(`${API_URL}/wishlist/`, { product: productId });
    },
    removeFromWishlist(itemId) {
        return axios.delete(`${API_URL}/wishlist/${itemId}/`);
    },

    // Reviews and Ratings
    getProductReviews(productId, params = {}) {
        return axios.get(`${API_URL}/product/products/${productId}/reviews/`, { params });
    },
    addProductReview(productId, reviewData) {
        return axios.post(`${API_URL}/product/products/${productId}/reviews/`, reviewData);
    },

    // Analytics and Reports
    getOrderAnalytics(params = {}) {
        return axios.get(`${API_URL}/analytics/orders/`, { params });
    },
    getProductAnalytics(params = {}) {
        return axios.get(`${API_URL}/analytics/products/`, { params });
    },

    // Flash Sale Products
    getFlashSaleProducts(params = {}) {
        return axios.get(`${API_URL}/product/products/`, {
            params: { flash_sale: true, ...params }
        });
    },

    // Featured Products
    getFeaturedProducts(params = {}) {
        return axios.get(`${API_URL}/product/products/`, {
            params: { featured: true, ...params }
        });
    },

    // Trending Products
    getTrendingProducts(params = {}) {
        return axios.get(`${API_URL}/product/products/`, {
            params: { trending: true, ...params }
        });
    },

    // Banners
    getBanners(params = {}) {
        return axios.get(`${API_URL}/banners/`, { params });
    },

    // Popular Categories
    getPopularCategories(params = {}) {
        return axios.get(`${API_URL}/product/categories/`, {
            params: { popular: true, ...params }
        });
    }
};
