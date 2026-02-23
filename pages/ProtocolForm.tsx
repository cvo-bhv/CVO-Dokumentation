import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, X, Save, User, Calendar, MessageSquare, Target, CheckSquare, Clock, Printer } from 'lucide-react';
import { ConversationType, Conversation, Student, ClassLevel } from '../types';
import { 
  fetchStudents, fetchClasses, addConversation, updateConversation, getConversation, deleteConversation, isNCConfigured 
} from '../services/nextcloudService';
import { SinglePrintPreview } from '../components/SinglePrintPreview';

export const ProtocolForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{id: string}>();
  const isEditMode = !!id;

  // Data Loading
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassLevel[]>([]);

  // Form State
  const [type, setType] = useState<ConversationType>(ConversationType.PARENT);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toLocaleTimeString('de-DE', {hour:'2-digit', minute:'2-digit'}));
  const [location, setLocation] = useState("");
  const [reportedBy, setReportedBy] = useState(""); // New State
  
  // Participants
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentName, setStudentName] = useState(""); // Can be manual
  const [className, setClassName] = useState(""); // Can be manual
  const [participants, setParticipants] = useState("");

  // Content
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [goals, setGoals] = useState("");
  const [results, setResults] = useState("");

  // Next Appointment
  const [hasNextAppt, setHasNextAppt] = useState(false);
  const [nextDate, setNextDate] = useState("");
  const [nextTime, setNextTime] = useState("");
  const [nextLocation, setNextLocation] = useState("");
  const [nextParticipants, setNextParticipants] = useState("");

  // Print State
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!isNCConfigured()) return;
      try {
        const [studs, cls] = await Promise.all([fetchStudents(), fetchClasses()]);
        setAvailableStudents(studs);
        setAvailableClasses(cls);

        if (isEditMode && id) {
          const conv = await getConversation(id);
          if (conv) {
            setType(conv.type);
            setDate(conv.date);
            setTime(conv.time);
            setLocation(conv.location);
            setReportedBy(conv.reportedBy || "");
            setSelectedStudentId(conv.studentId || "");
            setStudentName(conv.studentName);
            setClassName(conv.className);
            setParticipants(conv.participants);
            setSubject(conv.subject);
            setContent(conv.content);
            setGoals(conv.goals);
            setResults(conv.results);
            if (conv.nextAppointment) {
              setHasNextAppt(true);
              setNextDate(conv.nextAppointment.date);
              setNextTime(conv.nextAppointment.time);
              setNextLocation(conv.nextAppointment.location);
              setNextParticipants(conv.nextAppointment.participants);
            }
          }
        }
      } catch (e) {
        console.error("Error loading data", e);
      }
    };
    init();
  }, [id, isEditMode]);

  const handleStudentSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedStudentId(sId);
    if (sId) {
      const s = availableStudents.find(st => st.id === sId);
      if (s) {
        setStudentName(`${s.lastName}, ${s.firstName}`);
        const c = availableClasses.find(cl => cl.id === s.classId);
        setClassName(c ? c.name : "");
      }
    } else {
        // Keep manual input if switching to empty
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type, date, time, location, reportedBy,
      studentId: selectedStudentId || undefined,
      studentName, className, participants,
      subject, content, goals, results,
      nextAppointment: hasNextAppt ? {
        date: nextDate,
        time: nextTime,
        location: nextLocation,
        participants: nextParticipants
      } : undefined
    };

    if (isEditMode && id) {
      // @ts-ignore
      await updateConversation({ ...data, id, createdAt: Date.now() });
    } else {
      await addConversation(data);
    }
    navigate('/protocols');
  };

  const handleDelete = async () => {
    if (confirm("Protokoll wirklich löschen?")) {
      if (id) await deleteConversation(id);
      navigate('/protocols');
    }
  };

  const getPreviewData = () => {
    return {
      type, date, time, location, reportedBy,
      studentName, className, participants,
      subject, content, goals, results,
      nextAppointment: hasNextAppt ? {
        date: nextDate,
        time: nextTime,
        location: nextLocation,
        participants: nextParticipants
      } : undefined
    };
  };

  return (
    <div className="max-w-4xl mx-auto relative">
      {showPrintPreview && (
        <SinglePrintPreview 
          data={getPreviewData()} 
          type="protocol" 
          onClose={() => setShowPrintPreview(false)} 
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? 'Protokoll bearbeiten' : 'Neues Gesprächsprotokoll'}</h2>
        <div className="flex space-x-2">
          {isEditMode && (
            <button onClick={handleDelete} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => navigate('/protocols')} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Header / Meta */}
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Datum</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Uhrzeit</label>
              <input type="time" required value={time} onChange={e => setTime(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" />
            </div>
            <div className="md:col-span-1">
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ort</label>
               <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="z.B. Raum 101" className="w-full border border-gray-300 rounded-md p-2 text-sm" />
            </div>
            <div className="md:col-span-1">
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Protokollant:in</label>
               <input type="text" value={reportedBy} onChange={e => setReportedBy(e.target.value)} placeholder="Name" className="w-full border border-gray-300 rounded-md p-2 text-sm" />
            </div>
            <div className="md:col-span-4">
               <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Gesprächstyp</label>
               <div className="flex flex-wrap gap-2">
                 {Object.values(ConversationType).map(t => (
                   <button 
                    key={t} type="button" onClick={() => setType(t)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                   >
                     {t}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-indigo-500" /> Teilnehmer
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Schüler:in (Datenbank)</label>
                 <select value={selectedStudentId} onChange={handleStudentSelect} className="w-full border border-gray-300 rounded-md p-2 text-sm">
                   <option value="">-- Nicht aus Datenbank / Manuell --</option>
                   {availableStudents.map(s => <option key={s.id} value={s.id}>{s.lastName}, {s.firstName}</option>)}
                 </select>
               </div>
               <div className="grid grid-cols-3 gap-2">
                 <div className="col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">Name (Manuell/Auto)</label>
                   <input type="text" value={studentName} onChange={e => {setStudentName(e.target.value); setSelectedStudentId("");}} className="w-full border border-gray-300 rounded-md p-2 text-sm" placeholder="Nachname, Vorname"/>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Klasse</label>
                   <input type="text" value={className} onChange={e => setClassName(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" placeholder="z.B. 8b"/>
                 </div>
               </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weitere Teilnehmer</label>
              <textarea rows={4} value={participants} onChange={e => setParticipants(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" placeholder="Eltern, Lehrkräfte, Sozialarbeiter..."></textarea>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-500" /> Inhalt & Verlauf
          </h3>
          <div className="space-y-4">
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Betreff / Anlass / Gegenstand</label>
               <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Worum ging es?" />
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Gesprächsinhalt / Verlauf</label>
               <textarea required rows={6} value={content} onChange={e => setContent(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Detaillierte Notizen..."></textarea>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center"><Target className="w-4 h-4 mr-1 text-gray-400"/> Ziel des Gesprächs (Optional)</label>
               <textarea rows={2} value={goals} onChange={e => setGoals(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm"></textarea>
            </div>
          </div>
        </div>

        {/* Outcomes */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-green-600" /> Ergebnisse & Vereinbarungen
          </h3>
          <textarea rows={4} value={results} onChange={e => setResults(e.target.value)} className="w-full border border-gray-300 rounded-md p-2" placeholder="Lösungen, Abmachungen, Konsequenzen..."></textarea>
        </div>

        {/* Follow Up */}
        <div className="p-6 bg-gray-50/50">
          <div className="flex items-center mb-4">
            <input type="checkbox" id="nextAppt" checked={hasNextAppt} onChange={e => setHasNextAppt(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded mr-2" />
            <label htmlFor="nextAppt" className="font-semibold text-gray-800 cursor-pointer select-none flex items-center">
              <Clock className="w-5 h-5 mr-2 text-amber-500" /> Folgetermin vereinbart?
            </label>
          </div>
          
          {hasNextAppt && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-indigo-200 ml-2">
               <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Datum</label>
                  <input type="date" value={nextDate} onChange={e => setNextDate(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Uhrzeit</label>
                  <input type="time" value={nextTime} onChange={e => setNextTime(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Raum / Ort</label>
                  <input type="text" value={nextLocation} onChange={e => setNextLocation(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Teilnehmer</label>
                  <input type="text" value={nextParticipants} onChange={e => setNextParticipants(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm" />
               </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-white">
          <button type="button" onClick={() => navigate('/protocols')} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium">Abbrechen</button>
          
          <button type="button" onClick={() => setShowPrintPreview(true)} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium flex items-center">
            <Printer className="w-4 h-4 mr-2" /> Druckvorschau
          </button>
          
          <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center">
            <Save className="w-4 h-4 mr-2" /> Speichern
          </button>
        </div>
      </form>
    </div>
  );
};