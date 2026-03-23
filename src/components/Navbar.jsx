import { useState, useEffect, useRef } from 'react';
import { Search, Bell, Settings, LogOut, FileText, X, Clock } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { subscribeToNotifications, markAsRead, markAllAsRead } from '../services/notificationService';
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

    const [notifications, setNotifications] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const notifRef = useRef(null);

    // Load all requirements once from Firestore
    useEffect(() => {
        try {
            const unsub = onSnapshot(collection(db, 'requirements'), (snap) => {
                setRequirements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            }, () => { });
            return unsub;
        } catch { /* no firebase */ }
    }, []);

    // Load notifications
    useEffect(() => {
        if (!currentUser) return;
        const unsub = subscribeToNotifications((notifs) => {
            setNotifications(notifs);
        });
        return unsub;
    }, [currentUser]);

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
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setIsNotifOpen(false);
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

    const handleNotifClick = (notif) => {
        markAsRead(notif.id);
        setIsNotifOpen(false);
        navigate(`/requerimiento/${notif.requirementId}`);
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const diff = Date.now() - date.getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `Hace ${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `Hace ${hours}h`;
        return date.toLocaleDateString();
    };

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
                <div style={{ position: 'relative' }} ref={notifRef}>
                    <button 
                        className="navbar__icon-btn" 
                        title="Notificaciones"
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                    >
                        <Bell size={20} />
                        {unreadCount > 0 && <span className="navbar__notification-dot" />}
                    </button>

                    {isNotifOpen && (
                        <div className="navbar__notifications-dropdown">
                            <div className="navbar__notif-header">
                                <h3>Notificaciones</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        className="navbar__notif-clear" 
                                        onClick={() => markAllAsRead(notifications)}
                                    >
                                        Marcar todo como leído
                                    </button>
                                )}
                            </div>
                            <div className="navbar__notif-list">
                                {notifications.length > 0 ? (
                                    notifications.map(n => (
                                        <button 
                                            key={n.id} 
                                            className={`navbar__notif-item ${!n.isRead ? 'navbar__notif-item--unread' : ''}`}
                                            onClick={() => handleNotifClick(n)}
                                        >
                                            <div className="navbar__notif-icon">
                                                <FileText size={16} />
                                            </div>
                                            <div className="navbar__notif-content">
                                                <div className="navbar__notif-title">
                                                    {n.actorName} movió una tarea
                                                </div>
                                                <div className="navbar__notif-desc">
                                                    <strong>{n.requirementTitle}</strong> pasó de{' '}
                                                    <span style={{ color: STATUS_COLORS[n.oldStatus] }}>{STATUS_LABELS[n.oldStatus]}</span> a{' '}
                                                    <span style={{ color: STATUS_COLORS[n.newStatus] }}>{STATUS_LABELS[n.newStatus]}</span>
                                                </div>
                                                <div className="navbar__notif-time">{formatTime(n.createdAt)}</div>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="navbar__notif-empty">
                                        No tienes notificaciones
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

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
