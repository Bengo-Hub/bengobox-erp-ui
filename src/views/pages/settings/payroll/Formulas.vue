<script setup>
import { payrollService } from '@/services/hrm/payrollService';
import { useToast } from '@/composables/useToast';
import { onMounted, ref } from 'vue';

const formulas = ref([]);
const filters = ref({ type: null, category: null, effective_date: null });

const typeOptions = [
    { label: 'Income Tax', value: 'income' },
    { label: 'Deduction', value: 'deduction' },
    { label: 'Levy', value: 'levy' },
    { label: 'FBT', value: 'fbt' }
];
const categoryOptions = [
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Housing Levy', value: 'housing_levy' },
    { label: 'Social Security Fund', value: 'social_security_fund' }
];

const { showToast } = useToast();
const loading = ref(false);
const fetchFormulas = async () => {
    const params = {};
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.category) params.category = filters.value.category;
    if (filters.value.effective_date) params.effective_date = filters.value.effective_date;
    loading.value = true;
    try {
        const { data } = await payrollService.listFormulas(params);
        formulas.value = data;
    } catch (error) {
        showToast('error', 'Failed to load formulas', error?.response?.data?.detail || error.message, 5000);
    } finally {
        loading.value = false;
    }
};

onMounted(fetchFormulas);
</script>

<template>
    <div class="card p-4">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Payroll Formulas</h2>
            <div class="flex gap-2">
                <Dropdown v-model="filters.type" :options="typeOptions" optionLabel="label" optionValue="value" placeholder="Type" class="w-40" />
                <Dropdown v-model="filters.category" :options="categoryOptions" optionLabel="label" optionValue="value" placeholder="Category" class="w-56" />
                <Calendar v-model="filters.effective_date" dateFormat="yy-mm-dd" placeholder="Effective Date" :showIcon="true" />
                <Button label="Filter" icon="pi pi-filter" @click="fetchFormulas" />
            </div>
        </div>

        <DataTable :value="formulas" :paginator="true" :rows="10" :rowsPerPageOptions="[10, 25, 50]">
            <Column field="title" header="Title" />
            <Column field="type" header="Type" />
            <Column field="category" header="Category" />
            <Column field="effective_from" header="Effective From" />
            <Column field="effective_to" header="Effective To" />
            <Column field="is_current" header="Current">
                <template #body="{ data }">
                    <Tag :value="data.is_current ? 'Yes' : 'No'" :severity="data.is_current ? 'success' : 'secondary'" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
