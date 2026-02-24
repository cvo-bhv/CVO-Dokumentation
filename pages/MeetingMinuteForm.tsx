import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus, X, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { MeetingMinute, AgendaItem } from '../types';
import { addMeetingMinute, updateMeetingMinute, getMeetingMinute, deleteMeetingMinute, fetchMeetingMinutes } from '../services/nextcloudService';
import { RichTextEditor } from '../components/RichTextEditor';
import { SinglePrintPreview } from '../components/SinglePrintPreview';

export const MeetingMinuteForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Omit<MeetingMinute, 'id' | 'createdAt'>>({
    date: new Date().toISOString().split('T')[0],
    time: '',
    title: `UP-Sitzung ${new Date().toLocaleDateString('de-DE')}`,
    occasion: 'UP-Sitzung',
    occasionDetail: '',
    chairperson: '',
    minutesTaker: '',
    attendees: '',
    agendaItems: []
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Navigation State
  const [prevId, setPrevId] = useState<string | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && id) {
      const load = async () => {
        try {
          const allMinutes = await fetchMeetingMinutes();
          const sortedMinutes = [...allMinutes].sort((a, b) => {
            const getTime = (i: any) => {
              if (!i.date) return 0;
              const [h, m] = (i.time || "00:00").split(':');
              const timeStr = `${(h||"00").padStart(2, '0')}:${m||"00"}`;
              const iso = `${i.date}T${timeStr}`;
              return new Date(iso).getTime();
            };
            return getTime(b) - getTime(a);
          });
          
          const currentIndex = sortedMinutes.findIndex(i => i.id === id);
          if (currentIndex !== -1) {
            setPrevId(currentIndex > 0 ? sortedMinutes[currentIndex - 1].id : null);
            setNextId(currentIndex < sortedMinutes.length - 1 ? sortedMinutes[currentIndex + 1].id : null);
          }

          const minute = await getMeetingMinute(id);
          if (minute) {
            setFormData(minute);
            setHasUnsavedChanges(false);
          } else {
            navigate('/meetings');
          }
        } catch (e) {
          console.error("Error loading meeting minute", e);
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [id, isEdit, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const next = { ...prev, [name]: value };
      
      if (name === 'occasion' || name === 'occasionDetail' || name === 'date') {
        const dateStr = new Date(next.date).toLocaleDateString('de-DE');
        let titleParts = [];
        const occ = next.occasion || 'UP-Sitzung';
        if (occ === 'Sonstige') {
          if (next.occasionDetail) {
            titleParts.push(next.occasionDetail);
          } else {
            titleParts.push('Sitzung');
          }
        } else {
          titleParts.push(occ);
          if (['Fachkonferenz', 'Teamsitzung'].includes(occ) && next.occasionDetail) {
            titleParts.push(next.occasionDetail);
          }
        }
        titleParts.push(dateStr);
        next.title = titleParts.join(' ');
      }
      
      return next;
    });
    setHasUnsavedChanges(true);
  };

  const handleAddAgendaItem = () => {
    setFormData(prev => ({
      ...prev,
      agendaItems: [
        ...prev.agendaItems,
        { id: uuidv4(), number: String(prev.agendaItems.length + 1), summary: '' }
      ]
    }));
    setHasUnsavedChanges(true);
  };

  const handleAgendaItemChange = (itemId: string, field: keyof AgendaItem, value: string) => {
    setFormData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.map(item => 
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }));
    setHasUnsavedChanges(true);
  };

  const handleRemoveAgendaItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      agendaItems: prev.agendaItems.filter(item => item.id !== itemId)
    }));
    setHasUnsavedChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      let savedId = id;
      if (isEdit && id) {
        await updateMeetingMinute({ ...formData, id, createdAt: (formData as any).createdAt || Date.now() });
      } else {
        const newMinute = await addMeetingMinute(formData);
        savedId = newMinute.id;
      }
      setHasUnsavedChanges(false);
      if (!isEdit && savedId) {
        navigate(`/meetings/edit/${savedId}`, { replace: true });
      } else {
        // Just show success if already editing
        alert("Erfolgreich gespeichert!");
      }
    } catch (error) {
      console.error("Error saving meeting minute", error);
      alert("Fehler beim Speichern. Bitte überprüfen Sie die Nextcloud-Verbindung.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (window.confirm("Es gibt ungespeicherte Änderungen. Möchten Sie wirklich abbrechen?")) {
        navigate('/meetings');
      }
    } else {
      navigate('/meetings');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Möchten Sie dieses Protokoll wirklich löschen?')) {
      try {
        setSaving(true);
        if (id) await deleteMeetingMinute(id);
        navigate('/meetings');
      } catch (error) {
        console.error("Error deleting meeting minute", error);
        alert("Fehler beim Löschen.");
      } finally {
        setSaving(false);
      }
    }
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Lade Daten...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {showPrintPreview && (
        <SinglePrintPreview 
          data={formData} 
          type="meeting_minute" 
          onClose={() => setShowPrintPreview(false)} 
        />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Sitzungsprotokoll bearbeiten' : 'Neues Sitzungsprotokoll'}
          </h2>
          {isEdit && (
            <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
              <button 
                type="button"
                onClick={() => prevId && navigate(`/meetings/edit/${prevId}`)} 
                disabled={!prevId}
                className={`p-1.5 rounded ${prevId ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                title="Vorheriges Protokoll"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-px h-5 bg-gray-200"></div>
              <button 
                type="button"
                onClick={() => nextId && navigate(`/meetings/edit/${nextId}`)} 
                disabled={!nextId}
                className={`p-1.5 rounded ${nextId ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
                title="Nächstes Protokoll"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {isEdit && (
            <button onClick={handleDelete} disabled={saving} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
          <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Anlass</label>
                  <select required name="occasion" value={formData.occasion || 'UP-Sitzung'} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value="UP-Sitzung">UP-Sitzung</option>
                    <option value="Fachkonferenz">Fachkonferenz</option>
                    <option value="Teamsitzung">Teamsitzung</option>
                    <option value="Gesamtkonferenz">Gesamtkonferenz</option>
                    <option value="Sonstige">Sonstige</option>
                  </select>
                </div>
                {['Fachkonferenz', 'Teamsitzung', 'Sonstige'].includes(formData.occasion || 'UP-Sitzung') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {formData.occasion === 'Fachkonferenz' ? 'Fach' : formData.occasion === 'Teamsitzung' ? 'Jahrgang' : 'Sonstiges'}
                    </label>
                    <input required type="text" name="occasionDetail" value={formData.occasionDetail || ''} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titel</label>
                <input required type="text" name="title" value={formData.title} readOnly className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                  <input required type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zeit</label>
                  <input required type="text" name="time" value={formData.time} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="z.B. 11:45h- 12:30h" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sitzungsleitung</label>
                  <input required type="text" name="chairperson" value={formData.chairperson} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Kürzel/Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Protokollant</label>
                  <input required type="text" name="minutesTaker" value={formData.minutesTaker} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Kürzel/Name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Anwesenheit</label>
                <input required type="text" name="attendees" value={formData.attendees} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Teilnehmer durch Komma getrennt" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Tagesordnungspunkte (TOP)</h3>
            </div>

            <div className="space-y-4">
              {formData.agendaItems.map((item, index) => (
                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 relative group">
                  <div className="w-20 shrink-0">
                    <label className="block text-xs font-medium text-gray-500 mb-1">TOP</label>
                    <input type="text" value={item.number} onChange={(e) => handleAgendaItemChange(item.id, 'number', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Überschrift (optional)</label>
                    <input type="text" value={item.title || ''} onChange={(e) => handleAgendaItemChange(item.id, 'title', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold mb-2" placeholder="Titel des TOPs" />
                    <label className="block text-xs font-medium text-gray-500 mb-1">Zusammenfassung / Ergebnisse</label>
                    <RichTextEditor
                      value={item.summary}
                      onChange={(val) => handleAgendaItemChange(item.id, 'summary', val)}
                      placeholder="Ergebnisse hier eintragen..."
                    />
                  </div>
                  <button type="button" onClick={() => handleRemoveAgendaItem(item.id)} className="absolute -top-2 -right-2 p-1 bg-white border border-gray-200 rounded-full text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition shadow-sm">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.agendaItems.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-lg text-gray-500">
                  Keine Tagesordnungspunkte vorhanden. Klicken Sie auf "TOP hinzufügen".
                </div>
              )}
              
              <div className="pt-2">
                <button type="button" onClick={handleAddAgendaItem} className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 transition text-sm font-medium w-full justify-center border border-indigo-100 border-dashed">
                  <Plus className="w-4 h-4 mr-2" /> Weiteren TOP hinzufügen
                </button>
              </div>
            </div>
          </div>

        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button type="button" onClick={handleCancel} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium">Abbrechen</button>
          
          <button type="button" onClick={handlePrint} className="px-6 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium flex items-center">
            <Printer className="w-4 h-4 mr-2" /> Druckvorschau
          </button>
          
          <button type="button" onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium flex items-center disabled:opacity-50">
            <Save className="w-4 h-4 mr-2" /> {saving ? 'Speichert...' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  );
};
