<script setup>
import { useToast } from '@/composables/useToast';
import { userManagementService } from '@/services/userManagementService';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import { computed, onMounted, ref } from 'vue';

const { showToast } = useToast();
const loading = ref(false);

// Backup List
const backups = ref([]);
const selectedBackup = ref(null);
const backupFilter = ref('');
const deleteBackupDialog = ref(false);

// Backup Configuration
const backupConfig = ref({
    storage_type: 'local',
    local_path: '',
    s3_bucket: '',
    s3_region: '',
    s3_access_key: '',
    s3_secret_key: '',
    retention_days: 30
});

const storageTypes = [
    { label: 'Local Storage', value: 'local' },
    { label: 'Amazon S3', value: 's3' }
];

// Backup Schedule
const backupSchedule = ref({
    frequency: 'daily',
    cron_expression: '',
    is_active: true,
    last_run: null,
    next_run: null
});

const frequencies = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Custom', value: 'custom' }
];

const isValidCron = computed(() => {
    if (backupSchedule.value.frequency !== 'custom') return true;
    // Basic cron validation - you might want to use a proper cron validation library
    return /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])) (\*|([0-6]))$/.test(backupSchedule.value.cron_expression);
});

const loadData = async () => {
    loading.value = true;
    try {
        const [backupsRes, configRes, scheduleRes] = await Promise.all([userManagementService.getBackups(), userManagementService.getBackupConfig(), userManagementService.getBackupSchedule()]);

        backups.value = backupsRes.data;
        backupConfig.value = configRes.data;
        backupSchedule.value = scheduleRes.data;
    } catch (error) {
        showToast('error', 'Failed to load backup data');
    } finally {
        loading.value = false;
    }
};

const createBackup = async (type) => {
    try {
        await userManagementService.createBackup(type);
        showToast('success', 'Backup creation started');
        await loadData();
    } catch (error) {
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create backup',
            life: 3000
        });
    }
};

const downloadBackup = async (backup) => {
    try {
        const response = await userManagementService.downloadBackup(backup.id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `backup_${backup.id}.sql`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to download backup',
            life: 3000
        });
    }
};

const restoreBackup = async (backup) => {
    try {
        await userManagementService.restoreBackup(backup.id);
        showToast({
            severity: 'success',
            summary: 'Success',
            detail: 'Backup restoration started',
            life: 3000
        });
    } catch (error) {
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to restore backup',
            life: 3000
        });
    }
};

const confirmDeleteBackup = (backup) => {
    selectedBackup.value = backup;
    deleteBackupDialog.value = true;
};

const deleteBackup = async () => {
    try {
        await userManagementService.deleteBackup(selectedBackup.value.id);
        deleteBackupDialog.value = false;
        await loadData();
        showToast({
            severity: 'success',
            summary: 'Success',
            detail: 'Backup deleted successfully',
            life: 3000
        });
    } catch (error) {
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete backup',
            life: 3000
        });
    }
};

const saveBackupConfig = async () => {
    try {
        await userManagementService.updateBackupConfig(backupConfig.value);
        showToast({
            severity: 'success',
            summary: 'Success',
            detail: 'Backup configuration updated successfully',
            life: 3000
        });
    } catch (error) {
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update backup configuration',
            life: 3000
        });
    }
};

const saveBackupSchedule = async () => {
    if (backupSchedule.value.frequency === 'custom' && !isValidCron.value) {
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Invalid cron expression',
            life: 3000
        });
        return;
    }

    try {
        await userManagementService.updateBackupSchedule(backupSchedule.value);
        showToast({
            severity: 'success',
            summary: 'Success',
            detail: 'Backup schedule updated successfully',
            life: 3000
        });
        await loadData();
    } catch (error) {
        showToast({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update backup schedule',
            life: 3000
        });
    }
};

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getStatusSeverity = (status) => {
    switch (status) {
        case 'completed':
            return 'success';
        case 'in_progress':
            return 'info';
        case 'failed':
            return 'danger';
        default:
            return 'warning';
    }
};

onMounted(() => {
    loadData();
});
</script>

<template>
    <div class="backups">
        <div class="grid">
            <!-- Backup List -->
            <div class="col-12">
                <Card>
                    <template #title>Backup List</template>
                    <template #content>
                        <DataTable :value="backups" :paginator="true" :rows="10" v-model:selection="selectedBackup" selectionMode="single" dataKey="id">
                            <template #header>
                                <div class="flex justify-content-between">
                                    <div class="flex gap-2">
                                        <Button label="Create Full Backup" icon="pi pi-plus" @click="createBackup('full')" />
                                        <Button label="Create Incremental Backup" icon="pi pi-plus" @click="createBackup('incremental')" />
                                    </div>
                                    <span class="p-input-icon-left">
                                        <i class="pi pi-search" />
                                        <InputText v-model="backupFilter" placeholder="Search backups..." />
                                    </span>
                                </div>
                            </template>

                            <Column field="created_at" header="Date" sortable>
                                <template #body="{ data }">
                                    {{ new Date(data.created_at).toLocaleString() }}
                                </template>
                            </Column>
                            <Column field="type" header="Type" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.type" :severity="data.type === 'full' ? 'success' : 'info'" />
                                </template>
                            </Column>
                            <Column field="size" header="Size" sortable>
                                <template #body="{ data }">
                                    {{ formatFileSize(data.size) }}
                                </template>
                            </Column>
                            <Column field="status" header="Status" sortable>
                                <template #body="{ data }">
                                    <Tag :value="data.status" :severity="getStatusSeverity(data.status)" />
                                </template>
                            </Column>
                            <Column :exportable="false" style="min-width: 8rem">
                                <template #body="{ data }">
                                    <Button icon="pi pi-download" class="p-button-text" @click="downloadBackup(data)" :disabled="data.status !== 'completed'" />
                                    <Button icon="pi pi-refresh" class="p-button-text" @click="restoreBackup(data)" :disabled="data.status !== 'completed'" />
                                    <Button icon="pi pi-trash" class="p-button-text p-button-danger" @click="confirmDeleteBackup(data)" />
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>

            <!-- Backup Configuration -->
            <div class="col-12 md:col-6">
                <Card>
                    <template #title>Backup Configuration</template>
                    <template #content>
                        <form @submit.prevent="saveBackupConfig" class="p-fluid">
                            <div class="field">
                                <label for="storageType">Storage Type</label>
                                <Dropdown v-model="backupConfig.storage_type" :options="storageTypes" optionLabel="label" optionValue="value" placeholder="Select Storage Type" />
                            </div>

                            <template v-if="backupConfig.storage_type === 'local'">
                                <div class="field">
                                    <label for="localPath">Local Path</label>
                                    <InputText v-model="backupConfig.local_path" id="localPath" />
                                </div>
                            </template>

                            <template v-if="backupConfig.storage_type === 's3'">
                                <div class="field">
                                    <label for="s3Bucket">S3 Bucket</label>
                                    <InputText v-model="backupConfig.s3_bucket" id="s3Bucket" />
                                </div>
                                <div class="field">
                                    <label for="s3Region">S3 Region</label>
                                    <InputText v-model="backupConfig.s3_region" id="s3Region" />
                                </div>
                                <div class="field">
                                    <label for="s3AccessKey">S3 Access Key</label>
                                    <InputText v-model="backupConfig.s3_access_key" id="s3AccessKey" type="password" />
                                </div>
                                <div class="field">
                                    <label for="s3SecretKey">S3 Secret Key</label>
                                    <InputText v-model="backupConfig.s3_secret_key" id="s3SecretKey" type="password" />
                                </div>
                            </template>

                            <div class="field">
                                <label for="retentionDays">Retention Period (days)</label>
                                <InputNumber v-model="backupConfig.retention_days" id="retentionDays" :min="1" :max="365" />
                            </div>

                            <Button type="submit" label="Save Configuration" class="mt-3" />
                        </form>
                    </template>
                </Card>
            </div>

            <!-- Backup Schedule -->
            <div class="col-12 md:col-6">
                <Card>
                    <template #title>Backup Schedule</template>
                    <template #content>
                        <form @submit.prevent="saveBackupSchedule" class="p-fluid">
                            <div class="field">
                                <label for="frequency">Frequency</label>
                                <Dropdown v-model="backupSchedule.frequency" :options="frequencies" optionLabel="label" optionValue="value" placeholder="Select Frequency" />
                            </div>

                            <div class="field" v-if="backupSchedule.frequency === 'custom'">
                                <label for="cronExpression">Cron Expression</label>
                                <InputText v-model="backupSchedule.cron_expression" id="cronExpression" placeholder="e.g., 0 0 * * *" />
                                <small class="p-error" v-if="!isValidCron">Invalid cron expression</small>
                            </div>

                            <div class="field-checkbox">
                                <Checkbox v-model="backupSchedule.is_active" id="isActive" />
                                <label for="isActive">Enable Schedule</label>
                            </div>

                            <div class="field" v-if="backupSchedule.last_run">
                                <label>Last Run</label>
                                <div>{{ new Date(backupSchedule.last_run).toLocaleString() }}</div>
                            </div>

                            <div class="field" v-if="backupSchedule.next_run">
                                <label>Next Run</label>
                                <div>{{ new Date(backupSchedule.next_run).toLocaleString() }}</div>
                            </div>

                            <Button type="submit" label="Save Schedule" class="mt-3" />
                        </form>
                    </template>
                </Card>
            </div>
        </div>

        <!-- Delete Backup Dialog -->
        <Dialog v-model:visible="deleteBackupDialog" :style="{ width: '450px' }" header="Confirm" :modal="true">
            <div class="confirmation-content">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="selectedBackup">Are you sure you want to delete this backup?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" class="p-button-text" @click="deleteBackupDialog = false" />
                <Button label="Yes" icon="pi pi-check" class="p-button-danger" @click="deleteBackup" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.backups {
    padding: 1rem;
}

.field {
    margin-bottom: 1rem;
}

.field-checkbox {
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
}

.field-checkbox label {
    margin-left: 0.5rem;
}
</style>
