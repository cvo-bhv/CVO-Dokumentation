import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Plus, Search, FileText, ArrowUpDown, CloudOff, Printer, Users, Trash2
} from 'lucide-react';
import { MeetingMinute } from '../types';
import { fetchMeetingMinutes, isNCConfigured, deleteMeetingMinute } from '../services/nextcloudService';
import { SinglePrintPreview } from '../components/SinglePrintPreview';

export const MeetingMinutesList = () => {
  const navigate = useNavigate();
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isNCConfigured());

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC"); 
  const [selectedPrintMinute, setSelectedPrintMinute] = useState<MeetingMinute | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isNCConfigured()) {
        setLoading(false);
        setIsConfigured(false);
        return;
      }
      try {
        setLoading(true);
        setIsConfigured(true);
        const data = await fetchMeetingMinutes();
        setMinutes(data);
      } catch (e) {
        console.error("Error fetching meeting minutes", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredMinutes = useMemo(() => {
    let result = minutes.filter(m => {
      const matchesSearch = 
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.chairperson.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.attendees.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    result.sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.time.split('-')[0].trim().replace('h', '') || "00:00"}`).getTime();
      const timeB = new Date(`${b.date}T${b.time.split('-')[0].trim().replace('h', '') || "00:00"}`).getTime();
      return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [minutes, searchTerm, sortOrder]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Möchten Sie dieses Protokoll wirklich löschen?")) {
      try {
        await deleteMeetingMinute(id);
        setMinutes(prev => prev.filter(m => m.id !== id));
      } catch (error) {
        console.error("Error deleting meeting minute", error);
        alert("Fehler beim Löschen.");
      }
    }
  };

  const handlePrintSingle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const minute = minutes.find(m => m.id === id);
    if (minute) {
      setSelectedPrintMinute(minute);
    }
  };

  const handlePrintAll = () => {
    if(!isConfigured) return;
    const params = new URLSearchParams();
    params.append('type', 'meeting_minutes');
    if(searchTerm) params.append('search', searchTerm);
    
    const url = `#/print?${params.toString()}`;
    window.open(url, '_blank');
  };

  if (!isConfigured && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="p-6 bg-amber-50 rounded-full">
          <CloudOff className="w-12 h-12 text-amber-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Keine Verbindung</h2>
        <p className="text-gray-600 max-w-md">Die Sitzungsprotokolle können erst geladen werden, wenn Sie Ihre Nextcloud-Verbindung konfiguriert haben.</p>
        <button onClick={() => navigate('/settings')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
          Zu den Einstellungen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {selectedPrintMinute && (
        <SinglePrintPreview 
          data={selectedPrintMinute} 
          type="meeting_minute" 
          onClose={() => setSelectedPrintMinute(null)} 
        />
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Sitzungsprotokolle</h2>
          <p className="text-gray-500">Dokumentation von Sitzungen und Besprechungen.</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handlePrintAll} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center shadow-sm">
                <Printer className="w-5 h-5 mr-2" /> Druckvorschau
            </button>
            <Link to="/meetings/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center shadow-sm">
                <Plus className="w-5 h-5 mr-2" /> Neues Protokoll
            </Link>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
             <input 
               type="text" 
               placeholder="Suche nach Titel, Leitung, Teilnehmer..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
             />
          </div>

          <button 
              onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
              className="flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 min-w-[120px]"
            >
              <span>{sortOrder === 'DESC' ? 'Neueste' : 'Älteste'}</span>
              <ArrowUpDown className="w-4 h-4 text-gray-500 ml-2" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Datum / Zeit</th>
                <th className="px-6 py-4 font-semibold">Titel</th>
                <th className="px-6 py-4 font-semibold">Leitung / Protokoll</th>
                <th className="px-6 py-4 font-semibold">Teilnehmer</th>
                <th className="px-6 py-4 font-semibold text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic">Lade Daten...</td></tr>
              ) : filteredMinutes.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 italic text-sm">Keine Protokolle gefunden.</td></tr>
              ) : (
                filteredMinutes.map(m => (
                  <tr key={m.id} onClick={() => navigate(`/meetings/edit/${m.id}`)} className="hover:bg-indigo-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{new Date(m.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">{m.time}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-medium text-gray-900 truncate">
                        {(() => {
                          const dateStr = new Date(m.date).toLocaleDateString('de-DE');
                          let titleParts = [];
                          const occ = m.occasion || 'UP-Sitzung';
                          if (occ === 'Sonstige') {
                            if (m.occasionDetail) {
                              titleParts.push(m.occasionDetail);
                            } else {
                              titleParts.push('Sitzung');
                            }
                          } else {
                            titleParts.push(occ);
                            if (['Fachkonferenz', 'Teamsitzung'].includes(occ) && m.occasionDetail) {
                              titleParts.push(m.occasionDetail);
                            }
                          }
                          titleParts.push(dateStr);
                          return titleParts.join(' ');
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-800">L: {m.chairperson}</div>
                      <div className="text-xs text-gray-500">P: {m.minutesTaker}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                       <div className="text-sm text-gray-600 truncate flex items-center"><Users className="w-3 h-3 mr-1"/> {m.attendees}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end space-y-2">
                        <button onClick={(e) => handlePrintSingle(e, m.id)} className="text-gray-600 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition shadow-sm border border-transparent hover:border-indigo-100" title="Drucken">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/meetings/edit/${m.id}`); }} className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-full transition shadow-sm border border-transparent hover:border-indigo-100" title="Bearbeiten">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDelete(e, m.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition shadow-sm border border-transparent hover:border-red-100" title="Löschen">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
