import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export async function extractAgreementsFromTranscript(transcriptText) {
  if (!transractText || transcriptText.trim().length === 0) {
    throw new Error('El texto de la transcripción está vacío');
  }

  try {
    const extractAgreementsFn = httpsCallable(functions, 'extractAgreements');
    const result = await extractAgreementsFn({ transcriptText });
    
    if (!result.data) {
      throw new Error('No se recibió respuesta de la función');
    }

    return result.data;

  } catch (error) {
    console.error('Error en extractAgreementsFromTranscript:', error);
    throw new Error(error.message || 'Error al procesar con IA');
  }
}

export function formatAgreementAsComment(data) {
  const agreements = data?.acuerdos || data || [];
  const businessRules = data?.reglasNegocio || [];
  
  let result = '';

  if (!agreements || agreements.length === 0) {
    result = 'No se detectaron acuerdos en la transcripción.\n\n';
  } else {
    const header = '📋 **Acuerdos de Reunión**\n\n';
    const items = agreements.map((a, index) => {
      const texto = a.texto || a.text || 'Sin descripción';
      const responsable = a.responsable || a.responsible || 'Por definir';
      const fecha = a.fecha || a.date || 'Sin fecha límite';
      
      return `${index + 1}. **${texto}**\n   - Responsable: ${responsable}\n   - Fecha: ${fecha}`;
    }).join('\n\n');

    result = header + items + '\n\n';
  }

  if (businessRules && businessRules.length > 0) {
    const rulesHeader = '📜 **Reglas de Negocio**\n\n';
    const rulesItems = businessRules.map((r, index) => {
      const descripcion = r.descripcion || r.description || 'Sin descripción';
      const area = r.area || r.area || 'Por definir';
      
      return `${index + 1}. **${descripcion}**\n   - Área: ${area}`;
    }).join('\n\n');

    result += rulesHeader + rulesItems;
  }

  return result;
}
