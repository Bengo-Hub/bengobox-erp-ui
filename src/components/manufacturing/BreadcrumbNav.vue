<script setup>
import { defineProps } from 'vue';

const props = defineProps({
    items: {
        type: Array,
        required: true
    }
});

const home = { icon: 'pi pi-home', to: '/' };
</script>

<template>
    <div class="mb-3">
        <Breadcrumb :model="items" :home="home" />
    </div>
</template>
