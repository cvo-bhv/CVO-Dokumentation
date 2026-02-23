import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Plus, Printer, Search, FileText, Filter, Calendar, Users, AlertCircle, CloudOff, ArrowUpDown, Trash2
} from 'lucide-react';
import { IncidentStatus, IncidentCategory, JoinedIncident, ClassLevel } from '../types';
import { fetchIncidents, fetchStudents, fetchClasses, fetchYears, isNCConfigured, deleteIncident } from '../services/nextcloudService';

export const IncidentsList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const [incidents, setIncidents] = useState<JoinedIncident[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState(isNCConfigured());

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || "ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [classFilter, setClassFilter] = useState("ALL");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC"); 

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
        // Load all necessary data to join
        const [inc, studs, cls, yrs] = await Promise.all([
          fetchIncidents(),
          fetchStudents(),
          fetchClasses(),
          fetchYears()
        ]);

        setClasses(cls);

        // Join Data
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
      } catch (e) {
        console.error("Error fetching data", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Unique Months for Filter
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    incidents.forEach(inc => {
      const d = new Date(inc.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.add(key);
    });
    return Array.from(months).sort().reverse();
  }, [incidents]);

  const formatMonth = (key: string) => {
    const [y, m] = key.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
  };

  // Filtering Logic
  const filteredIncidents = useMemo(() => {
    let result = incidents.filter(inc => {
      const matchesSearch = 
        inc.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || inc.status === statusFilter;
      const matchesCategory = categoryFilter === "ALL" || inc.category === categoryFilter;
      const matchesClass = classFilter === "ALL" || inc.classId === classFilter;
      const matchesMonth = monthFilter === "ALL" || inc.date.startsWith(monthFilter);

      return matchesSearch && matchesStatus && matchesCategory && matchesClass && matchesMonth;
    });

    // Sorting
    result.sort((a, b) => {
      const getTime = (i: JoinedIncident) => {
        if (!i.date) return 0;
        const [h, m] = (i.time || "00:00").split(':');
        const timeStr = `${(h||"00").padStart(2, '0')}:${m||"00"}`;
        const iso = `${i.date}T${timeStr}`;
        return new Date(iso).getTime();
      };
      const timeA = getTime(a);
      const timeB = getTime(b);
      return sortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [incidents, searchTerm, statusFilter, categoryFilter, classFilter, monthFilter, sortOrder]);

  const getStatusColor = (status: IncidentStatus) => {
    switch(status) {
      case IncidentStatus.OPEN: return "bg-red-100 text-red-800";
      case IncidentStatus.IN_PROGRESS: return "bg-blue-100 text-blue-800";
      case IncidentStatus.RESOLVED: return "bg-green-100 text-green-800";
      case IncidentStatus.MONITORING: return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const sortedClasses = [...classes].sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}));

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Möchten Sie diesen Eintrag wirklich löschen?")) {
      try {
        await deleteIncident(id);
        setIncidents(prev => prev.filter(i => i.id !== id));
      } catch (error) {
        console.error("Error deleting incident", error);
        alert("Fehler beim Löschen.");
      }
    }
  };

  const handlePrintSingle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    window.open(`#/print-incident?id=${id}`, '_blank');
  };

  const handlePrintAll = () => {
    if(!isConfigured) return;
    const params = new URLSearchParams();
    params.append('type', 'incidents');
    if(searchTerm) params.append('search', searchTerm);
    if(statusFilter !== 'ALL') params.append('status', statusFilter);
    if(categoryFilter !== 'ALL') params.append('category', categoryFilter);
    if(classFilter !== 'ALL') params.append('class', classFilter);
    if(monthFilter !== 'ALL') params.append('month', monthFilter);
    
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
        <p className="text-gray-600 max-w-md">Die Protokolle können erst geladen werden, wenn Sie Ihre Nextcloud-Verbindung konfiguriert haben.</p>
        <button onClick={() => navigate('/settings')} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition">
          Zu den Einstellungen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Vorfallsprotokolle</h2>
          <p className="text-gray-500">Verwalten und filtern Sie alle dokumentierten Konflikte.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrintAll} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center shadow-sm">
            <Printer className="w-5 h-5 mr-2" /> Druckvorschau
          </button>
          <Link to="/incidents/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center shadow-sm">
            <Plus className="w-5 h-5 mr-2" /> Neuer Eintrag
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4 filters-container">
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Suche nach Schüler oder Stichwort..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-3">
          {/* Sort */}
          <div className="relative min-w-[140px]">
            <button 
              onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 text-sm font-medium text-gray-700"
            >
              <span>{sortOrder === 'DESC' ? 'Neueste' : 'Älteste'}</span>
              <ArrowUpDown className="w-4 h-4 text-gray-500 ml-2" />
            </button>
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <select 
              value={classFilter} 
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="ALL">Alle Klassen</option>
              {sortedClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <Users className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="ALL">Alle Status</option>
              {Object.values(IncidentStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="ALL">Alle Kategorien</option>
              {Object.values(IncidentCategory).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>

          <div className="relative flex-1 min-w-[140px]">
            <select 
              value={monthFilter} 
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="ALL">Alle Zeiträume</option>
              {availableMonths.map(m => <option key={m} value={m}>{formatMonth(m)}</option>)}
            </select>
            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Datum / Ort</th>
                <th className="px-6 py-4 font-semibold">Schüler:in</th>
                <th className="px-6 py-4 font-semibold">Kategorie</th>
                <th className="px-6 py-4 font-semibold">Kurzbeschreibung</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic">Lade Daten...</td></tr>
              ) : filteredIncidents.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 italic text-sm">Keine Einträge gefunden.</td></tr>
              ) : (
                filteredIncidents.map(inc => (
                  <tr key={inc.id} onClick={() => navigate(`/incidents/edit/${inc.id}`)} className="hover:bg-blue-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{new Date(inc.date).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{inc.time} Uhr</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{inc.studentName}</div>
                      <div className="text-xs text-gray-500">{inc.className} ({inc.yearLevelName})</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {inc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-gray-600 text-sm">
                      {inc.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inc.status)}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end space-y-2">
                        <button onClick={(e) => handlePrintSingle(e, inc.id)} className="text-gray-600 hover:text-indigo-600 p-2 hover:bg-indigo-50 rounded-full transition shadow-sm border border-transparent hover:border-indigo-100" title="Drucken">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); navigate(`/incidents/edit/${inc.id}`); }} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition shadow-sm border border-transparent hover:border-blue-100" title="Bearbeiten">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => handleDelete(e, inc.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition shadow-sm border border-transparent hover:border-red-100" title="Löschen">
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