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

    const prompt = `Eres un asistente que extrae acuerdos y reglas de negocio de reuniones.

Transcripción:
${truncatedText}

Extrae TODOS los acuerdos mencionados. Para cada acuerdo indica:
- Qué se decidió
- Quién es responsable (si se mencionó)
- Fecha límite (si se mencionó)

Luego extrae TODAS las reglas de negocio mencionadas. Una regla de negocio es una política, norma o restricción que debe cumplirse. Para cada regla indica:
- Descripción de la regla
- Área o proceso afectado (si se mencionó)

Formatea respuesta como JSON:
{
  "acuerdos": [
    {"texto": "...", "responsable": "...", "fecha": "..."}
  ],
  "reglasNegocio": [
    {"descripcion": "...", "area": "..."}
  ]
}

Si no hay acuerdos claros, devuelve: {"acuerdos": [], "reglasNegocio": []}

Solo responde con JSON válido, sin texto adicional ni markdown.`;

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
                    maxOutputTokens: 2048,
                    topP: 0.8,
                    topK: 40
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
        
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('La respuesta de la IA no contiene JSON válido');
        }

        let jsonStr = jsonMatch[0];
        jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const parsed = JSON.parse(jsonStr);
        
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
