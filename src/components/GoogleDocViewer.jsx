import React from 'react';
import { useGoogleDoc } from '../hooks/useGoogleDoc';
import './GoogleDocViewer.css';
import { AlertCircle, FileText, Loader2 } from 'lucide-react';

export default function GoogleDocViewer({ documentId }) {
    const { data: doc, loading, error } = useGoogleDoc(documentId);

    if (loading) {
        return (
            <div className="gdoc-viewer__loading">
                <Loader2 className="gdoc-viewer__spinner" size={24} />
                <span>Cargando contenido del documento...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="gdoc-viewer__error">
                <AlertCircle size={20} className="gdoc-viewer__error-icon" />
                <div className="gdoc-viewer__error-content">
                    <h4 className="gdoc-viewer__error-title">No se pudo cargar el documento</h4>
                    <p className="gdoc-viewer__error-message">{error}</p>
                </div>
            </div>
        );
    }

    if (!doc || !doc.body || !doc.body.content) {
        return null;
    }

    // Process styling for a text run
    const renderTextRun = (textRun, key) => {
        if (!textRun || !textRun.content) return null;

        let content = textRun.content;
        let style = {};
        
        const currentTextStyle = textRun.textStyle;

        if (currentTextStyle) {
            if (currentTextStyle.bold) style.fontWeight = 'bold';
            if (currentTextStyle.italic) style.fontStyle = 'italic';
            if (currentTextStyle.underline) style.textDecoration = 'underline';
            if (currentTextStyle.strikethrough) style.textDecoration = style.textDecoration ? `${style.textDecoration} line-through` : 'line-through';
            
            // Handle links
            if (currentTextStyle.link && currentTextStyle.link.url) {
                return (
                    <a 
                        key={key} 
                        href={currentTextStyle.link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={style}
                        className="gdoc-viewer__link"
                    >
                        {content}
                    </a>
                );
            }
        }

        // Replace newlines with <br /> for proper rendering if not part of a paragraph block naturally
        return <span key={key} style={style}>{content}</span>;
    };

    // Process a paragraph element
    const renderParagraphElement = (element, index) => {
        if (element.textRun) {
            return renderTextRun(element.textRun, `run-${index}`);
        }
        // Could handle other types like inlineObjectElement (images) here in the future
        return null;
    };

    // Process a structural element (Paragraph, Table, etc.)
    const renderStructuralElement = (contentObj, index) => {
        if (contentObj.paragraph) {
            const paragraph = contentObj.paragraph;
            const elements = paragraph.elements || [];
            
            // Render the children elements
            const renderedElements = elements.map((el, i) => renderParagraphElement(el, i));
            
            // Handle heading styles vs normal paragraphs
            const styleType = paragraph.paragraphStyle?.namedStyleType || 'NORMAL_TEXT';
            
            // Return nothing if it's completely empty (just a newline)
            const textContent = elements.map(e => e.textRun?.content || '').join('').trim();
            if (!textContent && styleType === 'NORMAL_TEXT') {
                 // For empty lines, we can return a break to preserve some spacing
                 // or return nothing. Let's return a small spacer.
                 return <div key={`empty-${index}`} className="gdoc-viewer__spacer"></div>;
            }

            switch (styleType) {
                case 'HEADING_1':
                    return <h1 key={index} className="gdoc-viewer__h1">{renderedElements}</h1>;
                case 'HEADING_2':
                    return <h2 key={index} className="gdoc-viewer__h2">{renderedElements}</h2>;
                case 'HEADING_3':
                    return <h3 key={index} className="gdoc-viewer__h3">{renderedElements}</h3>;
                case 'HEADING_4':
                    return <h4 key={index} className="gdoc-viewer__h4">{renderedElements}</h4>;
                case 'HEADING_5':
                    return <h5 key={index} className="gdoc-viewer__h5">{renderedElements}</h5>;
                case 'HEADING_6':
                    return <h6 key={index} className="gdoc-viewer__h6">{renderedElements}</h6>;
                case 'TITLE':
                    return <h1 key={index} className="gdoc-viewer__title">{renderedElements}</h1>;
                case 'SUBTITLE':
                    return <p key={index} className="gdoc-viewer__subtitle">{renderedElements}</p>;
                default:
                    return <p key={index} className="gdoc-viewer__p">{renderedElements}</p>;
            }
        }
        // Handle tables, lists, etc. could be added here
        return null;
    };

    return (
        <div className="gdoc-viewer">
            <div className="gdoc-viewer__header">
                <FileText size={16} />
                <span>{doc.title || 'Documento'}</span>
            </div>
            <div className="gdoc-viewer__content">
                {doc.body.content.map((element, index) => renderStructuralElement(element, index))}
            </div>
        </div>
    );
}
