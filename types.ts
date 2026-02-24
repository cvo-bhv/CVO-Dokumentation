export enum IncidentCategory {
  PHYSICAL = "Körperliche Gewalt",
  VERBAL = "Verbale Gewalt",
  BULLYING = "Mobbing / Ausgrenzung",
  VANDALISM = "Sachbeschädigung",
  DISRUPTION = "Unterrichtsstörung",
  THEFT = "Diebstahl",
  OTHER = "Sonstiges"
}

export enum IncidentStatus {
  OPEN = "Offen",
  IN_PROGRESS = "In Bearbeitung",
  RESOLVED = "Geklärt",
  MONITORING = "Beobachtung"
}

export enum ConversationType {
  PARENT = "Elterngespräch",
  STUDENT = "Schülergespräch",
  PHONE = "Telefonat",
  CONFERENCE = "Konferenz / Besprechung",
  ROUND_TABLE = "Runder Tisch",
  OTHER = "Sonstiges"
}

export interface YearLevel {
  id: string;
  name: string;
}

export interface ClassLevel {
  id: string;
  yearLevelId: string;
  name: string;
}

export interface Student {
  id: string;
  classId: string;
  firstName: string;
  lastName: string;
}

export interface Incident {
  id: string;
  createdAt: number;
  studentId: string;
  date: string;
  time: string;
  location: string;
  reportedBy: string; // New field
  category: IncidentCategory;
  description: string;
  involvedPersons: string;
  witnesses: string;
  immediateActions: string;
  agreements: string;
  parentContacted: boolean;
  administrationContacted: boolean;
  socialServiceContacted: boolean;
  socialServiceAbbreviation: string;
  status: IncidentStatus;
}

export interface Conversation {
  id: string;
  createdAt: number;
  date: string;
  time: string;
  location: string;
  reportedBy: string; // New field
  type: ConversationType;
  
  // Participant Data
  studentId?: string; // Optional link to DB student
  studentName: string; // Fallback/Manual name
  className: string; // Fallback/Manual class
  participants: string; // Other participants
  
  // Content
  subject: string; // Gegenstand / Betreff
  content: string; // Inhalt / Verlauf
  goals: string; // Ziel des Gesprächs
  results: string; // Ergebnisse / Lösungen / Vereinbarungen
  
  // Follow Up
  nextAppointment?: {
    date: string;
    time: string;
    location: string;
    participants: string;
  };
}

export interface AgendaItem {
  id: string;
  number: string;
  title?: string;
  summary: string;
}

export interface MeetingMinute {
  id: string;
  createdAt: number;
  date: string;
  time: string;
  title: string;
  occasion?: string;
  occasionDetail?: string;
  chairperson: string;
  minutesTaker: string;
  attendees: string;
  agendaItems: AgendaItem[];
}

export interface NCConfig {
  url: string;
  user: string;
  token: string;
  path: string;
}

export interface JoinedIncident extends Incident {
  studentName: string;
  className: string;
  classId?: string;
  yearLevelName: string;
}