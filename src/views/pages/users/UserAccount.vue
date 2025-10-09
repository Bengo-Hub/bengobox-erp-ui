<script setup>
import { useToast } from '@/composables/useToast';
import UserAddresses from '@/components/user/UserAddresses.vue';
import UserOrders from '@/components/user/UserOrders.vue';
import UserProfile from '@/components/user/UserProfile.vue';
import { UserService } from '@/services/UserService';
import { useBusinessBranding } from '@/utils/businessBranding';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';

const { showToast } = useToast();
const store = useStore();
const router = useRouter();
const route = useRoute();
const { applyBusinessBranding } = useBusinessBranding();

// Tab management
const activeTab = ref(0);

// 2FA state
const twoFactorEnabled = ref(false);
const twoFactorDialog = ref(false);
const qrCodeUrl = ref('');
const secretKey = ref('');
const verificationCode = ref('');

// User preferences
const preferences = ref({
    email_notifications: true,
    order_updates: true,
    promotional_emails: false,
    security_alerts: true,
    theme: { name: 'System Default', code: 'system' },
    language: { name: 'English', code: 'en' },
    reduced_motion: false
});

// Mock login activities
const loginActivities = ref([
    {
        device: 'Windows Chrome Browser',
        location: 'Nairobi, Kenya',
        timestamp: new Date(),
        current: true
    },
    {
        device: 'iPhone Safari Browser',
        location: 'Nairobi, Kenya',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        current: false
    }
]);

// Mock user permissions
const userPermissions = ref([
    {
        name: 'View Products',
        description: 'Can view product listings and details',
        granted: true
    },
    {
        name: 'Manage Orders',
        description: 'Can view and update order status',
        granted: true
    },
    {
        name: 'Edit Product Details',
        description: 'Can edit product information',
        granted: false
    }
]);

// Options for dropdowns
const themeOptions = [
    { name: 'System Default', code: 'system' },
    { name: 'Light', code: 'light' },
    { name: 'Dark', code: 'dark' }
];

const languageOptions = [
    { name: 'English', code: 'en' },
    { name: 'Swahili', code: 'sw' },
    { name: 'French', code: 'fr' },
    { name: 'Arabic', code: 'ar' }
];

// Computed properties
const user = computed(() => store.state.auth.user);
const isStaffUser = computed(() => {
    return user.value && (user.value.is_staff || user.value.is_superuser);
});

// Watch for route changes to set active tab
watch(
    () => route.query.tab,
    (newTab) => {
        if (newTab) {
            const tabMapping = {
                profile: 0,
                orders: 1,
                addresses: 2,
                security: 3,
                preferences: 4
            };

            if (tabMapping[newTab] !== undefined) {
                activeTab.value = tabMapping[newTab];
            }
        }
    },
    { immediate: true }
);

// Apply business branding on component mount
onMounted(() => {
    applyBusinessBranding();

    // Check if there's a tab parameter in the URL
    const tabParam = route.query.tab;
    if (tabParam) {
        const tabMapping = {
            profile: 0,
            orders: 1,
            addresses: 2,
            security: 3,
            preferences: 4
        };

        if (tabMapping[tabParam] !== undefined) {
            activeTab.value = tabMapping[tabParam];
        }
    }

    // Fetch user preferences
    fetchUserPreferences();

    // Check if 2FA is enabled
    check2FAStatus();
});

// Methods
const onTabChange = (e) => {
    activeTab.value = e.index;

    // Update URL without reloading page
    const tabMapping = ['profile', 'orders', 'addresses', 'security', 'preferences'];
    const newTab = tabMapping[e.index];

    router.push({
        query: { ...route.query, tab: newTab }
    });
};

const fetchUserPreferences = async () => {
    if (!user.value) return;

    try {
        const response = await UserService.getUserPreferences(user.value.id);

        if (response.data) {
            // Map API response to local preferences format
            preferences.value = {
                ...preferences.value,
                ...response.data,
                theme: themeOptions.find((t) => t.code === response.data.theme_preference) || preferences.value.theme,
                language: languageOptions.find((l) => l.code === response.data.language) || preferences.value.language
            };
        }
    } catch (error) {
        console.error('Error fetching user preferences:', error);
    }
};

const savePreferences = async () => {
    if (!user.value) return;

    try {
        // Convert preferences to API format
        const preferencesData = {
            email_notifications: preferences.value.email_notifications,
            order_updates: preferences.value.order_updates,
            promotional_emails: preferences.value.promotional_emails,
            security_alerts: preferences.value.security_alerts,
            theme_preference: preferences.value.theme.code,
            language: preferences.value.language.code,
            reduced_motion: preferences.value.reduced_motion
        };

        await UserService.updateUserPreferences(user.value.id, preferencesData);

        showToast('success', 'Success', 'Your preferences have been saved');
    } catch (error) {
        console.error('Error saving preferences:', error);
        showToast('error', 'Error', 'Failed to save preferences');
    }
};

const navigateToRolesPermissions = () => {
    router.push('/app/pages/users/roles-permissions');
};

const check2FAStatus = async () => {
    if (!user.value) return;

    try {
        const response = await UserService.get2FAStatus(user.value.id);
        twoFactorEnabled.value = response.data.enabled;
    } catch (error) {
        console.error('Error checking 2FA status:', error);
    }
};

const setup2FA = async () => {
    if (!user.value) return;

    try {
        const response = await UserService.generate2FASecret(user.value.id);
        qrCodeUrl.value = response.data.qr_code_url;
        secretKey.value = response.data.secret_key;
        twoFactorDialog.value = true;
    } catch (error) {
        console.error('Error setting up 2FA:', error);
        showToast('error', 'Error', 'Failed to set up two-factor authentication');
    }
};

const verifyAndEnable2FA = async () => {
    if (!verificationCode.value || !user.value) {
        showToast('warn', 'Warning', 'Please enter the verification code');
        return;
    }

    try {
        await UserService.verify2FACode(user.value.id, {
            code: verificationCode.value,
            secret_key: secretKey.value
        });

        twoFactorEnabled.value = true;
        twoFactorDialog.value = false;
        verificationCode.value = '';

        showToast('success', 'Success', 'Two-factor authentication has been enabled');
    } catch (error) {
        console.error('Error verifying 2FA code:', error);
        showToast('error', 'Error', 'Invalid verification code. Please try again.');
    }
};

const disable2FA = async () => {
    if (!user.value) return;

    try {
        await UserService.disable2FA(user.value.id);
        twoFactorEnabled.value = false;

        showToast('success', 'Success', 'Two-factor authentication has been disabled');
    } catch (error) {
        console.error('Error disabling 2FA:', error);
        showToast('error', 'Error', 'Failed to disable two-factor authentication');
    }
};

const formatDate = (date) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString(undefined, options);
};

const onAddressUpdated = (data) => {
    const { action, address } = data;

    let message = '';
    switch (action) {
        case 'create':
            message = 'New address has been added successfully';
            break;
        case 'update':
            message = 'Address has been updated successfully';
            break;
        case 'delete':
            message = 'Address has been deleted';
            break;
        case 'setDefault':
            message = 'Default address has been updated';
            break;
    }

    if (message) {
        showToast('success', 'Success', message);
    }
};

const signOut = () => {
    store.dispatch('auth/logout');
    router.push('/auth/login');
};
</script>

<template>
    <div class="user-account-page">
        <Toast />
        <div class="grid">
            <div class="col-12">
                <div class="card mb-0">
                    <div class="flex justify-content-between flex-column md:flex-row mb-3">
                        <div class="flex align-items-center">
                            <div>
                                <h1 class="m-0 font-bold text-xl mb-1">My Account</h1>
                                <p class="text-gray-600 m-0">Manage your profile, orders, and addresses</p>
                            </div>
                        </div>
                        <div class="flex align-items-center mt-3 md:mt-0">
                            <Button label="Back to Shop" icon="pi pi-shopping-cart" class="p-button-outlined mr-2" @click="router.push('/ecommerce/shop')" />
                            <Button label="Sign Out" icon="pi pi-sign-out" class="p-button-danger p-button-outlined" @click="signOut" />
                        </div>
                    </div>

                    <TabView @tab-change="onTabChange" :activeIndex="activeTab">
                        <TabPanel header="Profile">
                            <div class="user-profile-container">
                                <UserProfile />
                            </div>
                        </TabPanel>

                        <TabPanel header="Orders">
                            <div class="user-orders-container">
                                <UserOrders />
                            </div>
                        </TabPanel>

                        <TabPanel header="Addresses">
                            <div class="user-address-container">
                                <UserAddresses @address-updated="onAddressUpdated" />
                            </div>
                        </TabPanel>

                        <TabPanel v-if="isStaffUser" header="Security">
                            <div class="user-security-container">
                                <Card>
                                    <template #title>
                                        <div class="flex align-items-center">
                                            <i class="pi pi-shield mr-2"></i>
                                            <span>Account Security</span>
                                        </div>
                                    </template>

                                    <template #content>
                                        <div class="grid">
                                            <div class="col-12 md:col-6">
                                                <h3>Two-Factor Authentication</h3>
                                                <div class="p-field-checkbox mb-3">
                                                    <Checkbox id="2fa" v-model="twoFactorEnabled" binary />
                                                    <label for="2fa" class="ml-2">Enable Two-Factor Authentication</label>
                                                </div>
                                                <p class="text-gray-600">Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.</p>
                                                <Button v-if="!twoFactorEnabled" label="Set Up 2FA" icon="pi pi-lock" @click="setup2FA" />
                                                <Button v-else label="Disable 2FA" icon="pi pi-lock-open" class="p-button-warning" @click="disable2FA" />
                                            </div>

                                            <div class="col-12 md:col-6">
                                                <h3>Login Activity</h3>
                                                <div v-if="loginActivities.length === 0" class="text-gray-500">No recent login activity to display.</div>
                                                <ul v-else class="login-activity-list p-0 m-0">
                                                    <li v-for="(activity, index) in loginActivities" :key="index" class="mb-3 border-bottom-1 border-gray-200 pb-2">
                                                        <div class="flex align-items-center justify-content-between">
                                                            <div>
                                                                <i class="pi pi-desktop mr-2"></i>
                                                                <span class="font-semibold">{{ activity.device }}</span>
                                                                <div class="text-gray-600 text-sm mt-1">{{ activity.location }} · {{ formatDate(activity.timestamp) }}</div>
                                                            </div>
                                                            <Tag :severity="activity.current ? 'success' : 'info'" :value="activity.current ? 'Current Session' : 'Previous Login'" />
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>

                                            <div class="col-12 mt-4">
                                                <h3>Access Permissions</h3>
                                                <div class="permissions-container border-1 border-gray-200 border-round p-3">
                                                    <div v-for="(permission, index) in userPermissions" :key="index" class="permission-item mb-3 pb-2 border-bottom-1 border-gray-200">
                                                        <div class="flex justify-content-between">
                                                            <div>
                                                                <span class="font-semibold">{{ permission.name }}</span>
                                                                <div class="text-gray-600 text-sm mt-1">{{ permission.description }}</div>
                                                            </div>
                                                            <Tag :value="permission.granted ? 'Granted' : 'Restricted'" :severity="permission.granted ? 'success' : 'danger'" />
                                                        </div>
                                                    </div>

                                                    <div class="text-right mt-3">
                                                        <Button label="View All Permissions" icon="pi pi-list" class="p-button-outlined p-button-sm" @click="navigateToRolesPermissions" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </template>
                                </Card>
                            </div>
                        </TabPanel>

                        <TabPanel v-if="isStaffUser" header="Preferences">
                            <div class="user-preferences-container">
                                <Card>
                                    <template #title>
                                        <div class="flex align-items-center">
                                            <i class="pi pi-cog mr-2"></i>
                                            <span>Account Preferences</span>
                                        </div>
                                    </template>

                                    <template #content>
                                        <div class="grid">
                                            <div class="col-12 md:col-6">
                                                <h3>Notifications</h3>
                                                <div class="p-field-checkbox mb-2">
                                                    <Checkbox id="emailNotifs" v-model="preferences.email_notifications" binary />
                                                    <label for="emailNotifs" class="ml-2">Email Notifications</label>
                                                </div>
                                                <div class="p-field-checkbox mb-2">
                                                    <Checkbox id="orderUpdates" v-model="preferences.order_updates" binary />
                                                    <label for="orderUpdates" class="ml-2">Order Status Updates</label>
                                                </div>
                                                <div class="p-field-checkbox mb-2">
                                                    <Checkbox id="promoNotifs" v-model="preferences.promotional_emails" binary />
                                                    <label for="promoNotifs" class="ml-2">Promotional Emails</label>
                                                </div>
                                                <div class="p-field-checkbox mb-3">
                                                    <Checkbox id="securityNotifs" v-model="preferences.security_alerts" binary />
                                                    <label for="securityNotifs" class="ml-2">Security Alerts</label>
                                                </div>
                                            </div>

                                            <div class="col-12 md:col-6">
                                                <h3>Display Settings</h3>
                                                <div class="mb-3">
                                                    <label for="theme" class="block mb-2">Theme Preference</label>
                                                    <Dropdown id="theme" v-model="preferences.theme" :options="themeOptions" optionLabel="name" placeholder="Select Theme" class="w-full" />
                                                </div>

                                                <div class="mb-3">
                                                    <label for="language" class="block mb-2">Language</label>
                                                    <Dropdown id="language" v-model="preferences.language" :options="languageOptions" optionLabel="name" placeholder="Select Language" class="w-full" />
                                                </div>

                                                <div class="p-field-checkbox mb-2">
                                                    <Checkbox id="reducedMotion" v-model="preferences.reduced_motion" binary />
                                                    <label for="reducedMotion" class="ml-2">Reduced Motion</label>
                                                </div>
                                            </div>

                                            <div class="col-12 mt-3 flex justify-content-end">
                                                <Button label="Save Preferences" icon="pi pi-save" @click="savePreferences" />
                                            </div>
                                        </div>
                                    </template>
                                </Card>
                            </div>
                        </TabPanel>
                    </TabView>
                </div>
            </div>
        </div>

        <!-- Two-Factor Auth Dialog -->
        <Dialog v-model:visible="twoFactorDialog" header="Set Up Two-Factor Authentication" :style="{ width: '450px' }" modal>
            <div class="two-factor-setup p-4 text-center">
                <i class="pi pi-shield text-5xl text-primary mb-3"></i>
                <h3 class="mt-0">Scan QR Code</h3>
                <p>Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                <div class="qr-container p-4 border-1 border-gray-200 border-round flex justify-content-center">
                    <img :src="qrCodeUrl" alt="QR Code" width="200" height="200" />
                </div>
                <p class="mt-3 font-bold">Or enter this code manually:</p>
                <div class="secret-key p-3 border-1 border-gray-200 border-round font-mono">
                    {{ secretKey }}
                </div>

                <div class="mt-4">
                    <div class="p-float-label mb-3">
                        <InputText id="verificationCode" v-model="verificationCode" class="w-full" />
                        <label for="verificationCode">Enter Verification Code</label>
                    </div>

                    <Button label="Verify and Enable" icon="pi pi-check" class="w-full" @click="verifyAndEnable2FA" />
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.user-account-page {
    padding-bottom: 2rem;
}

:deep(.p-tabview-panels) {
    padding: 1.5rem 0;
}

:deep(.p-tabview .p-tabview-nav) {
    border-width: 0 0 1px 0;
}

.login-activity-list {
    list-style-type: none;
}

.two-factor-setup .qr-container {
    background-color: white;
}

.two-factor-setup .secret-key {
    font-family: monospace;
    letter-spacing: 2px;
    background-color: #f8f9fa;
    user-select: all;
}

.permissions-container {
    max-height: 300px;
    overflow-y: auto;
}

@media screen and (max-width: 768px) {
    :deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
        padding: 0.75rem 0.5rem;
    }
}
</style>
