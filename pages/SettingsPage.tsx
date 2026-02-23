import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cloud, HelpCircle, Save, AlertCircle, ShieldCheck, Clock, Link, Database, LogOut, Lock, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { IncidentStatus, IncidentCategory, ConversationType } from '../types';
import { 
  getNCConfig, saveNCConfig, fetchYears, isNCConfigured,
  fetchClasses, fetchStudents, fetchIncidents, fetchConversations, fetchMeetingMinutes,
  saveYears, saveClasses, saveStudents, saveIncidents, saveConversations, saveMeetingMinutes
} from '../services/nextcloudService';

export const SettingsPage = () => {
  const navigate = useNavigate();
  
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState(false);

  // Config State
  const [config, setConfig] = useState(getNCConfig());
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'testing'>('idle');
  const [message, setMessage] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem('cvo_admin_auth') === 'true';
    setIsAuthenticated(auth);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "0000") {
      sessionStorage.setItem('cvo_admin_auth', 'true');
      setIsAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
      setPasswordInput("");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cvo_admin_auth');
    setIsAuthenticated(false);
    navigate('/');
  };

  const handleSave = () => {
    try {
      if (config.url && !config.url.startsWith('http')) {
        throw new Error("URL muss mit http:// oder https:// beginnen");
      }
      saveNCConfig(config);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
      return true;
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message);
      return false;
    }
  };

  const handleTestConnection = async () => {
    setStatus('testing');
    setMessage('');
    try {
      await fetchYears();
      setStatus('success');
      alert("Verbindung erfolgreich hergestellt!");
    } catch (e: any) {
      setStatus('error');
      setMessage(e.message);
      alert("Verbindung fehlgeschlagen: " + e.message);
    }
  };

  const importShareLink = () => {
    const regex = /^(https?:\/\/[^\/]+)\/s\/([a-zA-Z0-9]+)/;
    const match = shareLink.match(regex);
    
    if (match) {
      const [full, domain, token] = match;
      const newConfig = {
        url: `${domain}/public.php/webdav`,
        user: token,
        token: '',
        path: ''
      };
      setConfig(newConfig);
      setShareLink('');
      alert("Link erfolgreich importiert! Die Einstellungen wurden für einen öffentlichen Ordner angepasst. Bitte klicken Sie unten noch auf 'Speichern'.");
    } else {
      alert("Das Format des Links wurde nicht erkannt. Es sollte wie folgt aussehen: https://meine-cloud.de/s/xyz123");
    }
  };

  const generateDemoData = async () => {
    const saved = handleSave();
    if (!saved && !isNCConfigured()) {
        alert("Bitte konfigurieren und speichern Sie zuerst die Nextcloud-Verbindung.");
        return;
    }
    
    if (!confirm("Dies generiert ca. 200 Datensätze (Vorfälle, Gespräche & Sitzungsprotokolle) sowie Schülerdaten in Ihrer Nextcloud.\n\nDieser Vorgang kann bis zu 30 Sekunden dauern.\n\nFortfahren?")) return;

    setSeeding(true);
    try {
        const FIRST_NAMES = ["Leon", "Mia", "Noah", "Emma", "Paul", "Hannah", "Luca", "Sofia", "Elias", "Anna", "Ben", "Lea", "Luis", "Marie", "Jonas", "Lena", "Felix", "Emily", "Maximilian", "Lina", "Mohammed", "Aisha", "Kevin", "Chantal"];
        const LAST_NAMES = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann", "Yilmaz", "Kowalski"];
        const LOCATIONS = ["Klassenzimmer 8b", "Pausenhof West", "Mensa", "Flur 1. Stock", "Sporthalle", "Chemie-Raum", "Bushaltestelle", "Digital / Teams", "Sekretariat", "Treppenhaus"];
        const TEACHERS = ["Frau Müller", "Herr Schmidt", "Frau Weber", "Herr Meyer", "Frau Wagner", "Herr Becker", "Frau Schulz", "Herr Hoffmann", "Frau Koch"];

        const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
        const getRandomDate = (start: Date, end: Date) => {
            const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            if (date.getDay() === 0 || date.getDay() === 6) {
                date.setDate(date.getDate() + 2);
            }
            return date;
        };

        const today = new Date();
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);

        const [existingYears, existingClasses, existingStudents, existingIncidents, existingConversations, existingMeetingMinutes] = await Promise.all([
            fetchYears(), fetchClasses(), fetchStudents(), fetchIncidents(), fetchConversations(), fetchMeetingMinutes()
        ]);

        const newYears = [...existingYears];
        const newClasses = [...existingClasses];
        const newStudents = [...existingStudents];
        const newIncidents = [...existingIncidents];
        const newConversations = [...existingConversations];
        const newMeetingMinutes = [...existingMeetingMinutes];

        const createdYears: any[] = [];
        const createdStudents: any[] = [];

        for (let i = 5; i <= 10; i++) {
            const yearName = `Jahrgang ${i}`;
            let year = newYears.find(y => y.name === yearName);
            if (!year) {
                year = { id: uuidv4(), name: yearName };
                newYears.push(year);
            }
            createdYears.push(year);
        }

        for (const year of createdYears) {
            for (const suffix of ['a', 'b', 'c']) {
                const className = `${year.name.split(' ')[1]}${suffix}`;
                let cls = newClasses.find(c => c.yearLevelId === year.id && c.name === className);
                if (!cls) {
                    cls = { id: uuidv4(), yearLevelId: year.id, name: className };
                    newClasses.push(cls);
                }

                const currentStudentsInClass = newStudents.filter(s => s.classId === cls!.id).length;
                if (currentStudentsInClass < 3) {
                    const numStudents = Math.floor(Math.random() * 4) + 3; 
                    for (let k = 0; k < numStudents; k++) {
                        const s = { 
                            id: uuidv4(), 
                            classId: cls.id, 
                            firstName: getRandom(FIRST_NAMES), 
                            lastName: getRandom(LAST_NAMES) 
                        };
                        newStudents.push(s);
                        createdStudents.push(s);
                    }
                }
            }
        }

        const poolStudents = newStudents.length > 0 ? newStudents : createdStudents;
        if (poolStudents.length === 0) throw new Error("Keine Schüler konnten generiert werden.");

        const INCIDENT_SCENARIOS = [
            { cat: IncidentCategory.DISRUPTION, desc: "Hat während der Stillarbeit laut 'Skibidi Toilet' gesungen.", act: "Ermahnung, Eintrag im Klassenbuch." },
            { cat: IncidentCategory.THEFT, desc: "Hat das Pausenbrot von Lukas entwendet und gegen Pokemon-Karten getauscht.", act: "Elterngespräch, Rückgabe gefordert." },
            { cat: IncidentCategory.VANDALISM, desc: "Hat 'Ferien jetzt!' mit Edding an die Tafel geschrieben (permanent).", act: "Reinigung durch Schüler angeordnet." },
            { cat: IncidentCategory.PHYSICAL, desc: "Schubsen in der Mensa-Schlange, weil es Pommes gab.", act: "Trennungsgespräch, Entschuldigung." },
            { cat: IncidentCategory.DISRUPTION, desc: "Weigerte sich, die Sonnenbrille im Unterricht abzunehmen ('Augenentzündung').", act: "Zum Sekretariat geschickt." },
            { cat: IncidentCategory.BULLYING, desc: "Hat Gerüchte über WhatsApp in der Klassengruppe verbreitet.", act: "Handy einkassiert, Schulleitung informiert." },
            { cat: IncidentCategory.OTHER, desc: "Hat versucht, den Schulhamster 'frei zu lassen'.", act: "Eltern informiert, Hamster gesichert." },
            { cat: IncidentCategory.VERBAL, desc: "Beleidigung der Lehrkraft als 'Boomer'.", act: "Reflexionsbogen ausfüllen lassen." },
            { cat: IncidentCategory.DISRUPTION, desc: "Hat den Feueralarm 'aus Versehen' mit dem Ellbogen berührt.", act: "Gespräch mit Hausmeister und SL." },
            { cat: IncidentCategory.THEFT, desc: "Diebstahl von Kreidevorräten für private Straßenkunst.", act: "Sozialstunden: Tafeldienst für 2 Wochen." },
            { cat: IncidentCategory.VANDALISM, desc: "Kaugummi unter den Lehrertisch geklebt.", act: "Muss alle Tische im Raum kontrollieren." },
            { cat: IncidentCategory.DISRUPTION, desc: "Hat sich im Schrank versteckt, um die Klasse zu erschrecken.", act: "Nachsitzen." },
            { cat: IncidentCategory.OTHER, desc: "Betrieb einen illegalen Handel mit Energy-Drinks aus dem Spind.", act: "Handel unterbunden, Ware konfisziert." },
            { cat: IncidentCategory.PHYSICAL, desc: "Schneeballschlacht im Treppenhaus.", act: "Pausenverbot für 2 Tage." },
            { cat: IncidentCategory.VERBAL, desc: "Lautstarker Streit über Fußballergebnisse während der Klausur.", act: "Klausur abgenommen, Note 6." },
            { cat: IncidentCategory.DISRUPTION, desc: "Hat die Sprache des Smartboards auf Chinesisch gestellt.", act: "Technischer Support gerufen, Schüler half bei Korrektur." },
            { cat: IncidentCategory.BULLYING, desc: "Ausschließen von Mitschülern beim Völkerball.", act: "Gespräch in der Klasse über Fairness." },
            { cat: IncidentCategory.VANDALISM, desc: "Hat versucht, ein TikTok-Video auf dem Lehrerpult zu drehen, Tisch verkratzt.", act: "Schadensmeldung an Stadt, Rechnung an Eltern." },
            { cat: IncidentCategory.OTHER, desc: "Hat Hausaufgaben durch ChatGPT erstellen lassen und den Prompt mit ausgedruckt.", act: "Hausaufgabe wiederholen (handschriftlich)." },
            { cat: IncidentCategory.DISRUPTION, desc: "Simulierte Ohnmacht, um dem Vokabeltest zu entgehen.", act: "Sanitäter gerufen, Eltern informiert." }
        ];

        for (let i = 0; i < 100; i++) {
            const student = getRandom(poolStudents);
            const scenario = getRandom(INCIDENT_SCENARIOS);
            const dateObj = getRandomDate(oneYearAgo, today);
            
            let status = IncidentStatus.RESOLVED;
            const daysOld = (today.getTime() - dateObj.getTime()) / (1000 * 3600 * 24);
            
            if (daysOld < 14) status = Math.random() > 0.5 ? IncidentStatus.OPEN : IncidentStatus.IN_PROGRESS;
            if (daysOld > 14 && daysOld < 60 && Math.random() > 0.7) status = IncidentStatus.MONITORING;
            
            const contactParents = Math.random() > 0.4;
            const contactAdmin = Math.random() > 0.8 || scenario.cat === IncidentCategory.PHYSICAL;
            const contactSocial = Math.random() > 0.8;

            newIncidents.push({
                id: uuidv4(),
                createdAt: Date.now(),
                studentId: student.id,
                date: dateObj.toISOString().split('T')[0],
                time: `${String(Math.floor(Math.random() * 6) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`,
                location: getRandom(LOCATIONS),
                reportedBy: getRandom(TEACHERS),
                category: scenario.cat,
                description: scenario.desc,
                involvedPersons: Math.random() > 0.7 ? "Kevin, Chantal" : "",
                witnesses: Math.random() > 0.6 ? "Herr Müller" : "",
                immediateActions: scenario.act,
                agreements: status === IncidentStatus.RESOLVED ? "Fall abgeschlossen." : "Weiteres Vorgehen abwarten.",
                parentContacted: contactParents,
                administrationContacted: contactAdmin,
                socialServiceContacted: contactSocial,
                socialServiceAbbreviation: contactSocial ? getRandom(["Hr. S.", "Fr. K.", "ReBUZ"]) : "",
                status: status
            });
        }

        const CONV_TOPICS = [
            { type: ConversationType.PARENT, subj: "Leistungsabfall Mathe", content: "Eltern machen sich Sorgen um die Note.", res: "Förderunterricht empfohlen." },
            { type: ConversationType.STUDENT, subj: "Fehlzeiten", content: "Schüler fehlt häufig montags. Gespräch über Motivation.", res: "Attestpflicht ab 1. Tag." },
            { type: ConversationType.PHONE, subj: "Krankmeldung / Vorfall gestern", content: "Mutter rief an wegen Vorfall auf dem Schulhof.", res: "Rückruf durch Klassenlehrer vereinbart." },
            { type: ConversationType.ROUND_TABLE, subj: "Hilfeplangespräch", content: "Große Runde mit ReBUZ und Sozialarbeiter.", res: "Maßnahme wird verlängert." },
            { type: ConversationType.CONFERENCE, subj: "Ordnungsmaßnahme", content: "Anhörung wegen wiederholtem Fehlverhalten.", res: "Schriftlicher Verweis." },
            { type: ConversationType.PARENT, subj: "Lobanruf", content: "Rückmeldung über positive Entwicklung im Sozialverhalten.", res: "Eltern haben sich sehr gefreut." },
            { type: ConversationType.STUDENT, subj: "Streitschlichtung", content: "Konflikt mit Mitschüler aus der 7a.", res: "Handshake und Entschuldigung." },
            { type: ConversationType.OTHER, subj: "Austausch mit Schulbegleitung", content: "Abstimmung der Ziele für die Woche.", res: "Fokus auf Pünktlichkeit." },
            { type: ConversationType.PARENT, subj: "Klassenfahrt Kosten", content: "Klärung der Finanzierung über Jobcenter.", res: "Antrag ausgehändigt." },
            { type: ConversationType.STUDENT, subj: "Berufsorientierung", content: "Schüler weiß nicht, wohin nach der 10.", res: "Termin bei Berufsberatung gemacht." }
        ];

        for (let i = 0; i < 100; i++) {
            const student = getRandom(poolStudents);
            const topic = getRandom(CONV_TOPICS);
            const dateObj = getRandomDate(oneYearAgo, today);
            
            const hasFollowUp = Math.random() > 0.7;
            const followUpDate = new Date(dateObj);
            followUpDate.setDate(dateObj.getDate() + 14);

            const studentClass = newClasses.find(c => c.id === student.classId);

            newConversations.push({
                id: uuidv4(),
                createdAt: Date.now(),
                date: dateObj.toISOString().split('T')[0],
                time: `${String(Math.floor(Math.random() * 7) + 8).padStart(2, '0')}:${String(Math.floor(Math.random() * 4) * 15).padStart(2, '0')}`,
                location: getRandom(["Besprechungsraum", "Lehrerzimmer", "Telefon", "Büro SL"]),
                reportedBy: getRandom(TEACHERS),
                type: topic.type,
                studentId: student.id,
                studentName: `${student.lastName}, ${student.firstName}`,
                className: studentClass ? studentClass.name : "k.A.",
                participants: topic.type === ConversationType.PARENT ? "Mutter, Vater, KL" : "Schüler, KL",
                subject: topic.subj,
                content: topic.content + " (Automatisch generierter Eintrag)",
                goals: "Verbesserung der Situation.",
                results: topic.res,
                nextAppointment: hasFollowUp ? {
                    date: followUpDate.toISOString().split('T')[0],
                    time: "14:00",
                    location: "Raum 102",
                    participants: "Wie heute"
                } : undefined
            });
        }

        const MEETING_TOPICS = [
            { title: "Dienstbesprechung", chair: "Herr Schmidt", taker: "Frau Müller", attendees: "Gesamtes Kollegium" },
            { title: "Fachkonferenz Mathe", chair: "Frau Weber", taker: "Herr Becker", attendees: "Mathe-Lehrkräfte" },
            { title: "Klassenkonferenz 8b", chair: "Herr Meyer", taker: "Frau Schulz", attendees: "Klassenlehrer, Fachlehrer 8b" },
            { title: "Steuergruppe", chair: "Frau Wagner", taker: "Herr Hoffmann", attendees: "Mitglieder der Steuergruppe" },
            { title: "Schulvorstand", chair: "Herr Schmidt", taker: "Frau Koch", attendees: "Schulleitung, Elternvertreter, Schülervertreter" }
        ];

        for (let i = 0; i < 20; i++) {
            const topic = getRandom(MEETING_TOPICS);
            const dateObj = getRandomDate(oneYearAgo, today);
            
            newMeetingMinutes.push({
                id: uuidv4(),
                createdAt: Date.now(),
                date: dateObj.toISOString().split('T')[0],
                time: `${String(Math.floor(Math.random() * 7) + 8).padStart(2, '0')}:00 - ${String(Math.floor(Math.random() * 7) + 9).padStart(2, '0')}:30`,
                title: topic.title,
                chairperson: topic.chair,
                minutesTaker: topic.taker,
                attendees: topic.attendees,
                agendaItems: [
                    {
                        id: uuidv4(),
                        title: "Begrüßung und Formalia",
                        summary: "Feststellung der Beschlussfähigkeit. Genehmigung des letzten Protokolls.",
                        tasks: []
                    },
                    {
                        id: uuidv4(),
                        title: "Aktuelle Themen",
                        summary: "Diskussion über aktuelle Herausforderungen im Schulalltag. <b>Wichtig:</b> Handyverbot in den Pausen konsequenter durchsetzen.",
                        tasks: [
                            { id: uuidv4(), description: "Rundmail an alle Eltern bzgl. Handyverbot", assignee: "Schulleitung", deadline: new Date(dateObj.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completed: Math.random() > 0.5 }
                        ]
                    },
                    {
                        id: uuidv4(),
                        title: "Verschiedenes",
                        summary: "Nächster Termin in 4 Wochen.",
                        tasks: []
                    }
                ]
            });
        }

        await Promise.all([
            saveYears(newYears),
            saveClasses(newClasses),
            saveStudents(newStudents),
            saveIncidents(newIncidents),
            saveConversations(newConversations),
            saveMeetingMinutes(newMeetingMinutes)
        ]);

        alert("Erfolg! Es wurden 100 Vorfälle, 100 Gespräche und 20 Sitzungsprotokolle sowie die nötige Struktur generiert. Viel Erfolg bei der Präsentation!");
    } catch (e: any) {
        console.error(e);
        alert("Fehler beim Erstellen der Demo-Daten: " + e.message + "\n\nBitte prüfen Sie die Konfiguration und die Browser-Konsole.");
    } finally {
        setSeeding(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-gray-800 mb-2">Geschützter Bereich</h2>
          <p className="text-gray-500 text-center text-sm mb-6">Bitte geben Sie das Admin-Passwort ein.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Passwort"
                autoFocus
                className={`w-full border rounded-lg p-3 text-center tracking-widest outline-none focus:ring-2 transition-all ${loginError ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-blue-200'}`}
              />
              {loginError && <p className="text-red-500 text-xs text-center mt-2">Falsches Passwort</p>}
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center group">
              Anmelden <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          <div className="mt-6 text-center">
             <button onClick={() => navigate('/')} className="text-gray-400 text-xs hover:text-gray-600">Zurück zum Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">System-Einstellungen</h2>
        <button onClick={handleLogout} className="text-red-600 hover:text-red-700 font-medium flex items-center text-sm px-3 py-2 rounded-lg hover:bg-red-50 transition">
          <LogOut className="w-4 h-4 mr-2" /> Abmelden
        </button>
      </div>

      {/* Share Link Importer */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Link className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Schnell-Start: Freigabe-Link importieren</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Haben Sie einen Ordner in Ihrer Nextcloud geteilt (Link mit <code>/s/</code>)? 
          Fügen Sie ihn hier ein, um die App automatisch zu konfigurieren.
        </p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="z.B. https://fie.nl.tab.digital/s/xM5wY4eTxoY3Mxi" 
            className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={shareLink}
            onChange={(e) => setShareLink(e.target.value)}
          />
          <button onClick={importShareLink} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            Importieren
          </button>
        </div>
      </div>

      {/* Manual Config */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <Cloud className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Manuelle Konfiguration</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-700">Nextcloud WebDAV-URL</label>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute right-0 w-64 p-2 bg-gray-800 text-white text-xs rounded hidden group-hover:block z-10">
                  Für Benutzer: <code>.../remote.php/dav/files/USER/</code><br/>
                  Für Freigaben: <code>.../public.php/webdav</code>
                </div>
              </div>
            </div>
            <input 
              type="text" 
              placeholder="https://meine-cloud.de/remote.php/dav/files/admin" 
              className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-600"
              value={config.url}
              onChange={(e) => setConfig({...config, url: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Benutzername / Token</label>
              <input 
                type="text" 
                placeholder="admin oder Share-Token" 
                className="w-full border border-gray-300 rounded-md p-2"
                value={config.user}
                onChange={(e) => setConfig({...config, user: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passwort / App-Token</label>
              <input 
                type="password" 
                placeholder="Leer lassen bei öffentlichen Links ohne PW" 
                className="w-full border border-gray-300 rounded-md p-2"
                value={config.token}
                onChange={(e) => setConfig({...config, token: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unterordner (Optional)</label>
            <input 
              type="text" 
              placeholder="SchulKonfliktData" 
              className="w-full border border-gray-300 rounded-md p-2"
              value={config.path}
              onChange={(e) => setConfig({...config, path: e.target.value})}
            />
            <p className="text-xs text-gray-500 mt-1">Lassen Sie dieses Feld leer, wenn Sie einen direkten Freigabe-Link verwenden.</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex items-center">
            {status === 'success' && <span className="flex items-center text-emerald-600 text-sm font-medium"><ShieldCheck className="w-4 h-4 mr-1"/> Einstellungen gespeichert!</span>}
            {status === 'error' && <span className="flex items-center text-red-600 text-sm font-medium"><AlertCircle className="w-4 h-4 mr-1"/> {message}</span>}
            {status === 'testing' && <span className="flex items-center text-blue-600 text-sm font-medium"><Clock className="w-4 h-4 mr-1 animate-spin"/> Teste Verbindung...</span>}
          </div>
          <div className="flex gap-2">
             <button onClick={handleTestConnection} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition flex items-center shadow-sm font-medium">
              Verbindung testen
            </button>
            <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition flex items-center shadow-md font-bold">
              <Save className="w-5 h-5 mr-2" /> Speichern
            </button>
          </div>
        </div>
      </div>

      {/* Demo Data Section */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-800">Präsentations-Modus (Demo-Daten)</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Nutzen Sie diese Funktion, um die Datenbank mit ca. 200 Einträgen (Vorfälle, Gespräche & Sitzungsprotokolle) zu füllen. 
          Ideal zur Demonstration der App vor dem Kollegium.
        </p>
        <button 
            onClick={generateDemoData} 
            disabled={seeding}
            className={`bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition flex items-center ${seeding ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {seeding ? <><Clock className="w-4 h-4 mr-2 animate-spin"/> Generiere 200+ Datensätze...</> : "Demo-Daten generieren (Vorfälle, Gespräche & Protokolle)"}
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <h4 className="font-bold text-amber-800 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Sicherheitshinweis</h4>
        <p className="text-amber-700 text-xs mt-1">
          Alle Zugangsdaten werden ausschließlich lokal in Ihrem Browser gespeichert. Stellen Sie sicher, dass Sie diese Anwendung nur auf vertrauenswürdigen Geräten verwenden.
        </p>
      </div>
    </div>
  );
};