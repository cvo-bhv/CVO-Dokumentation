import React, { useState, useEffect } from 'react';
import { Folder, Users, Plus, Trash2, User } from 'lucide-react';
import { YearLevel, ClassLevel, Student } from '../types';
import { 
  fetchYears, getClassesByYear, getStudentsByClass, addYear, deleteYear, 
  addClass, deleteClass, addStudent, deleteStudent, isNCConfigured 
} from '../services/nextcloudService';

const ChevronRight = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export const StructureManager = () => {
  const [years, setYears] = useState<YearLevel[]>([]);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // Inputs
  const [yearName, setYearName] = useState("");
  const [className, setClassName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const refresh = async () => {
    if (!isNCConfigured()) return;

    try {
      const y = await fetchYears();
      setYears(y);
      if (selectedYear) {
        const c = await getClassesByYear(selectedYear);
        setClasses(c);
      } else {
        setClasses([]);
      }
      if (selectedClass) {
        const s = await getStudentsByClass(selectedClass);
        setStudents(s);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.warn("Konnte Strukturdaten nicht laden:", error);
    }
  };

  useEffect(() => { refresh(); }, [selectedYear, selectedClass]);

  const handleAddYear = async () => { 
    if(!yearName.trim()) return;
    if(!isNCConfigured()) { alert("Bitte konfigurieren Sie zuerst die Nextcloud-Verbindung in den Einstellungen."); return; }
    
    try {
      await addYear(yearName); 
      setYearName(""); 
      refresh(); 
    } catch (e: any) {
      alert("Fehler beim Speichern: " + e.message);
    }
  };
  
  const handleDeleteYear = async (id: string) => { 
    if(confirm("Sind Sie sicher? Alle Klassen und Schüler in diesem Jahrgang werden endgültig aus der Datenbank gelöscht.")) { 
      try {
        await deleteYear(id); 
        if(selectedYear === id) setSelectedYear(null); 
        refresh(); 
      } catch (e: any) {
        alert("Fehler beim Löschen: " + e.message);
      }
    }
  };

  const handleAddClass = async () => { 
    if(!selectedYear || !className.trim()) return;
    if(!isNCConfigured()) { alert("Bitte konfigurieren Sie zuerst die Nextcloud-Verbindung."); return; }

    try {
      await addClass(selectedYear, className); 
      setClassName(""); 
      refresh(); 
    } catch (e: any) {
      alert("Fehler beim Speichern der Klasse: " + e.message);
    }
  };
  
  const handleDeleteClass = async (id: string) => { 
    if(confirm("Klasse und alle zugehörigen Schüler endgültig löschen?")) { 
      try {
        await deleteClass(id); 
        if(selectedClass === id) setSelectedClass(null); 
        refresh(); 
      } catch (e: any) {
        alert("Fehler beim Löschen: " + e.message);
      }
    }
  };

  const handleAddStudent = async () => { 
    if(!selectedClass || !firstName.trim() || !lastName.trim()) return;
    if(!isNCConfigured()) { alert("Bitte konfigurieren Sie zuerst die Nextcloud-Verbindung."); return; }

    try {
      await addStudent(selectedClass, firstName, lastName); 
      setFirstName(""); 
      setLastName(""); 
      refresh(); 
    } catch (e: any) {
      alert("Fehler beim Speichern des Schülers: " + e.message);
    }
  };
  
  const handleDeleteStudent = async (id: string) => { 
    if(confirm("Schüler wirklich löschen?")) { 
      try {
        await deleteStudent(id); 
        refresh(); 
      } catch (e: any) {
        alert("Fehler beim Löschen: " + e.message);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* Years */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-w-0">
        <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl flex justify-between items-center">
          <h2 className="font-semibold text-gray-700 flex items-center whitespace-nowrap"><Folder className="w-5 h-5 mr-2 text-blue-500" /> Jahrgänge</h2>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="flex space-x-2">
            <input type="text" value={yearName} onChange={e => setYearName(e.target.value)} placeholder="z.B. Jahrgang 5" className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            <button onClick={handleAddYear} className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition flex-shrink-0"><Plus className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {years.map(y => (
            <div key={y.id} onClick={() => { setSelectedYear(y.id); setSelectedClass(null); }} 
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition ${selectedYear === y.id ? 'bg-blue-50 border border-blue-200 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}`}>
              <span className="font-medium truncate mr-2">{y.name}</span>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); handleDeleteYear(y.id); }} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                <ChevronRight className={`w-4 h-4 ${selectedYear === y.id ? 'text-blue-500' : 'text-gray-300'}`} />
              </div>
            </div>
          ))}
          {years.length === 0 && <p className="text-gray-400 text-center text-sm mt-4">Keine Jahrgänge</p>}
        </div>
      </div>

      {/* Classes */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-w-0 ${selectedYear ? '' : 'opacity-50 pointer-events-none'}`}>
        <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="font-semibold text-gray-700 flex items-center whitespace-nowrap"><Users className="w-5 h-5 mr-2 text-indigo-500" /> Klassen</h2>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="flex space-x-2">
            <input type="text" value={className} onChange={e => setClassName(e.target.value)} placeholder="z.B. 5a" className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            <button onClick={handleAddClass} className="bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition flex-shrink-0"><Plus className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {classes.map(c => (
            <div key={c.id} onClick={() => setSelectedClass(c.id)} 
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition ${selectedClass === c.id ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'hover:bg-gray-50 text-gray-700'}`}>
              <span className="font-medium truncate mr-2">{c.name}</span>
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); handleDeleteClass(c.id); }} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                <ChevronRight className={`w-4 h-4 ${selectedClass === c.id ? 'text-indigo-500' : 'text-gray-300'}`} />
              </div>
            </div>
          ))}
          {selectedYear && classes.length === 0 && <p className="text-gray-400 text-center text-sm mt-4">Keine Klassen im Jahrgang</p>}
        </div>
      </div>

      {/* Students */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-w-0 ${selectedClass ? '' : 'opacity-50 pointer-events-none'}`}>
        <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-xl">
          <h2 className="font-semibold text-gray-700 flex items-center whitespace-nowrap"><User className="w-5 h-5 mr-2 text-emerald-500" /> Schüler:innen</h2>
        </div>
        <div className="p-4 border-b border-gray-100 space-y-3">
          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Vorname" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
          <div className="flex space-x-2">
            <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Nachname" className="flex-1 min-w-0 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            <button onClick={handleAddStudent} className="bg-emerald-600 text-white p-2 rounded-md hover:bg-emerald-700 transition flex-shrink-0"><Plus className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {students.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200 group">
              <span className="text-gray-700 truncate min-w-0 flex-1 mr-2">{s.firstName} <strong>{s.lastName}</strong></span>
              <button onClick={() => handleDeleteStudent(s.id)} className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {selectedClass && students.length === 0 && <p className="text-gray-400 text-center text-sm mt-4">Keine Schüler in dieser Klasse</p>}
        </div>
      </div>
    </div>
  );
};