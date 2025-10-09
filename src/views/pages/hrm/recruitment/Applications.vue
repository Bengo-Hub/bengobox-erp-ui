<script setup>
import { useToast } from '@/composables/useToast';
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';

const { showToast } = useToast();

const applications = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ job: '', candidate: '', status: 'applied' });

const fetchApplications = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listApplications();
        applications.value = data.results || data;
    } catch (error) {
        showToast('error', 'Error', 'Failed to load applications', 3000);
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    form.value = { job: '', candidate: '', status: 'applied' };
    showDialog.value = true;
};

const createApplication = async () => {
    if (!form.value.job || !form.value.candidate) {
        showToast('warning', 'Warning', 'Job and candidate are required', 3000);
        return;
    }
    
    saving.value = true;
    try {
        await employeeService.createApplication(form.value);
        showDialog.value = false;
        showToast('success', 'Success', 'Application created successfully', 3000);
        await fetchApplications();
    } catch (error) {
        showToast('error', 'Error', error?.response?.data?.detail || error.message || 'Failed to create application', 3000);
    } finally {
        saving.value = false;
    }
};

onMounted(() => {
    fetchApplications();
});
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-semibold">Applications</h2>
            <Button label="New Application" icon="pi pi-plus" @click="openCreate" />
        </div>
        <DataTable :value="applications" :loading="loading" dataKey="id" class="w-full">
            <Column field="job" header="Job" />
            <Column field="candidate" header="Candidate" />
            <Column field="status" header="Status" />
        </DataTable>

        <Dialog v-model:visible="showDialog" header="Create Application" :modal="true" :style="{ width: '32rem' }">
            <div class="space-y-3">
                <div>
                    <label class="block mb-1">Job (ID)</label>
                    <InputText v-model="form.job" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Candidate (ID)</label>
                    <InputText v-model="form.candidate" class="w-full" />
                </div>
                <div>
                    <label class="block mb-1">Status</label>
                    <InputText v-model="form.status" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showDialog = false" />
                <Button label="Create" @click="createApplication" :loading="saving" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
