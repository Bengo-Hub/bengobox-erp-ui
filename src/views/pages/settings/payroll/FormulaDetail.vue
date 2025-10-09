<script setup>
import { useToast } from '@/composables/useToast';
import { payrollService } from '@/services/hrm/payrollService';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const { showToast } = useToast();
const route = useRoute();
const id = route.params.id;

const formula = ref(null);
const items = ref([]);
const split = ref({ employee_percentage: 0, employer_percentage: 0 });

const fetchFormulaData = async () => {
    try {
        const [formulasRes, itemsRes, splitRes] = await Promise.all([payrollService.getFormula(id), payrollService.getFormulaItems(id), payrollService.getFormulaSplitRatio(id)]);
        formula.value = formulasRes.data;
        items.value = itemsRes.data;
        split.value = splitRes.data;
    } catch (error) {
        console.error('Error fetching formula data:', error);
        showToast('error', 'Error', 'Failed to fetch formula data', 3000);
    }
};

const addRow = () => {
    items.value = items.value.concat([{ amount_from: 0, amount_to: 0, deduct_amount: 0, deduct_percentage: 0 }]);
};

const onCellEdit = ({ index, field, newValue }) => {
    items.value[index][field] = newValue;
};

const saveFormulaItems = async () => {
    try {
        await payrollService.createFormulaItems(id, items.value);
        showToast('success', 'Success', 'Formula items saved successfully!', 3000);
    } catch (error) {
        console.error('Error saving formula items:', error);
        showToast('error', 'Error', 'Failed to save formula items', 3000);
    }
};

const saveFormulaSplitRatio = async () => {
    try {
        await payrollService.createFormulaSplitRatio(id, split.value);
        showToast('success', 'Success', 'Formula split ratio saved successfully!', 3000);
    } catch (error) {
        console.error('Error saving formula split ratio:', error);
        showToast('error', 'Error', 'Failed to save formula split ratio', 3000);
    }
};

onMounted(fetchFormulaData);
</script>

<template>
    <div class="card p-4">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold">Edit Formula</h2>
            <div class="text-gray-600">{{ formula?.title }}</div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Type</label>
                <InputText v-model="formula.type" disabled class="w-full" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Category</label>
                <InputText v-model="formula.category" disabled class="w-full" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Personal Relief</label>
                <InputNumber v-model="formula.personal_relief" inputClass="w-full" :minFractionDigits="2" :maxFractionDigits="2" />
            </div>
        </div>

        <div class="mb-2 font-semibold">Split Ratio</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
                <label class="block text-sm font-medium text-gray-700">Employee %</label>
                <InputNumber v-model="split.employee_percentage" :minFractionDigits="2" :maxFractionDigits="2" inputClass="w-full" />
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Employer %</label>
                <InputNumber v-model="split.employer_percentage" :minFractionDigits="2" :maxFractionDigits="2" inputClass="w-full" />
            </div>
            <div class="md:col-span-2 flex gap-2">
                <Button label="Save Split" icon="pi pi-save" @click="saveFormulaSplitRatio" />
            </div>
        </div>

        <div class="mb-2 font-semibold">Brackets / Items</div>
        <DataTable :value="items" editMode="cell" @cell-edit-complete="onCellEdit" class="mb-3">
            <Column field="amount_from" header="Amount From" />
            <Column field="amount_to" header="Amount To" />
            <Column field="deduct_amount" header="Deduct Amount" />
            <Column field="deduct_percentage" header="Deduct %" />
        </DataTable>
        <div class="flex gap-2">
            <Button label="Add Row" icon="pi pi-plus" @click="addRow" />
            <Button label="Save Items" icon="pi pi-save" @click="saveFormulaItems" />
        </div>
    </div>
</template>
