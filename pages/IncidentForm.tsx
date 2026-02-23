import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, X, Plus, Save, Printer } from 'lucide-react';
import { IncidentStatus, IncidentCategory, YearLevel, ClassLevel, Student } from '../types';
import { 
  fetchYears, fetchClasses, fetchStudents, getIncident, addYear, addClass, addStudent, 
  getClassesByYear, getStudentsByClass, updateIncident, addIncident, deleteIncident, isNCConfigured 
} from '../services/nextcloudService';
import { SinglePrintPreview } from '../components/SinglePrintPreview';

export const IncidentForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{id: string}>();
  const isEditMode = !!id;

  // Selection Data
  const [years, setYears] = useState<YearLevel[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Selection States
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");

  // Form Data
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'}));
  const [location, setLocation] = useState("");
  const [reportedBy, setReportedBy] = useState(""); 
  const [category, setCategory] = useState<IncidentCategory>(IncidentCategory.DISRUPTION);
  const [description, setDescription] = useState("");
  const [involvedPersons, setInvolvedPersons] = useState("");
  const [witnesses, setWitnesses] = useState("");
  const [immediateActions, setImmediateActions] = useState("");
  const [agreements, setAgreements] = useState("");
  
  // Checkboxes
  const [parentContacted, setParentContacted] = useState(false);
  const [administrationContacted, setAdministrationContacted] = useState(false);
  const [socialServiceContacted, setSocialServiceContacted] = useState(false);
  const [socialServiceAbbreviation, setSocialServiceAbbreviation] = useState("");
  
  const [status, setStatus] = useState<IncidentStatus>(IncidentStatus.OPEN);

  // Print State
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!isNCConfigured()) return;

      try {
        const yrs = await fetchYears();
        setYears(yrs);

        if (isEditMode && id) {
          const incident = await getIncident(id);
          if (incident) {
            // Fill form
            setDate(incident.date);
            setTime(incident.time);
            setLocation(incident.location);
            setReportedBy(incident.reportedBy || "");
            setCategory(incident.category);
            setDescription(incident.description);
            setInvolvedPersons(incident.involvedPersons);
            setWitnesses(incident.witnesses);
            setImmediateActions(incident.immediateActions);
            setAgreements(incident.agreements);
            setParentContacted(incident.parentContacted);
            setAdministrationContacted(incident.administrationContacted || false);
            setSocialServiceContacted(incident.socialServiceContacted || false);
            setSocialServiceAbbreviation(incident.socialServiceAbbreviation || "");
            setStatus(incident.status);

            // Restore Selection Hierarchy
            const allStudents = await fetchStudents();
            const student = allStudents.find(x => x.id === incident.studentId);
            if (student) {
              const allClasses = await fetchClasses();
              const cl = allClasses.find(x => x.id === student.classId);
              if (cl) {
                // Load cascades
                const classesForYear = await getClassesByYear(cl.yearLevelId);
                const studentsForClass = await getStudentsByClass(cl.id);
                
                setClasses(classesForYear);
                setStudents(studentsForClass);
                
                setSelectedYear(cl.yearLevelId);
                setSelectedClass(cl.id);
                setSelectedStudent(student.id);
              }
            }
          }
        }
      } catch (e) {
        console.error("Fehler beim Laden des Formulars:", e);
      }
    };
    init();
  }, [id, isEditMode]);

  const handleYearChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const yId = e.target.value;
    setSelectedYear(yId);
    setSelectedClass("");
    setSelectedStudent("");
    setStudents([]);
    if (yId) {
      const cls = await getClassesByYear(yId);
      setClasses(cls);
    } else {
      setClasses([]);
    }
  };

  const handleClassChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cId = e.target.value;
    setSelectedClass(cId);
    setSelectedStudent("");
    if (cId) {
      const studs = await getStudentsByClass(cId);
      setStudents(studs);
    } else {
      setStudents([]);
    }
  };

  const createYear = async () => {
    const name = window.prompt("Name des neuen Jahrgangs (z.B. 'Jahrgang 11'):");
    if (name) {
      const newYear = await addYear(name);
      const allYears = await fetchYears();
      setYears(allYears);
      setSelectedYear(newYear.id);
      setClasses([]);
      setStudents([]);
      setSelectedClass("");
      setSelectedStudent("");
    }
  };

  const createClass = async () => {
    if (!selectedYear) { alert("Bitte wählen Sie zuerst einen Jahrgang aus."); return; }
    const name = window.prompt("Name der neuen Klasse (z.B. '11a'):");
    if (name) {
      const newClass = await addClass(selectedYear, name);
      const cls = await getClassesByYear(selectedYear);
      setClasses(cls);
      setSelectedClass(newClass.id);
      setStudents([]);
      setSelectedStudent("");
    }
  };

  const createStudent = async () => {
    if (!selectedClass) { alert("Bitte wählen Sie zuerst eine Klasse aus."); return; }
    const first = window.prompt("Vorname des Schülers:");
    if (!first) return;
    const last = window.prompt("Nachname des Schülers:");
    if (!last) return;
    
    const newStudent = await addStudent(selectedClass, first, last);
    const studs = await getStudentsByClass(selectedClass);
    setStudents(studs);
    setSelectedStudent(newStudent.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) { alert("Bitte wählen Sie einen Schüler aus."); return; }

    const incidentData = {
      studentId: selectedStudent,
      date,
      time,
      location,
      reportedBy,
      category,
      description,
      involvedPersons,
      witnesses,
      immediateActions,
      agreements,
      parentContacted,
      administrationContacted,
      socialServiceContacted,
      socialServiceAbbreviation: socialServiceContacted ? socialServiceAbbreviation : "",
      status
    };

    if (isEditMode && id) {
      // @ts-ignore
      await updateIncident({ ...incidentData, id, createdAt: Date.now() }); 
    } else {
      await addIncident(incidentData);
    }
    navigate('/incidents');
  };

  const handleDelete = async () => {
    if (isEditMode && id) {
      if (confirm("Diesen Eintrag wirklich löschen?")) {
        await deleteIncident(id);
        navigate('/incidents');
      }
    }
  };

  const getPreviewData = () => {
    const s = students.find(x => x.id === selectedStudent);
    const c = classes.find(x => x.id === selectedClass);
    return {
      studentName: s ? `${s.lastName}, ${s.firstName}` : '',
      className: c ? c.name : '',
      date, time, location, reportedBy, category, description,
      involvedPersons, witnesses, immediateActions, agreements,
      parentContacted, administrationContacted, socialServiceContacted,
      socialServiceAbbreviation
    };
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      {showPrintPreview && (
        <SinglePrintPreview 
          data={getPreviewData()} 
          type="incident" 
          onClose={() => setShowPrintPreview(false)} 
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Vorfall bearbeiten' : 'Neuen Vorfall melden'}</h2>
        <div className="flex space-x-2">
          {isEditMode && (
            <button onClick={handleDelete} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => navigate('/incidents')} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Section 1: Student Selection */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">1</span>
            Schüler:in auswählen
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jahrgang</label>
              <div className="flex gap-2">
                <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" value={selectedYear} onChange={handleYearChange} required>
                  <option value="">Bitte wählen...</option>
                  {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
                <button type="button" onClick={createYear} className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200" title="Neuen Jahrgang anlegen"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klasse</label>
              <div className="flex gap-2">
                <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" value={selectedClass} onChange={handleClassChange} disabled={!selectedYear} required>
                  <option value="">Bitte wählen...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" onClick={createClass} className={`p-2 rounded ${selectedYear ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'}`} disabled={!selectedYear} title="Neue Klasse anlegen"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schüler:in</label>
              <div className="flex gap-2">
                <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} disabled={!selectedClass} required>
                  <option value="">Bitte wählen...</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
                </select>
                <button type="button" onClick={createStudent} className={`p-2 rounded ${selectedClass ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-gray-100 text-gray-400'}`} disabled={!selectedClass} title="Neuen Schüler anlegen"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Core Data */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">2</span>
            Rahmendaten
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Uhrzeit</label>
                <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ort des Vorfalls</label>
                <input type="text" required value={location} onChange={e => setLocation(e.target.value)} placeholder="z.B. Klassenzimmer" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gemeldet von</label>
                <input type="text" required value={reportedBy} onChange={e => setReportedBy(e.target.value)} placeholder="Name Lehrkraft" className="w-full border border-gray-300 rounded-md p-2" />
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
              <select value={category} onChange={e => setCategory(e.target.value as IncidentCategory)} className="w-full border border-gray-300 rounded-md p-2">
                {Object.values(IncidentCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Description */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">3</span>
            Detaillierte Beschreibung
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Was ist passiert? (Beschreibung)</label>
              <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sachliche Schilderung des Hergangs..."></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weitere Beteiligte</label>
                <input type="text" value={involvedPersons} onChange={e => setInvolvedPersons(e.target.value)} placeholder="Namen..." className="w-full border border-gray-300 rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zeugen</label>
                <input type="text" value={witnesses} onChange={e => setWitnesses(e.target.value)} placeholder="Namen..." className="w-full border border-gray-300 rounded-md p-2" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Measures */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs mr-2">4</span>
            Maßnahmen & Verbleib
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ergriffene Sofortmaßnahmen</label>
              <textarea rows={2} value={immediateActions} onChange={e => setImmediateActions(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="z.B. Elterngespräch, Reflexionsbogen..."></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vereinbarungen / Konsequenzen</label>
              <textarea rows={2} value={agreements} onChange={e => setAgreements(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="z.B. Entschuldigung, Dienst für die Gemeinschaft..."></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <input type="checkbox" id="parentContact" checked={parentContacted} onChange={e => setParentContacted(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <label htmlFor="parentContact" className="text-gray-700 font-medium cursor-pointer select-none text-sm">Eltern informiert</label>
              </div>
              <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
                <input type="checkbox" id="adminContact" checked={administrationContacted} onChange={e => setAdministrationContacted(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                <label htmlFor="adminContact" className="text-gray-700 font-medium cursor-pointer select-none text-sm">Schulleitung inf.</label>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center space-x-2">
                <div className="flex items-center flex-1 space-x-2">
                  <input type="checkbox" id="socialContact" checked={socialServiceContacted} onChange={e => setSocialServiceContacted(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                  <label htmlFor="socialContact" className="text-gray-700 font-medium cursor-pointer select-none text-sm whitespace-nowrap">Schulsozialarbeit</label>
                </div>
                {socialServiceContacted && (
                  <input type="text" placeholder="Kürzel" value={socialServiceAbbreviation} onChange={e => setSocialServiceAbbreviation(e.target.value)} className="w-16 p-1 border border-gray-300 rounded text-sm" />
                )}
              </div>
            </div>

            <div className="pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as IncidentStatus)} className="w-full border border-gray-300 rounded-md p-2">
                {Object.values(IncidentStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button type="button" onClick={() => navigate('/incidents')} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium">Abbrechen</button>
          
          <button type="button" onClick={() => setShowPrintPreview(true)} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium flex items-center">
            <Printer className="w-4 h-4 mr-2" /> Druckvorschau
          </button>
          
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center">
            <Save className="w-4 h-4 mr-2" /> Speichern
          </button>
        </div>
      </form>
    </div>
  );
};