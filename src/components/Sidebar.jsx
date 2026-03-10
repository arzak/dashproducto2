import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    CheckSquare,
    Users,
    BarChart3,
    Settings,
    Plus,
} from 'lucide-react';
import './Sidebar.css';

const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Tablero' },
    { path: '/tareas', icon: CheckSquare, label: 'Requerimientos' },
    { path: '/equipo', icon: Users, label: 'Equipo' },
    { path: '/reportes', icon: BarChart3, label: 'Reportes' },
    { path: '/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function Sidebar() {
    const location = useLocation();

    return (
        <aside className="sidebar">
            <div className="sidebar__brand">
                <div className="sidebar__logo">
                    <LayoutDashboard size={20} />
                </div>
                <div>
                    <div className="sidebar__brand-name">Gestión Pro</div>
                    <div className="sidebar__brand-sub">Ciclo de Vida</div>
                </div>
            </div>

            <nav className="sidebar__nav">
                {navItems.map(({ path, icon: Icon, label }) => (
                    <NavLink
                        key={path}
                        to={path}
                        data-label={label}
                        className={({ isActive }) =>
                            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
                        }
                    >
                        <Icon size={18} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar__footer">
                <NavLink to="/nuevo" className="sidebar__new-btn">
                    <Plus size={18} />
                    <span>Nuevo Requerimiento</span>
                </NavLink>
            </div>
        </aside>
    );
}
