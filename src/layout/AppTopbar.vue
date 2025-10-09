<script setup>
import { useLayout } from '@/layout/composables/layout';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import AppConfigurator from './AppConfigurator.vue';
import BusinessBranding from '@/components/BusinessBranding.vue';
import { getBusinessDetails } from '@/utils/businessBranding';

const store = useStore();
const router = useRouter();
const businessDetails = ref(null);

onMounted(() => {
    // Get business details from session storage
    businessDetails.value = getBusinessDetails();
});

// Computed properties for dynamic styling
const topbarStyle = computed(() => {
    if (!businessDetails.value) return {};

    return {
        backgroundColor: businessDetails.value.business__background_color || '#ffffff',
        color: businessDetails.value.business__text_color || '#212121',
        borderBottom: `1px solid ${businessDetails.value.business__primary_color || '#1976D2'}30`
    };
});

const actionButtonStyle = computed(() => {
    if (!businessDetails.value) return {};

    return {
        color: businessDetails.value.business__text_color || '#212121'
    };
});

const highlightButtonStyle = computed(() => {
    if (!businessDetails.value) return {};

    return {
        backgroundColor: `${businessDetails.value.business__primary_color || '#1976D2'}15`,
        color: businessDetails.value.business__primary_color || '#1976D2'
    };
});

// Logout function
const logout = async () => {
    await store.dispatch('auth/logout');
    router.push({ name: 'login' });
};

const profileItems = ref([
    {
        label: 'Profile',
        icon: 'pi pi-fw pi-user',
        items: [
            {
                label: 'Settings',
                icon: 'pi pi-fw pi-cog'
            },
            {
                label: 'Billing',
                icon: 'pi pi-fw pi-file'
            }
        ]
    },
    {
        separator: true
    },
    {
        label: 'Log Out',
        icon: 'pi pi-fw pi-sign-out',
        command: logout
    }
]);

const { onMenuToggle, toggleDarkMode, isDarkTheme } = useLayout();
</script>

<template>
    <div class="layout-topbar" :style="topbarStyle">
        <div class="layout-topbar-logo-container">
            <button class="layout-menu-button layout-topbar-action" @click="onMenuToggle" :style="actionButtonStyle">
                <i class="pi pi-bars"></i>
            </button>
            <router-link to="/" class="layout-topbar-logo">
                <BusinessBranding size="medium" />
            </router-link>
        </div>

        <div class="layout-topbar-actions">
            <div class="layout-config-menu flex items-center gap-2">
                <button type="button" class="layout-topbar-action" @click="toggleDarkMode" :style="actionButtonStyle">
                    <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
                </button>

                <button type="button" class="layout-topbar-action" :style="actionButtonStyle">
                    <i class="pi pi-bell"></i>
                    <span class="notification-badge">5</span>
                </button>

                <div class="relative">
                    <button
                        v-styleclass="{
                            selector: '@next',
                            enterFromClass: 'hidden',
                            enterActiveClass: 'animate-scalein',
                            leaveToClass: 'hidden',
                            leaveActiveClass: 'animate-fadeout',
                            hideOnOutsideClick: true
                        }"
                        type="button"
                        class="layout-topbar-action layout-topbar-action-highlight"
                        :style="highlightButtonStyle"
                    >
                        <i class="pi pi-palette"></i>
                    </button>
                    <AppConfigurator />
                </div>
            </div>

            <button
                class="layout-topbar-menu-button layout-topbar-action"
                v-styleclass="{
                    selector: '@next',
                    enterFromClass: 'hidden',
                    enterActiveClass: 'animate-scalein',
                    leaveToClass: 'hidden',
                    leaveActiveClass: 'animate-fadeout',
                    hideOnOutsideClick: true
                }"
                :style="actionButtonStyle"
            >
                <i class="pi pi-ellipsis-v"></i>
            </button>

            <div class="layout-topbar-menu hidden lg:flex items-center">
                <button type="button" class="layout-topbar-action flex flex-column items-center justify-center mr-2" :style="actionButtonStyle">
                    <i class="pi pi-calendar text-xl"></i>
                    <span class="text-xs mt-1">Calendar</span>
                </button>

                <button type="button" class="layout-topbar-action flex flex-column items-center justify-center mr-2" :style="actionButtonStyle">
                    <i class="pi pi-inbox text-xl"></i>
                    <span class="text-xs mt-1">Messages</span>
                </button>

                <SplitButton label="" icon="pi pi-user" :model="profileItems" class="p-button-rounded p-button-text ml-2" :style="highlightButtonStyle"></SplitButton>
            </div>
        </div>
    </div>
</template>

<style scoped>
.layout-topbar {
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    height: 80px;
}

.layout-topbar-action {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    transition: background-color 0.2s;
}

.layout-topbar-action:hover {
    background-color: rgba(0, 0, 0, 0.04);
}

.layout-topbar-action i {
    font-size: 1.2rem;
}

.notification-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    background-color: #f44336;
    color: white;
    font-size: 0.7rem;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.layout-topbar-menu {
    display: flex;
    align-items: center;
}

.layout-topbar-logo-container {
    display: flex;
    align-items: center;
}

:deep(.p-splitbutton-menubutton) {
    border-top-right-radius: 50% !important;
    border-bottom-right-radius: 50% !important;
}

:deep(.p-splitbutton-defaultbutton) {
    border-top-left-radius: 50% !important;
    border-bottom-left-radius: 50% !important;
}
</style>
