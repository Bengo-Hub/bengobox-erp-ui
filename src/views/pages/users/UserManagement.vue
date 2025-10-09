<script setup>
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/userManagementService';
import Backups from '@/views/pages/security/backups.vue';
import Settings from '@/views/pages/security/settings.vue';
import RolesPermissions from '@/views/pages/users/rolesPermissions.vue';
import UsersList from '@/views/pages/users/usersList.vue';
import Button from 'primevue/button';
import TabPanel from 'primevue/tabpanel';
import TabView from 'primevue/tabview';
import Toolbar from 'primevue/toolbar';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const loading = ref(false);

const navigateToHome = () => {
    router.push('/');
};

const navigateToHRM = () => {
    router.push('/hrm');
};

const refreshData = async () => {
    loading.value = true;
    try {
        // Refresh all necessary data
        await Promise.all([
            userManagementService.getUsers(),
            userManagementService.getRoles(),
            userManagementService.getPermissions(),
            userManagementService.getPasswordPolicy(),
            userManagementService.getOrganization(),
            userManagementService.getDepartments(),
            userManagementService.getBackups(),
            userManagementService.getBackupConfig(),
            userManagementService.getBackupSchedule()
        ]);
        showToast('success', 'Success', 'Data refreshed successfully', 3000);
    } catch (error) {
        showToast('error', 'Error', 'Failed to refresh data', 3000);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    refreshData();
});
</script>

<template>
    <div class="user-management">
        <Toolbar class="mb-4">
            <template #start>
                <Button label="Home" icon="pi pi-home" class="p-button-text" @click="navigateToHome" />
                <Button label="HRM" icon="pi pi-users" class="p-button-text" @click="navigateToHRM" />
            </template>
            <template #end>
                <Button label="Refresh" icon="pi pi-refresh" class="p-button-text" @click="refreshData" />
            </template>
        </Toolbar>

        <TabView>
            <TabPanel header="Users">
                <users-list />
            </TabPanel>
            <TabPanel header="Roles & Permissions">
                <roles-permissions />
            </TabPanel>
            <TabPanel header="Settings">
                <settings />
            </TabPanel>
            <TabPanel header="Backups">
                <backups />
            </TabPanel>
        </TabView>
    </div>
</template>

<style scoped>
.user-management {
    padding: 1rem;
}

:deep(.p-tabview-panels) {
    padding: 1rem 0;
}
</style>
