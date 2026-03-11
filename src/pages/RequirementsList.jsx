import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { collection, doc, updateDoc, onSnapshot, serverTimestamp, addDoc, Timestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Edit2, X, UserPlus, Check, Link, CalendarCheck } from 'lucide-react';
import './RequirementsList.css';

const STATUS_LABELS = {
    backlog: 'Backlog',
    analisis: 'Análisis QA',
    desarrollo: 'Desarrollo',
    review: 'Code Review',
    done: 'Terminado',
    rechazado: 'Rechazado',
};

const STATUS_COLORS = {
    backlog: '#94A3B8',
    analisis: '#3B82F6',
    desarrollo: '#F59E0B',
    review: '#8B5CF6',
    done: '#10B981',
    rechazado: '#EF4444',
};

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
    'DevOps / SRE',
];

const PRIORITIES = ['Alta', 'Media', 'Baja'];

const FIELD_LABELS = {
    title: 'Título',
    description: 'Descripción',
    scope: 'Alcance',
    requester: 'Solicitante',
    priority: 'Prioridad',
    status: 'Estado',
    teams: 'Equipos',
    rejectionReason: 'Motivo de Rechazo',
    assignees: 'Miembros Asignados',
    businessRules: 'Reglas de Negocio',
    timeType: 'Tipo de Tiempo',
    attachments: 'Documentos / Ligas',
    dueDate: 'Fecha de Entrega',
};

export default function RequirementsList() {
    const [requirements, setRequirements] = useState([]);
    const [editingReq, setEditingReq] = useState(null);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [availableMembers, setAvailableMembers] = useState([]);

    // Filters and Sorting
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [sortByDate, setSortByDate] = useState('desc'); // 'desc' | 'asc'


    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'requirements'), (snapshot) => {
            const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setRequirements(data);
        });

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

        return unsubscribe;
    }, []);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'S/F';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    // Derived list for display
    const displayedRequirements = requirements
        .filter(req => {
            if (filterStatus && req.status !== filterStatus) return false;
            if (filterPriority && req.priority !== filterPriority) return false;
            return true;
        })
        .sort((a, b) => {
            const dateA = a.created_at?.toDate ? a.created_at.toDate() : new Date(a.created_at || 0);
            const dateB = b.created_at?.toDate ? b.created_at.toDate() : new Date(b.created_at || 0);
            return sortByDate === 'desc' ? dateB - dateA : dateA - dateB;
        });


    const handleEditClick = (req) => {
        setFormData({
            title: req.title || '',
            description: req.description || '',
            scope: req.scope || '',
            requester: req.requester || '',
            priority: req.priority || 'Media',
            status: req.status || 'backlog',
            teams: req.teams || [],
            team: req.team || '', // Legacy fallback
            rejectionReason: req.rejectionReason || '',
            assignees: req.assignees || [],
            businessRules: req.businessRules || '',
            timeType: req.timeType || 'definido',
            attachments: req.attachments || '',
            dueDate: req.dueDate || '',
        });
        setEditingReq(req);
    };

    const toggleAssignee = (member) => {
        setFormData((prev) => {
            const currentAssignees = prev.assignees || [];
            const exists = currentAssignees.find((a) => a.id === member.id);
            return {
                ...prev,
                assignees: exists
                    ? currentAssignees.filter((a) => a.id !== member.id)
                    : [...currentAssignees, { id: member.id, name: member.name, initials: member.initials, color: member.color }],
            };
        });
    };

    const toggleTeam = (teamName) => {
        setFormData((prev) => {
            const currentTeams = prev.teams || [];
            const exists = currentTeams.includes(teamName);
            return {
                ...prev,
                teams: exists
                    ? currentTeams.filter((t) => t !== teamName)
                    : [...currentTeams, teamName],
            };
        });
    };

    const handleCloseModal = () => {
        setEditingReq(null);
        setFormData({});
    };

    const handleSave = async () => {
        if (!editingReq || saving) return;
        setSaving(true);

        // ── 1. Detect changed fields ──
        const changes = [];
        Object.keys(FIELD_LABELS).forEach((field) => {
            if (field === 'assignees') {
                const oldNames = (editingReq.assignees || []).map(a => a.name).sort().join(', ');
                const newNames = (formData.assignees || []).map(a => a.name).sort().join(', ');
                if (oldNames !== newNames) {
                    changes.push({
                        field: FIELD_LABELS[field],
                        from: oldNames || '—',
                        to: newNames || '—',
                    });
                }
            } else if (field === 'teams') {
                const oldVals = (editingReq.teams || []).sort().join(', ');
                const newVals = (formData.teams || []).sort().join(', ');
                if (oldVals !== newVals) {
                    changes.push({
                        field: FIELD_LABELS[field],
                        from: oldVals || '—',
                        to: newVals || '—',
                    });
                }
            } else {
                const oldVal = String(editingReq[field] || '');
                const newVal = String(formData[field] || '');
                if (oldVal !== newVal) {
                    changes.push({
                        field: FIELD_LABELS[field],
                        from: oldVal || '—',
                        to: newVal || '—',
                    });
                }
            }
        });

        // ── 2. Update requirement in Firestore ──
        try {
            const updatePayload = { ...formData };
            if (formData.status !== editingReq.status) {
                updatePayload[`status_${formData.status}_at`] = serverTimestamp();
            }
            await updateDoc(doc(db, 'requirements', editingReq.id), updatePayload);
        } catch (error) {
            console.error('Error actualizando requerimiento:', error);
            alert('No se pudo guardar. Verifica tus permisos en Firestore.');
            setSaving(false);
            return;
        }

        // ── 3. Close modal right after save succeeds ──
        handleCloseModal();
        setSaving(false);

        // ── 4. Write audit log (non-blocking, best-effort) ──
        if (changes.length > 0) {
            const user = auth.currentUser;
            addDoc(collection(db, 'audit_logs'), {
                requirement_id: editingReq.id,
                requirement_title: editingReq.title || editingReq.id,
                edited_by: user ? (user.displayName || user.email) : 'Desconocido',
                edited_by_uid: user?.uid || null,
                edited_at: Timestamp.now(),
                changes,
            }).catch((err) => console.warn('Audit log no guardado:', err));
        }
    };

    return (
        <div className="requirements-list animate-fade-in">
            <div className="page-header">
                <div className="page-header__title">
                    <h1>Lista de Requerimientos</h1>
                    <p>Vista tabular detallada y edición de requerimientos activos.</p>
                </div>
            </div>

            <div className="req-filters animate-fade-in" style={{ display: 'flex', gap: '12px', marginBottom: 'var(--space-6)', flexWrap: 'wrap' }}>
                <div className="input-group" style={{ margin: 0, width: '220px' }}>
                    <select
                        className="input-group__field"
                        value={sortByDate}
                        onChange={e => setSortByDate(e.target.value)}
                    >
                        <option value="desc">Más recientes primero</option>
                        <option value="asc">Más antiguos primero</option>
                    </select>
                </div>

                <div className="input-group" style={{ margin: 0, width: '200px' }}>
                    <select
                        className="input-group__field"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="">Todos los Estados</option>
                        {Object.entries(STATUS_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="input-group" style={{ margin: 0, width: '200px' }}>
                    <select
                        className="input-group__field"
                        value={filterPriority}
                        onChange={e => setFilterPriority(e.target.value)}
                    >
                        <option value="">Todas las Prioridades</option>
                        {PRIORITIES.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                </div>
            </div>


            <div className="card" style={{ overflowX: 'auto' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Requerimiento</th>
                            <th>Descripción / Alcance</th>
                            <th>Solicitante / Equipo</th>
                            <th>Fecha</th>
                            <th>Prioridad</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedRequirements.map((req) => (
                            <tr key={req.id}>
                                <td>
                                    <div style={{ fontWeight: 600 }}>
                                        <RouterLink 
                                            to={`/requerimiento/${req.id}`}
                                            title="Ver detalles"
                                            style={{ color: 'var(--color-info)', textDecoration: 'none' }}
                                        >
                                            {req.title}
                                        </RouterLink>
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                                        ID: {req.id.slice(0, 8)}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: 'var(--font-size-sm)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <strong>Desc:</strong> {req.description || 'N/A'}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                        <strong>Alcance:</strong> {req.scope || 'N/A'}
                                    </div>
                                    {req.status === 'rechazado' && req.rejectionReason && (
                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)', maxWidth: '280px', marginTop: '4px', fontStyle: 'italic' }}>
                                            <strong>Motivo:</strong> {req.rejectionReason}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <div style={{ fontSize: 'var(--font-size-sm)' }}>
                                        {req.requester || 'Sin solicitante'}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: '2px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {req.teams?.length > 0 ? req.teams.join(', ') : (req.team || 'Sin equipo')}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                        {formatDate(req.created_at)}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge badge--${(req.priority || 'media').toLowerCase()}`}>
                                        {req.priority || 'Media'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[req.status] || STATUS_COLORS.backlog }} />
                                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                                            {STATUS_LABELS[req.status] || STATUS_LABELS.backlog}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <button
                                        className="btn btn--icon btn--ghost"
                                        onClick={() => handleEditClick(req)}
                                        title="Editar requerimiento"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {displayedRequirements.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                                    No se encontraron requerimientos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal — portal so it escapes sidebar/page layout */}
            {editingReq && createPortal(
                <div className="req-modal-overlay">
                    <div className="req-modal-content animate-slide-in">
                        <div className="req-modal-header">
                            <div>
                                <h2>Editar Requerimiento</h2>
                                <p>Modifica los campos del requerimiento seleccionado.</p>
                            </div>
                            <button className="btn btn--icon btn--ghost" onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="req-modal-body grid grid--2">
                            <div className="input-group">
                                <label className="input-group__label">Título</label>
                                <input
                                    type="text"
                                    className="input-group__field"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-group__label">Solicitante</label>
                                <input
                                    type="text"
                                    className="input-group__field"
                                    value={formData.requester}
                                    onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                                />
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-group__label">Descripción</label>
                                <textarea
                                    className="input-group__field"
                                    style={{ height: '80px', resize: 'vertical' }}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-group__label">Alcance y Límites</label>
                                <textarea
                                    className="input-group__field"
                                    style={{ height: '60px', resize: 'vertical' }}
                                    value={formData.scope}
                                    onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                                />
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-group__label" style={{ marginBottom: 'var(--space-3)', display: 'block' }}>
                                    Equipos Asignados
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {TEAMS.map((t) => {
                                        const isSelected = (formData.teams || []).includes(t);
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                className={`req-form__member-chip ${isSelected ? 'req-form__member-chip--active' : ''}`}
                                                onClick={() => toggleTeam(t)}
                                                style={{ justifyContent: 'space-between', padding: '6px 12px', width: 'auto', minHeight: '32px' }}
                                            >
                                                <span style={{ fontSize: 'var(--font-size-xs)' }}>{t}</span>
                                                {isSelected && <Check size={14} className="req-form__member-check" style={{ marginLeft: '4px' }} />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="input-group">
                                <label className="input-group__label">Prioridad</label>
                                <select
                                    className="input-group__field"
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                >
                                    {PRIORITIES.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label className="input-group__label" style={{ marginBottom: 'var(--space-3)', display: 'block' }}>
                                    <UserPlus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                                    Miembros Asignados
                                </label>
                                <div className="req-form__members-grid">
                                    {availableMembers.map((member) => {
                                        const isSelected = (formData.assignees || []).some((a) => a.id === member.id);
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
                                                    {member.initials[0]}
                                                </div>
                                                <span>{member.name}</span>
                                                {isSelected && <Check size={14} className="req-form__member-check" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>


                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-group__label">Reglas de Negocio</label>
                                <textarea
                                    className="input-group__field"
                                    style={{ height: '60px', resize: 'vertical' }}
                                    value={formData.businessRules}
                                    onChange={(e) => setFormData({ ...formData, businessRules: e.target.value })}
                                    placeholder="Reglas de negocio que aplican..."
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-group__label">Tipo de Tiempo</label>
                                <select
                                    className="input-group__field"
                                    value={formData.timeType}
                                    onChange={(e) => setFormData({ ...formData, timeType: e.target.value })}
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
                                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                />
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-group__label">
                                    <Link size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />
                                    Documentos / Ligas
                                </label>
                                <textarea
                                    className="input-group__field"
                                    style={{ height: '60px', resize: 'vertical' }}
                                    value={formData.attachments}
                                    onChange={(e) => setFormData({ ...formData, attachments: e.target.value })}
                                    placeholder="Enlaces a Drive, Figma, documentos de referencia..."
                                />
                            </div>

                            <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                <label className="input-group__label">Estado del Requerimiento</label>
                                <select
                                    className="input-group__field"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.status === 'rechazado' && (
                                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="input-group__label">Razón del Rechazo</label>
                                    <textarea
                                        className="input-group__field"
                                        style={{ height: '60px', resize: 'vertical' }}
                                        value={formData.rejectionReason}
                                        onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                                        placeholder="Motivo por el cual este requerimiento no se llevará a cabo..."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="req-modal-footer">
                            <button className="btn btn--secondary" onClick={handleCloseModal} disabled={saving}>
                                Cancelar
                            </button>
                            <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
