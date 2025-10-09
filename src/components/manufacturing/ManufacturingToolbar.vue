<script setup>
import { defineProps } from 'vue';

defineProps({
    title: { type: String, required: true },
    icon: { type: String, required: true }
});
</script>

<template>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-md">
        <!-- Title + Icon -->
        <div class="flex items-center space-x-2">
            <i :class="`${icon} text-2xl text-indigo-600`"></i>
            <h2 class="text-xl font-semibold text-gray-800">{{ title }}</h2>
        </div>

        <!-- Actions Slot -->
        <div class="flex flex-wrap items-center gap-3">
            <slot name="actions" />
        </div>
    </div>
</template>
