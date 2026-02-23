import { v4 as uuidv4 } from 'uuid';
import { NCConfig, YearLevel, ClassLevel, Student, Incident, Conversation } from '../types';

const FIXED_NC_CONFIG: NCConfig = {
  url: 'https://victorymind.de/nextcloud/',
  user: 'hosting236423',
  token: '3Ckpa-7Pr97-kEQYr-wxG4s-iEZpX',
  path: 'vorfalls'
};

export const getNCConfig = (): NCConfig => {
  const storedConfig = localStorage.getItem('nc_config');
  if (storedConfig) {
    return JSON.parse(storedConfig);
  }
  if (FIXED_NC_CONFIG.url && FIXED_NC_CONFIG.user && FIXED_NC_CONFIG.token) {
    return FIXED_NC_CONFIG;
  }
  return { url: '', user: '', token: '', path: 'SchulKonfliktData' };
};

export const isNCConfigured = (): boolean => {
  const config = getNCConfig();
  return !!(config.url && config.user && config.token);
};

export const saveNCConfig = (config: NCConfig) => {
  localStorage.setItem('nc_config', JSON.stringify(config));
};

const cleanUrlPart = (str: string) => str ? str.replace(/^\/+|\/+$/g, '') : '';

async function ncFetch(filename: string, method = 'GET', body: string | null = null): Promise<any> {
  if (!isNCConfigured()) throw new Error("Nextcloud nicht konfiguriert");
  
  const config = getNCConfig();
  let baseUrl = config.url.replace(/\/+$/, ""); 
  
  // Auto-detect remote.php URL structure if not provided
  if (!baseUrl.includes('remote.php/dav/files') && !baseUrl.includes('public.php/webdav')) {
      baseUrl += `/remote.php/dav/files/${encodeURIComponent(config.user)}`;
  }

  let finalUrl = baseUrl;
  const subPath = cleanUrlPart(config.path);
  if (subPath) {
      finalUrl += `/${subPath}`;
  }
  finalUrl += `/${cleanUrlPart(filename)}`;

  const authHeader = 'Basic ' + btoa(`${config.user}:${config.token}`);

  console.log(`NC Request: ${method} ${finalUrl}`);

  try {
    const headers: Record<string, string> = {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
    };

    // Note: Removed 'Destination' and 'X-Requested-With' headers as they often trigger 
    // stricter CORS preflight checks which can fail if the server isn't configured for them.

    const response = await fetch(finalUrl, {
      method: method,
      headers: headers,
      body: body,
      cache: 'no-store' // Prevent caching of data files
    });

    // Handle 404 (Not Found) for GET requests as empty list (first initialization)
    if (method === 'GET' && response.status === 404) {
      return []; 
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Keine Details');
      throw new Error(`Nextcloud Fehler (${response.status}): ${response.statusText} - ${errorText}`);
    }

    if (method === 'GET') {
      return await response.json();
    }
    return true;

  } catch (error: any) {
    // Enhance error message for "Load failed" which is usually CORS or Network
    if (error.message === 'Load failed' || error.message === 'Failed to fetch') {
        console.error("Network/CORS Error:", error);
        throw new Error("Netzwerkfehler: Zugriff verweigert (CORS) oder Server nicht erreichbar. Bitte URL prüfen.");
    }
    console.error("Nextcloud Fetch Error:", error);
    throw error;
  }
}

// Data Access
export const fetchYears = (): Promise<YearLevel[]> => ncFetch('years.json');
export const saveYears = (data: YearLevel[]) => ncFetch('years.json', 'PUT', JSON.stringify(data));

export const fetchClasses = (): Promise<ClassLevel[]> => ncFetch('classes.json');
export const saveClasses = (data: ClassLevel[]) => ncFetch('classes.json', 'PUT', JSON.stringify(data));

export const fetchStudents = (): Promise<Student[]> => ncFetch('students.json');
export const saveStudents = (data: Student[]) => ncFetch('students.json', 'PUT', JSON.stringify(data));

export const fetchIncidents = (): Promise<Incident[]> => ncFetch('incidents.json');
export const saveIncidents = (data: Incident[]) => ncFetch('incidents.json', 'PUT', JSON.stringify(data));

export const fetchConversations = (): Promise<Conversation[]> => ncFetch('conversations.json');
export const saveConversations = (data: Conversation[]) => ncFetch('conversations.json', 'PUT', JSON.stringify(data));

export const addYear = async (name: string): Promise<YearLevel> => {
  const years = await fetchYears();
  const newYear = { id: uuidv4(), name };
  years.push(newYear);
  await saveYears(years);
  return newYear;
};

export const deleteYear = async (id: string) => {
  const years = await fetchYears();
  const classes = await fetchClasses();
  const students = await fetchStudents();

  const classesToDelete = classes.filter(c => c.yearLevelId === id);
  const classIdsToDelete = new Set(classesToDelete.map(c => c.id));

  const newYears = years.filter(y => y.id !== id);
  const newClasses = classes.filter(c => c.yearLevelId !== id);
  const newStudents = students.filter(s => !classIdsToDelete.has(s.classId));

  await Promise.all([
    saveYears(newYears),
    saveClasses(newClasses),
    saveStudents(newStudents)
  ]);
};

export const getClassesByYear = async (yearId: string): Promise<ClassLevel[]> => {
  const classes = await fetchClasses();
  return classes.filter(c => c.yearLevelId === yearId);
};

export const addClass = async (yearId: string, name: string): Promise<ClassLevel> => {
  const classes = await fetchClasses();
  const newClass = { id: uuidv4(), yearLevelId: yearId, name };
  classes.push(newClass);
  await saveClasses(classes);
  return newClass;
};

export const deleteClass = async (id: string) => {
  const classes = await fetchClasses();
  const students = await fetchStudents();
  const newClasses = classes.filter(c => c.id !== id);
  const newStudents = students.filter(s => s.classId !== id);
  await Promise.all([
    saveClasses(newClasses),
    saveStudents(newStudents)
  ]);
};

export const getStudentsByClass = async (classId: string): Promise<Student[]> => {
  const students = await fetchStudents();
  return students.filter(s => s.classId === classId);
};

export const addStudent = async (classId: string, firstName: string, lastName: string): Promise<Student> => {
  const students = await fetchStudents();
  const newStudent = { id: uuidv4(), classId, firstName, lastName };
  students.push(newStudent);
  await saveStudents(students);
  return newStudent;
};

export const deleteStudent = async (id: string) => {
  const students = await fetchStudents();
  await saveStudents(students.filter(s => s.id !== id));
};

export const addIncident = async (incident: Omit<Incident, 'id' | 'createdAt'>): Promise<Incident> => {
  const incidents = await fetchIncidents();
  const newIncident = { ...incident, id: uuidv4(), createdAt: Date.now() };
  incidents.push(newIncident);
  await saveIncidents(incidents);
  return newIncident;
};

export const updateIncident = async (incident: Incident) => {
  const incidents = await fetchIncidents();
  const index = incidents.findIndex(i => i.id === incident.id);
  if (index !== -1) {
    incidents[index] = incident;
    await saveIncidents(incidents);
  }
};

export const deleteIncident = async (id: string) => {
  const incidents = await fetchIncidents();
  await saveIncidents(incidents.filter(i => i.id !== id));
};

export const getIncident = async (id: string): Promise<Incident | undefined> => {
  const incidents = await fetchIncidents();
  return incidents.find(i => i.id === id);
};

export const addConversation = async (conversation: Omit<Conversation, 'id' | 'createdAt'>): Promise<Conversation> => {
  const conversations = await fetchConversations();
  const newConv = { ...conversation, id: uuidv4(), createdAt: Date.now() };
  conversations.push(newConv);
  await saveConversations(conversations);
  return newConv;
};

export const updateConversation = async (conversation: Conversation) => {
  const conversations = await fetchConversations();
  const index = conversations.findIndex(c => c.id === conversation.id);
  if (index !== -1) {
    conversations[index] = conversation;
    await saveConversations(conversations);
  }
};

export const deleteConversation = async (id: string) => {
  const conversations = await fetchConversations();
  await saveConversations(conversations.filter(c => c.id !== id));
};

export const getConversation = async (id: string): Promise<Conversation | undefined> => {
  const conversations = await fetchConversations();
  return conversations.find(c => c.id === id);
};