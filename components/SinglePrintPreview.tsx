import React, { useState } from 'react';
import { X, Printer, ZoomIn, ZoomOut, Type } from 'lucide-react';

interface SinglePrintPreviewProps {
  data: any; 
  type: 'incident' | 'protocol';
  onClose: () => void;
}

export const SinglePrintPreview: React.FC<SinglePrintPreviewProps> = ({ data, type, onClose }) => {
  // Start with standard 11pt font size
  const [fontSize, setFontSize] = useState(11);

  const handlePrint = () => {
    window.print();
  };

  // Helper to format date
  const formatDate = (d: string) => {
    if (!d) return "__________";
    return new Date(d).toLocaleDateString('de-DE');
  };

  const LogoHeader = () => (
    <div className="flex items-center justify-between mb-8 border-b-2 border-black pb-4">
      <div className="flex items-center space-x-4">
        <img 
           src="https://victorymind.de/nextcloud/index.php/apps/files_sharing/publicpreview/d46AGa5jWRKGaXX?file=/&fileId=728&x=3024&y=1964&a=true&etag=ed17bd91eacca7d1bfcaa55efd52e5b2" 
           alt="CVO Logo" 
           className="h-16 object-contain grayscale" 
           style={{ height: '4rem' }} // Fixed height for logo regardless of font size
        />
        <div>
          <h1 className="font-bold uppercase tracking-wider leading-tight" style={{ fontSize: '1.5em' }}>
            {type === 'incident' ? 'Vorfallsprotokoll' : 'Gesprächsprotokoll'}
          </h1>
          <p className="font-semibold" style={{ fontSize: '0.9em' }}>CVO Oberschule Bremerhaven</p>
        </div>
      </div>
      <div className="text-right" style={{ fontSize: '0.8em' }}>
        <p>Datum: {new Date().toLocaleDateString()}</p>
        <p>Dokument-Typ: {type === 'incident' ? 'Konflikt' : 'Beratung'}</p>
      </div>
    </div>
  );

  const Field = ({ label, value, fullWidth = false }: { label: string, value: any, fullWidth?: boolean }) => (
    <div className={`mb-4 ${fullWidth ? 'col-span-2' : 'col-span-1'}`} style={{ breakInside: 'avoid' }}>
      <span className="block font-bold uppercase text-gray-500 mb-1" style={{ fontSize: '0.75em' }}>{label}</span>
      <div className="border-b border-gray-300 min-h-[1.5em] py-1">
        {value || <span className="text-gray-300 italic">Keine Angabe</span>}
      </div>
    </div>
  );

  const LongText = ({ label, value }: { label: string, value: string }) => (
    <div className="mb-6" style={{ breakInside: 'avoid' }}>
      <span className="block font-bold uppercase text-gray-500 mb-2 border-b border-gray-200 pb-1" style={{ fontSize: '0.75em' }}>{label}</span>
      <div className="text-justify whitespace-pre-wrap leading-relaxed min-h-[4em] p-2 bg-gray-50/50 border border-gray-100 rounded">
        {value || <span className="text-gray-300 italic">Keine Eintragung</span>}
      </div>
    </div>
  );

  const SignatureSection = () => (
    <div className="mt-12 pt-8 border-t border-gray-400" style={{ breakInside: 'avoid' }}>
      <p className="mb-8 italic text-gray-500" style={{ fontSize: '0.8em' }}>Ich bestätige die Kenntnisnahme des oben genannten Sachverhalts.</p>
      <div className="grid grid-cols-3 gap-8">
        <div>
          <div className="border-b border-black h-8"></div>
          <p className="mt-1 text-center" style={{ fontSize: '0.7em' }}>Unterschrift Lehrkraft / Protokollant</p>
        </div>
        <div>
          <div className="border-b border-black h-8"></div>
          <p className="mt-1 text-center" style={{ fontSize: '0.7em' }}>Unterschrift Schüler:in</p>
        </div>
        <div>
          <div className="border-b border-black h-8"></div>
          <p className="mt-1 text-center" style={{ fontSize: '0.7em' }}>Unterschrift Erziehungsberechtigte/r</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/95 flex flex-col">
      {/* Toolbar - No Print */}
      <div className="no-print bg-slate-800 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center space-x-6">
          <h2 className="font-bold hidden md:block">Druckvorschau</h2>
          
          {/* Font Size Control */}
          <div className="flex items-center space-x-2 bg-slate-700 rounded-lg p-1 border border-slate-600">
            <button onClick={() => setFontSize(s => Math.max(8, s - 1))} className="p-2 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition" title="Schrift kleiner">
              <ZoomOut className="w-5 h-5"/>
            </button>
            <div className="flex items-center space-x-2 px-2 w-24 justify-center border-l border-r border-slate-600">
              <Type className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-mono font-bold">{fontSize} pt</span>
            </div>
            <button onClick={() => setFontSize(s => Math.min(18, s + 1))} className="p-2 hover:bg-slate-600 rounded text-slate-300 hover:text-white transition" title="Schrift größer">
              <ZoomIn className="w-5 h-5"/>
            </button>
          </div>
          
          <span className="text-xs text-gray-400 hidden lg:inline max-w-md">
            Passen Sie die Schriftgröße an. Wenn der Text zu lang ist, werden automatisch weitere Seiten gedruckt.
          </span>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center transition text-sm">
            <X className="w-4 h-4 mr-2" /> Schließen
          </button>
          <button onClick={handlePrint} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center font-bold transition text-sm shadow-lg shadow-blue-900/20">
            <Printer className="w-4 h-4 mr-2" /> Jetzt Drucken
          </button>
        </div>
      </div>

      {/* Preview Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto bg-gray-600 p-8 flex justify-center">
        {/* The Paper Sheet */}
        <div 
          className="bg-white shadow-2xl transition-all duration-200 print-sheet"
          style={{ 
            width: '210mm',          // Fixed A4 width
            minHeight: '297mm',      // Minimum A4 height
            height: 'auto',          // Allow growing
            padding: '20mm',
            fontSize: `${fontSize}pt`, // Dynamic Font Size
            lineHeight: 1.4,
            boxSizing: 'border-box'
          }}
        >
          {/* CONTENT START */}
          <LogoHeader />

          {type === 'incident' ? (
            // INCIDENT LAYOUT
            <>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
                <Field label="Schüler:in" value={data.studentName || '____________'} />
                <Field label="Klasse" value={data.className || '____________'} />
                <Field label="Datum / Uhrzeit" value={`${formatDate(data.date)} um ${data.time} Uhr`} />
                <Field label="Ort des Vorfalls" value={data.location} />
                <Field label="Gemeldet von" value={data.reportedBy} />
                <Field label="Kategorie" value={data.category} />
              </div>

              <LongText label="Beschreibung des Vorfalls" value={data.description} />
              
              <div className="grid grid-cols-2 gap-8 mb-6" style={{ breakInside: 'avoid' }}>
                <div className="col-span-1">
                   <span className="block font-bold uppercase text-gray-500 mb-2" style={{ fontSize: '0.75em' }}>Beteiligte / Zeugen</span>
                   <div className="p-2 bg-gray-50 border border-gray-100 rounded min-h-[3em]">
                      {data.involvedPersons && <p><strong>Beteiligt:</strong> {data.involvedPersons}</p>}
                      {data.witnesses && <p><strong>Zeugen:</strong> {data.witnesses}</p>}
                      {!data.involvedPersons && !data.witnesses && <span className="text-gray-300 italic">Keine Angaben</span>}
                   </div>
                </div>
                <div className="col-span-1">
                   <span className="block font-bold uppercase text-gray-500 mb-2" style={{ fontSize: '0.75em' }}>Benachrichtigungen</span>
                   <div className="space-y-1 mt-2">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 border mr-2 flex items-center justify-center text-xs ${data.parentContacted ? 'bg-black text-white' : ''}`}>{data.parentContacted ? '✓' : ''}</div> Eltern
                      </div>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 border mr-2 flex items-center justify-center text-xs ${data.administrationContacted ? 'bg-black text-white' : ''}`}>{data.administrationContacted ? '✓' : ''}</div> Schulleitung
                      </div>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 border mr-2 flex items-center justify-center text-xs ${data.socialServiceContacted ? 'bg-black text-white' : ''}`}>{data.socialServiceContacted ? '✓' : ''}</div> Schulsozialarbeit
                      </div>
                   </div>
                </div>
              </div>

              <LongText label="Sofortmaßnahmen & Pädagogische Konsequenzen" value={data.immediateActions} />
              <LongText label="Vereinbarungen / Verbleib" value={data.agreements} />
            </>
          ) : (
            // PROTOCOL LAYOUT
            <>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8">
                <Field label="Gesprächstyp" value={data.type} />
                <Field label="Datum / Uhrzeit" value={`${formatDate(data.date)} um ${data.time} Uhr`} />
                <Field label="Schüler:in" value={data.studentName} />
                <Field label="Klasse" value={data.className} />
                <Field label="Ort" value={data.location} />
                <Field label="Protokollant:in" value={data.reportedBy} />
                <Field label="Weitere Teilnehmer" value={data.participants} fullWidth />
              </div>

              <div className="mb-6">
                 <Field label="Betreff / Anlass" value={data.subject} fullWidth />
              </div>

              <LongText label="Gesprächsverlauf / Inhalt" value={data.content} />
              <LongText label="Ergebnisse & Vereinbarungen" value={data.results} />
              
              {data.goals && <LongText label="Zielsetzung" value={data.goals} />}

              {data.nextAppointment?.date ? (
                <div className="mt-4 p-4 border border-gray-300 rounded bg-gray-50" style={{ breakInside: 'avoid' }}>
                  <span className="block font-bold uppercase text-black mb-2" style={{ fontSize: '0.8em' }}>Folgetermin vereinbart</span>
                  <div className="grid grid-cols-3 gap-4">
                    <div>Datum: <strong>{formatDate(data.nextAppointment.date)}</strong></div>
                    <div>Zeit: <strong>{data.nextAppointment.time}</strong></div>
                    <div>Ort: <strong>{data.nextAppointment.location}</strong></div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-gray-500 italic" style={{ fontSize: '0.9em' }}>Kein direkter Folgetermin vereinbart.</div>
              )}
            </>
          )}

          <SignatureSection />
          {/* CONTENT END */}
        </div>
      </div>

      {/* Modern Print CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.5cm; /* Standard print margin */
          }
          
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }

          /* Hide UI - Sidebar is hidden via 'print:hidden' class in Layout.tsx, 
             but we add safety here for other elements */
          .no-print, 
          .fixed.inset-0 > div:first-child { 
            display: none !important; 
          }
          
          /* Crucial: Hide the form content (siblings of this modal) so they don't print */
          .fixed.inset-0 ~ * {
            display: none !important;
          }

          /* Reset Container for Print Flow */
          .fixed.inset-0 {
            position: relative !important;
            width: auto !important;
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            display: block !important;
            z-index: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            left: 0 !important;
            top: 0 !important;
          }

          .flex-1 {
            display: block !important;
            overflow: visible !important;
            padding: 0 !important;
            background: white !important;
            margin: 0 !important;
          }

          /* The Content Sheet */
          .print-sheet {
            width: 100% !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important; /* Margins handled by @page */
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
          }

          /* Ensure grids work in print */
          .grid {
            display: grid !important;
          }
        }
      `}</style>
    </div>
  );
};