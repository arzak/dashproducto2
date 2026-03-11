const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { google } = require("googleapis");

setGlobalOptions({ maxInstances: 10 });

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
