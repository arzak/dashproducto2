const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { google } = require("googleapis");

setGlobalOptions({ maxInstances: 10 });

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

/**
 * Cloud Function Proxy: extractAgreements
 * 
 * Recibe el texto de una transcripción y devuelve acuerdos y reglas de negocio
 * usando la API de Gemini de forma segura (sin exponer la API key).
 */
exports.extractAgreements = onCall({
    secrets: [geminiApiKey]
}, async (request) => {
    const { transcriptText } = request.data;

    if (!transcriptText || transcriptText.trim().length === 0) {
        throw new HttpsError("invalid-argument", "El texto de la transcripción está vacío");
    }

    const GEMINI_API_KEY = geminiApiKey.value();
    if (!GEMINI_API_KEY) {
        logger.error("GEMINI_API_KEY no configurada en Firebase Functions");
        throw new HttpsError("internal", "Configuración del servidor incompleta");
    }

    const maxChars = 8000;
    const truncatedText = transcriptText.length > maxChars 
        ? transcriptText.substring(0, maxChars) + '...'
        : transcriptText;

    const prompt = `Extrae acuerdos y reglas de negocio de esta transcripción. Responde SOLO con JSON, sin texto adicional.

Ejemplo de formato:
{"acuerdos":[{"texto":"Decisión tomada","responsable":"Nombre","fecha":"fecha"}],"reglasNegocio":[{"descripcion":"Regla","area":"Área"}]}

Transcripción:
${truncatedText}

Si no hay acuerdos: {"acuerdos":[],"reglasNegocio":[]}`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 8192,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Error al conectar con Google AI');
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('No se recibió respuesta de la IA');
        }

        const responseText = data.candidates[0].content.parts[0].text;
        
        logger.info('Respuesta IA (primeros 500 chars):', responseText.substring(0, 500));
        
        let jsonStr = responseText.trim();
        
        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (parseError) {
            // Intentar extraer solo el JSON
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    let cleanJson = jsonMatch[0]
                        .replace(/,\s*}/g, '}')
                        .replace(/,\s*]/g, ']')
                        .replace(/```/g, '')
                        .replace(/"fecha":\s*"([^"]*)$/gm, '"fecha": "$1"') // Completar comillas cortadas
                        .replace(/"responsable":\s*"([^"]*)$/gm, '"responsable": "$1"')
                        .replace(/"texto":\s*"([^"]*)$/gm, '"texto": "$1"')
                        .replace(/"descripcion":\s*"([^"]*)$/gm, '"descripcion": "$1"')
                        .replace(/"area":\s*"([^"]*)$/gm, '"area": "$1"');
                    parsed = JSON.parse(cleanJson);
                } catch (e) {
                    logger.error('JSON parse error:', e.message, 'Intento:', jsonMatch[0].substring(0, 300));
                    throw new Error('JSON inválido');
                }
            } else {
                logger.error('No se encontró JSON. Respuesta:', responseText.substring(0, 500));
                throw new Error('No se encontró JSON en la respuesta');
            }
        }
        
        if (!parsed.acuerdos || !Array.isArray(parsed.acuerdos)) {
            throw new Error('Formato de respuesta inválido');
        }

        return {
            acuerdos: parsed.acuerdos,
            reglasNegocio: parsed.reglasNegocio || []
        };

    } catch (error) {
        logger.error('Error en extractAgreements:', error.message);
        throw new HttpsError("internal", error.message);
    }
});

/**
 * Cloud Function Proxy: getGoogleDocProxy
 * 
 * Recibe un { documentId } y devuelve el JSON completo del documento
 * usando la Service Account del proyecto de Firebase.
 * 
 * El documento de Google Docs debe estar compartido con la Service Account
 * del proyecto o configurado como público.
 */
exports.getGoogleDocProxy = onCall(async (request) => {
    const documentId = request.data.documentId;

    if (!documentId) {
        throw new HttpsError("invalid-argument", "Se requiere un documentId.");
    }

    try {
        // GoogleAuth usa automáticamente la Service Account del servidor de Functions
        const auth = new google.auth.GoogleAuth({
            scopes: ["https://www.googleapis.com/auth/documents.readonly"],
        });

        const docs = google.docs({ version: "v1", auth });
        const docResponse = await docs.documents.get({ documentId });

        logger.info(`Google Doc fetched successfully: ${documentId}`);
        return docResponse.data;
    } catch (error) {
        logger.error("Error fetching Google Doc:", error.message, error);

        throw new HttpsError(
            "internal", 
            `Error de Google Docs: ${error.message} (Código HTTP ${error.code})`
        );
    }
});
