import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { GripVertical, MoreHorizontal, Eye, Calendar, MessageSquare } from 'lucide-react';
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
    const [cards, setCards] = useState(DEMO_CARDS);
    const [draggedCard, setDraggedCard] = useState(null);
    const [dragOverColumn, setDragOverColumn] = useState(null);

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

    return (
        <div className="kanban">
            <div className="page-header">
                <div className="page-header__title">
                    <h1>Tablero Kanban</h1>
                    <p>Seguimiento detallado del ciclo de vida del software en tiempo real.</p>
                </div>
            </div>

            <div className="kanban__board">
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
        </div>
    );
}
