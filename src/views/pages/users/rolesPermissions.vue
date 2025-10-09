<script setup>
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/userManagementService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const loading = ref(false);
const roles = ref([]);
const permissions = ref([]);
const roleDialog = ref(false);
const permissionDialog = ref(false);
const deleteRoleDialog = ref(false);
const deletePermissionDialog = ref(false);
const role = ref({});
const permission = ref({});
const submitted = ref(false);
const selectedRole = ref(null);
const selectedPermission = ref(null);
const filters = ref({
    global: { value: null, matchMode: 'contains' },
    name: { value: null, matchMode: 'contains' }
});

onMounted(async () => {
    await loadData();
});

const loadData = async () => {
    try {
        loading.value = true;
        const [rolesRes, permissionsRes] = await Promise.all([userManagementService.getRoles(), userManagementService.getPermissions()]);
        roles.value = rolesRes.data;
        permissions.value = permissionsRes.data;
    } catch (error) {
        showToast('error', 'Error', 'Failed to load data', 3000);
    } finally {
        loading.value = false;
    }
};

const showAddRoleDialog = () => {
    role.value = {
        name: '',
        permissions: []
    };
    submitted.value = false;
    roleDialog.value = true;
};

const hideRoleDialog = () => {
    roleDialog.value = false;
    submitted.value = false;
};

const saveRole = async () => {
    submitted.value = true;

    if (role.value.name) {
        try {
            if (role.value.id) {
                await userManagementService.updateRole(role.value.id, role.value);
                showToast('success', 'Success', 'Role updated successfully', 3000);
            } else {
                await userManagementService.createRole(role.value);
                showToast('success', 'Success', 'Role created successfully', 3000);
            }
            roleDialog.value = false;
            await loadData();
        } catch (error) {
            showToast('error', 'Error', 'Failed to save role', 3000);
        }
    }
};

const editRole = (roleData) => {
    role.value = { ...roleData };
    roleDialog.value = true;
};

const confirmDeleteRole = (roleData) => {
    role.value = roleData;
    deleteRoleDialog.value = true;
};

const deleteRole = async () => {
    try {
        await userManagementService.deleteRole(role.value.id);
        showToast('success', 'Success', 'Role deleted successfully', 3000);
        deleteRoleDialog.value = false;
        await loadData();
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete role', 3000);
    }
};

const showAddPermissionDialog = () => {
    permission.value = {
        name: '',
        codename: ''
    };
    submitted.value = false;
    permissionDialog.value = true;
};

const hidePermissionDialog = () => {
    permissionDialog.value = false;
    submitted.value = false;
};

const savePermission = async () => {
    submitted.value = true;

    if (permission.value.name && permission.value.codename) {
        try {
            if (permission.value.id) {
                await userManagementService.updatePermission(permission.value.id, permission.value);
                showToast('success', 'Success', 'Permission updated successfully', 3000);
            } else {
                await userManagementService.createPermission(permission.value);
                showToast('success', 'Success', 'Permission created successfully', 3000);
            }
            permissionDialog.value = false;
            await loadData();
        } catch (error) {
            showToast('error', 'Error', 'Failed to save permission', 3000);
        }
    }
};

const editPermission = (permissionData) => {
    permission.value = { ...permissionData };
    permissionDialog.value = true;
};

const confirmDeletePermission = (permissionData) => {
    permission.value = permissionData;
    deletePermissionDialog.value = true;
};

const deletePermission = async () => {
    try {
        await userManagementService.deletePermission(permission.value.id);
        showToast('success', 'Success', 'Permission deleted successfully', 3000);
        deletePermissionDialog.value = false;
        await loadData();
    } catch (error) {
        showToast('error', 'Error', 'Failed to delete permission', 3000);
    }
};
</script>

<template>
    <div class="p-4">
        <div class="mb-4">
            <Toolbar>
                <template #start>
                    <Button icon="pi pi-home" class="mr-2" severity="secondary" text @click="$router.push('/')" />
                    <Button icon="pi pi-arrow-left" class="mr-2" severity="secondary" text @click="$router.push('/hrm/users')" />
                    <Button label="Roles & Permissions" severity="primary" text />
                </template>
                <template #end>
                    <Button label="Add Role" icon="pi pi-plus" class="mr-2" @click="showAddRoleDialog" />
                    <Button label="Add Permission" icon="pi pi-plus" @click="showAddPermissionDialog" />
                </template>
            </Toolbar>
        </div>

        <div class="grid">
            <!-- Roles Section -->
            <div class="col-12 md:col-6">
                <Card>
                    <template #title>Roles</template>
                    <template #content>
                        <DataTable
                            :value="roles"
                            :loading="loading"
                            :paginator="true"
                            :rows="10"
                            :rowsPerPageOptions="[5, 10, 20, 50]"
                            :filters="filters"
                            filterDisplay="row"
                            v-model:selection="selectedRole"
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

                            <Column field="name" header="Name" sortable filter>
                                <template #body="{ data }">
                                    {{ data.name }}
                                </template>
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" class="p-column-filter" placeholder="Search by name" />
                                </template>
                            </Column>

                            <Column field="permissions" header="Permissions">
                                <template #body="{ data }">
                                    <Chip v-for="permission in data.permissions" :key="permission.id" :label="permission.name" class="mr-2" />
                                </template>
                            </Column>

                            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-text mr-2" @click="editRole(data)" />
                                    <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="confirmDeleteRole(data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>

            <!-- Permissions Section -->
            <div class="col-12 md:col-6">
                <Card>
                    <template #title>Permissions</template>
                    <template #content>
                        <DataTable
                            :value="permissions"
                            :loading="loading"
                            :paginator="true"
                            :rows="10"
                            :rowsPerPageOptions="[5, 10, 20, 50]"
                            :filters="filters"
                            filterDisplay="row"
                            v-model:selection="selectedPermission"
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

                            <Column field="name" header="Name" sortable filter>
                                <template #body="{ data }">
                                    {{ data.name }}
                                </template>
                                <template #filter="{ filterModel, filterCallback }">
                                    <InputText v-model="filterModel.value" type="text" @input="filterCallback()" class="p-column-filter" placeholder="Search by name" />
                                </template>
                            </Column>

                            <Column field="codename" header="Code" sortable>
                                <template #body="{ data }">
                                    {{ data.codename }}
                                </template>
                            </Column>

                            <Column header="Actions" :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-pencil" class="p-button-rounded p-button-text mr-2" @click="editPermission(data)" />
                                    <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="confirmDeletePermission(data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Add/Edit Role Dialog -->
        <Dialog v-model:visible="roleDialog" :style="{ width: '450px' }" header="Role Details" :modal="true" class="p-fluid">
            <div class="field">
                <label for="name" class="font-bold">Name</label>
                <InputText id="name" v-model.trim="role.name" required autofocus :class="{ 'p-invalid': submitted && !role.name }" />
                <small class="p-error" v-if="submitted && !role.name">Name is required.</small>
            </div>
            <div class="field">
                <label for="permissions" class="font-bold">Permissions</label>
                <MultiSelect id="permissions" v-model="role.permissions" :options="permissions" optionLabel="name" optionValue="id" placeholder="Select Permissions" />
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hideRoleDialog" />
                <Button label="Save" icon="pi pi-check" class="p-button-text" @click="saveRole" />
            </template>
        </Dialog>

        <!-- Add/Edit Permission Dialog -->
        <Dialog v-model:visible="permissionDialog" :style="{ width: '450px' }" header="Permission Details" :modal="true" class="p-fluid">
            <div class="field">
                <label for="name" class="font-bold">Name</label>
                <InputText id="name" v-model.trim="permission.name" required autofocus :class="{ 'p-invalid': submitted && !permission.name }" />
                <small class="p-error" v-if="submitted && !permission.name">Name is required.</small>
            </div>
            <div class="field">
                <label for="codename" class="font-bold">Code</label>
                <InputText id="codename" v-model.trim="permission.codename" required :class="{ 'p-invalid': submitted && !permission.codename }" />
                <small class="p-error" v-if="submitted && !permission.codename">Code is required.</small>
            </div>

            <template #footer>
                <Button label="Cancel" icon="pi pi-times" class="p-button-text" @click="hidePermissionDialog" />
                <Button label="Save" icon="pi pi-check" class="p-button-text" @click="savePermission" />
            </template>
        </Dialog>

        <!-- Delete Role Dialog -->
        <Dialog v-model:visible="deleteRoleDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="role"
                    >Are you sure you want to delete <b>{{ role.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteRoleDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-text p-button-danger" @click="deleteRole" />
            </template>
        </Dialog>

        <!-- Delete Permission Dialog -->
        <Dialog v-model:visible="deletePermissionDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="permission"
                    >Are you sure you want to delete <b>{{ permission.name }}</b
                    >?</span
                >
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deletePermissionDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-text p-button-danger" @click="deletePermission" />
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
