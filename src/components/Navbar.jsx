import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Settings, LogOut, FileText, X, Clock } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

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

export default function Navbar() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [query, setQuery] = useState('');
    const [requirements, setRequirements] = useState([]);
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [focused, setFocused] = useState(false);
    const [recentSearches, setRecentSearches] = useState(() => {
        try { return JSON.parse(localStorage.getItem('recentSearches') || '[]'); } catch { return []; }
    });

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Load all requirements once from Firestore
    useEffect(() => {
        try {
            const unsub = onSnapshot(collection(db, 'requirements'), (snap) => {
                setRequirements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, () => { });
            return unsub;
        } catch { /* no firebase */ }
    }, []);

    // Filter in real time
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const q = query.toLowerCase();
        const filtered = requirements.filter(r =>
            r.title?.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.requester?.toLowerCase().includes(q) ||
            r.team?.toLowerCase().includes(q) ||
            r.businessRules?.toLowerCase().includes(q)
        ).slice(0, 8);
        setResults(filtered);
    }, [query, requirements]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(e.target) &&
                inputRef.current && !inputRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Keyboard shortcut Ctrl+K / Cmd+K
    useEffect(() => {
        const handler = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                inputRef.current?.blur();
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    const handleSelect = (req) => {
        // Save to recent searches
        const updated = [
            { id: req.id, title: req.title },
            ...recentSearches.filter(r => r.id !== req.id),
        ].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));

        setIsOpen(false);
        setQuery('');
        navigate(`/requerimiento/${req.id}`);
    };

    const handleRecentClick = (item) => {
        navigate(`/requerimiento/${item.id}`);
        setIsOpen(false);
    };

    const clearRecent = (e, id) => {
        e.stopPropagation();
        const updated = recentSearches.filter(r => r.id !== id);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const showDropdown = isOpen && (query.trim() ? true : recentSearches.length > 0);

    return (
        <header className="navbar">
            {/* Search bar */}
            <div className="navbar__search-wrap" ref={dropdownRef}>
                <div className={`navbar__search ${focused ? 'navbar__search--focused' : ''}`}>
                    <Search size={15} className="navbar__search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar requerimiento..."
                        className="navbar__search-input"
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                        onFocus={() => { setFocused(true); setIsOpen(true); }}
                        onBlur={() => setFocused(false)}
                    />
                    {query && (
                        <button
                            className="navbar__search-clear"
                            onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }}
                        >
                            <X size={14} />
                        </button>
                    )}
                    <kbd className="navbar__search-kbd">⌘K</kbd>
                </div>

                {/* Dropdown */}
                {showDropdown && (
                    <div className="navbar__dropdown">
                        {query.trim() ? (
                            results.length > 0 ? (
                                <>
                                    <div className="navbar__dropdown-label">Resultados</div>
                                    {results.map(r => (
                                        <button
                                            key={r.id}
                                            className="navbar__dropdown-item"
                                            onMouseDown={() => handleSelect(r)}
                                        >
                                            <FileText size={14} className="navbar__dropdown-item-icon" />
                                            <div className="navbar__dropdown-item-info">
                                                <span className="navbar__dropdown-item-title">{r.title}</span>
                                                <span className="navbar__dropdown-item-sub">
                                                    {r.requester && `${r.requester} · `}
                                                    <span style={{ color: STATUS_COLORS[r.status] || '#94A3B8' }}>
                                                        {STATUS_LABELS[r.status] || r.status}
                                                    </span>
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </>
                            ) : (
                                <div className="navbar__dropdown-empty">
                                    <FileText size={24} style={{ color: 'var(--color-text-muted)', marginBottom: '8px' }} />
                                    <span>Sin resultados para "<strong>{query}</strong>"</span>
                                </div>
                            )
                        ) : (
                            recentSearches.length > 0 && (
                                <>
                                    <div className="navbar__dropdown-label">Búsquedas recientes</div>
                                    {recentSearches.map(item => (
                                        <button
                                            key={item.id}
                                            className="navbar__dropdown-item"
                                            onMouseDown={() => handleRecentClick(item)}
                                        >
                                            <Clock size={14} className="navbar__dropdown-item-icon" style={{ color: 'var(--color-text-muted)' }} />
                                            <div className="navbar__dropdown-item-info">
                                                <span className="navbar__dropdown-item-title">{item.title}</span>
                                            </div>
                                            <button
                                                className="navbar__dropdown-item-remove"
                                                onMouseDown={(e) => clearRecent(e, item.id)}
                                                title="Quitar"
                                            >
                                                <X size={12} />
                                            </button>
                                        </button>
                                    ))}
                                </>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="navbar__actions">
                <button className="navbar__icon-btn" title="Notificaciones">
                    <Bell size={20} />
                </button>
                <button className="navbar__icon-btn" title="Configuración">
                    <Settings size={20} />
                </button>

                {currentUser && (
                    <div className="navbar__user">
                        {currentUser.photoURL ? (
                            <img
                                src={currentUser.photoURL}
                                alt={currentUser.displayName}
                                className="navbar__avatar"
                            />
                        ) : (
                            <div className="navbar__avatar navbar__avatar--placeholder">
                                {currentUser.displayName?.[0] || 'U'}
                            </div>
                        )}
                        <button
                            className="navbar__icon-btn navbar__icon-btn--logout"
                            onClick={logout}
                            title="Cerrar sesión"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
