import { useState, useEffect, useRef, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { GripVertical, MoreHorizontal, Eye, Calendar, MessageSquare, LayoutDashboard, AlignLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import './KanbanBoard.css';

const COLUMNS = [
    { id: 'backlog', label: 'Backlog', color: '#64748B' },
    { id: 'analisis', label: 'Análisis', color: '#F59E0B' },
    { id: 'desarrollo', label: 'Desarrollo', color: '#F59E0B' },
    { id: 'review', label: 'Review', color: '#3B82F6' },
    { id: 'done', label: 'Done', color: '#10B981' },
];

const DEMO_CARDS = [
    {
        id: '1', title: 'Refactorización de API', description: 'Optimización de endpoints críticos para mejorar latencia.',
        status: 'backlog', priority: 'Alta',
        assignees: [
            { id: 'carlos', name: 'Carlos M.', initials: 'CM', color: '#14B8A6' },
            { id: 'maria', name: 'María R.', initials: 'MR', color: '#8B5CF6' },
        ],
        comments: 4, created_at: '2025-10-01',
    },
    {
        id: '2', title: 'Documentación de Arquitectura', description: 'Actualizar los diagramas C4 y el repositorio README.',
        status: 'backlog', priority: 'Media',
        assignees: [{ id: 'laura', name: 'Laura V.', initials: 'LV', color: '#10B981' }],
        dueDate: '12 Oct', created_at: '2025-10-02',
    },
    {
        id: '3', title: 'Definición de Requisitos UX', description: 'Entrevistas con stakeholders para el nuevo dashboard.',
        status: 'analisis', priority: 'Media',
        assignees: [{ id: 'carlos', name: 'Carlos M.', initials: 'CM', color: '#14B8A6' }],
        created_at: '2025-10-03',
    },
    {
        id: '4', title: 'Sistema de Autenticación MFA', description: 'Implementación de TOTP y verificación por SMS.',
        status: 'desarrollo', priority: 'Alta',
        assignees: [{ id: 'jorge', name: 'Jorge L.', initials: 'JL', color: '#F59E0B' }],
        created_at: '2025-09-28',
    },
    {
        id: '5', title: 'Dashboard v2.0', description: 'Migración de componentes legacy a nuevos componentes atómicos.',
        status: 'desarrollo', priority: 'Media', progress: 85,
        assignees: [
            { id: 'ana', name: 'Ana P.', initials: 'AP', color: '#EC4899' },
            { id: 'diego', name: 'Diego S.', initials: 'DS', color: '#3B82F6' },
        ],
        created_at: '2025-09-25',
    },
];

const priorityColors = {
    Alta: { bg: 'var(--priority-alta-bg)', color: 'var(--priority-alta)' },
    Media: { bg: 'var(--priority-media-bg)', color: 'var(--priority-media)' },
    Baja: { bg: 'var(--priority-baja-bg)', color: 'var(--priority-baja)' },
};

export default function KanbanBoard() {
    const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'gantt'
    const [cards, setCards] = useState(DEMO_CARDS);
    const [draggedCard, setDraggedCard] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);
    const wasDragged = useRef(false);
    const navigate = useNavigate();

    useEffect(() => {
        try {
            const unsubscribe = onSnapshot(
                collection(db, 'requirements'),
                (snapshot) => {
                    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                    setCards(data);
                },
                () => { /* Firebase not configured, use demo data */ }
            );
            return unsubscribe;
        } catch {
            /* Firebase not configured */
        }
    }, []);

    const getColumnCards = (columnId) => cards.filter((c) => c.status === columnId);

    const handleDragStart = (e, card) => {
        setDraggedCard(card);
        wasDragged.current = true;
        e.dataTransfer.effectAllowed = 'move';
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '1';
        setDraggedCard(null);
        setDragOverColumn(null);
    };

    const handleDragOver = (e, columnId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverColumn(columnId);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = async (e, columnId) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggedCard || draggedCard.status === columnId) return;

        // Optimistic update
        setCards((prev) =>
            prev.map((c) =>
                c.id === draggedCard.id ? { ...c, status: columnId } : c
            )
        );

        // Firestore update
        try {
            const statusField = `status_${columnId}_at`;
            await updateDoc(doc(db, 'requirements', draggedCard.id), {
                status: columnId,
                [statusField]: serverTimestamp(),
            });
        } catch {
            /* Firebase not configured */
        }
    };

    const ganttMetrics = useMemo(() => {
        if (!cards || cards.length === 0) {
            const now = new Date();
            return {
                start: new Date(now.getFullYear(), now.getMonth(), 1),
                end: new Date(now.getFullYear(), now.getMonth() + 6, 0),
                duration: 6 * 30 * 24 * 3600 * 1000
            };
        }

        let minD = new Date();
        let maxD = new Date(minD.getTime() + 14 * 24 * 3600 * 1000);

        cards.forEach(c => {
            let s = new Date(c.created_at?.toDate ? c.created_at.toDate() : (c.created_at || Date.now()));
            if (isNaN(s.getTime())) s = new Date();
            let e = c.dueDate ? new Date(c.dueDate) : new Date(s.getTime() + 14 * 24 * 3600 * 1000);
            if (isNaN(e.getTime())) e = new Date(s.getTime() + 14 * 24 * 3600 * 1000);

            if (s < minD) minD = s;
            if (e > maxD) maxD = e;
        });

        minD = new Date(minD.getFullYear(), minD.getMonth(), 1);
        maxD = new Date(maxD.getFullYear(), maxD.getMonth() + 1, 0);

        const minEnd = new Date(minD.getFullYear(), minD.getMonth() + 6, 0);
        if (maxD < minEnd) maxD = minEnd;

        return { start: minD, end: maxD, duration: maxD.getTime() - minD.getTime() };
    }, [cards]);

    const ganttMonths = useMemo(() => {
        const months = [];
        const { start, end } = ganttMetrics;
        let p = new Date(start.getFullYear(), start.getMonth(), 1);
        while (p <= end) {
            const mStr = p.toLocaleString('es-ES', { month: 'long' });
            const label = mStr.charAt(0).toUpperCase() + mStr.slice(1);
            months.push({ id: p.getTime(), label });
            p.setMonth(p.getMonth() + 1);
        }
        return months;
    }, [ganttMetrics]);

    const getGanttStyle = (startDateStr, endDateStr, statusId) => {
        let start = new Date(startDateStr?.toDate ? startDateStr.toDate() : (startDateStr || Date.now()));
        if (isNaN(start.getTime())) start = new Date();

        let end = endDateStr ? new Date(endDateStr) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
        if (isNaN(end.getTime())) end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

        const { start: timelineStart, duration } = ganttMetrics;

        let leftPct = Math.max(0, (start.getTime() - timelineStart.getTime()) / duration * 100);
        let widthPct = Math.max(1, (end.getTime() - start.getTime()) / duration * 100);

        if (leftPct + widthPct > 100) widthPct = 100 - leftPct;

        const columnDef = COLUMNS.find(c => c.id === statusId);
        const color = columnDef?.color || 'var(--color-primary)';

        return {
            left: `${leftPct}%`,
            width: `${widthPct}%`,
            background: color,
        };
    };

    return (
        <div className="kanban animate-fade-in">
            <div className="page-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="page-header__title">
                    <h1>Tablero de Trabajo</h1>
                    <p>Seguimiento detallado del ciclo de vida del software en tiempo real.</p>
                </div>
                <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface)', padding: '4px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border-light)' }}>
                    <button
                        className={`btn btn--ghost ${viewMode === 'kanban' ? 'btn--primary' : ''}`}
                        onClick={() => setViewMode('kanban')}
                        style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', height: 'auto', gap: '8px', color: viewMode === 'kanban' ? 'var(--color-primary-content)' : '' }}
                    >
                        <LayoutDashboard size={16} /> Kanban
                    </button>
                    <button
                        className={`btn btn--ghost ${viewMode === 'gantt' ? 'btn--primary' : ''}`}
                        onClick={() => setViewMode('gantt')}
                        style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', height: 'auto', gap: '8px', color: viewMode === 'gantt' ? 'var(--color-primary-content)' : '' }}
                    >
                        <AlignLeft size={16} /> Gantt
                    </button>
                </div>
            </div>

            {viewMode === 'kanban' ? (
                <div className="kanban__board animate-slide-in">
                    {COLUMNS.map((column) => {
                        const columnCards = getColumnCards(column.id);
                        return (
                            <div
                                key={column.id}
                                className={`kanban__column ${dragOverColumn === column.id ? 'kanban__column--drag-over' : ''}`}
                                onDragOver={(e) => handleDragOver(e, column.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, column.id)}
                            >
                                <div className="kanban__column-header">
                                    <div className="kanban__column-title">
                                        <span
                                            className="kanban__column-dot"
                                            style={{ background: column.color }}
                                        />
                                        <span>{column.label}</span>
                                    </div>
                                    <span className="kanban__column-count">{columnCards.length}</span>
                                </div>

                                <div className="kanban__cards">
                                    {columnCards.map((card) => (
                                        <div
                                            key={card.id}
                                            className="kanban-card"
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, card)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => {
                                                if (!wasDragged.current) {
                                                    navigate(`/requerimiento/${card.id}`);
                                                }
                                                wasDragged.current = false;
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {card.priority && (
                                                <span
                                                    className="badge"
                                                    style={{
                                                        background: priorityColors[card.priority]?.bg,
                                                        color: priorityColors[card.priority]?.color,
                                                    }}
                                                >
                                                    {card.priority}
                                                </span>
                                            )}

                                            <h4 className="kanban-card__title">{card.title}</h4>
                                            <p className="kanban-card__desc">{card.description}</p>

                                            {card.progress !== undefined && (
                                                <div style={{ marginTop: 'var(--space-3)' }}>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-bar__fill"
                                                            style={{ width: `${card.progress}%` }}
                                                        />
                                                    </div>
                                                    <span style={{
                                                        fontSize: 'var(--font-size-xs)',
                                                        color: 'var(--color-text-muted)',
                                                        marginTop: '4px',
                                                        display: 'block',
                                                        textAlign: 'right',
                                                    }}>
                                                        {card.progress}%
                                                    </span>
                                                </div>
                                            )}

                                            <div className="kanban-card__footer">
                                                <div className="kanban-card__assignees">
                                                    {card.assignees?.slice(0, 3).map((a, i) => (
                                                        <div
                                                            key={a.id || i}
                                                            className="avatar avatar--sm"
                                                            title={a.name || a}
                                                            style={{
                                                                background: a.color || (i === 0 ? 'var(--color-primary)' : 'var(--color-text-muted)'),
                                                                marginLeft: i > 0 ? '-6px' : 0,
                                                                border: '2px solid var(--color-surface)',
                                                            }}
                                                        >
                                                            {a.initials ? a.initials[0] : (typeof a === 'string' ? a[0] : '?')}
                                                        </div>
                                                    ))}
                                                    {card.assignees && card.assignees.length > 3 && (
                                                        <div
                                                            className="avatar avatar--sm"
                                                            style={{
                                                                background: 'var(--color-neutral-200)',
                                                                color: 'var(--color-text-secondary)',
                                                                marginLeft: '-6px',
                                                                border: '2px solid var(--color-surface)',
                                                                fontSize: '10px',
                                                            }}
                                                        >
                                                            +{card.assignees.length - 3}
                                                        </div>
                                                    )}
                                                    {card.assignees && card.assignees.length === 1 && (
                                                        <span className="kanban-card__assignee-name">
                                                            {card.assignees[0].name || card.assignees[0]}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="kanban-card__meta">
                                                    {card.comments && (
                                                        <span className="kanban-card__meta-item">
                                                            <MessageSquare size={12} />
                                                            {card.comments}
                                                        </span>
                                                    )}
                                                    {card.dueDate && (
                                                        <span className="kanban-card__meta-item">
                                                            <Calendar size={12} />
                                                            {card.dueDate}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="gantt-board animate-slide-in">
                    <div className="gantt-container">
                        <div className="gantt-header">
                            <div className="gantt-task-info-header">Requerimiento & Estimación</div>
                            <div className="gantt-timeline-header" style={{ minWidth: `${ganttMonths.length * 80}px` }}>
                                {ganttMonths.map(m => <div key={m.id} className="gantt-month">{m.label}</div>)}
                            </div>
                        </div>
                        <div className="gantt-body">
                            {cards.map(card => {
                                const style = getGanttStyle(card.created_at, card.dueDate, card.status);
                                const columnDef = COLUMNS.find(c => c.id === card.status);
                                return (
                                    <div key={card.id} className="gantt-row" onClick={() => navigate(`/requerimiento/${card.id}`)} style={{ cursor: 'pointer' }}>
                                        <div className="gantt-task-info">
                                            <h4 className="gantt-task-title" title={card.title}>{card.title}</h4>
                                            <p className="gantt-task-status" style={{ color: columnDef?.color }}>
                                                {columnDef?.label || 'Backlog'}
                                            </p>
                                        </div>
                                        <div className="gantt-timeline-row" style={{ minWidth: `${ganttMonths.length * 80}px` }}>
                                            <div className="gantt-grid-lines">
                                                {ganttMonths.map(m => <div key={`line-${m.id}`} className="gantt-grid-line" />)}
                                            </div>
                                            <div className="gantt-bar-wrapper">
                                                <div className="gantt-bar" style={style}>
                                                    <span className="gantt-bar-title">{card.title}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
