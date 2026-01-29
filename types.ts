
export type AppView = 'DASHBOARD' | 'CLASS_DETAIL' | 'REPORT_CARDS' | 'SETTINGS';

export type ClassLevel = 'CI' | 'CP' | 'CE1' | 'CE2' | 'CM1' | 'CM2';

export interface SchoolInfo {
  ia: string;
  ief: string;
  school: string;
  academicYear: string;
  term: string;
  logoUrl?: string;
  apiUrl?: string;
}

export interface Subject {
  id: string;
  category: string;
  label: string;
  maxGrade: number;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  classId: string;
  observation?: string;
}

export interface GradeEntry {
  studentId: string;
  subjectId: string;
  value: number;
}

export interface ClassRoom {
  id: string;
  name: string;
  level: ClassLevel;
  teacherName: string;
  directorName: string;
  subjects: Subject[];
}

export interface AppState {
  schoolInfo: SchoolInfo;
  classes: ClassRoom[];
  students: Student[];
  grades: GradeEntry[];
}
