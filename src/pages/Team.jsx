import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { Users, Edit2, Check, X, UserPlus } from 'lucide-react';
import { db } from '../firebase';

const TEAMS = [
    'Producto',
    'Dirección',
    'Ventas',
    'Mkt',
    'UI/UX',
    'Legal',
    'Investigación',
    'Data scientist',
    'Desarrollo',
    'Equipo de Desarrollo',
    'Equipo de Diseño UI/UX',
    'QA & Testing',
    'Marketing Digital',
    'DevOps / SRE'
];

export default function Team() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ role: '', team: '' });
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMember, setNewMember] = useState({ name: '', email: '', role: 'Dev', team: 'Sin Asignar' });

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'users'));
            const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMembers(usersList);
        } catch (error) {
            console.error("Error fetching members:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const startEditing = (member) => {
        setEditingId(member.id);
        setEditForm({ role: member.role || 'Dev', team: member.team || 'Sin Asignar' });
    };

    const cancelEditing = () => {
        setEditingId(null);
    };

    const saveEdit = async (id) => {
        try {
            await updateDoc(doc(db, 'users', id), {
                role: editForm.role,
                team: editForm.team
            });
            setMembers(prev => prev.map(m => m.id === id ? { ...m, ...editForm } : m));
            setEditingId(null);
        } catch (error) {
            console.error("Error updating member:", error);
        }
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            const names = newMember.name ? newMember.name.split(' ') : ['User'];
            let initials = names[0][0].toUpperCase();
            if (names.length > 1) {
                initials += names[names.length - 1][0].toUpperCase();
            }

            const colors = ['#14B8A6', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6', '#10B981', '#EF4444', '#6366F1'];
            const color = colors[Math.floor(Math.random() * colors.length)];

            const docRef = await addDoc(collection(db, 'users'), {
                name: newMember.name,
                email: newMember.email,
                role: newMember.role,
                team: newMember.team,
                initials: initials,
                color: color,
                status: 'activo',
                createdAt: new Date().toISOString()
            });

            setMembers([...members, { id: docRef.id, ...newMember, initials, color, status: 'activo' }]);
            setShowAddForm(false);
            setNewMember({ name: '', email: '', role: 'Dev', team: 'Sin Asignar' });
        } catch (error) {
            console.error("Error adding new member:", error);
        }
    };

    if (loading) {
        return (
            <div className="animate-fade-in" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                Cargando miembros del equipo...
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="page-header__title">
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <Users size={24} color="var(--color-primary)" />
                        Directorio del Equipo
                    </h1>
                    <p>Administra los roles y equipos de los usuarios registrados.</p>
                </div>
                <button className="btn btn--primary" onClick={() => setShowAddForm(true)}>
                    <UserPlus size={18} style={{ marginRight: '8px' }} />
                    Agregar Miembro
                </button>
            </div>

            {showAddForm && (
                <div className="card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-6)', background: 'var(--color-primary-pale)', border: '1px solid var(--color-primary-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                        <h3 style={{ margin: 0 }}>Nuevo Miembro del Equipo</h3>
                        <button className="btn " onClick={() => setShowAddForm(false)} style={{ padding: '4px' }}><X size={18} /></button>
                    </div>
                    <form onSubmit={handleAddMember} className="grid grid--2" style={{ gap: 'var(--space-4)' }}>
                        <div className="input-group">
                            <label className="input-group__label">Nombre Completo</label>
                            <input type="text" className="input-group__field" required value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} placeholder="Ej. Ana Pérez" />
                        </div>
                        <div className="input-group">
                            <label className="input-group__label">Correo Electrónico</label>
                            <input type="email" className="input-group__field" required value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} placeholder="ana@ejemplo.com" />
                        </div>
                        <div className="input-group">
                            <label className="input-group__label">Rol</label>
                            <select className="input-group__field" value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })}>
                                <option value="Admin">Admin</option>
                                <option value="Product Owner">Product Owner</option>
                                <option value="Scrum Master">Scrum Master</option>
                                <option value="Dev">Dev</option>
                            </select>
                        </div>
                        <div className="input-group">
                            <label className="input-group__label">Equipo</label>
                            <select className="input-group__field" value={newMember.team} onChange={e => setNewMember({ ...newMember, team: e.target.value })}>
                                <option value="Sin Asignar">Sin Asignar</option>
                                {TEAMS.map(team => (
                                    <option key={team} value={team}>{team}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                            <button type="submit" className="btn btn--primary">Guardar Usuario</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border-light)' }}>
                    <h3 style={{ fontSize: 'var(--font-size-md)', margin: 0 }}>Usuarios y Permisos</h3>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ background: 'var(--color-bg)', borderBottom: '2px solid var(--color-border)' }}>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Usuario</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Correo</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Rol</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Equipo</th>
                                <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {members.map(member => (
                                <tr key={member.id} style={{ borderBottom: '1px solid var(--color-border-light)', transition: 'background var(--transition-fast)' }}>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                            <div className="avatar avatar--md" style={{ background: member.color || 'var(--color-neutral-300)', flexShrink: 0 }}>
                                                {member.initials || (member.name ? member.name[0]?.toUpperCase() : '?')}
                                            </div>
                                            <span style={{ fontWeight: 'var(--font-weight-medium)' }}>{member.name || 'Usuario'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: 'var(--space-3) var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        {member.email}
                                    </td>

                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        {editingId === member.id ? (
                                            <select
                                                className="input"
                                                value={editForm.role}
                                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                                style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)', minWidth: '100px' }}
                                            >
                                                <option value="Admin">Admin</option>
                                                <option value="Product Owner">Product Owner</option>
                                                <option value="Scrum Master">Scrum Master</option>
                                                <option value="Dev">Dev</option>
                                            </select>
                                        ) : (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: 'var(--font-size-xs)',
                                                fontWeight: 'var(--font-weight-medium)',
                                                background: member.role === 'Admin' ? 'var(--color-danger-pale)' : 'var(--color-neutral-100)',
                                                color: member.role === 'Admin' ? 'var(--color-danger)' : 'var(--color-text-secondary)'
                                            }}>
                                                {member.role || 'Dev'}
                                            </span>
                                        )}
                                    </td>

                                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                                        {editingId === member.id ? (
                                            <select
                                                className="input"
                                                value={editForm.team}
                                                onChange={(e) => setEditForm({ ...editForm, team: e.target.value })}
                                                style={{ padding: '4px 8px', fontSize: 'var(--font-size-sm)', minWidth: '120px' }}
                                            >
                                                <option value="Sin Asignar">Sin Asignar</option>
                                                {TEAMS.map(team => (
                                                    <option key={team} value={team}>{team}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span style={{
                                                display: 'inline-block',
                                                padding: '2px 8px',
                                                borderRadius: 'var(--radius-full)',
                                                fontSize: 'var(--font-size-xs)',
                                                fontWeight: 'var(--font-weight-medium)',
                                                background: member.team === 'Sin Asignar' ? 'var(--color-warning-pale)' : 'var(--color-primary-pale)',
                                                color: member.team === 'Sin Asignar' ? 'var(--color-warning-dark)' : 'var(--color-primary-dark)'
                                            }}>
                                                {member.team || 'Sin Asignar'}
                                            </span>
                                        )}
                                    </td>

                                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                                        {editingId === member.id ? (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-1)' }}>
                                                <button onClick={() => saveEdit(member.id)} className="btn btn--primary" style={{ padding: '4px', minWidth: '32px' }}>
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={cancelEditing} className="btn " style={{ padding: '4px', background: 'var(--color-neutral-200)', minWidth: '32px' }}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => startEditing(member)} className="btn btn--outline" style={{ padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}>
                                                <Edit2 size={14} style={{ marginRight: '4px' }} /> Editar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {members.length === 0 && (
                                <tr>
                                    <td colSpan="5" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        No hay usuarios en el sistema. Inicia sesión con Google para registrarte.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
