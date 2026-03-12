import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare, Clock, User, Loader2 } from 'lucide-react';
import './RequirementComments.css';

export default function RequirementComments({ requirementId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const { currentUser, userData } = useAuth();

    useEffect(() => {
        if (!requirementId) return;

        console.log("Fetching comments for requirement:", requirementId);
        const q = query(
            collection(db, 'requirements', requirementId, 'comments'),
            orderBy('created_at', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("Comments loaded:", data.length);
            setComments(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching comments:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [requirementId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || sending || !currentUser) {
            if (!currentUser) alert("Debes iniciar sesión para comentar.");
            return;
        }

        setSending(true);
        try {
            const commentData = {
                text: newComment.trim(),
                author_name: userData?.name || currentUser?.displayName || currentUser?.email || 'Usuario',
                author_uid: currentUser?.uid,
                author_email: currentUser?.email,
                created_at: serverTimestamp(),
                author_initials: userData?.initials || currentUser?.displayName?.charAt(0).toUpperCase() || 'U',
                author_color: userData?.color || '#64748B' 
            };

            await addDoc(collection(db, 'requirements', requirementId, 'comments'), commentData);
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            alert("No se pudo enviar el comentario: " + error.message);
        } finally {
            setSending(false);
        }
    };

    const formatCommentDate = (timestamp) => {
        if (!timestamp) return 'Recién';
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString('es-MX', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="comments-loading">
                <Loader2 size={24} className="animate-spin" />
                <span>Cargando comentarios...</span>
            </div>
        );
    }

    return (
        <div className="requirement-comments">
            <div className="comments-header">
                <MessageSquare size={18} />
                <h3>Comentarios del Proyecto ({comments.length})</h3>
            </div>

            <form className="comment-form" onSubmit={handleSubmit}>
                <textarea
                    placeholder="Escribe un comentario o actualización..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={sending}
                />
                <button type="submit" className="btn btn--primary" disabled={sending || !newComment.trim()}>
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {sending ? 'Enviando...' : 'Comentar'}
                </button>
            </form>

            <div className="comments-list">
                {comments.length === 0 ? (
                    <div className="comments-empty">
                        <MessageSquare size={32} />
                        <p>No hay comentarios aún. ¡Sé el primero en decir algo!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="comment-card animate-fade-in">
                            <div className="comment-card__header">
                                <div 
                                    className="avatar avatar--sm" 
                                    style={{ background: comment.author_color || 'var(--color-primary)' }}
                                >
                                    {comment.author_initials || (comment.author_name ? comment.author_name[0] : '?')}
                                </div>
                                <div className="comment-card__meta">
                                    <span className="comment-author">{comment.author_name}</span>
                                    <span className="comment-date">
                                        <Clock size={12} />
                                        {formatCommentDate(comment.created_at)}
                                    </span>
                                </div>
                            </div>
                            <div className="comment-card__text">
                                {comment.text}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
