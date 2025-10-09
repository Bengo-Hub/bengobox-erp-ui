<script setup>
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/userManagementService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const users = ref([]);
const roles = ref([]);
const userDialog = ref(false);
const deleteUserDialog = ref(false);
const resetPasswordDialog = ref(false);
const user = ref({});
const submitted = ref(false);
const selectedUsers = ref(null);
const filters = ref({
    global: { value: null, matchMode: 'contains' },
    username: { value: null, matchMode: 'contains' },
    email: { value: null, matchMode: 'contains' }
});

onMounted(async () => {
    await loadData();
});

const loadData = async () => {
    try {
        loading.value = true;
        const [usersRes, rolesRes] = await Promise.all([userManagementService.getUsers(), userManagementService.getRoles()]);
        users.value = usersRes.data;
        roles.value = rolesRes.data;
    } catch (error) {
        showToast('error', 'Error', 'Failed to load data', 3000);
    } finally {
        loading.value = false;
    }
};

const showAddUserDialog = () => {
    user.value = {
        username: '',
        email: '',
        password: '',
        roles: [],
        is_active: true
    };
    submitted.value = false;
    userDialog.value = true;
};

const hideDialog = () => {
    userDialog.value = false;
    submitted.value = false;
};

const saveUser = async () => {
    submitted.value = true;

    if (user.value.username && user.value.email && user.value.password) {
        try {
            if (user.value.id) {
                await userManagementService.updateUser(user.value.id, user.value);
                showToast('success', 'Success', 'User updated successfully', 3000);
            } else {
                await userManagementService.createUser(user.value);
                showToast('success', 'Success', 'User created successfully', 3000);
            }
            userDialog.value = false;
            await loadData();
        } catch (error) {
            showToast('error', 'Error', 'Failed to save user', 3000);
        }
    }
};

const editUser = (userData) => {
    user.value = { ...userData };
    userDialog.value = true;
};

const confirmDeleteUser = (userData) => {
    user.value = userData;
    deleteUserDialog.value = true;
};

const deleteUser = async () => {
    try {
        await userManagementService.deleteUser(user.value.id);
        showToast('success', 'Success', 'User deleted successfully', 3000);
        deleteUserDialog.value = false;
        await loadData();
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete user', 3000);
    }
};

const resetPassword = (userData) => {
    user.value = userData;
    resetPasswordDialog.value = true;
};

const confirmResetPassword = async () => {
    try {
        await userManagementService.resetPassword(user.value.id);
        showToast('success', 'Success', 'Password reset successfully', 3000);
        resetPasswordDialog.value = false;
    } catch (error) {
        showToast('error', 'Error', 'Failed to reset password', 3000);
    }
};

const toggleUserStatus = async (userData) => {
    try {
        if (userData.is_active) {
            await userManagementService.deactivateUser(userData.id);
        } else {
            await userManagementService.activateUser(userData.id);
        }
        showToast('success', 'Success', `User ${userData.is_active ? 'deactivated' : 'activated'} successfully`, 3000);
        await loadData();
    } catch (error) {
        showToast('error', 'Error', 'Failed to update user status', 3000);
    }
};
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-2" severity="secondary" text @click="$router.push('/')" />
                    <Button icon="pi pi-arrow-left" class="mr-2" severity="secondary" text @click="$router.push('/hrm')" />
                    <Button label="User Management" severity="primary" text />
                </template>
                <template #end>
                    <Button label="Add User" icon="pi pi-plus" @click="showAddUserDialog" />
                </template>
            </Toolbar>
        </div>

        <div class="grid">
            <div class="col-12">
                <Card>
                    <template #title>Users</template>
                    <template #content>
                        <DataTable
                            :value="users"
                            :loading="loading"
                            :paginator="true"
                            :rows="10"
                            :rowsPerPageOptions="[5, 10, 20, 50]"
                            :filters="filters"
                            filterDisplay="row"
                            v-model:selection="selectedUsers"
                            selectionMode="single"
                            dataKey="id"
                            responsiveLayout="scroll"
                        >
                            <template #header>
                                <div class="flex justify-content-between">
                                    <span class="p-input-icon-left">
                                        <i class="pi pi-search" />
                                        <InputText v-model="filters['global'].value" placeholder="Search..." />
                                    </span>
                                </div>
                            </template>

                            <Column field="username" header="Username" sortable filter>
                                <template #body="{ data }">
                                    {{ data.username }}
                                </template>
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" class="p-column-filter" placeholder="Search by username" />
                                </template>
                            </Column>

                            <Column field="email" header="Email" sortable filter>
                                <template #body="{ data }">
                                    {{ data.email }}
                                </template>
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" class="p-column-filter" placeholder="Search by email" />
                                </template>
                            </Column>

                            <Column field="is_active" header="Status" sortable>
                                <template #body="{ data }">
                                    <Tag :severity="data.is_active ? 'success' : 'danger'" :value="data.is_active ? 'Active' : 'Inactive'" />
                                </template>
                            </Column>

                            <Column field="roles" header="Roles" sortable>
                                <template #body="{ data }">
                                    <Chip v-for="role in data.roles" :key="role.id" :label="role.name" class="mr-2" />
                                </template>
                            </Column>

                            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-text mr-2" @click="editUser(data)" />
                                    <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger mr-2" @click="confirmDeleteUser(data)" />
                                    <Button icon="pi pi-key" class="p-button-rounded p-button-text p-button-warning mr-2" @click="resetPassword(data)" />
                                    <Button :icon="data.is_active ? 'pi pi-ban' : 'pi pi-check'" class="p-button-rounded p-button-text" :class="data.is_active ? 'p-button-danger' : 'p-button-success'" @click="toggleUserStatus(data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Add/Edit User Dialog -->
        <Dialog v-model:visible="userDialog" :style="{ width: '450px' }" header="User Details" :modal="true" class="p-fluid">
            <div class="field">
                <label for="username" class="font-bold">Username</label>
                <InputText id="username" v-model.trim="user.username" required autofocus :class="{ 'p-invalid': submitted && !user.username }" />
                <small class="p-error" v-if="submitted && !user.username">Username is required.</small>
            </div>
            <div class="field">
                <label for="email" class="font-bold">Email</label>
                <InputText id="email" v-model.trim="user.email" required :class="{ 'p-invalid': submitted && !user.email }" />
                <small class="p-error" v-if="submitted && !user.email">Email is required.</small>
            </div>
            <div class="field">
                <label for="password" class="font-bold">Password</label>
                <Password id="password" v-model="user.password" :toggleMask="true" :class="{ 'p-invalid': submitted && !user.password }" />
                <small class="p-error" v-if="submitted && !user.password">Password is required.</small>
            </div>
            <div class="field">
                <label for="roles" class="font-bold">Roles</label>
                <MultiSelect id="roles" v-model="user.roles" :options="roles" optionLabel="name" optionValue="id" placeholder="Select Roles" />
            </div>
            <div class="field">
                <label for="is_active" class="font-bold">Status</label>
                <InputSwitch id="is_active" v-model="user.is_active" />
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideDialog" />
                <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveUser" />
            </template>
        </Dialog>

        <!-- Delete User Dialog -->
        <Dialog v-model:visible="deleteUserDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="user"
                    >Are you sure you want to delete <b>{{ user.username }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteUserDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-text p-button-danger" @click="deleteUser" />
            </template>
        </Dialog>

        <!-- Reset Password Dialog -->
        <Dialog v-model:visible="resetPasswordDialog" :style="{ width: '450px' }" header="Reset Password" :modal="true">
            <div class="confirmation-content">
                <span v-if="user"
                    >Are you sure you want to reset password for <b>{{ user.username }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="resetPasswordDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-text p-button-warning" @click="confirmResetPassword" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.p-datatable .p-column-header-content {
    justify-content: center;
}

.p-datatable .p-datatable-tbody > tr > td {
    text-align: center;
}

.p-datatable .p-datatable-tbody > tr > td:last-child {
    text-align: center;
}
</style>
