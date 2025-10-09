import axios from '@/utils/axiosConfig';

// Error handling helper
const handleError = (error) => {
    console.error('API Error:', error);
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return {
            success: false,
            message: error.response.data.message || 'An error occurred',
            data: error.response.data
        };
    } else if (error.request) {
        // The request was made but no response was received
        return {
            success: false,
            message: 'No response from server',
            data: null
        };
    } else {
        // Something happened in setting up the request that triggered an Error
        return {
            success: false,
            message: error.message,
            data: null
        };
    }
};

export const systemConfigService = {
    // Approval Settings
    async getApprovalSettings() {
        try {
            const response = await axios.get(`approvals/workflows/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async getApprovalById(id) {
        try {
            const response = await axios.get(`approvals/workflows/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateApprovalSetting(id, data) {
        try {
            const response = await axios.patch(`approvals/workflows/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createApprovalSetting(data) {
        try {
            const response = await axios.post(`approvals/workflows/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteApprovalSetting(id) {
        try {
            const response = await axios.delete(`approvals/workflows/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Content Types
    async getContentTypes() {
        try {
            const response = await axios.get(`approvals/workflows/content-types/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Users (for approval assignment)
    async getUsers() {
        try {
            const response = await axios.get(`listusers/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    //hod users
    async getHodUsers() {
        try {
            const response = await axios.get(`auth/hodusers/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },
    // Business Settings
    async getBusinessSettings() {
        try {
            const response = await axios.get(`business/business/business/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateBusinessSettings(data) {
        try {
            const response = await axios.patch(`business/business/business/${data.id}/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    // Business Branches
    async getBusinessBranches(params = {}) {
        try {
            const response = await axios.get(`business/business/branches/`, { params });
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async getBusinessBranchById(id) {
        try {
            const response = await axios.get(`business/business/branches/${id}/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async createBusinessBranch(data) {
        try {
            const response = await axios.post(`business/business/branches/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateBusinessBranch(id, data) {
        try {
            const response = await axios.patch(`business/business/branches/${id}/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteBusinessBranch(id) {
        try {
            const response = await axios.delete(`business/business/branches/${id}/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    // Branding Settings
    async getBrandingSettings() {
        try {
            const response = await axios.get(`business/business/branding-settings/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    async updateBrandingSettings(data) {
        try {
            const response = await axios.patch(`business/business/branding-settings/${data.id}/`, data);
            return {
                success: true,
                data: response.data,
                message: 'Branding settings updated successfully'
            };
        } catch (error) {
            return handleError(error);
        }
    },

    // Prefix Settings
    async getPrefixSettings() {
        try {
            const response = await axios.get(`business/business/prefix-settings/`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },
    async createPrefixSettings(data) {
        try {
            const response = await axios.post(`business/business/prefix-settings/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },
    async updatePrefixSettings(data) {
        try {
            const response = await axios.patch(`business/business/prefix-settings/`, data);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            return handleError(error);
        }
    },

    // Tax Configuration
    async getTaxSettings() {
        try {
            const response = await axios.get(`business/business/tax-rates/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updateTaxSetting(id, data) {
        try {
            const response = await axios.patch(`business/business/tax-rates/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async createTaxSetting(data) {
        try {
            const response = await axios.post(`business/business/tax-rates/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async deleteTaxSetting(id) {
        try {
            const response = await axios.delete(`business/business/tax-rates/${id}/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // Payment Integrations
    async getPaymentIntegrations() {
        try {
            const response = await axios.get(`/business/payment-integrations/`);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    async updatePaymentIntegration(id, data) {
        try {
            const response = await axios.patch(`/business/payment-integrations/${id}/`, data);
            return response.data;
        } catch (error) {
            return handleError(error);
        }
    },

    // KRA eTIMS Settings
    async getKRASettings() {
        try {
            const response = await axios.get(`integrations/kra-settings/current/`);
            return { success: true, data: response.data };
        } catch (error) {
            return handleError(error);
        }
    },

    async saveKRASettings(data) {
        try {
            if (data && data.id) {
                const response = await axios.patch(`integrations/kra-settings/${data.id}/`, data);
                return { success: true, data: response.data };
            } else {
                const response = await axios.post(`integrations/kra-settings/`, data);
                return { success: true, data: response.data };
            }
        } catch (error) {
            return handleError(error);
        }
    }
};
