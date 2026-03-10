import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import KanbanBoard from './pages/KanbanBoard';
import RequirementForm from './pages/RequirementForm';
import Login from './pages/Login';
import Team from './pages/Team';
import RequirementsList from './pages/RequirementsList';
import { useAuth } from './context/AuthContext';

function AppLayout({ children }) {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-area">
                <Navbar />
                <div className="page-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

export default function App() {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // Full-screen routes (no sidebar/navbar) — must render even while loading
    const fullScreenRoutes = ['/login', '/nuevo'];
    const isFullScreen = fullScreenRoutes.includes(location.pathname);

    if (isFullScreen) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/nuevo" element={<RequirementForm />} />
            </Routes>
        );
    }

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                color: 'var(--color-text-muted)',
                fontFamily: 'var(--font-family)',
            }}>
                Cargando...
            </div>
        );
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <AppLayout>
            <Routes>
                <Route path="/" element={<KanbanBoard />} />
                <Route path="/tareas" element={<RequirementsList />} />
                <Route path="/reportes" element={<Dashboard />} />
                <Route path="/equipo" element={<Team />} />
                <Route path="/ajustes" element={
                    <div className="animate-fade-in">
                        <div className="page-header">
                            <div className="page-header__title">
                                <h1>Ajustes</h1>
                                <p>Configuración general del sistema.</p>
                            </div>
                        </div>
                        <div className="card" style={{ padding: 'var(--space-16)', textAlign: 'center' }}>
                            <p style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-text-muted)' }}>
                                Módulo de ajustes — próximamente
                            </p>
                        </div>
                    </div>
                } />
            </Routes>
        </AppLayout>
    );
}
