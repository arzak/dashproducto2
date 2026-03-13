import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Send, MessageSquare, Clock, User, Loader2, Upload, X, FileText, Sparkles, Briefcase } from 'lucide-react';
import { parseTranscriptFile } from '../utils/transcriptionParser';
import { extractAgreementsFromTranscript, formatAgreementAsComment } from '../services/googleAI';
import './RequirementComments.css';

export default function RequirementComments({ requirementId }) {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const { currentUser, userData } = useAuth();
    
    const [showImportModal, setShowImportModal] = useState(false);
    const [importingFile, setImportingFile] = useState(false);
    const [processingAI, setProcessingAI] = useState(false);
    const [extractedText, setExtractedText] = useState('');
    const [aiResult, setAiResult] = useState({ acuerdos: [], reglasNegocio: [] });
    const [aiError, setAiError] = useState('');
    const fileInputRef = useRef(null);

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

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['.txt', '.vtt', '.srt', '.json'];
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!validTypes.includes(ext)) {
            alert('Tipo de archivo no válido. Usa: .txt, .vtt, .srt o .json');
            return;
        }

        setImportingFile(true);
        setAiError('');
        setExtractedText('');
        setAiResult({ acuerdos: [], reglasNegocio: [] });
        
        try {
            const text = await parseTranscriptFile(file);
            setExtractedText(text);
            setShowImportModal(true);
        } catch (err) {
            alert('Error al leer el archivo: ' + err.message);
        } finally {
            setImportingFile(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleProcessWithAI = async () => {
        if (!extractedText.trim()) return;
        
        setProcessingAI(true);
        setAiError('');
        
        try {
            const result = await extractAgreementsFromTranscript(extractedText);
            setAiResult(result);
        } catch (err) {
            setAiError(err.message);
        } finally {
            setProcessingAI(false);
        }
    };

    const handleSaveAgreements = async () => {
        if (aiResult.acuerdos.length === 0 && aiResult.reglasNegocio.length === 0) return;
        
        const commentText = formatAgreementAsComment(aiResult);
        
        setSending(true);
        try {
            const commentData = {
                text: commentText,
                author_name: 'IA - Asistente',
                author_uid: 'ai-assistant',
                author_email: 'ai@system.local',
                created_at: serverTimestamp(),
                author_initials: '🤖',
                author_color: '#8B5CF6',
                is_ai_generated: true,
                original_file: extractedText.substring(0, 500)
            };

            await addDoc(collection(db, 'requirements', requirementId, 'comments'), commentData);
            closeModal();
        } catch (error) {
            alert('Error al guardar: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const closeModal = () => {
        setShowImportModal(false);
        setExtractedText('');
        setAiResult({ acuerdos: [], reglasNegocio: [] });
        setAiError('');
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
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".txt,.vtt,.srt,.json"
                    style={{ display: 'none' }}
                />
                <button 
                    className="btn btn--secondary import-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importingFile}
                    style={{ marginLeft: 'auto' }}
                >
                    {importingFile ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {importingFile ? 'Leyendo...' : 'Importar transcripción'}
                </button>
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

            {showImportModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>
                                <Sparkles size={18} />
                                Importar Transcripción
                            </h3>
                            <button className="modal-close" onClick={closeModal}>
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            {!extractedText ? (
                                <div className="modal-loading">
                                    <Loader2 size={24} className="animate-spin" />
                                    <p>Procesando archivo...</p>
                                </div>
                            ) : aiResult.acuerdos.length === 0 && aiResult.reglasNegocio.length === 0 ? (
                                <>
                                    <div className="transcript-preview">
                                        <div className="preview-label">
                                            <FileText size={14} />
                                            Vista previa de transcripción
                                        </div>
                                        <div className="preview-text">
                                            {extractedText.substring(0, 1000)}
                                            {extractedText.length > 1000 && '...'}
                                        </div>
                                    </div>
                                    
                                    {aiError && (
                                        <div className="ai-error">
                                            {aiError}
                                        </div>
                                    )}
                                    
                                    <button 
                                        className="btn btn--primary"
                                        onClick={handleProcessWithAI}
                                        disabled={processingAI}
                                        style={{ width: '100%', marginTop: 'var(--space-4)' }}
                                    >
                                        {processingAI ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Extrayendo acuerdos con IA...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={16} />
                                                Extraer acuerdos con IA
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {aiResult.acuerdos.length > 0 && (
                                        <div className="agreements-preview">
                                            <div className="preview-label">
                                                <Sparkles size={14} />
                                                Acuerdos detectados ({aiResult.acuerdos.length})
                                            </div>
                                            <div className="agreements-list">
                                                {aiResult.acuerdos.map((agreement, index) => (
                                                    <div key={index} className="agreement-item">
                                                        <div className="agreement-number">{index + 1}</div>
                                                        <div className="agreement-content">
                                                            <div className="agreement-text">{agreement.texto || agreement.text}</div>
                                                            <div className="agreement-meta">
                                                                {agreement.responsable && (
                                                                    <span><User size={12} /> {agreement.responsable}</span>
                                                                )}
                                                                {agreement.fecha && (
                                                                    <span><Clock size={12} /> {agreement.fecha}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {aiResult.reglasNegocio.length > 0 && (
                                        <div className="agreements-preview" style={{ marginTop: 'var(--space-4)' }}>
                                            <div className="preview-label">
                                                <Sparkles size={14} />
                                                Reglas de Negocio detectadas ({aiResult.reglasNegocio.length})
                                            </div>
                                            <div className="agreements-list">
                                                {aiResult.reglasNegocio.map((rule, index) => (
                                                    <div key={index} className="agreement-item">
                                                        <div className="agreement-number" style={{ background: '#F59E0B' }}>{index + 1}</div>
                                                        <div className="agreement-content">
                                                            <div className="agreement-text">{rule.descripcion || rule.description}</div>
                                                            <div className="agreement-meta">
                                                                {rule.area && (
                                                                    <span><Briefcase size={12} /> {rule.area}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="modal-actions">
                                        <button 
                                            className="btn btn--secondary"
                                            onClick={() => setAiResult({ acuerdos: [], reglasNegocio: [] })}
                                            disabled={sending}
                                        >
                                            Volver a procesar
                                        </button>
                                        <button 
                                            className="btn btn--primary"
                                            onClick={handleSaveAgreements}
                                            disabled={sending || (aiResult.acuerdos.length === 0 && aiResult.reglasNegocio.length === 0)}
                                        >
                                            {sending ? (
                                                <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                                            ) : (
                                                <>Guardar como comentario</>
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
