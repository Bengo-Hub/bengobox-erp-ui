<script setup>
import { formatCurrency } from '@/utils/formatters';
import { ref, watch } from 'vue';

const props = defineProps(['items']);
const emit = defineEmits(['update']);

const items = ref([...props.items]);

const addItem = () => {
    items.value.push({
        stockItem: null,
        quantity: 1,
        unitPrice: 0
    });
    emitUpdate();
};

const removeItem = (index) => {
    items.value.splice(index, 1);
    emitUpdate();
};

const emitUpdate = () => {
    emit('update', items.value);
};

watch(items, () => emitUpdate(), { deep: true });
</script>

<template>
    <DataTable :value="items" class="p-datatable-sm">
        <Column header="Item">
            <template #body="{ data, index }">
                <ItemSelector v-model="items[index].stockItem" />
            </template>
        </Column>
        <Column header="Quantity">
            <template #body="{ data, index }">
                <InputNumber v-model="items[index].quantity" :min="1" />
            </template>
        </Column>
        <Column header="Unit Price">
            <template #body="{ data, index }">
                <InputNumber v-model="items[index].unitPrice" mode="currency" currency="USD" />
            </template>
        </Column>
        <Column header="Total">
            <template #body="{ data }">
                {{ formatCurrency(data.quantity * data.unitPrice) }}
            </template>
        </Column>
        <Column header="Actions">
            <template #body="{ index }">
                <Button icon="pi pi-trash" class="p-button-danger p-button-text" @click="removeItem(index)" />
            </template>
        </Column>
        <template #footer>
            <Button icon="pi pi-plus" label="Add Item" @click="addItem" />
        </template>
    </DataTable>
</template>
