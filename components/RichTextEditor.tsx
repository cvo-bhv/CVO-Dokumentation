import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      // Only update if the content is actually different to avoid cursor jumping
      if (document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string) => {
    document.execCommand(command, false, undefined);
    if (editorRef.current) {
      editorRef.current.focus();
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 bg-white">
      <div className="bg-gray-50 border-b border-gray-300 p-1 flex gap-1">
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Fett">
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Kursiv">
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }} className="p-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors" title="Unterstrichen">
          <Underline className="w-4 h-4" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="w-full p-3 min-h-[100px] outline-none text-sm bg-white empty:before:content-[attr(placeholder)] empty:before:text-gray-400"
        style={{ whiteSpace: 'pre-wrap' }}
        placeholder={placeholder}
      />
    </div>
  );
};
