import { useToast } from '@/composables/useToast';
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';

export function useTaskManager() {
    const { showToast, showSuccess, showError, showWarning, showInfo } = useToast();

    // WebSocket connection state
    const ws = ref(null);
    const isConnected = ref(false);
    const connectionStatus = ref('disconnected'); // disconnected, connecting, connected, error

    // Task management state
    const activeTasks = reactive(new Map());
    const taskHistory = ref([]);
    const maxHistorySize = 100;

    // WebSocket connection management
    const connectWebSocket = () => {
        if (ws.value && ws.value.readyState === WebSocket.OPEN) {
            return;
        }

        try {
            connectionStatus.value = 'connecting';

            // Get WebSocket URL from current location
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}/ws/payroll/`;

            ws.value = new WebSocket(wsUrl);

            ws.value.onopen = () => {
                isConnected.value = true;
                connectionStatus.value = 'connected';
                console.log('Payroll WebSocket connected');
                showInfo('Real-time task updates connected');
            };

            ws.value.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            ws.value.onclose = (event) => {
                isConnected.value = false;
                connectionStatus.value = 'disconnected';
                console.log('Payroll WebSocket disconnected:', event.code, event.reason);

                // Attempt to reconnect after 3 seconds
                setTimeout(() => {
                    if (connectionStatus.value === 'disconnected') {
                        connectWebSocket();
                    }
                }, 3000);
            };

            ws.value.onerror = (error) => {
                connectionStatus.value = 'error';
                console.error('Payroll WebSocket error:', error);
                showError('Real-time task updates connection error');
            };
        } catch (error) {
            connectionStatus.value = 'error';
            console.error('Error creating WebSocket connection:', error);
            showError('Failed to connect to real-time task updates');
        }
    };

    const disconnectWebSocket = () => {
        if (ws.value) {
            ws.value.close();
            ws.value = null;
        }
        isConnected.value = false;
        connectionStatus.value = 'disconnected';
    };

    // WebSocket message handling
    const handleWebSocketMessage = (data) => {
        const { type, task_id, ...eventData } = data;

        // Add to task history
        addToTaskHistory(data);

        switch (type) {
            case 'task_started':
                handleTaskStarted(eventData);
                break;
            case 'task_progress':
                handleTaskProgress(eventData);
                break;
            case 'task_completed':
                handleTaskCompleted(eventData);
                break;
            case 'task_failed':
                handleTaskFailed(eventData);
                break;
            case 'payroll_processing_started':
                handlePayrollProcessingStarted(eventData);
                break;
            case 'payroll_processing_progress':
                handlePayrollProcessingProgress(eventData);
                break;
            case 'payroll_processing_completed':
                handlePayrollProcessingCompleted(eventData);
                break;
            case 'payslip_rerun_completed':
                handlePayslipRerunCompleted(eventData);
                break;
            case 'voucher_generated':
                handleVoucherGenerated(eventData);
                break;
            case 'email_distribution_completed':
                handleEmailDistributionCompleted(eventData);
                break;
            case 'error':
                handleError(eventData);
                break;
            default:
                console.log('Unknown WebSocket message type:', type, eventData);
        }
    };

    // Task event handlers
    const handleTaskStarted = (data) => {
        const { task_id, task_type, message, ...otherData } = data;

        activeTasks.set(task_id, {
            id: task_id,
            type: task_type,
            status: 'running',
            message: message,
            progress: 0,
            startTime: new Date(),
            ...otherData
        });

        showInfo(message, 'Task Started');
    };

    const handleTaskProgress = (data) => {
        const { task_id, progress, message, ...otherData } = data;

        if (activeTasks.has(task_id)) {
            const task = activeTasks.get(task_id);
            task.progress = progress;
            task.message = message;
            task.lastUpdate = new Date();
            Object.assign(task, otherData);
        }
    };

    const handleTaskCompleted = (data) => {
        const { task_id, result, message, ...otherData } = data;

        if (activeTasks.has(task_id)) {
            const task = activeTasks.get(task_id);
            task.status = 'completed';
            task.progress = 100;
            task.message = message;
            task.result = result;
            task.endTime = new Date();
            Object.assign(task, otherData);

            // Remove from active tasks after 5 seconds
            setTimeout(() => {
                activeTasks.delete(task_id);
            }, 5000);
        }

        showSuccess(message, 'Task Completed');
    };

    const handleTaskFailed = (data) => {
        const { task_id, error, message, ...otherData } = data;

        if (activeTasks.has(task_id)) {
            const task = activeTasks.get(task_id);
            task.status = 'failed';
            task.message = message;
            task.error = error;
            task.endTime = new Date();
            Object.assign(task, otherData);

            // Remove from active tasks after 10 seconds
            setTimeout(() => {
                activeTasks.delete(task_id);
            }, 10000);
        }

        showError(message, 'Task Failed');
    };

    const handlePayrollProcessingStarted = (data) => {
        const { task_id, employee_count, message, ...otherData } = data;

        activeTasks.set(task_id, {
            id: task_id,
            type: 'batch_payroll',
            status: 'running',
            message: message,
            progress: 0,
            employeeCount: employee_count,
            processedCount: 0,
            startTime: new Date(),
            ...otherData
        });

        showInfo(message, 'Payroll Processing Started');
    };

    const handlePayrollProcessingProgress = (data) => {
        const { task_id, processed, total, message, ...otherData } = data;

        if (activeTasks.has(task_id)) {
            const task = activeTasks.get(task_id);
            task.progress = Math.round((processed / total) * 100);
            task.processedCount = processed;
            task.message = message;
            task.lastUpdate = new Date();
            Object.assign(task, otherData);
        }
    };

    const handlePayrollProcessingCompleted = (data) => {
        const { task_id, result, payslips_created, message, ...otherData } = data;

        if (activeTasks.has(task_id)) {
            const task = activeTasks.get(task_id);
            task.status = 'completed';
            task.progress = 100;
            task.message = message;
            task.result = result;
            task.payslipsCreated = payslips_created;
            task.endTime = new Date();
            Object.assign(task, otherData);

            // Remove from active tasks after 5 seconds
            setTimeout(() => {
                activeTasks.delete(task_id);
            }, 5000);
        }

        showSuccess(message, 'Payroll Processing Completed');
    };

    const handlePayslipRerunCompleted = (data) => {
        const { task_id, payslip_id, result, message, ...otherData } = data;

        if (activeTasks.has(task_id)) {
            const task = activeTasks.get(task_id);
            task.status = 'completed';
            task.progress = 100;
            task.message = message;
            task.result = result;
            task.payslipId = payslip_id;
            task.endTime = new Date();
            Object.assign(task, otherData);

            // Remove from active tasks after 5 seconds
            setTimeout(() => {
                activeTasks.delete(task_id);
            }, 5000);
        }

        showSuccess(message, 'Payslip Rerun Completed');
    };

    const handleVoucherGenerated = (data) => {
        const { task_id, voucher_type, result, message, ...otherData } = data;

        if (activeTasks.has(task_id)) {
            const task = activeTasks.get(task_id);
            task.status = 'completed';
            task.progress = 100;
            task.message = message;
            task.result = result;
            task.voucherType = voucher_type;
            task.endTime = new Date();
            Object.assign(task, otherData);

            // Remove from active tasks after 5 seconds
            setTimeout(() => {
                activeTasks.delete(task_id);
            }, 5000);
        }

        showSuccess(message, 'Voucher Generated');
    };

    const handleEmailDistributionCompleted = (data) => {
        const { task_id, emails_sent, total_emails, message, ...otherData } = data;

        if (activeTasks.has(task_id)) {
            const task = activeTasks.get(task_id);
            task.status = 'completed';
            task.progress = 100;
            task.message = message;
            task.emailsSent = emails_sent;
            task.totalEmails = total_emails;
            task.endTime = new Date();
            Object.assign(task, otherData);

            // Remove from active tasks after 5 seconds
            setTimeout(() => {
                activeTasks.delete(task_id);
            }, 5000);
        }

        showSuccess(message, 'Email Distribution Completed');
    };

    const handleError = (data) => {
        const { message, error_details, ...otherData } = data;
        showError(message, 'System Error');
        console.error('Payroll system error:', error_details, otherData);
    };

    // Task history management
    const addToTaskHistory = (event) => {
        taskHistory.value.unshift({
            ...event,
            timestamp: new Date()
        });

        // Keep only the last maxHistorySize events
        if (taskHistory.value.length > maxHistorySize) {
            taskHistory.value = taskHistory.value.slice(0, maxHistorySize);
        }
    };

    // Computed properties
    const activeTasksList = computed(() => Array.from(activeTasks.values()));
    const runningTasksCount = computed(() => activeTasksList.value.filter((task) => task.status === 'running').length);
    const hasActiveTasks = computed(() => runningTasksCount.value > 0);

    // Task subscription methods
    const subscribeToTask = (taskId) => {
        if (ws.value && ws.value.readyState === WebSocket.OPEN) {
            ws.value.send(
                JSON.stringify({
                    type: 'subscribe_task',
                    task_id: taskId
                })
            );
        }
    };

    const unsubscribeFromTask = (taskId) => {
        if (ws.value && ws.value.readyState === WebSocket.OPEN) {
            ws.value.send(
                JSON.stringify({
                    type: 'unsubscribe_task',
                    task_id: taskId
                })
            );
        }
    };

    // Utility methods
    const getTaskById = (taskId) => activeTasks.get(taskId);
    const clearTaskHistory = () => {
        taskHistory.value = [];
    };

    // Lifecycle hooks
    onMounted(() => {
        connectWebSocket();
    });

    onUnmounted(() => {
        disconnectWebSocket();
    });

    return {
        // Connection state
        isConnected,
        connectionStatus,

        // Task state
        activeTasks: activeTasksList,
        taskHistory,
        runningTasksCount,
        hasActiveTasks,

        // Methods
        connectWebSocket,
        disconnectWebSocket,
        subscribeToTask,
        unsubscribeFromTask,
        getTaskById,
        clearTaskHistory,

        // Task management
        activeTasksMap: activeTasks
    };
}
