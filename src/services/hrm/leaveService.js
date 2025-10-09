import axios from '@/utils/axiosConfig';

const API_URL = '/hrm/leave';

export const leaveService = {
    // Leave Categories
    getCategories() {
        return axios.get(`${API_URL}/categories/`);
    },
    createCategory(data) {
        return axios.post(`${API_URL}/categories/`, data);
    },
    updateCategory(id, data) {
        return axios.put(`${API_URL}/categories/${id}/`, data);
    },
    deleteCategory(id) {
        return axios.delete(`${API_URL}/categories/${id}/`);
    },

    // Leave Entitlements
    getEntitlements(params = {}) {
        return axios.get(`${API_URL}/entitlements/`, { params });
    },
    createEntitlement(data) {
        return axios.post(`${API_URL}/entitlements/`, data);
    },
    updateEntitlement(id, data) {
        return axios.put(`${API_URL}/entitlements/${id}/`, data);
    },
    deleteEntitlement(id) {
        return axios.delete(`${API_URL}/entitlements/${id}/`);
    },

    // Leave Requests
    getRequests(params = {}) {
        return axios.get(`${API_URL}/requests/`, { params });
    },
    validateLeave(data) {
        return axios.post(`${API_URL}/requests/validate/`, data);
    },
    createRequest(data) {
        return axios.post(`${API_URL}/requests/`, data);
    },
    updateRequest(id, data) {
        return axios.put(`${API_URL}/requests/${id}/`, data);
    },
    deleteRequest(id) {
        return axios.delete(`${API_URL}/requests/${id}/`);
    },
    approveRequest(id) {
        return axios.post(`${API_URL}/requests/${id}/approve/`);
    },
    rejectRequest(id, reason) {
        return axios.post(`${API_URL}/requests/${id}/reject/`, { rejection_reason: reason });
    },

    // Leave Balances
    getBalances(params = {}) {
        return axios.get(`${API_URL}/balances/`, { params });
    },
    createBalance(data) {
        return axios.post(`${API_URL}/balances/`, data);
    },
    updateBalance(id, data) {
        return axios.put(`${API_URL}/balances/${id}/`, data);
    },
    deleteBalance(id) {
        return axios.delete(`${API_URL}/balances/${id}/`);
    },

    // Leave Logs
    getLogs(params = {}) {
        return axios.get(`${API_URL}/logs/`, { params });
    }
};
