
import React, { useRef, useState } from 'react';
import { Student, GradeEntry, ClassRoom, Subject } from '../types';
import { 
  PlusCircle, Trash2, Printer, AlertCircle, Users, FileUp, 
  CheckCircle2, BookOpen, X, Plus, UserCheck, Search, 
  ShieldCheck, BarChart3, Edit3, Settings2, Info, ArrowRight,
  MessageSquareQuote
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface GradeTableProps {
  activeClass: ClassRoom;
  students: Student[];
  grades: GradeEntry[];
  onAddStudent: (firstName: string, lastName: string) => void;
  onUpdateStudent: (id: string, firstName: string, lastName: string) => void;
  onUpdateObservation: (id: string, observation: string) => void;
  onAddSubject: (subject: Subject) => void;
  onUpdateSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  onUpdateGrade: (studentId: string, subjectId: string, value: string) => void;
  onDeleteStudent: (studentId: string) => void;
  onGenerateBulletins: () => void;
  onExportCSV: () => void;
  onBulkImport: (importedStudents: { firstName: string, lastName: string, grades: Record<string, number> }[]) => void;
  onUpdateTeacherName: (name: string) => void;
  onUpdateDirectorName: (name: string) => void;
}

export const GradeTable: React.FC<GradeTableProps> = ({
  activeClass,
  students,
  grades,
  onAddStudent,
  onUpdateStudent,
  onUpdateObservation,
  onAddSubject,
  onUpdateSubject,
  onDeleteSubject,
  onUpdateGrade,
  onDeleteStudent,
  onGenerateBulletins,
  onExportCSV,
  onBulkImport,
  onUpdateTeacherName,
  onUpdateDirectorName
}) => {
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isManagingSubjects, setIsManagingSubjects] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [newSubCategory, setNewSubCategory] = useState('');
  const [newSubLabel, setNewSubLabel] = useState('');
  const [newSubMaxGrade, setNewSubMaxGrade] = useState('20');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getGradeValue = (studentId: string, subjectId: string) => {
    const entry = grades.find(g => g.studentId === studentId && g.subjectId === subjectId);
    return entry ? entry.value : '';
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFirstName && newLastName) {
      onAddStudent(newFirstName, newLastName);
      setNewFirstName('');
      setNewLastName('');
    }
  };

  const startEditingStudent = (student: Student) => {
    setEditingStudentId(student.id);
    setEditFirstName(student.firstName);
    setEditLastName(student.lastName);
  };

  const saveEditedStudent = () => {
    if (editingStudentId && editFirstName && editLastName) {
      onUpdateStudent(editingStudentId, editFirstName, editLastName);
      setEditingStudentId(null);
    }
  };

  const handleSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubCategory.trim() && newSubMaxGrade) {
      const category = newSubCategory.trim().toUpperCase();
      const label = newSubLabel.trim().toUpperCase();
      const maxGrade = parseFloat(newSubMaxGrade) || 20;

      if (editingSubjectId) {
        onUpdateSubject({ id: editingSubjectId, category, label, maxGrade });
        setEditingSubjectId(null);
      } else {
        const isDuplicate = activeClass.subjects.some(s => s.category === category && s.label === label);
        if (isDuplicate) {
          alert("Cette matière existe déjà (même catégorie et libellé).");
          return;
        }
        onAddSubject({ id: Math.random().toString(36).substr(2, 9), category, label, maxGrade });
      }
      
      setNewSubCategory('');
      setNewSubLabel('');
      setNewSubMaxGrade('20');
    }
  };

  const startEditingSubject = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setNewSubCategory(subject.category);
    setNewSubLabel(subject.label);
    setNewSubMaxGrade(subject.maxGrade.toString());
    setIsManagingSubjects(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelSubjectEdit = () => {
    setEditingSubjectId(null);
    setNewSubCategory('');
    setNewSubLabel('');
    setNewSubMaxGrade('20');
  };

  const handleDeleteSubjectClick = (id: string, name: string) => {
    if (window.confirm(`Supprimer la matière "${name}" ? Cela effacera toutes les notes saisies pour cette colonne.`)) {
      onDeleteSubject(id);
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in duration-700">
      {/* Top Action Bar */}
      <div className="p-8 bg-slate-50 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex flex-col gap-6 w-full max-w-4xl">
          <div>
            <div className="flex items-center gap-4 mb-1">
              <h2 className="text-3xl font-black text-indigo-950 uppercase tracking-tighter">Classe : {activeClass.name}</h2>
              <div className="bg-indigo-900 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-100">
                NIVEAU {activeClass.level}
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
              <Users size={16} className="text-indigo-500" />
              <span>{students.length} élèves actifs dans la base</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 bg-white border-2 border-indigo-50 p-4 rounded-[1.5rem] shadow-sm group hover:border-indigo-200 transition-all">
              <UserCheck size={20} className="text-indigo-600" />
              <div className="flex flex-col flex-1">
                <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Maitre / Enseignant</label>
                <input className="font-bold text-slate-700 outline-none text-base bg-transparent" value={activeClass.teacherName || ''} onChange={(e) => onUpdateTeacherName(e.target.value)} placeholder="Prénom Nom..." />
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white border-2 border-slate-100 p-4 rounded-[1.5rem] shadow-sm group hover:border-slate-300 transition-all">
              <ShieldCheck size={20} className="text-slate-600" />
              <div className="flex flex-col flex-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Direction / Visa</label>
                <input className="font-bold text-slate-700 outline-none text-base bg-transparent" value={activeClass.directorName || ''} onChange={(e) => onUpdateDirectorName(e.target.value)} placeholder="Nom du Directeur..." />
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-100/80 p-4 rounded-[1.5rem] focus-within:ring-4 focus-within:ring-indigo-100 transition-all">
              <Search size={20} className="text-slate-400" />
              <div className="flex flex-col flex-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filtre Rapide</label>
                <input className="font-bold text-slate-600 outline-none text-base bg-transparent" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nom de l'élève..." />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsManagingSubjects(!isManagingSubjects)} 
            className={`flex items-center gap-2 px-8 py-4 rounded-[1.5rem] font-black transition-all active:scale-95 shadow-xl border-2 ${isManagingSubjects ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-100 hover:bg-indigo-50'}`}
          >
             <Settings2 size={22} /> {isManagingSubjects ? 'FERMER GESTION' : 'MATIÈRES'}
          </button>
          <button onClick={onGenerateBulletins} disabled={students.length === 0} className="flex items-center gap-3 bg-indigo-950 text-white px-10 py-4 rounded-[1.5rem] font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50 hover:bg-black">
            <Printer size={24} /> GÉNÉRER BULLETINS
          </button>
        </div>
      </div>

      {/* Interface CRUD Matières Perfectionnée */}
      {isManagingSubjects && (
        <div className="p-10 bg-indigo-50/40 border-b border-indigo-100 animate-in slide-in-from-top-6 duration-500">
          <div className="max-w-7xl mx-auto space-y-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-indigo-600 rounded-xl text-white"><BookOpen size={24} /></div>
                  <h3 className="text-2xl font-black text-indigo-950">
                    {editingSubjectId ? 'MODIFICATION DE MATIÈRE' : 'CONFIGURATION DES DISCIPLINES'}
                  </h3>
                </div>
                <p className="text-sm text-slate-500 font-medium ml-12">Ajoutez, modifiez ou retirez les matières figurant sur le bulletin de cette classe.</p>
              </div>
              {editingSubjectId && (
                <button onClick={cancelSubjectEdit} className="px-4 py-2 bg-white text-red-500 border-2 border-red-100 rounded-xl font-black text-xs uppercase hover:bg-red-50 transition-all flex items-center gap-2">
                  <X size={14} /> Annuler l'édition
                </button>
              )}
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Formulaire CRUD */}
              <form onSubmit={handleSubjectSubmit} className={`lg:col-span-5 p-8 rounded-[2rem] border-2 transition-all shadow-2xl ${editingSubjectId ? 'bg-amber-50 border-amber-200' : 'bg-white border-white'}`}>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                      Catégorie <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" 
                      placeholder="Ex: MATHEMATIQUES, LANGUES..." 
                      value={newSubCategory} 
                      onChange={e => setNewSubCategory(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Libellé / Sous-matière (Optionnel)</label>
                    <input 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-500 focus:bg-white outline-none transition-all" 
                      placeholder="Ex: GEOMETRIE, LECTURE..." 
                      value={newSubLabel} 
                      onChange={e => setNewSubLabel(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Barème Maximum (Note sur...)</label>
                    <div className="flex items-center gap-4">
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        className="w-32 p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-2xl text-center focus:border-indigo-500 focus:bg-white outline-none transition-all" 
                        value={newSubMaxGrade} 
                        onChange={e => setNewSubMaxGrade(e.target.value)} 
                      />
                      <p className="text-xs text-slate-400 font-medium italic leading-tight">Par défaut 20. <br/>Certaines matières peuvent être sur 10, 40 ou 50.</p>
                    </div>
                  </div>
                  <button type="submit" className={`w-full py-5 rounded-2xl font-black text-white shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-widest ${editingSubjectId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                    {editingSubjectId ? <CheckCircle2 size={24} /> : <PlusCircle size={24} />}
                    {editingSubjectId ? 'Enregistrer les modifications' : 'Ajouter à la classe'}
                  </button>
                </div>
              </form>

              {/* Liste des matières existantes (Read/Delete) */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Aperçu de la structure actuelle</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {activeClass.subjects.length === 0 && (
                    <div className="col-span-full bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center">
                      <p className="text-slate-400 font-bold italic">Aucune matière configurée pour cette classe.</p>
                    </div>
                  )}
                  {activeClass.subjects.map(sub => (
                    <div key={sub.id} className="group bg-white p-5 rounded-3xl border-2 border-slate-100 hover:border-indigo-500 hover:shadow-xl transition-all relative">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md truncate max-w-[80%]">{sub.category}</div>
                        <div className="text-[10px] font-black text-slate-300">#{sub.id.slice(0,3)}</div>
                      </div>
                      <div className="text-sm font-black text-slate-800 uppercase mb-3 min-h-[1.2rem]">{sub.label || '-'}</div>
                      <div className="flex items-center justify-between">
                         <div className="text-[10px] font-black text-slate-400 uppercase">Barème: <span className="text-indigo-900 text-sm">{sub.maxGrade}</span></div>
                         <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditingSubject(sub)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm" title="Modifier"><Edit3 size={14} /></button>
                            <button onClick={() => handleDeleteSubjectClick(sub.id, sub.category)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm" title="Supprimer"><Trash2 size={14} /></button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white/60 p-4 rounded-2xl flex items-center gap-3 border border-indigo-100">
                  <Info size={16} className="text-indigo-400 shrink-0" />
                  <p className="text-[10px] font-bold text-indigo-900/60 leading-tight uppercase italic">La modification du barème recalculera automatiquement les moyennes des élèves en temps réel.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grade Saisie Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-slate-100 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b-2 border-slate-200">
            <tr>
              <th className="px-8 py-8 border-r sticky left-0 z-20 min-w-[350px] bg-slate-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-indigo-900" />
                  <span>Identité Complète de l'Élève</span>
                </div>
              </th>
              {activeClass.subjects.map(sub => (
                <th key={sub.id} className="px-6 py-6 border-r text-center min-w-[180px] bg-white relative group/header">
                  <div className="text-indigo-950 font-black mb-1 leading-tight text-xs">{sub.category}</div>
                  <div className="text-[9px] text-slate-400 mb-2 opacity-75 uppercase truncate max-w-[150px] mx-auto font-bold">{sub.label || '-'}</div>
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full font-black text-[10px] border border-indigo-100">
                    <ArrowRight size={10} /> SUR {sub.maxGrade}
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                    <button onClick={() => startEditingSubject(sub)} className="p-1.5 bg-white rounded-lg shadow-md border border-slate-100 text-indigo-500 hover:bg-indigo-50 transition-colors" title="Éditer cette colonne"><Edit3 size={12} /></button>
                  </div>
                </th>
              ))}
              <th className="px-6 py-8 border-r text-center min-w-[300px] bg-white">
                <div className="flex flex-col items-center">
                  <MessageSquareQuote size={18} className="text-indigo-900 mb-1" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Observations / Appréciations</span>
                </div>
              </th>
              <th className="px-8 py-6 text-center w-32 bg-slate-50">Gestion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStudents.map((student, idx) => (
              <tr key={student.id} className={`group hover:bg-indigo-50/20 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                {/* Identité Élève */}
                <td className="px-8 py-6 border-r font-black text-slate-800 sticky left-0 bg-inherit z-10 shadow-sm">
                  {editingStudentId === student.id ? (
                    <div className="flex gap-2 animate-in zoom-in-95 duration-200">
                       <input autoFocus className="w-1/2 p-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-600 outline-none font-bold shadow-lg" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
                       <input className="w-1/2 p-3 border-2 border-indigo-200 rounded-xl focus:border-indigo-600 outline-none font-bold shadow-lg" value={editLastName} onChange={e => setEditLastName(e.target.value)} />
                       <button onClick={saveEditedStudent} className="bg-emerald-600 text-white px-4 rounded-xl hover:bg-emerald-700 transition-all shadow-lg active:scale-95"><CheckCircle2 size={20} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group/name">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] bg-indigo-900 text-white w-7 h-7 rounded-lg flex items-center justify-center font-black shadow-md">{idx + 1}</span>
                        <span className="text-xl tracking-tighter uppercase font-black text-indigo-950 flex gap-2">
                           <span className="font-medium text-slate-400 opacity-60 lowercase">{student.firstName}</span> 
                           {student.lastName}
                        </span>
                      </div>
                      <button onClick={() => startEditingStudent(student)} className="opacity-0 group-hover/name:opacity-100 text-slate-300 hover:text-indigo-600 transition-all transform hover:scale-110"><Edit3 size={20}/></button>
                    </div>
                  )}
                </td>

                {/* Notes Saisies */}
                {activeClass.subjects.map(sub => {
                  const val = getGradeValue(student.id, sub.id);
                  const isOverMax = val !== '' && Number(val) > sub.maxGrade;
                  const isLow = val !== '' && Number(val) < (sub.maxGrade / 2);
                  
                  return (
                    <td key={sub.id} className="px-6 py-5 text-center border-r border-slate-50">
                      <div className="relative inline-block">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="-"
                          className={`w-28 text-center text-3xl font-black border-2 rounded-[1.25rem] py-4 transition-all focus:ring-8 outline-none ${
                            isOverMax 
                            ? 'border-red-500 bg-red-50 text-red-700 focus:ring-red-100' 
                            : isLow 
                              ? 'border-amber-200 bg-amber-50 text-amber-700 focus:ring-amber-100 focus:border-amber-500' 
                              : 'border-slate-100 text-indigo-950 bg-white focus:ring-indigo-100 focus:border-indigo-600 shadow-sm hover:border-indigo-200'
                          }`}
                          value={val}
                          onChange={(e) => onUpdateGrade(student.id, sub.id, e.target.value)}
                        />
                        {isOverMax && (
                          <div className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full p-2 animate-bounce shadow-xl ring-4 ring-white" title="ERREUR: Note supérieure au barème !">
                            <AlertCircle size={14} />
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}

                {/* Champ Observation */}
                <td className="px-6 py-5 border-r border-slate-50">
                  <input
                    className="w-full p-4 bg-white border-2 border-slate-100 rounded-2xl text-[13px] font-bold text-slate-700 italic placeholder:text-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-inner"
                    placeholder="Ex: Travail sérieux, doit s'appliquer davantage..."
                    value={student.observation || ''}
                    onChange={(e) => onUpdateObservation(student.id, e.target.value)}
                  />
                </td>

                {/* Actions Ligne */}
                <td className="px-8 py-6 text-center bg-slate-50/50">
                  <button onClick={() => onDeleteStudent(student.id)} className="text-slate-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all transform hover:scale-150" title="Retirer l'élève de la liste"><Trash2 size={24}/></button>
                </td>
              </tr>
            ))}
            
            {/* Pied de tableau: Moyenne de Classe */}
            {filteredStudents.length > 0 && (
              <tr className="bg-slate-900 font-black border-t-4 border-black">
                <td className="px-8 py-8 border-r sticky left-0 bg-slate-900 z-10 flex items-center gap-4">
                  <div className="p-3 bg-indigo-500 rounded-2xl text-white shadow-lg"><BarChart3 size={24} /></div>
                  <div className="flex flex-col">
                    <span className="uppercase text-[11px] tracking-[0.3em] text-indigo-300 mb-1">Moyenne Générale</span>
                    <span className="text-white text-lg tracking-widest">COHORTE {activeClass.name}</span>
                  </div>
                </td>
                {activeClass.subjects.map(sub => {
                  const subGrades = filteredStudents.map(s => getGradeValue(s.id, sub.id)).filter(v => v !== '').map(v => Number(v));
                  const avg = subGrades.length > 0 ? subGrades.reduce((a, b) => a + b, 0) / subGrades.length : 0;
                  const isWarning = avg < (sub.maxGrade / 2);
                  return (
                    <td key={sub.id} className="px-6 py-6 text-center border-r border-slate-800">
                      <div className={`text-3xl font-black tracking-tighter ${isWarning ? 'text-red-400' : 'text-emerald-400'}`}>{avg.toFixed(2)}</div>
                      <div className="text-[9px] text-slate-500 uppercase mt-1">/ {sub.maxGrade}</div>
                    </td>
                  );
                })}
                <td className="border-r border-slate-800"></td>
                <td className="bg-slate-900/50"></td>
              </tr>
            )}

            {/* Inscription Rapide */}
            <tr className="bg-emerald-50/20">
              <td className="px-8 py-12 border-r sticky left-0 bg-white z-10 border-t border-slate-100">
                <form onSubmit={handleAddSubmit} className="space-y-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-emerald-600 rounded-xl text-white shadow-lg shadow-emerald-100"><PlusCircle size={20}/></div>
                    <p className="text-[12px] font-black text-emerald-900 uppercase tracking-widest">Nouvelle Inscription</p>
                  </div>
                  <div className="space-y-4">
                    <input placeholder="Prénom de l'enfant" className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold focus:border-emerald-500 focus:ring-8 focus:ring-emerald-50 outline-none transition-all bg-white shadow-inner" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} />
                    <input placeholder="NOM DE FAMILLE" className="w-full border-2 border-slate-100 rounded-2xl px-5 py-4 font-black focus:border-emerald-500 focus:ring-8 focus:ring-emerald-50 outline-none transition-all bg-white shadow-inner uppercase" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all mt-4 border-b-4 border-emerald-800">VALIDER L'INSCRIPTION</button>
                </form>
              </td>
              <td colSpan={activeClass.subjects.length + 2} className="p-12 border-t border-slate-100">
                <div className="bg-white/80 backdrop-blur-xl p-10 rounded-[3rem] border-4 border-dashed border-emerald-100 flex items-center gap-10 shadow-2xl max-w-4xl mx-auto">
                  <div className="bg-emerald-100 p-6 rounded-[2rem] text-emerald-600 ring-8 ring-emerald-50"><Info size={48} /></div>
                  <div className="space-y-3">
                    <h5 className="text-emerald-900 font-black uppercase text-sm tracking-widest">Conseils de saisie administrative</h5>
                    <p className="text-emerald-800/70 text-base font-medium leading-relaxed">
                      Utilisez la colonne <strong>Observations</strong> pour saisir les appréciations qui apparaîtront directement sur le bulletin. 
                      Utilisez la touche <strong>TAB</strong> pour passer rapidement d'une cellule à l'autre. Les modifications sont enregistrées instantanément dans la base de données locale.
                    </p>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
