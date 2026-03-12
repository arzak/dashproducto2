const API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

export async function extractAgreementsFromTranscript(transcriptText) {
  if (!transcriptText || transcriptText.trim().length === 0) {
    throw new Error('El texto de la transcripción está vacío');
  }

  const maxChars = 8000;
  const truncatedText = transcriptText.length > maxChars 
    ? transcriptText.substring(0, maxChars) + '...'
    : transcriptText;

  const prompt = `Eres un asistente que extrae acuerdos de reuniones.

Transcripción:
${truncatedText}

Extrae TODOS los acuerdos mencionados. Para cada acuerdo indica:
- Qué se decidió
- Quién es responsable (si se mencionó)
- Fecha límite (si se mencionó)

Formatea respuesta como JSON:
{
  "acuerdos": [
    {"texto": "...", "responsable": "...", "fecha": "..."}
  ]
}

Si no hay acuerdos claros, devuelve:
{"acuerdos": []}

Solo responde con JSON válido, sin texto adicional ni markdown.`;

  try {
    const response = await fetch(API_URL, {
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

    return parsed.acuerdos;

  } catch (error) {
    console.error('Error en extractAgreementsFromTranscript:', error);
    throw error;
  }
}

export function formatAgreementAsComment(agreements) {
  if (!agreements || agreements.length === 0) {
    return 'No se detectaron acuerdos en la transcripción.';
  }

  const header = '📋 **Acuerdos de Reunión**\n\n';
  const items = agreements.map((a, index) => {
    const texto = a.texto || a.text || 'Sin descripción';
    const responsable = a.responsable || a.responsible || 'Por definir';
    const fecha = a.fecha || a.date || 'Sin fecha límite';
    
    return `${index + 1}. **${texto}**\n   - Responsable: ${responsable}\n   - Fecha: ${fecha}`;
  }).join('\n\n');

  return header + items;
}
