export function parseTranscriptFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target.result;
      const extension = file.name.split('.').pop().toLowerCase();
      
      let parsedText = '';
      
      switch (extension) {
        case 'txt':
          parsedText = parseTxt(content);
          break;
        case 'vtt':
          parsedText = parseVtt(content);
          break;
        case 'srt':
          parsedText = parseSrt(content);
          break;
        case 'json':
          parsedText = parseJsonTranscript(content);
          break;
        default:
          parsedText = content;
      }
      
      resolve(parsedText);
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
}

function parseTxt(content) {
  return content.trim();
}

function parseVtt(content) {
  const lines = content.split('\n');
  const textLines = [];
  let skipUntilNextEmpty = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('WEBVTT') || trimmed.startsWith('NOTE') || trimmed.startsWith('STYLE')) {
      continue;
    }
    
    if (/^\d{2}:\d{2}:\d{2}\.\d{3} --> /.test(trimmed)) {
      skipUntilNextEmpty = false;
      continue;
    }
    
    if (trimmed === '') {
      skipUntilNextEmpty = true;
      continue;
    }
    
    if (!skipUntilNextEmpty && !/^\d+$/.test(trimmed)) {
      textLines.push(trimmed);
    }
  }
  
  return textLines.join(' ');
}

function parseSrt(content) {
  const blocks = content.split(/\n\n+/);
  const textLines = [];
  
  for (const block of blocks) {
    const lines = block.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !/^\d+$/.test(trimmed) && !/\d{2}:\d{2}:\d{2},\d{3} --> /.test(trimmed)) {
        textLines.push(trimmed);
      }
    }
  }
  
  return textLines.join(' ');
}

function parseJsonTranscript(content) {
  try {
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      return data.map(item => item.text || item.content || item.transcript || '').filter(Boolean).join(' ');
    }
    
    if (data.results && Array.isArray(data.results)) {
      return data.results.map(r => r.alternatives?.[0]?.transcript || '').filter(Boolean).join(' ');
    }
    
    if (data.text || data.transcript || data.content) {
      return data.text || data.transcript || data.content;
    }
    
    return JSON.stringify(data);
  } catch {
    return content;
  }
}
