import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './Ajustes.css';

export default function Ajustes() {
    const { role } = useAuth();
    const [domains, setDomains] = useState([]);
    const [newDomain, setNewDomain] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'auth');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().allowedDomains) {
                    setDomains(docSnap.data().allowedDomains);
                } else {
                    setDomains(['@globalt.com.mx', '@mhs.com.mx']);
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };

        if (role === 'Admin') {
            fetchSettings();
        } else {
            setLoading(false);
        }
    }, [role]);

    const handleAddDomain = () => {
        let domainToAdd = newDomain.trim().toLowerCase();
        if (!domainToAdd) return;
        
        if (!domainToAdd.startsWith('@')) {
            domainToAdd = '@' + domainToAdd;
        }

        if (!domains.includes(domainToAdd)) {
            setDomains([...domains, domainToAdd]);
        }
        setNewDomain('');
    };

    const handleRemoveDomain = (domainToRemove) => {
        setDomains(domains.filter(d => d !== domainToRemove));
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await setDoc(doc(db, 'settings', 'auth'), { allowedDomains: domains }, { merge: true });
            setMessage({ type: 'success', text: 'Configuración guardada correctamente.' });
        } catch (error) {
            console.error("Error saving settings:", error);
            setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
        } finally {
            setSaving(false);
        }
    };

    if (role !== 'Admin') {
        return (
            <div className="animate-fade-in">
                <div className="page-header">
                    <div className="page-header__title">
                        <h1>Ajustes</h1>
                        <p>Configuración general del sistema.</p>
                    </div>
                </div>
                <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-danger)' }}>
                        No tienes permisos para acceder a esta sección. Solo los administradores pueden modificar los ajustes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in ajustes-page">
            <div className="page-header">
                <div className="page-header__title">
                    <h1>Ajustes</h1>
                    <p>Configuración general del sistema.</p>
                </div>
            </div>

            <div className="card">
                <div className="card__header">
                    <h3>Restricción de Acceso</h3>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                        Solo los correos que pertenezcan a los dominios listados podrán registrarse e iniciar sesión.
                    </p>
                </div>
                
                <div className="card__content">
                    {message && (
                        <div className={`ajustes__message ajustes__message--${message.type}`}>
                            {message.text}
                        </div>
                    )}

                    {loading ? (
                        <p>Cargando configuración...</p>
                    ) : (
                        <div className="ajustes__domains">
                            <div className="ajustes__domains-input-group">
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Ej: @empresa.com"
                                    value={newDomain}
                                    onChange={(e) => setNewDomain(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddDomain();
                                        }
                                    }}
                                />
                                <button 
                                    className="btn btn--secondary" 
                                    onClick={handleAddDomain}
                                    type="button"
                                >
                                    Agregar
                                </button>
                            </div>

                            <ul className="ajustes__domains-list">
                                {domains.map((domain) => (
                                    <li key={domain} className="ajustes__domain-tag">
                                        {domain}
                                        <button 
                                            className="ajustes__domain-remove"
                                            onClick={() => handleRemoveDomain(domain)}
                                        >
                                            &times;
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <div style={{ marginTop: 'var(--space-6)' }}>
                                <button 
                                    className="btn btn--primary" 
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
