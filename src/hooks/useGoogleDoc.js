import { useState, useEffect } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export function useGoogleDoc(documentId) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!documentId) {
            setData(null);
            setError(null);
            return;
        }

        const fetchDocument = async () => {
            setLoading(true);
            setError(null);

            try {
                // Llamamos a la Cloud Function de Firebase
                const getDocFunction = httpsCallable(functions, 'getGoogleDocProxy');
                const result = await getDocFunction({ documentId });
                
                // La Cloud function devuelve el JSON del documento
                setData(result.data);
            } catch (err) {
                console.error('Error fetching Google Doc via Proxy:', err);
                // Extraer el mensaje real de Firebase Error si existe
                const errorMessage = err.message || 'Error al descargar el documento. Verifica los permisos o intenta de nuevo.';
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchDocument();
    }, [documentId]);

    return { data, loading, error };
}
