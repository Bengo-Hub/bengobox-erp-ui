<script setup>
import { employeeService } from '@/services/hrm/employeeService';
import { onMounted, ref } from 'vue';

const shifts = ref([]);
const loading = ref(false);
const showDialog = ref(false);
const saving = ref(false);
const form = ref({ name: '', start_time: '', end_time: '' });

const fetchShifts = async () => {
    loading.value = true;
    try {
        const { data } = await employeeService.listWorkShifts();
        shifts.value = data.results || data;
    } finally {
        loading.value = false;
    }
};

const openCreate = () => {
    form.value = { name: '', start_time: '', end_time: '' };
    showDialog.value = true;
};

const createShift = async () => {
    saving.value = true;
    try {
        await employeeService.createWorkShift(form.value);
        showDialog.value = false;
        await fetchShifts();
    } finally {
        saving.value = false;
    }
};

onMounted(fetchShifts);
</script>

<template>
    <div class="p-4">
        <div class="flex items-center justify-between mb-3">
            <h2 class="text-xl font-semibold">Work Shifts</h2>
            <Button label="New Shift" icon="pi pi-plus" @click="openCreate" />
        </div>
        <DataTable :value="shifts" :loading="loading" dataKey="id" class="w-full">
            <Column field="name" header="Name" />
            <Column field="start_time" header="Start" />
            <Column field="end_time" header="End" />
        </DataTable>

        <Dialog v-model:visible="showDialog" header="Create Work Shift" :modal="true" :style="{ width: '28rem' }">
            <div class="space-y-3">
                <div>
                    <label class="block mb-1">Name</label>
                    <InputText v-model="form.name" class="w-full" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block mb-1">Start Time (HH:MM:SS)</label>
                        <InputText v-model="form.start_time" class="w-full" />
                    </div>
                    <div>
                        <label class="block mb-1">End Time (HH:MM:SS)</label>
                        <InputText v-model="form.end_time" class="w-full" />
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="Cancel" class="p-button-text" @click="showDialog = false" />
                <Button label="Create" @click="createShift" :loading="saving" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped></style>
