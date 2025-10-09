// Employee related routes
export const employeeRoutes = [
    // HRM Dashboard
    {
        path: '/hrm',
        name: 'hrmDashboard',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/dashboards/hrmDashboard.vue')
    },
    {
        path: '/hrm/employees/view-employees',
        name: 'employees',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/employees/view-employees.vue')
    },
    // Training
    {
        path: '/hrm/training/courses',
        name: 'training-courses',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/training/Courses.vue')
    },
    {
        path: '/hrm/training/enrollments',
        name: 'training-enrollments',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/training/Enrollments.vue')
    },
    {
        path: '/hrm/training/evaluations',
        name: 'training-evaluations',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/training/Evaluations.vue')
    },
    {
        path: '/hrm/employees/manageContracts',
        name: 'contracts',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/employees/manageContracts.vue')
    },
    {
        path: '/hrm/org/orgChart',
        name: 'orgChart',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/org/orgChart.vue')
    },
    // Attendance
    {
        path: '/hrm/attendance/work-shifts',
        name: 'work-shifts',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/WorkShifts.vue')
    },
    {
        path: '/hrm/attendance/off-days',
        name: 'off-days',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/OffDays.vue')
    },
    {
        path: '/hrm/attendance/records',
        name: 'attendance-records',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/attendance/AttendanceRecords.vue')
    },
    // Recruitment
    {
        path: '/hrm/recruitment/jobs',
        name: 'recruitment-jobs',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/recruitment/Jobs.vue')
    },
    {
        path: '/hrm/recruitment/candidates',
        name: 'recruitment-candidates',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/recruitment/Candidates.vue')
    },
    {
        path: '/hrm/recruitment/applications',
        name: 'recruitment-applications',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/recruitment/Applications.vue')
    },
    // Performance (reusing appraisals)
    {
        path: '/hrm/performance/appraisals',
        name: 'performance-appraisals',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/appraisals/appraisalList.vue')
    },
    {
        path: '/hrm/performance/goals',
        name: 'performance-goals',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/appraisals/goalsList.vue')
    },
    {
        path: '/hrm/performance/templates',
        name: 'performance-templates',
        meta: { requiresAuth: true },
        component: () => import('@/views/pages/hrm/appraisals/appraisalTemplates.vue')
    }
];
