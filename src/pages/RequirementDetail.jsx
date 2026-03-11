import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
    ArrowLeft, Calendar, Clock, Users, FileText, Link as LinkIcon,
    ExternalLink, BookOpen, Shield, CalendarCheck, Tag, User, Briefcase,
} from 'lucide-react';
import './RequirementDetail.css';

const STATUS_LABELS = {
    backlog: 'Backlog',
    analisis: 'Análisis',
    desarrollo: 'Desarrollo',
    review: 'Review',
    done: 'Done',
    rechazado: 'Rechazado',
};

const STATUS_COLORS = {
    backlog: '#94A3B8',
    analisis: '#F59E0B',
    desarrollo: '#F97316',
    review: '#6366F1',
    done: '#10B981',
    rechazado: '#EF4444',
};

const PRIORITY_CLASSES = {
    Alta: 'alta',
    Media: 'media',
    Baja: 'baja',
};

export default function RequirementDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [req, setReq] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequirement = async () => {
            try {
                const docRef = doc(db, 'requirements', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setReq({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (err) {
                console.error('Error fetching requirement:', err);
            }
            setLoading(false);
        };
        fetchRequirement();
    }, [id]);

    const formatDate = (dateValue) => {
        if (!dateValue) return '—';
        const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
        return date.toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const parseAttachments = (attachments) => {
        if (!attachments) return [];
        return attachments
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    };

    const isUrl = (text) => {
        try {
            new URL(text);
            return true;
        } catch {
            return false;
        }
    };

    if (loading) {
        return <div className="req-detail__loading">Cargando requerimiento...</div>;
    }

    if (!req) {
        return (
            <div className="req-detail">
                <button className="req-detail__back" onClick={() => navigate(-1)}>
                    <ArrowLeft size={16} />
                    Volver
                </button>
                <div className="req-detail__loading">Requerimiento no encontrado</div>
            </div>
        );
    }

    const attachmentLines = parseAttachments(req.attachments);

    return (
        <div className="req-detail">
            {/* Back button */}
            <button className="req-detail__back" onClick={() => navigate(-1)}>
                <ArrowLeft size={16} />
                Volver al tablero
            </button>

            {/* Header */}
            <div className="req-detail__header">
                <div className="req-detail__header-left">
                    <h1 className="req-detail__title">{req.title}</h1>
                    <div className="req-detail__badges">
                        <span className={`badge badge--${PRIORITY_CLASSES[req.priority] || 'media'}`}>
                            {req.priority}
                        </span>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-full)',
                            background: `${STATUS_COLORS[req.status] || '#94A3B8'}18`,
                            color: STATUS_COLORS[req.status] || '#94A3B8',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                        }}>
                            <span className="req-detail__status-dot" style={{ background: STATUS_COLORS[req.status] }} />
                            {STATUS_LABELS[req.status] || req.status}
                        </span>
                        {req.timeType && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 12px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--color-bg)',
                                border: '1px solid var(--color-border)',
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-text-secondary)',
                                fontWeight: 'var(--font-weight-medium)',
                            }}>
                                <Clock size={12} />
                                {req.timeType === 'definido' ? 'Tiempo Definido' : 'Tiempo Indefinido'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* 2-column grid */}
            <div className="req-detail__grid">
                {/* LEFT — Main content */}
                <div>
                    {/* Descripción */}
                    <div className="req-detail__section">
                        <div className="req-detail__section-title">
                            <FileText size={14} />
                            Descripción
                        </div>
                        {req.description ? (
                            <div className="req-detail__text">{req.description}</div>
                        ) : (
                            <div className="req-detail__empty">Sin descripción</div>
                        )}
                    </div>

                    {/* Objetivo / Scope */}
                    {req.scope && (
                        <div className="req-detail__section">
                            <div className="req-detail__section-title">
                                <Tag size={14} />
                                Objetivo
                            </div>
                            <div className="req-detail__text">{req.scope}</div>
                        </div>
                    )}

                    {/* Reglas de Negocio */}
                    {req.businessRules && (
                        <div className="req-detail__section">
                            <div className="req-detail__section-title">
                                <Shield size={14} />
                                Reglas de Negocio
                            </div>
                            <div className="req-detail__text">{req.businessRules}</div>
                        </div>
                    )}

                    {/* Criterios de Aceptación */}
                    {req.acceptanceCriteria && (
                        <div className="req-detail__section">
                            <div className="req-detail__section-title">
                                <BookOpen size={14} />
                                Criterios de Aceptación
                            </div>
                            <div className="req-detail__text">{req.acceptanceCriteria}</div>
                        </div>
                    )}

                    {/* Notas Técnicas */}
                    {req.technicalNotes && (
                        <div className="req-detail__section">
                            <div className="req-detail__section-title">
                                <FileText size={14} />
                                Notas Técnicas
                            </div>
                            <div className="req-detail__text">{req.technicalNotes}</div>
                        </div>
                    )}

                    {/* Documentos y Ligas */}
                    {attachmentLines.length > 0 && (
                        <div className="req-detail__section">
                            <div className="req-detail__section-title">
                                <LinkIcon size={14} />
                                Documentos y Ligas
                            </div>
                            <div className="req-detail__links">
                                {attachmentLines.map((line, i) =>
                                    isUrl(line) ? (
                                        <a
                                            key={i}
                                            href={line}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="req-detail__link"
                                        >
                                            <ExternalLink size={14} />
                                            {line}
                                        </a>
                                    ) : (
                                        <div key={i} className="req-detail__text" style={{ padding: 'var(--space-2) 0' }}>
                                            {line}
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT — Sidebar info */}
                <div>
                    {/* Meta info */}
                    <div className="req-detail__section">
                        <div className="req-detail__section-title">
                            <Briefcase size={14} />
                            Información del Proyecto
                        </div>
                        <div className="req-detail__info-list">
                            <div className="req-detail__info-item">
                                <span className="req-detail__info-label">Solicitante</span>
                                <span className="req-detail__info-value">
                                    <User size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                    {req.requester || '—'}
                                </span>
                            </div>
                            <div className="req-detail__info-item">
                                <span className="req-detail__info-label">Equipos Asignados</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                                    {req.teams && req.teams.length > 0 ? (
                                        req.teams.map((t) => (
                                            <span key={t} style={{
                                                display: 'inline-flex', padding: '2px 8px',
                                                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-full)', fontSize: '11px',
                                                fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)'
                                            }}>
                                                {t}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="req-detail__info-value">{req.team || '—'}</span>
                                    )}
                                </div>
                            </div>
                            <div className="req-detail__info-item">
                                <span className="req-detail__info-label">Horas Estimadas</span>
                                <span className="req-detail__info-value">
                                    <Clock size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                    {req.estimatedHours ? `${req.estimatedHours} hrs` : '—'}
                                </span>
                            </div>
                            <div className="req-detail__info-item">
                                <span className="req-detail__info-label">Fecha de Creación</span>
                                <span className="req-detail__info-value">
                                    <Calendar size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                    {formatDate(req.created_at)}
                                </span>
                            </div>
                            {req.dueDate && (
                                <div className="req-detail__info-item">
                                    <span className="req-detail__info-label">Fecha de Entrega</span>
                                    <span className="req-detail__info-value">
                                        <CalendarCheck size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
                                        {req.dueDate}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Participantes */}
                    <div className="req-detail__section">
                        <div className="req-detail__section-title">
                            <Users size={14} />
                            Participantes
                        </div>
                        {req.assignees && req.assignees.length > 0 ? (
                            <div className="req-detail__assignees">
                                {req.assignees.map((a) => (
                                    <div key={a.id} className="req-detail__assignee">
                                        <div
                                            className="avatar avatar--sm"
                                            style={{ background: a.color, flexShrink: 0 }}
                                        >
                                            {a.initials?.[0] || a.name?.[0] || '?'}
                                        </div>
                                        <span className="req-detail__assignee-name">{a.name}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="req-detail__empty">Sin participantes asignados</div>
                        )}
                    </div>

                    {/* Motivo de rechazo */}
                    {req.status === 'rechazado' && req.rejectionReason && (
                        <div className="req-detail__section" style={{ borderColor: 'var(--color-danger)', borderWidth: '2px' }}>
                            <div className="req-detail__section-title" style={{ color: 'var(--color-danger)' }}>
                                Motivo del Rechazo
                            </div>
                            <div className="req-detail__text">{req.rejectionReason}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
