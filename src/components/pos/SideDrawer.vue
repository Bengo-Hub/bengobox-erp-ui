<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
    modelValue: {
        type: Boolean,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    position: {
        type: String,
        default: 'right'
    },
    width: {
        type: String,
        default: '30rem'
    }
});

defineEmits(['update:modelValue']);
</script>

<template>
    <Sidebar :visible="modelValue" :position="position" :style="{ width: width }" @update:visible="$emit('update:modelValue', $event)" class="p-sidebar-lg">
        <template #header>
            <div class="flex justify-between items-center w-full">
                <h3 class="text-xl font-semibold">{{ title }}</h3>
                <Button icon="pi pi-times" class="p-button-rounded p-button-text" @click="$emit('update:modelValue', false)" />
            </div>
        </template>

        <div class="p-4">
            <slot></slot>
        </div>

        <template #footer>
            <slot name="footer"></slot>
        </template>
    </Sidebar>
</template>

<style scoped>
:deep(.p-sidebar-header) {
    padding: 1rem;
    border-bottom: 1px solid var(--surface-border);
}

:deep(.p-sidebar-content) {
    padding: 0;
}

:deep(.p-sidebar-footer) {
    padding: 1rem;
    border-top: 1px solid var(--surface-border);
}
</style>
