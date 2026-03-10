import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';

const AuthContext = createContext(null);

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fallback: If Firebase auth state takes more than 5 seconds, drop the loading screen
        const loadingFallbackTimeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            clearTimeout(loadingFallbackTimeout);
            if (user) {
                setCurrentUser(user);
                try {
                    // Try to get user role, but don't hang forever
                    const fetchUserDoc = getDoc(doc(db, 'users', user.uid));
                    // 5-second timeout to prevent the app from freezing if Firestore has issues
                    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));

                    const userDoc = await Promise.race([fetchUserDoc, timeout]);

                    if (userDoc.exists()) {
                        setRole(userDoc.data().role || 'Dev');
                    } else {
                        // Generate initials from display name
                        const names = user.displayName ? user.displayName.split(' ') : ['User'];
                        let initials = names[0][0].toUpperCase();
                        if (names.length > 1) {
                            initials += names[names.length - 1][0].toUpperCase();
                        }

                        // Generate a random pleasant color for the avatar
                        const colors = ['#14B8A6', '#8B5CF6', '#F59E0B', '#EC4899', '#3B82F6', '#10B981', '#EF4444', '#6366F1'];
                        const color = colors[Math.floor(Math.random() * colors.length)];

                        await setDoc(doc(db, 'users', user.uid), {
                            email: user.email,
                            name: user.displayName || 'Unnamed User',
                            photoURL: user.photoURL,
                            role: 'Dev',
                            team: 'Sin Asignar', // Waiting to be assigned
                            initials: initials,
                            color: color,
                            status: 'activo',
                            createdAt: new Date().toISOString(),
                        });
                        setRole('Dev');
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    setRole('Dev');
                } finally {
                    setLoading(false);
                }
            } else {
                setCurrentUser(null);
                setRole(null);
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const login = async () => {
        try {
            // Use popup with specific settings to handle COOP
            googleProvider.setCustomParameters({
                prompt: 'select_account',
            });
            const result = await signInWithPopup(auth, googleProvider);
            return result;
        } catch (err) {
            // If popup blocked, the auth state listener will still catch it
            // via the redirect fallback
            console.error('Login failed:', err);
            throw err;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
        } catch (err) {
            console.error('Logout failed:', err);
        }
    };

    const value = { currentUser, role, loading, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
