<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
    approvalSteps: Array,
    currentStage: String,
    userRole: String
});

const emit = defineEmits(['approve']);

const comments = ref('');

const showApprovalActions = computed(() => {
    return props.userRole === 'approver' && props.currentStage === 'pending';
});

const approve = (status) => {
    emit('approve', { status, comments: comments.value });
};

const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
};

const statusSeverity = (status) => {
    switch (status) {
        case 'approved':
            return 'success';
        case 'rejected':
            return 'danger';
        default:
            return 'info';
    }
};
</script>

<template>
    <div class="approval-workflow">
        <Timeline :value="approvalSteps" align="alternate">
            <template #content="{ item }">
                <Card>
                    <template #title>{{ item.stage }}</template>
                    <template #subtitle>{{ formatDate(item.date) }}</template>
                    <template #content>
                        <p>{{ item.notes }}</p>
                        <div class="flex gap-2 mt-3">
                            <Tag :value="item.status" :severity="statusSeverity(item.status)" />
                            <span v-if="item.approver">by {{ item.approver.name }}</span>
                        </div>
                    </template>
                </Card>
            </template>
        </Timeline>

        <div v-if="showApprovalActions">
            <Card>
                <template #title>Approval Actions</template>
                <template #content>
                    <div class="field">
                        <label>Comments</label>
                        <Textarea v-model="comments" rows="3" />
                    </div>
                    <div class="flex gap-2 mt-4">
                        <Button label="Approve" severity="success" @click="approve('approved')" />
                        <Button label="Reject" severity="danger" @click="approve('rejected')" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.approval-workflow {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}
</style>
