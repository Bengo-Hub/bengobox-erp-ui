<script>
export default {
    props: {
        msg: {
            type: String,
            required: true
        }
    }
};
</script>

<template>
    <h1>{{ msg }}</h1>
</template>
