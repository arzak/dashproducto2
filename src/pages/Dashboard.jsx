import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Clock, CheckCircle, Zap, Download, Calendar, TrendingUp, MoreHorizontal, Users } from 'lucide-react';
import { db } from '../firebase';
import KpiCard from '../components/KpiCard';
import {
    calculateAvgCycleTime,
    calculateHealthScore,
    getStatusCounts,
    getCycleTimeTrend,
    getTeamWorkload,
} from '../utils/metricsEngine';
import './Dashboard.css';

const DEMO_REQUIREMENTS = [
    { id: '1', title: 'Refactorización de API', status: 'backlog', priority: 'Alta', team: 'Equipo de Desarrollo A', created_at: '2025-10-01', status_in_progress_at: '2025-10-05', status_done_at: '2025-10-09' },
    { id: '2', title: 'Definición de Requisitos UX', status: 'analisis', priority: 'Media', team: 'Equipo de Diseño UI/UX', created_at: '2025-10-02' },
    { id: '3', title: 'Sistema de Autenticación MFA', status: 'desarrollo', priority: 'Alta', team: 'Equipo de Desarrollo A', created_at: '2025-10-03', status_in_progress_at: '2025-10-06' },
    { id: '4', title: 'Dashboard v2.0', status: 'desarrollo', priority: 'Media', team: 'Equipo de Desarrollo A', created_at: '2025-09-28', status_in_progress_at: '2025-10-01' },
    { id: '5', title: 'Tests de Integración', status: 'done', priority: 'Baja', team: 'QA & Testing', created_at: '2025-09-20', status_in_progress_at: '2025-09-22', status_done_at: '2025-09-25' },
    { id: '6', title: 'Optimización de Rendimiento', status: 'done', priority: 'Alta', team: 'Equipo de Desarrollo A', created_at: '2025-09-15', status_in_progress_at: '2025-09-17', status_done_at: '2025-09-20' },
    { id: '7', title: 'Campaña de Email Marketing', status: 'review', priority: 'Baja', team: 'Marketing Digital', created_at: '2025-10-01', status_in_progress_at: '2025-10-04' },
];



export default function Dashboard() {
    const [requirements, setRequirements] = useState(DEMO_REQUIREMENTS);
    const trendData = getCycleTimeTrend(requirements);
    const avgCycleTime = calculateAvgCycleTime(requirements);
    const healthScore = calculateHealthScore(requirements);
    const statusCounts = getStatusCounts(requirements);
    const completedCount = statusCounts.done + statusCounts.review;

    // Calculamos la carga de trabajo real
    const teamWorkloads = getTeamWorkload(requirements).map((t, index) => {
        const colors = ['#14B8A6', '#3B82F6', '#F59E0B', '#EC4899', '#8B5CF6'];
        return {
            ...t,
            color: t.percentage > 80 ? 'var(--color-danger)' : colors[index % colors.length]
        };
    });

    // Generamos la tabla de líderes dinámicamente
    const topTeams = [...teamWorkloads]
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5)
        .map(t => ({
            name: t.name,
            metric: `Ratio de completitud del ${t.percentage}%`,
            progress: t.percentage,
            trend: 'Calculada',
            initial: t.name.charAt(0).toUpperCase(),
            color: t.color
        }));

    useEffect(() => {
        try {
            const unsubscribe = onSnapshot(
                collection(db, 'requirements'),
                (snapshot) => {
                    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                    setRequirements(data);
                },
                () => { /* Firebase not configured yet, use demo data */ }
            );
            return unsubscribe;
        } catch {
            /* Firebase not configured */
        }
    }, []);

    return (
        <div className="dashboard">
            {/* Page Header */}
            <div className="page-header">
                <div className="page-header__title">
                    <h1>Dashboard de Rendimiento</h1>
                    <p>Análisis detallado de eficiencia y carga de trabajo</p>
                </div>
                <div className="page-header__actions">
                    <button className="btn btn--secondary">
                        <Calendar size={16} />
                        Últimos 30 días
                    </button>
                    <button className="btn btn--primary">
                        <Download size={16} />
                        Exportar
                    </button>
                </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid--3 stagger" style={{ marginBottom: 'var(--space-8)' }}>
                <KpiCard
                    label="Tiempo de Ciclo Medio"
                    value={`${avgCycleTime || 4.2} días`}
                    trend="-12%"
                    trendDirection="up"
                    subtitle="vs. mes anterior"
                    icon={Clock}
                    iconBg="var(--color-info-bg)"
                />
                <KpiCard
                    label="Tareas Completadas"
                    value={completedCount || 128}
                    trend="+8%"
                    trendDirection="up"
                    subtitle="En el periodo actual"
                    icon={CheckCircle}
                    iconBg="var(--color-success-bg)"
                />
                <KpiCard
                    label="Eficiencia Global"
                    value={`${healthScore || 94}%`}
                    trend="+2%"
                    trendDirection="up"
                    subtitle="Objetivo: 90%"
                    icon={Zap}
                    iconBg="var(--color-warning-bg)"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid--2" style={{ marginBottom: 'var(--space-8)' }}>
                {/* Cycle Time Trend Chart */}
                <div className="card animate-fade-in">
                    <div className="card__header">
                        <h3>Tendencia del Tiempo de Ciclo</h3>
                        <button className="btn btn--icon btn--ghost">
                            <MoreHorizontal size={18} />
                        </button>
                    </div>
                    <div className="dashboard__chart">
                        <ResponsiveContainer width="100%" height={240}>
                            <LineChart data={trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" />
                                <XAxis
                                    dataKey="day"
                                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--color-surface)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        boxShadow: 'var(--shadow-md)',
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="cycleTime"
                                    stroke="var(--color-primary)"
                                    strokeWidth={2.5}
                                    dot={{ r: 4, fill: 'var(--color-primary)' }}
                                    activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Team Workload */}
                <div className="card animate-fade-in">
                    <div className="card__header">
                        <h3>Carga de Trabajo del Equipo</h3>
                        <div className="kpi-card__icon" style={{ background: 'var(--color-bg)' }}>
                            <Users size={18} />
                        </div>
                    </div>
                    <div className="dashboard__workload">
                        {teamWorkloads.length > 0 ? (
                            teamWorkloads.map((team) => (
                                <div key={team.name} className="workload-item">
                                    <div className="workload-item__header">
                                        <span className="workload-item__name">{team.name}</span>
                                        <span className="workload-item__value">{team.percentage}% completado</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className={`progress-bar__fill ${team.percentage < 50 ? 'progress-bar__fill--warning' : ''}`}
                                            style={{ width: `${team.percentage}%`, background: team.color }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', textAlign: 'center', marginTop: 'var(--space-4)' }}>
                                No hay datos de equipos aún.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Top Teams Table */}
            <div className="card animate-fade-in">
                <div className="card__header">
                    <h3>Equipos con Mejor Rendimiento</h3>
                    <button className="btn btn--ghost" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                        Ver todos
                    </button>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Equipo</th>
                            <th>Métrica Clave</th>
                            <th>Progreso</th>
                            <th>Tendencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topTeams.length > 0 ? (
                            topTeams.map((team) => (
                                <tr key={team.name}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <div
                                                className="avatar"
                                                style={{ background: team.color }}
                                            >
                                                {team.initial}
                                            </div>
                                            <span style={{ fontWeight: 600 }}>{team.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--color-text-secondary)' }}>{team.metric}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <div className="progress-bar" style={{ width: '120px' }}>
                                                <div
                                                    className="progress-bar__fill"
                                                    style={{ width: `${team.progress}%`, background: team.color }}
                                                />
                                            </div>
                                            <span style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                                                {team.progress}%
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            color: team.progress > 50 ? 'var(--color-success)' : 'var(--color-text-muted)',
                                            fontWeight: 600,
                                            fontSize: 'var(--font-size-sm)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--space-1)',
                                        }}>
                                            {team.progress > 50 && <TrendingUp size={14} />}
                                            {team.trend}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-muted)' }}>
                                    Aún no hay datos suficientes de rendimiento.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
