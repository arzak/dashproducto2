import { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, Timestamp } from 'firebase/firestore';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, Filter, Triangle, Asterisk, Info, UserPlus, Check, Link, CalendarCheck, CheckCircle } from 'lucide-react';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './RequirementForm.css';

const STEPS = [
    { label: 'Información Básica', next: 'Detalles Técnicos y Alcance' },
    { label: 'Detalles Técnicos y Alcance', next: 'Revisión y Confirmación' },
    { label: 'Revisión y Confirmación', next: null },
];

const PRIORITIES = [
    { value: 'Baja', icon: Filter, description: 'Sin impacto crítico inmediato', color: 'var(--color-success)' },
    { value: 'Media', icon: Triangle, description: 'Requiere atención próxima', color: 'var(--color-warning)' },
    { value: 'Alta', icon: Asterisk, description: 'Urgente, bloqueo detectado', color: 'var(--color-danger)' },
];

const TEAMS = [
    'Producto',
    'Dirección',
    'Ventas',
    'Innovación',
    'Legal',
    'Investigación',
    'Data scientist',
    'Desarrollo',
    'Equipo de Diseño UI/UX',
    'QA & Testing',
    'Marketing Digital',
    'DevOps / SRE'
];

export default function RequirementForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, loading: authLoading } = useAuth();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [availableMembers, setAvailableMembers] = useState([]);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'users'));
                const usersList = [];
                querySnapshot.forEach((doc) => {
                    usersList.push({ id: doc.id, ...doc.data() });
                });
                setAvailableMembers(usersList);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchMembers();
    }, []);
    const [formData, setFormData] = useState({
        title: '',
        priority: 'Media',
        description: '',
        scope: '',
        estimatedHours: '',
        teams: [],
        requester: '',
        assignees: [],
        acceptanceCriteria: '',
        technicalNotes: '',
        businessRules: '',
        timeType: 'definido',
        attachments: '',
        dueDate: '',
        created_at: new Date().toISOString().split('T')[0], // Default today
    });

    const toggleTeam = (teamName) => {
        setFormData((prev) => {
            const currentTeams = prev.teams || [];
            const exists = currentTeams.includes(teamName);
            const newTeams = exists
                ? currentTeams.filter((t) => t !== teamName)
                : [...currentTeams, teamName];

            // When removing a team, also remove assignees that belonged to that team
            // (only if there are still other teams selected — if no teams selected, show all)
            let newAssignees = prev.assignees;
            if (exists && newTeams.length > 0) {
                newAssignees = prev.assignees.filter((a) => newTeams.includes(a.team));
            }

            return {
                ...prev,
                teams: newTeams,
                assignees: newAssignees,
            };
        });
    };

    const toggleAssignee = (member) => {
        setFormData((prev) => {
            const exists = prev.assignees.find((a) => a.id === member.id);
            return {
                ...prev,
                assignees: exists
                    ? prev.assignees.filter((a) => a.id !== member.id)
                    : [...prev.assignees, member],
            };
        });
    };
    const [errors, setErrors] = useState({});

    const progress = ((step + 1) / STEPS.length) * 100;

    const updateField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: null }));
        }
    };

    const validateStep = () => {
        const newErrors = {};
        if (step === 0) {
            if (!formData.title.trim()) newErrors.title = 'El título es requerido';
            if (!formData.requester.trim()) newErrors.requester = 'El solicitante es requerido';
            if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
            if (!formData.created_at) newErrors.created_at = 'La fecha de creación es requerida';
        }
        if (step === 1) {
            if (!formData.teams || formData.teams.length === 0) newErrors.teams = 'Selecciona al menos un equipo';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep()) {
            setStep((prev) => Math.min(prev + 1, STEPS.length - 1));
        }
    };

    const handleBack = () => {
        setStep((prev) => Math.max(prev - 1, 0));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const { assignees, created_at, ...rest } = formData;

            // Creamos un Timestamp válido a partir de la fecha (y definimos hora genérica a mediodía para evitar husos horarios confusos)
            const creationDate = created_at ? Timestamp.fromDate(new Date(`${created_at}T12:00:00`)) : serverTimestamp();

            await addDoc(collection(db, 'requirements'), {
                ...rest,
                assignees: assignees.map((a) => ({ id: a.id, name: a.name, initials: a.initials, color: a.color })),
                status: 'backlog',
                created_at: creationDate,
            });
            setIsSubmitted(true);
        } catch (err) {
            console.error('Submit error:', err);
            // Optionally set error text here
        }
        setSubmitting(false);
    };

    if (authLoading) return <div className="req-form-overlay"><div className="req-form__loading">Verificando sesión...</div></div>;
    if (!currentUser) return <Navigate to="/login" state={{ from: location }} replace />;

    if (isSubmitted) {
        return (
            <div className="req-form-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="req-form__success-card" style={{
                    background: 'var(--color-bg)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-8)',
                    maxWidth: '400px',
                    width: '100%',
                    textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    <CheckCircle size={64} style={{ color: 'var(--color-success)', margin: '0 auto var(--space-4)', display: 'block' }} />
                    <h2 style={{ marginBottom: 'var(--space-2)' }}>Requerimiento Creado</h2>
                    <p style={{ color: 'var(--color-text-muted)', margin: 0 }}>
                        El requerimiento se ha guardado correctamente en el sistema.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="req-form-overlay">
            {/* Header */}
            <header className="req-form__header">
                <div className="req-form__header-brand">
                    <div className="sidebar__logo" style={{ width: 28, height: 28 }}>
                        <Filter size={14} />
                    </div>
                    <span style={{ fontWeight: 700 }}>Nuevo Requerimiento</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <button className="btn btn--icon btn--ghost" onClick={() => navigate('/')}>
                        <X size={20} />
                    </button>
                </div>
            </header>

            <div className="req-form__body">
                {/* Progress */}
                <div className="req-form__progress-section">
                    <div className="req-form__progress-label">
                        <span className="req-form__step-tag">CONFIGURACIÓN INICIAL</span>
                        <h3>Paso {step + 1} de {STEPS.length}: {STEPS[step].label}</h3>
                    </div>
                    <span className="req-form__progress-pct" style={{ color: 'var(--color-primary)' }}>
                        {Math.round(progress)}% completado
                    </span>
                </div>
                <div className="progress-bar" style={{ marginBottom: 'var(--space-2)' }}>
                    <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
                </div>
                {STEPS[step].next && (
                    <p className="req-form__next-hint">→ Siguiente: {STEPS[step].next}</p>
                )}

                {/* Step Content */}
                <div className="req-form__content animate-fade-in" key={step}>
                    {step === 0 && (
                        <div className="req-form__card">
                            {/* Title */}
                            <div className="input-group">
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>¿Cuál es el nombre del proyecto?</h3>
                                <label className="input-group__label">Título del Requerimiento</label>
                                <input
                                    type="text"
                                    className={`input-group__field ${errors.title ? 'input-group__field--error' : ''}`}
                                    placeholder="Ej. Actualización de servidor de base de datos de producción"
                                    value={formData.title}
                                    onChange={(e) => updateField('title', e.target.value)}
                                />
                                {errors.title && <span className="input-group__error">{errors.title}</span>}
                            </div>

                            {/* Requester */}
                            <div className="input-group" style={{ marginTop: 'var(--space-8)' }}>
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>¿Quién solicita este requerimiento?</h3>
                                <label className="input-group__label">Solicitante</label>
                                <input
                                    type="text"
                                    className={`input-group__field ${errors.requester ? 'input-group__field--error' : ''}`}
                                    placeholder="Ej. Nombre del cliente, stakeholder o PO"
                                    value={formData.requester}
                                    onChange={(e) => updateField('requester', e.target.value)}
                                />
                                {errors.requester && <span className="input-group__error">{errors.requester}</span>}
                            </div>

                            {/* Fecha de Creacion */}
                            <div className="input-group" style={{ marginTop: 'var(--space-8)' }}>
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>Fecha de Creación Inicial</h3>
                                <label className="input-group__label">¿Cuándo se originó esta tarea?</label>
                                <input
                                    type="date"
                                    className={`input-group__field ${errors.created_at ? 'input-group__field--error' : ''}`}
                                    value={formData.created_at}
                                    onChange={(e) => updateField('created_at', e.target.value)}
                                />
                                {errors.created_at && <span className="input-group__error">{errors.created_at}</span>}
                            </div>

                            {/* Priority */}
                            <div style={{ marginTop: 'var(--space-8)' }}>
                                <h3 style={{ marginBottom: 'var(--space-4)' }}>Nivel de Prioridad</h3>
                                <div className="req-form__priority-grid">
                                    {PRIORITIES.map(({ value, icon: PIcon, description, color }) => (
                                        <button
                                            key={value}
                                            className={`req-form__priority-card ${formData.priority === value ? 'req-form__priority-card--active' : ''}`}
                                            onClick={() => updateField('priority', value)}
                                        >
                                            <PIcon size={20} style={{ color, opacity: 0.7 }} />
                                            <strong>{value}</strong>
                                            <span>{description}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{ marginTop: 'var(--space-8)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                                    <h3>Descripción Detallada</h3>
                                    <span className="req-form__char-count">Máx. 2000 caracteres</span>
                                </div>
                                <textarea
                                    className={`input-group__field input-group__field--textarea ${errors.description ? 'input-group__field--error' : ''}`}
                                    placeholder="Describe aquí los objetivos, requisitos técnicos y cualquier detalle relevante del requerimiento..."
                                    value={formData.description}
                                    onChange={(e) => updateField('description', e.target.value)}
                                    maxLength={2000}
                                />
                                {errors.description && <span className="input-group__error">{errors.description}</span>}
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="req-form__card">
                            <h3 style={{ marginBottom: 'var(--space-6)' }}>Detalles Técnicos</h3>

                            <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                                <label className="input-group__label">Objetivo</label>
                                <textarea
                                    className="input-group__field input-group__field--textarea"
                                    placeholder="Define los límites del trabajo, entregables esperados..."
                                    value={formData.scope}
                                    onChange={(e) => updateField('scope', e.target.value)}
                                    style={{ minHeight: '100px' }}
                                />
                            </div>

                            <div className="grid grid--2" style={{ marginBottom: 'var(--space-6)' }}>
                                <div className="input-group">
                                    <label className="input-group__label">Horas Estimadas</label>
                                    <input
                                        type="number"
                                        className="input-group__field"
                                        placeholder="Ej. 40"
                                        value={formData.estimatedHours}
                                        onChange={(e) => updateField('estimatedHours', e.target.value)}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-group__label">Equipos Asignados</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {TEAMS.map((t) => {
                                            const isSelected = (formData.teams || []).includes(t);
                                            return (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    className={`req-form__member-chip ${isSelected ? 'req-form__member-chip--active' : ''}`}
                                                    onClick={() => toggleTeam(t)}
                                                    style={{ padding: '6px 12px', width: 'auto', minHeight: '32px' }}
                                                >
                                                    <span style={{ fontSize: 'var(--font-size-xs)' }}>{t}</span>
                                                    {isSelected && <Check size={14} className="req-form__member-check" style={{ marginLeft: '4px' }} />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {errors.teams && <span className="input-group__error">{errors.teams}</span>}
                                </div>
                            </div>

                            {/* Team Members */}
                            <div style={{ marginBottom: 'var(--space-6)' }}>
                                <label className="input-group__label" style={{ marginBottom: 'var(--space-3)', display: 'block' }}>
                                    <UserPlus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                                    Asignar Miembros del Equipo
                                    {(formData.teams || []).length > 0 && (
                                        <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '8px', fontSize: 'var(--font-size-xs)' }}>
                                            — Mostrando miembros de: {formData.teams.join(', ')}
                                        </span>
                                    )}
                                </label>
                                <div className="req-form__members-grid">
                                    {(() => {
                                        const selectedTeams = formData.teams || [];
                                        const filteredMembers = selectedTeams.length > 0
                                            ? availableMembers.filter(m => selectedTeams.includes(m.team))
                                            : availableMembers;

                                        if (filteredMembers.length === 0 && selectedTeams.length > 0) {
                                            return (
                                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', padding: 'var(--space-4)', textAlign: 'center', gridColumn: '1 / -1' }}>
                                                    No hay miembros asignados a los equipos seleccionados. Agrega miembros desde el <strong>Directorio del Equipo</strong>.
                                                </p>
                                            );
                                        }

                                        return filteredMembers.map((member) => {
                                            const isSelected = formData.assignees.some((a) => a.id === member.id);
                                            return (
                                                <button
                                                    key={member.id}
                                                    type="button"
                                                    className={`req-form__member-chip ${isSelected ? 'req-form__member-chip--active' : ''}`}
                                                    onClick={() => toggleAssignee(member)}
                                                >
                                                    <div
                                                        className="avatar avatar--sm"
                                                        style={{ background: member.color, flexShrink: 0 }}
                                                    >
                                                        {member.initials?.[0] || member.name?.[0] || '?'}
                                                    </div>
                                                    <span>{member.name}</span>
                                                    {isSelected && <Check size={14} className="req-form__member-check" />}
                                                </button>
                                            );
                                        });
                                    })()}
                                </div>
                                {formData.assignees.length > 0 && (
                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                                        {formData.assignees.length} miembro{formData.assignees.length > 1 ? 's' : ''} seleccionado{formData.assignees.length > 1 ? 's' : ''}
                                    </p>
                                )}
                            </div>

                            <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                                <label className="input-group__label">Reglas de Negocio</label>
                                <textarea
                                    className="input-group__field input-group__field--textarea"
                                    placeholder="Describe las reglas de negocio que aplican a este requerimiento..."
                                    value={formData.businessRules}
                                    onChange={(e) => updateField('businessRules', e.target.value)}
                                    style={{ minHeight: '100px' }}
                                />
                            </div>

                            <div className="grid grid--2" style={{ marginBottom: 'var(--space-6)' }}>
                                <div className="input-group">
                                    <label className="input-group__label">Tipo de Tiempo</label>
                                    <select
                                        className="input-group__field"
                                        value={formData.timeType}
                                        onChange={(e) => updateField('timeType', e.target.value)}
                                    >
                                        <option value="definido">Tiempo Definido</option>
                                        <option value="indefinido">Tiempo Indefinido</option>
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label className="input-group__label">
                                        <CalendarCheck size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                                        Fecha de Entrega
                                    </label>
                                    <input
                                        type="date"
                                        className="input-group__field"
                                        value={formData.dueDate}
                                        onChange={(e) => updateField('dueDate', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                                <label className="input-group__label">
                                    <Link size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                                    Documentos o Ligas (Drive, Figma, etc.)
                                </label>
                                <textarea
                                    className="input-group__field input-group__field--textarea"
                                    placeholder="Pega aquí los enlaces a Google Drive, Figma, documentos de referencia, etc. Un enlace por línea."
                                    value={formData.attachments}
                                    onChange={(e) => updateField('attachments', e.target.value)}
                                    style={{ minHeight: '80px' }}
                                />
                            </div>

                            <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
                                <label className="input-group__label">Criterios de Aceptación</label>
                                <textarea
                                    className="input-group__field input-group__field--textarea"
                                    placeholder="Lista los criterios que deben cumplirse para considerar el requerimiento como completado..."
                                    value={formData.acceptanceCriteria}
                                    onChange={(e) => updateField('acceptanceCriteria', e.target.value)}
                                    style={{ minHeight: '100px' }}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-group__label">Notas Técnicas</label>
                                <textarea
                                    className="input-group__field input-group__field--textarea"
                                    placeholder="Dependencias, riesgos técnicos, consideraciones de infraestructura..."
                                    value={formData.technicalNotes}
                                    onChange={(e) => updateField('technicalNotes', e.target.value)}
                                    style={{ minHeight: '80px' }}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="req-form__card">
                            <h3 style={{ marginBottom: 'var(--space-6)' }}>Revisión Final</h3>
                            <p style={{ marginBottom: 'var(--space-6)' }}>Verifica que todos los datos sean correctos antes de enviar.</p>

                            <div className="req-form__review-grid">
                                <div className="req-form__review-item">
                                    <span className="req-form__review-label">Título</span>
                                    <span className="req-form__review-value">{formData.title || '—'}</span>
                                </div>
                                <div className="req-form__review-item">
                                    <span className="req-form__review-label">Solicitante</span>
                                    <span className="req-form__review-value">{formData.requester || '—'}</span>
                                </div>
                                <div className="req-form__review-item">
                                    <span className="req-form__review-label">Fecha del Proyecto</span>
                                    <span className="req-form__review-value">{formData.created_at || '—'}</span>
                                </div>
                                <div className="req-form__review-item">
                                    <span className="req-form__review-label">Prioridad</span>
                                    <span className={`badge badge--${formData.priority.toLowerCase()}`}>
                                        {formData.priority}
                                    </span>
                                </div>
                                <div className="req-form__review-item">
                                    <span className="req-form__review-label">Equipos Asignados</span>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                        {formData.teams && formData.teams.length > 0 ? formData.teams.map((t) => (
                                            <span key={t} style={{
                                                display: 'inline-flex', padding: '4px 10px',
                                                background: 'var(--color-bg)', border: '1px solid var(--color-border)',
                                                borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-xs)',
                                                fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text-secondary)'
                                            }}>
                                                {t}
                                            </span>
                                        )) : <span className="req-form__review-value">—</span>}
                                    </div>
                                </div>
                                <div className="req-form__review-item">
                                    <span className="req-form__review-label">Miembros Asignados</span>
                                    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                                        {formData.assignees.length > 0 ? formData.assignees.map((a) => (
                                            <span key={a.id} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                padding: '4px 10px', background: 'var(--color-primary-pale)',
                                                borderRadius: 'var(--radius-full)', fontSize: 'var(--font-size-xs)',
                                            }}>
                                                <span className="avatar avatar--xs" style={{ background: a.color, width: 20, height: 20, fontSize: '10px' }}>
                                                    {a.initials[0]}
                                                </span>
                                                {a.name}
                                            </span>
                                        )) : <span className="req-form__review-value">—</span>}
                                    </div>
                                </div>
                                <div className="req-form__review-item">
                                    <span className="req-form__review-label">Horas Estimadas</span>
                                    <span className="req-form__review-value">{formData.estimatedHours || '—'}</span>
                                </div>
                                <div className="req-form__review-item">
                                    <span className="req-form__review-label">Tipo de Tiempo</span>
                                    <span className="req-form__review-value">{formData.timeType === 'definido' ? 'Tiempo Definido' : 'Tiempo Indefinido'}</span>
                                </div>
                                <div className="req-form__review-item">
                                    <span className="req-form__review-label">Fecha de Entrega</span>
                                    <span className="req-form__review-value">{formData.dueDate || '—'}</span>
                                </div>
                                <div className="req-form__review-item req-form__review-item--full">
                                    <span className="req-form__review-label">Descripción</span>
                                    <span className="req-form__review-value">{formData.description || '—'}</span>
                                </div>
                                {formData.scope && (
                                    <div className="req-form__review-item req-form__review-item--full">
                                        <span className="req-form__review-label">Objetivo</span>
                                        <span className="req-form__review-value">{formData.scope}</span>
                                    </div>
                                )}
                                {formData.businessRules && (
                                    <div className="req-form__review-item req-form__review-item--full">
                                        <span className="req-form__review-label">Reglas de Negocio</span>
                                        <span className="req-form__review-value">{formData.businessRules}</span>
                                    </div>
                                )}
                                {formData.attachments && (
                                    <div className="req-form__review-item req-form__review-item--full">
                                        <span className="req-form__review-label">Documentos / Ligas</span>
                                        <span className="req-form__review-value" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{formData.attachments}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>


                {/* Footer Actions */}
                <div className="req-form__actions">
                    <button
                        className="btn btn--secondary btn--lg"
                        onClick={step === 0 ? () => navigate('/') : handleBack}
                    >
                        {step === 0 ? 'Cancelar' : (
                            <>
                                <ArrowLeft size={16} />
                                Anterior
                            </>
                        )}
                    </button>

                    {step < STEPS.length - 1 ? (
                        <button className="btn btn--primary btn--lg" onClick={handleNext}>
                            Continuar
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            className="btn btn--primary btn--lg"
                            onClick={handleSubmit}
                            disabled={submitting}
                        >
                            {submitting ? 'Enviando...' : 'Crear Requerimiento'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
