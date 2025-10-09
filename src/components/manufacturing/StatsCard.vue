<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    title: { type: String, required: true },
    value: { type: [String, Number], required: true },
    icon: { type: String, required: true },
    iconBgClass: { type: String, default: 'bg-indigo-50' },
    iconColorClass: { type: String, default: 'text-indigo-600' }
});
</script>

<template>
    <div class="bg-white p-5 rounded-2xl h-full flex flex-col justify-between shadow-sm hover:shadow-lg transition-shadow duration-200">
        <!-- Header: Title + Value + Icon -->
        <div class="flex justify-between items-center mb-4">
            <div>
                <h3 class="text-sm text-gray-500 font-medium">{{ title }}</h3>
                <p class="text-2xl font-bold text-gray-900">{{ value }}</p>
            </div>
            <div :class="iconBgClass" class="flex items-center justify-center w-12 h-12 rounded-lg">
                <i :class="`${icon} text-xl ${iconColorClass}`"></i>
            </div>
        </div>

        <!-- Slot for subtitle / extra info -->
        <div class="text-sm text-gray-500">
            <slot />
        </div>
    </div>
</template>
