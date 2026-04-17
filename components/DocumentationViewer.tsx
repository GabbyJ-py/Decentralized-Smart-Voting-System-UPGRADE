import React, { useState, useEffect } from 'react';
import { X, FileText, ArrowLeft } from 'lucide-react';

interface DocumentationViewerProps {
  file: string;
  onClose: () => void;
}

const DocumentationViewer: React.FC<DocumentationViewerProps> = ({ file, onClose }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`/${file}`);
        const text = await response.text();
        setContent(text);
      } catch (error) {
        setContent('# Error\n\nFailed to load documentation.');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [file]);

  const renderMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    const elements: React.ReactElement[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeBlockLang = '';
    let listItems: string[] = [];
    let inList = false;

    const flushList = () => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-2 mb-4 ml-4">
            {listItems.map((item, i) => (
              <li key={i} className="text-slate-700">{item}</li>
            ))}
          </ul>
        );
        listItems = [];
        inList = false;
      }
    };

    lines.forEach((line, index) => {
      // Code blocks
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${index}`} className="bg-slate-900 text-green-400 p-4 rounded-xl overflow-x-auto mb-4 font-mono text-sm">
              <code>{codeBlockContent.join('\n')}</code>
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          flushList();
          inCodeBlock = true;
          codeBlockLang = line.slice(3);
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        return;
      }

      // Headers
      if (line.startsWith('# ')) {
        flushList();
        elements.push(
          <h1 key={`h1-${index}`} className="text-4xl font-black text-[#053c6d] mb-6 mt-8 border-b-4 border-blue-100 pb-3">
            {line.slice(2)}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        flushList();
        elements.push(
          <h2 key={`h2-${index}`} className="text-2xl font-bold text-[#053c6d] mb-4 mt-6">
            {line.slice(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        flushList();
        elements.push(
          <h3 key={`h3-${index}`} className="text-xl font-bold text-slate-800 mb-3 mt-4">
            {line.slice(4)}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        flushList();
        elements.push(
          <h4 key={`h4-${index}`} className="text-lg font-bold text-slate-700 mb-2 mt-3">
            {line.slice(5)}
          </h4>
        );
      }
      // Lists
      else if (line.match(/^[-*]\s/)) {
        if (!inList) inList = true;
        listItems.push(line.slice(2));
      }
      // Checkboxes
      else if (line.match(/^[-*]\s\[.\]\s/)) {
        flushList();
        const checked = line.includes('[x]') || line.includes('[✓]') || line.includes('[✅]');
        const text = line.slice(line.indexOf(']') + 2);
        elements.push(
          <div key={`check-${index}`} className="flex items-center gap-2 mb-2">
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
              {checked && <span className="text-white text-xs">✓</span>}
            </div>
            <span className="text-slate-700">{text}</span>
          </div>
        );
      }
      // Horizontal rule
      else if (line.match(/^---+$/)) {
        flushList();
        elements.push(<hr key={`hr-${index}`} className="my-8 border-slate-200" />);
      }
      // Blockquote
      else if (line.startsWith('> ')) {
        flushList();
        elements.push(
          <blockquote key={`quote-${index}`} className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 rounded-r-lg">
            <p className="text-slate-700 italic">{line.slice(2)}</p>
          </blockquote>
        );
      }
      // Inline code
      else if (line.includes('`') && !line.startsWith('```')) {
        flushList();
        const parts = line.split('`');
        elements.push(
          <p key={`p-${index}`} className="mb-3 text-slate-700 leading-relaxed">
            {parts.map((part, i) => 
              i % 2 === 0 ? part : <code key={i} className="bg-slate-100 px-2 py-1 rounded text-sm font-mono text-blue-600">{part}</code>
            )}
          </p>
        );
      }
      // Bold text
      else if (line.includes('**')) {
        flushList();
        const parts = line.split('**');
        elements.push(
          <p key={`p-${index}`} className="mb-3 text-slate-700 leading-relaxed">
            {parts.map((part, i) => 
              i % 2 === 0 ? part : <strong key={i} className="font-bold text-slate-900">{part}</strong>
            )}
          </p>
        );
      }
      // Regular paragraph
      else if (line.trim()) {
        if (!inList) {
          flushList();
          elements.push(
            <p key={`p-${index}`} className="mb-3 text-slate-700 leading-relaxed">
              {line}
            </p>
          );
        }
      }
      // Empty line
      else {
        flushList();
      }
    });

    flushList();
    return elements;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#053c6d] to-[#0a5a9e] text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={24} />
            <div>
              <h2 className="text-xl font-bold">{file.replace('.md', '').replace(/_/g, ' ')}</h2>
              <p className="text-sm text-blue-200">Documentation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="prose prose-slate max-w-none">
              {renderMarkdown(content)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 flex items-center justify-between border-t border-slate-200">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-[#053c6d] text-white rounded-xl font-bold hover:bg-[#074a8a] transition"
          >
            <ArrowLeft size={18} />
            Back to Home
          </button>
          <p className="text-xs text-slate-500">SmartVote Documentation</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentationViewer;