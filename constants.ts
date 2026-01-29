
import { Subject, ClassLevel } from './types';

export const DEFAULT_SCHOOL_INFO = {
  ia: "THIES",
  ief: "THIES VILLE",
  school: "SUD STADE",
  academicYear: "2024/2025",
  term: "PREMIER TRIMESTRE"
};

export const CLASS_LEVELS: ClassLevel[] = ['CI', 'CP', 'CE1', 'CE2', 'CM1', 'CM2'];

export const LEVEL_ORDER: Record<ClassLevel, number> = {
  'CI': 1,
  'CP': 2,
  'CE1': 3,
  'CE2': 4,
  'CM1': 5,
  'CM2': 6
};

export const SUBJECTS_CP_B: Subject[] = [
  { id: 'lc_lw', category: 'LANGUE ET COMMUNICATION', label: 'LECTURE WOLOF', maxGrade: 45 },
  { id: 'math_res', category: 'MATHEMATIQUES', label: 'RESSOURCES', maxGrade: 40 },
  { id: 'math_comp', category: 'MATHEMATIQUES', label: 'COMPETENCE', maxGrade: 10 },
  { id: 'dm_res', category: 'DECOUVERTE DU MONDE', label: 'RESSOURCES', maxGrade: 30 },
  { id: 'dd_res', category: 'DEVELOPPEMENT DURABLE', label: 'RESSOURCES', maxGrade: 20 },
  { id: 'art', category: 'EDUCATION ARTISTIQUE', label: '', maxGrade: 10 },
  { id: 'arabe', category: 'ARABE', label: '', maxGrade: 10 },
];

export const SUBJECTS_CM2_B: Subject[] = [
  { id: 'math', category: 'MATHEMATIQUES', label: 'MATH', maxGrade: 20 },
  { id: 'francais', category: 'LANGUE ET COMMUNICATION', label: 'FRANÇAIS', maxGrade: 20 },
  { id: 'anglais', category: 'LANGUE ET COMMUNICATION', label: 'ANGLAIS', maxGrade: 20 },
  { id: 'physique', category: 'SCIENCES', label: 'PHYSIQUE', maxGrade: 20 },
  { id: 'chimie', category: 'SCIENCES', label: 'CHIMIE', maxGrade: 20 },
];

export const getAppreciation = (moyenneSurVingt: number): string => {
  if (moyenneSurVingt >= 16) return "Excellent";
  if (moyenneSurVingt >= 14) return "Très bien";
  if (moyenneSurVingt >= 12) return "Bien";
  if (moyenneSurVingt >= 10) return "Assez bien";
  return "À améliorer";
};
