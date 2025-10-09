<!-- src/components/procurement/POStatusBadge.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: String
});

const statusSeverity = computed(() => {
    return (
        {
            draft: 'warning',
            procurement_approved: 'info',
            finance_approved: 'success',
            rejected: 'danger'
        }[props.status] || 'info'
    );
});

const statusIcon = computed(() => {
    return {
        draft: 'pi pi-pencil',
        procurement_approved: 'pi pi-check',
        finance_approved: 'pi pi-check-circle',
        rejected: 'pi pi-times-circle'
    }[props.status];
});
</script>

<template>
    <Tag :value="status" :severity="statusSeverity" :icon="statusIcon" />
</template>
