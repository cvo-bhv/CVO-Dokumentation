import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Printer, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { MeetingMinute } from '../types';
import { getMeetingMinute } from '../services/nextcloudService';

export const MeetingMinutePrint = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get('id');
  
  const [minute, setMinute] = useState<MeetingMinute | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (id) {
        try {
          const data = await getMeetingMinute(id);
          if (data) {
            setMinute(data);
          }
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Lade Daten...</div>;
  }

  if (!minute) {
    return <div className="p-8 text-center text-red-500">Protokoll nicht gefunden.</div>;
  }

  // Format date as DD.MM.YYYY
  const formattedDate = new Date(minute.date).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const handleDownloadPDF = () => {
    if (!printRef.current) return;
    
    const element = printRef.current;
    
    const opt = {
      margin:       15,
      filename:     `Sitzungsprotokoll_${minute?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'dokument'}_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="bg-white min-h-screen text-black font-sans">
      <div className="no-print fixed top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center shadow-lg z-50">
        <div>
          <h2 className="font-bold text-lg">Druckvorschau (Sitzungsprotokoll)</h2>
          <p className="text-slate-300 text-xs">Überprüfen Sie die Daten und klicken Sie auf "Jetzt Drucken", um das Dokument zu erstellen.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.close()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center transition">
            <X className="w-4 h-4 mr-2" /> Schließen
          </button>
          <button onClick={handleDownloadPDF} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center font-bold transition shadow-lg shadow-emerald-900/20">
            <Download className="w-4 h-4 mr-2" /> Als PDF speichern
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center font-bold transition">
            <Printer className="w-4 h-4 mr-2" /> Jetzt Drucken
          </button>
        </div>
      </div>
      <div className="h-24 no-print"></div>

      {/* Print Content */}
      <div ref={printRef} className="max-w-[210mm] mx-auto p-8 bg-white print:p-0 print:m-0">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-xl font-bold">{minute.title}</h1>
          <div className="text-xl">{formattedDate}</div>
        </div>

        {/* Meta Info */}
        <div className="grid grid-cols-[150px_1fr] gap-y-1 mb-6 text-base">
          <div className="font-bold">Zeit:</div>
          <div>{minute.time}</div>
          
          <div className="font-bold">Anwesenheit:</div>
          <div>
            {minute.chairperson} (Sitzungsleitung), {minute.attendees}, {minute.minutesTaker} (Protokoll)
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-300 print:bg-gray-300" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
              <th className="border border-gray-300 p-2 text-left w-16 font-bold">TOP</th>
              <th className="border border-gray-300 p-2 text-left font-bold uppercase">ZUSAMMENFASSUNG/ ERGEBNISSE</th>
            </tr>
          </thead>
          <tbody>
            {minute.agendaItems.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-300 p-2 align-top font-bold text-base">
                  {item.number}
                </td>
                <td className="border border-gray-300 p-2 align-top text-base">
                  {item.title && <div className="font-bold text-lg mb-1">{item.title}</div>}
                  <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: item.summary }} />
                </td>
              </tr>
            ))}
            {minute.agendaItems.length === 0 && (
              <tr>
                <td colSpan={2} className="border border-gray-300 p-4 text-center text-gray-500 italic">
                  Keine Tagesordnungspunkte vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
};
