import { Search, Bell, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
    const { currentUser, logout } = useAuth();

    return (
        <header className="navbar">
            <div className="navbar__search">
                <Search size={16} className="navbar__search-icon" />
                <input
                    type="text"
                    placeholder="Buscar métricas..."
                    className="navbar__search-input"
                />
            </div>

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
