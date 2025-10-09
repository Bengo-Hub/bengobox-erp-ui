import axios from '@/utils/axiosConfig';
import { applyAllBranding, applyPrimeVueTheme, DEFAULT_BRANDING, resetBranding, saveThemeSettings } from '@/utils/businessBranding';

const state = {
    isAuthenticated: false,
    user: null,
    business: null,
    addresses: []
};

const mutations = {
    SET_AUTHENTICATED(state, isAuthenticated) {
        state.isAuthenticated = isAuthenticated;
    },
    SET_USER(state, user) {
        state.user = user;
    },
    SET_BUSINESS(state, business) {
        state.business = business;
    },
    SET_ADDRESSES(state, addresses) {
        state.addresses = Array.isArray(addresses) ? addresses : [];
    },
    UPDATE_BRANDING_SETTINGS(state, settings) {
        if (state.business) {
            state.business.branding_settings = settings;
            // Update session storage with new business details
            sessionStorage.setItem('business', JSON.stringify(state.business));
        }
    }
};

const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
};

const actions = {
    async login({ commit }, payload) {
        try {
            const { data } = await axios.post('/auth/security/login/', payload, {
                headers: { 'X-CSRFToken': getCookie('csrftoken') }
            });

            // Check if backend requires 2FA
            if (data && data.requires_2fa) {
                return { requires_2fa: true };
            }

            // Check if login was successful
            if (data && data.message === 'Login successful') {
                const user = data.user || {};
                const imgBaseUrl = (axios.defaults.baseURL || '').replace('/api/v1/', '/media/');

                // Build safe business fallback
                const rawBiz = data.business || {};
                const business = {
                    business__name: rawBiz.business__name || 'BengoBox ERP',
                    name: rawBiz.name || rawBiz.branch_name || '',
                    branch_code: rawBiz.branch_code || rawBiz.location_id || null,
                    country: rawBiz.country || '',
                    city: rawBiz.city || '',
                    postal_code: rawBiz.postal_code || '',
                    zip_code: rawBiz.zip_code || '',
                    contact_number: rawBiz.contact_number || '',
                    alternate_contact_number: rawBiz.alternate_contact_number || '',
                    address: rawBiz.address || '',
                    email: rawBiz.email || '',
                    website: rawBiz.website || '',
                    business__logo: rawBiz.business__logo ? imgBaseUrl + rawBiz.business__logo : '',
                    business__watermarklogo: rawBiz.business__watermarklogo ? imgBaseUrl + rawBiz.business__watermarklogo : '',
                    branding_settings: rawBiz.branding_settings || null,
                    id: rawBiz.id || null
                };

                const addresses = Array.isArray(data.addresses) ? data.addresses : [];

                // Process branding settings if they exist
                if (business && business.branding_settings) {
                    // Apply theme settings immediately
                    applyPrimeVueTheme(business.branding_settings);
                }

                // Set token
                axios.defaults.headers.common['Authorization'] = user.token ? `Token ${user.token}` : '';

                commit('SET_AUTHENTICATED', true);
                commit('SET_USER', user);
                commit('SET_BUSINESS', business);
                commit('SET_ADDRESSES', addresses);

                // Store in session storage
                if (user && user.token) sessionStorage.setItem('token', user.token);
                sessionStorage.setItem('user', JSON.stringify(user || {}));
                sessionStorage.setItem('business', JSON.stringify(business || {}));
                sessionStorage.setItem('addresses', JSON.stringify(addresses));
                sessionStorage.setItem('isAuthenticated', true);

                // Apply all branding (logo, colors, etc.)
                applyAllBranding(business || {}, DEFAULT_BRANDING);
                return { success: true };
            } else {
                // Handle error response from backend
                let errorMessage = 'Login failed. Please check your credentials.';
                if (data && data.error) {
                    if (typeof data.error === 'object' && data.error.message) {
                        errorMessage = data.error.message;
                    } else if (typeof data.error === 'string') {
                        errorMessage = data.error;
                    }
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.log('Login error:', error);
            // If it's already an Error object with our message, re-throw it
            if (error instanceof Error) {
                throw error;
            }
            // Otherwise, create a generic error
            throw new Error('An error occurred during login.');
        }
    },

    async logout({ commit }) {
        try {
            await axios.post(
                '/auth/logout/',
                {},
                {
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                    withCredentials: true
                }
            );
        } catch (_) {
            // Ignore network/CORS failures and proceed with local cleanup to ensure UX
        } finally {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('business');
            sessionStorage.removeItem('addresses');
            sessionStorage.removeItem('isAuthenticated');
            commit('SET_AUTHENTICATED', false);
            commit('SET_USER', null);
            commit('SET_BUSINESS', null);
            commit('SET_ADDRESSES', []);
            delete axios.defaults.headers.common['Authorization'];
            // Note: X-Branch-ID header is handled by axios interceptor

            // Reset to default branding
            resetBranding(DEFAULT_BRANDING);
        }
    },

    checkAuthentication({ commit }) {
        const token = sessionStorage.getItem('token');
        const userStr = sessionStorage.getItem('user');
        const businessStr = sessionStorage.getItem('business');
        const addressesStr = sessionStorage.getItem('addresses');

        if (token && userStr) {
            const user = JSON.parse(userStr);
            commit('SET_AUTHENTICATED', true);
            commit('SET_USER', user);
            axios.defaults.headers.common['Authorization'] = `Token ${token}`;

            // Load permissions from localStorage if available
            const storedPermissions = localStorage.getItem('userPermissions');
            if (storedPermissions && user.permissions) {
                // Ensure permissions are in sync
                localStorage.setItem('userPermissions', JSON.stringify(user.permissions));
            }

            if (businessStr) {
                const business = JSON.parse(businessStr);
                commit('SET_BUSINESS', business);

                if (addressesStr) {
                    try {
                        commit('SET_ADDRESSES', JSON.parse(addressesStr));
                    } catch (_) {
                        commit('SET_ADDRESSES', []);
                    }
                }

                // Apply branding settings
                if (business.branding_settings) {
                    // Apply theme settings specifically
                    applyPrimeVueTheme(business.branding_settings);
                }

                // Apply all branding (logo, colors, etc.)
                applyAllBranding(business, DEFAULT_BRANDING);
            } else {
                resetBranding(DEFAULT_BRANDING);
            }
        } else {
            resetBranding(DEFAULT_BRANDING);
        }
    },

    async fetchBrandingSettings({ commit, state }) {
        try {
            if (!state.business || !state.business.id) return;

            const response = await axios.get(`business/business/branding-settings/`);
            const brandingSettings = response.data;

            // Update the store
            commit('UPDATE_BRANDING_SETTINGS', brandingSettings);

            // Apply the theme settings
            applyPrimeVueTheme(brandingSettings);

            return brandingSettings;
        } catch (error) {
            console.error('Error fetching branding settings:', error);
            throw error;
        }
    },

    async updateBrandingSettings({ commit, state }, settings) {
        try {
            if (!state.business || !state.business.id) return;

            // Save settings to backend
            const response = await saveThemeSettings(state.business.id, settings);

            // Update local state
            commit('UPDATE_BRANDING_SETTINGS', response);

            // Apply the updated theme
            applyPrimeVueTheme(response);

            return response;
        } catch (error) {
            console.error('Error updating branding settings:', error);
            throw error;
        }
    },

    updateBusinessDetails({ commit }, business) {
        commit('SET_BUSINESS', business);
        sessionStorage.setItem('business', JSON.stringify(business));
        applyAllBranding(business, DEFAULT_BRANDING);
    }
};

export default {
    namespaced: true, // Make sure the module is namespaced
    state,
    mutations,
    actions
};
