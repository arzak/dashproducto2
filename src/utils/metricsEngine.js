import { differenceInDays, differenceInHours, subDays, format, isSameDay } from 'date-fns';

/**
 * Calculate Cycle Time: time from In Progress to Done (in days).
 * Returns null if requirement is not Done.
 */
export function calculateCycleTime(requirement) {
    const start = requirement.status_analisis_at || requirement.status_desarrollo_at || requirement.status_in_progress_at || requirement.created_at;
    const end = requirement.status_done_at;
    if (!start || !end) return null;

    const startDate = start.toDate ? start.toDate() : new Date(start);
    const endDate = end.toDate ? end.toDate() : new Date(end);

    const hours = differenceInHours(endDate, startDate);
    return Math.max(0.1, parseFloat((hours / 24).toFixed(1))); // Retorna fracción de día para tareas cortas
}

/**
 * Calculate Lead Time: time from creation to Done (in days).
 * Returns null if requirement is not Done.
 */
export function calculateLeadTime(requirement) {
    const start = requirement.created_at;
    const end = requirement.status_done_at;
    if (!start || !end) return null;

    const startDate = start.toDate ? start.toDate() : new Date(start);
    const endDate = end.toDate ? end.toDate() : new Date(end);
    return differenceInDays(endDate, startDate);
}

/**
 * Calculate average Cycle Time for a set of done requirements.
 */
export function calculateAvgCycleTime(requirements) {
    const doneReqs = requirements.filter((r) => r.status === 'done');
    if (doneReqs.length === 0) return 0;

    const total = doneReqs.reduce((sum, r) => {
        const ct = calculateCycleTime(r);
        return sum + (ct || 0);
    }, 0);

    return parseFloat((total / doneReqs.length).toFixed(1));
}

/**
 * Calculate Health Score (0-100).
 * 40% on-time delivery, 30% within budget, 30% no blockers.
 */
export function calculateHealthScore(requirements) {
    if (requirements.length === 0) return 0;

    const doneReqs = requirements.filter((r) => r.status === 'done');

    // On-time: percentage delivered on or before estimated date
    let onTimeCount = 0;
    doneReqs.forEach((r) => {
        if (r.estimated_date && r.status_done_at) {
            const estimated = r.estimated_date.toDate
                ? r.estimated_date.toDate()
                : new Date(r.estimated_date);
            const actual = r.status_done_at.toDate
                ? r.status_done_at.toDate()
                : new Date(r.status_done_at);
            if (actual <= estimated) onTimeCount++;
        } else {
            onTimeCount++; // no estimate = assume on time
        }
    });
    const onTimeRate = doneReqs.length > 0 ? onTimeCount / doneReqs.length : 1;

    // Budget: simplified CPI (assume 1.0 if no budget data)
    const budgetEfficiency = 1.0;

    // Blockers: percentage of non-blocked requirements
    const blockedCount = requirements.filter(
        (r) => r.priority === 'Alta' && r.status !== 'done'
    ).length;
    const blockerRate = 1 - blockedCount / Math.max(requirements.length, 1);

    const score = Math.round(onTimeRate * 40 + budgetEfficiency * 30 + blockerRate * 30);
    return Math.max(0, Math.min(100, score));
}

/**
 * Count requirements per status.
 */
export function getStatusCounts(requirements) {
    const counts = {
        backlog: 0,
        analisis: 0,
        desarrollo: 0,
        review: 0,
        done: 0,
    };
    requirements.forEach((r) => {
        const status = (r.status || 'backlog').toLowerCase();
        if (counts[status] !== undefined) {
            counts[status]++;
        }
    });
    return counts;
}

/**
 * Generate cycle time trend data (last 7 days simulated).
 */
export function getCycleTimeTrend(requirements) {
    const doneReqs = requirements.filter((r) => r.status === 'done' && r.status_done_at);

    const spanishDays = {
        'MON': 'LUN', 'TUE': 'MAR', 'WED': 'MIE', 'THU': 'JUE', 'FRI': 'VIE', 'SAT': 'SAB', 'SUN': 'DOM'
    };

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
        const date = subDays(new Date(), 6 - i);
        return { date, engDay: format(date, 'EEE').toUpperCase() };
    });

    return last7Days.map(({ date, engDay }) => {
        const displayDay = spanishDays[engDay] || engDay;

        const reqsCompletedThisDay = doneReqs.filter((r) => {
            const endDate = r.status_done_at.toDate ? r.status_done_at.toDate() : new Date(r.status_done_at);
            return isSameDay(endDate, date);
        });

        if (reqsCompletedThisDay.length === 0) {
            return { day: displayDay, cycleTime: 0 };
        }

        const totalHours = reqsCompletedThisDay.reduce((sum, r) => {
            const start = r.status_analisis_at || r.status_desarrollo_at || r.status_in_progress_at || r.created_at;
            if (!start) return sum;
            const startDate = start.toDate ? start.toDate() : new Date(start);
            const endDate = r.status_done_at.toDate ? r.status_done_at.toDate() : new Date(r.status_done_at);
            return sum + Math.max(0.1, differenceInHours(endDate, startDate) / 24);
        }, 0);

        return {
            day: displayDay,
            cycleTime: parseFloat((totalHours / reqsCompletedThisDay.length).toFixed(1)),
        };
    });
}

/**
 * Group requirements by assigned team for workload view.
 */
export function getTeamWorkload(requirements) {
    const teamMap = {};
    requirements.forEach((r) => {
        const team = r.team || 'Sin asignar';
        if (!teamMap[team]) {
            teamMap[team] = { total: 0, done: 0 };
        }
        teamMap[team].total++;
        if (r.status === 'done') teamMap[team].done++;
    });

    return Object.entries(teamMap).map(([name, data]) => ({
        name,
        percentage: data.total > 0 ? Math.round((data.done / data.total) * 100) : 0,
    }));
}
