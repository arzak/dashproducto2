import { collection, addDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';

/**
 * Crea una notificación de cambio de estado para un requerimiento.
 * @param {Object} requirement - Datos del requerimiento.
 * @param {string} oldStatus - Estado anterior.
 * @param {string} newStatus - Nuevo estado.
 */
export const createStatusChangeNotification = async (requirement, oldStatus, newStatus) => {
    const user = auth.currentUser;
    if (!user) return;

    // Solo notificar si hay un cambio real
    if (oldStatus === newStatus) return;

    try {
        await addDoc(collection(db, 'notifications'), {
            type: 'status_change',
            requirementId: requirement.id,
            requirementTitle: requirement.title || 'Requerimiento sin título',
            oldStatus,
            newStatus,
            actorId: user.uid,
            actorName: user.displayName || user.email || 'Usuario',
            createdAt: serverTimestamp(),
            readBy: [], // Lista de UIDs que han leído la notificación
            // En el sistema actual, notificamos a todos los que NO son el actor
            // En el futuro, esto podría filtrarse por equipo o asignados
        });
    } catch (error) {
        console.error('Error al crear notificación:', error);
    }
};

/**
 * Se suscribe a las notificaciones recientes para el usuario actual.
 */
export const subscribeToNotifications = (callback) => {
    const user = auth.currentUser;
    if (!user) return () => {};

    const q = query(
        collection(db, 'notifications'),
        orderBy('createdAt', 'desc'),
        limit(20)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            isRead: d.data().readBy?.includes(user.uid) || false
        })).filter(n => n.actorId !== user.uid);
        callback(notifications);
    });
};

/**
 * Marca una notificación como leída por el usuario actual.
 */
export const markAsRead = async (notificationId) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, {
            readBy: arrayUnion(user.uid)
        });
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
    }
};

/**
 * Marca todas las notificaciones visibles como leídas.
 */
export const markAllAsRead = async (notifications) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const promises = notifications
            .filter(n => !n.readBy?.includes(user.uid))
            .map(n => updateDoc(doc(db, 'notifications', n.id), {
                readBy: arrayUnion(user.uid)
            }));
        await Promise.all(promises);
    } catch (error) {
        console.warn('Error al marcar todas como leídas:', error);
    }
};
