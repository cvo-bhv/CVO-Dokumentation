import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { X, Printer, Calendar, Users } from 'lucide-react';
import { JoinedIncident, ClassLevel, Conversation } from '../types';
import { fetchIncidents, fetchStudents, fetchClasses, fetchYears, fetchConversations } from '../services/nextcloudService';

export const PrintView = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const type = searchParams.get('type') || 'incidents'; // 'incidents' or 'protocols'
  
  const [incidents, setIncidents] = useState<JoinedIncident[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [loading, setLoading] = useState(true);

  // Common Filters
  const searchTerm = searchParams.get('search') || "";
  
  // Incident Filters
  const statusFilter = searchParams.get('status') || "ALL";
  const categoryFilter = searchParams.get('category') || "ALL";
  const classFilter = searchParams.get('class') || "ALL";
  const monthFilter = searchParams.get('month') || "ALL";

  // Protocol Filters
  const typeFilter = searchParams.get('protocolType') || "ALL";

  useEffect(() => {
    const load = async () => {
      try {
        if (type === 'incidents') {
            const [inc, studs, cls, yrs] = await Promise.all([
            fetchIncidents(),
            fetchStudents(),
            fetchClasses(),
            fetchYears()
            ]);
            setClasses(cls);
            const joined = inc.map(i => {
            const student = studs.find(s => s.id === i.studentId);
            const cl = student ? cls.find(c => c.id === student.classId) : null;
            const yr = cl ? yrs.find(y => y.id === cl.yearLevelId) : null;
            return {
                ...i,
                studentName: student ? `${student.lastName}, ${student.firstName}` : 'Unbekannt',
                className: cl ? cl.name : '?',
                classId: cl ? cl.id : undefined,
                yearLevelName: yr ? yr.name : '?'
            } as JoinedIncident;
            });
            setIncidents(joined);
        } else {
            // Load Protocols
            const convs = await fetchConversations();
            setConversations(convs);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    load();
  }, [type]);

  const filteredData = useMemo(() => {
    if (type === 'incidents') {
        let result = incidents.filter(inc => {
        const matchesSearch = inc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || inc.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "ALL" || inc.status === statusFilter;
        const matchesCategory = categoryFilter === "ALL" || inc.category === categoryFilter;
        const matchesClass = classFilter === "ALL" || inc.classId === classFilter;
        const matchesMonth = monthFilter === "ALL" || inc.date.startsWith(monthFilter);
        return matchesSearch && matchesStatus && matchesCategory && matchesClass && matchesMonth;
        });
        result.sort((a, b) => {
            const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
            const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
            return timeB - timeA;
        });
        return result;
    } else {
        // Protocols
        let result = conversations.filter(conv => {
            const matchesSearch = 
              conv.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              conv.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (conv.participants && conv.participants.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesType = typeFilter === "ALL" || conv.type === typeFilter;
      
            return matchesSearch && matchesType;
        });
        result.sort((a, b) => {
            const timeA = new Date(`${a.date}T${a.time || "00:00"}`).getTime();
            const timeB = new Date(`${b.date}T${b.time || "00:00"}`).getTime();
            return timeB - timeA;
        });
        return result;
    }
  }, [type, incidents, conversations, searchTerm, statusFilter, categoryFilter, classFilter, monthFilter, typeFilter]);

  return (
    <div className="bg-white min-h-screen p-8 text-black">
      <div className="no-print fixed top-0 left-0 right-0 bg-slate-800 text-white p-4 flex justify-between items-center shadow-lg z-50">
        <div>
          <h2 className="font-bold text-lg">Druckvorschau ({type === 'incidents' ? 'Vorfallsprotokolle' : 'Gesprächsprotokolle'})</h2>
          <p className="text-slate-300 text-xs">Überprüfen Sie die Daten und klicken Sie auf "Jetzt Drucken", um das Dokument zu erstellen.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.close()} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center transition">
            <X className="w-4 h-4 mr-2" /> Schließen
          </button>
          <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg flex items-center font-bold transition">
            <Printer className="w-4 h-4 mr-2" /> Jetzt Drucken
          </button>
        </div>
      </div>
      <div className="h-20 no-print"></div>

      <div className="mb-8 border-b-2 border-black pb-4">
        <h1 className="text-3xl font-bold mb-2">{type === 'incidents' ? 'Vorfallsprotokolle' : 'Gesprächsprotokolle'}</h1>
        <div className="flex justify-between items-end">
          <div className="text-sm space-y-1">
            <p><strong>Erstellt am:</strong> {new Date().toLocaleDateString()} um {new Date().toLocaleTimeString()}</p>
            <p><strong>Filter:</strong> {' '}
              {searchTerm && `Suche: "${searchTerm}" • `}
              {type === 'incidents' ? (
                  <>
                    {classFilter !== 'ALL' && `Klasse: ${classes.find(c=>c.id===classFilter)?.name} • `}
                    {statusFilter !== 'ALL' && `Status: ${statusFilter} • `}
                    {categoryFilter !== 'ALL' && `Kategorie: ${categoryFilter}`}
                  </>
              ) : (
                  <>
                    {typeFilter !== 'ALL' && `Typ: ${typeFilter}`}
                  </>
              )}
              {((type === 'incidents' && classFilter === 'ALL' && statusFilter === 'ALL' && categoryFilter === 'ALL') || 
                (type === 'protocols' && typeFilter === 'ALL')) && !searchTerm && "Alle Einträge"}
            </p>
          </div>
          <div className="text-right text-sm">
            <strong>Anzahl:</strong> {filteredData.length} Einträge
          </div>
        </div>
      </div>

      <table className="print-table w-full text-left">
        <thead>
          <tr>
            <th style={{width: '15%'}}>Datum/Typ</th>
            <th style={{width: '20%'}}>Teilnehmer/Schüler</th>
            {type === 'incidents' ? (
                <>
                    <th style={{width: '15%'}}>Kategorie</th>
                    <th style={{width: '30%'}}>Beschreibung & Beteiligte</th>
                    <th style={{width: '20%'}}>Maßnahmen & Status</th>
                </>
            ) : (
                <>
                    <th style={{width: '35%'}}>Thema & Inhalt</th>
                    <th style={{width: '30%'}}>Ergebnis & Folgetermin</th>
                </>
            )}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={5} className="text-center p-8 text-gray-500 italic">Lade Daten...</td></tr>
          ) : filteredData.length === 0 ? (
            <tr><td colSpan={5} className="text-center p-8 text-gray-500 italic">Keine Einträge für diese Auswahl gefunden.</td></tr>
          ) : (
            filteredData.map((item: any) => (
              <tr key={item.id}>
                <td>
                  <div className="font-bold">{new Date(item.date).toLocaleDateString()}</div>
                  <div>{item.time} Uhr</div>
                  <div className="text-gray-600 italic mt-1 text-xs">{item.location}</div>
                  {type === 'protocols' && <div className="text-xs font-semibold uppercase text-indigo-700 mt-1">{item.type}</div>}
                  {item.reportedBy && <div className="text-gray-500 text-xs mt-2 border-t pt-1">Melder/Prot.: {item.reportedBy}</div>}
                </td>
                
                {/* Protocol Specific or Incident Specific Columns */}
                {type === 'incidents' ? (
                    // INCIDENTS COLUMNS
                    <>
                        <td>
                            <div className="font-bold">{item.studentName}</div>
                            <div>{item.className}</div>
                            <div className="text-xs text-gray-500">{item.yearLevelName}</div>
                        </td>
                        <td>{item.category}</td>
                        <td>
                            <div className="whitespace-pre-wrap text-sm">{item.description}</div>
                            {(item.involvedPersons || item.witnesses) && (
                                <div className="mt-2 pt-2 border-t border-gray-300 text-xs">
                                {item.involvedPersons && <div className="mb-1"><strong>Beteiligte:</strong> {item.involvedPersons}</div>}
                                {item.witnesses && <div><strong>Zeugen:</strong> {item.witnesses}</div>}
                                </div>
                            )}
                        </td>
                        <td>
                            {item.immediateActions && <div className="mb-2 text-sm"><strong>Maßnahme:</strong> {item.immediateActions}</div>}
                            {item.agreements && <div className="mb-2 text-sm"><strong>Verbleib:</strong> {item.agreements}</div>}
                            <div className="mt-1 text-xs space-y-1">
                                {item.parentContacted && <div>☑ Eltern</div>}
                                {item.administrationContacted && <div>☑ SL</div>}
                                {item.socialServiceContacted && <div>☑ Soz. ({item.socialServiceAbbreviation})</div>}
                            </div>
                            <div className="mt-2">
                                <span className="font-bold border border-gray-400 px-2 py-1 rounded inline-block text-xs uppercase tracking-wider">{item.status}</span>
                            </div>
                        </td>
                    </>
                ) : (
                    // PROTOCOL COLUMNS
                    <>
                         <td>
                            <div className="font-bold">{item.studentName || 'Kein Schülerbezug'}</div>
                            {item.className && <div className="text-xs text-gray-600">Klasse {item.className}</div>}
                            {item.participants && (
                                <div className="mt-2 text-xs text-gray-500">
                                    <strong>Weitere Teilnehmer:</strong><br/>
                                    {item.participants}
                                </div>
                            )}
                        </td>
                        <td>
                            <div className="font-bold mb-1">{item.subject}</div>
                            <div className="whitespace-pre-wrap text-sm text-gray-700">{item.content}</div>
                            {item.goals && (
                                <div className="mt-2 pt-2 border-t border-gray-200 text-xs italic">
                                    <strong>Ziel:</strong> {item.goals}
                                </div>
                            )}
                        </td>
                        <td>
                            <div className="text-sm">{item.results || <span className="text-gray-400 italic">Keine Ergebnisse festgehalten</span>}</div>
                            {item.nextAppointment?.date && (
                                <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
                                    <div className="font-bold flex items-center mb-1"><Calendar className="w-3 h-3 mr-1"/> Folgetermin</div>
                                    <div>{new Date(item.nextAppointment.date).toLocaleDateString()} um {item.nextAppointment.time}</div>
                                    <div className="text-gray-500">{item.nextAppointment.location}</div>
                                </div>
                            )}
                        </td>
                    </>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
      
      <div className="mt-8 text-xs text-gray-500 text-center border-t border-gray-300 pt-2 print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white">
        Dokument generiert durch CVO-Dokumentation - Vertrauliche Unterlage
      </div>
    </div>
  );
};