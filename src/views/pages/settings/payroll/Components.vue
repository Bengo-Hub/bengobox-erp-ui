<script setup>
import { payrollService } from '@/services/hrm/payrollService';
import { ref } from 'vue';

const category = ref(null);
const categories = [
    { label: 'Earnings', value: 'Earnings' },
    { label: 'Benefits', value: 'Benefits' },
    { label: 'Deductions', value: 'Deductions' },
    { label: 'Loans', value: 'Loans' },
    { label: 'Basic Pay', value: 'BasicPay' }
];

const items = ref([]);
const payrollComponents = ref([]);

const fetchComponents = async () => {
    if (!category.value) {
        items.value = [];
        return;
    }
    try {
        const response = await payrollService.listPayrollComponents({ category: category.value });
        items.value = response.data;
    } catch (error) {
        console.error('Error fetching payroll components:', error);
    }
};
</script>

<template>
    <div class="card p-4">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Payroll Components</h2>
            <div class="flex gap-2">
                <Dropdown v-model="category" :options="categories" optionLabel="label" optionValue="value" placeholder="Category" class="w-56" />
                <Button label="Load" icon="pi pi-download" @click="fetchComponents" />
            </div>
        </div>

        <DataTable :value="items" :paginator="true" :rows="10" :rowsPerPageOptions="[10, 25, 50]">
            <Column header="#">
                <template #body="{ index }">{{ index + 1 }}</template>
            </Column>
            <Column field="component.title" header="Title" />
            <Column field="component.mode" header="Mode" />
            <Column field="component.checkoff" header="Checkoff" />
            <Column field="component.statutory" header="Statutory" />
        </DataTable>
    </div>
</template>
