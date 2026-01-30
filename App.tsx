
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppView, AppState, Student, GradeEntry, ClassRoom, SchoolInfo, Subject, ClassLevel } from './types';
import { DEFAULT_SCHOOL_INFO, SUBJECTS_CP_B, SUBJECTS_CM2_B, CLASS_LEVELS, LEVEL_ORDER } from './constants';
import { Layout } from './components/Layout';
import { GradeTable } from './components/GradeTable';
import { ReportCard } from './components/ReportCard';
import * as XLSX from 'xlsx';
import { 
  ChevronLeft, Users, FileText, ArrowLeft, Download, Save, 
  RefreshCw, Plus, Edit2, X, Database, Image as ImageIcon, 
  CloudUpload, CloudDownload, Wifi, WifiOff, Trash2, GraduationCap,
  Server, Link as LinkIcon, CheckCircle, AlertTriangle
} from 'lucide-react';

const STORAGE_KEY = 'sudstade_grading_app_state_v4';

const App: React.FC = () => {
  const [view, setView] = React.useState<AppView>('DASHBOARD');
  const [activeClassId, setActiveClassId] = React.useState<string | null>(null);
  const [isCreatingClass, setIsCreatingClass] = React.useState(false);
  const [isEditingClass, setIsEditingClass] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [isApiOnline, setIsApiOnline] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<{type: 'success' | 'error', msg: string} | null>(null);

  const [editClassName, setEditClassName] = React.useState('');
  const [editClassLevel, setEditClassLevel] = React.useState<ClassLevel>('CP');

  const [state, setState] = React.useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved) as AppState;
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    
    return {
      schoolInfo: { 
        ...DEFAULT_SCHOOL_INFO, 
        logoUrl: 'https://img.freepik.com/vecteurs-premium/logo-education-graduation-cap-icon-vector-illustration_592324-118.jpg',
        apiUrl: 'http://localhost:8080/api'
      },
      classes: [
        { id: '1', name: 'CP B', level: 'CP', teacherName: 'Mme Sow', directorName: 'Mme Diallo', subjects: SUBJECTS_CP_B },
        { id: '2', name: 'CM2 B', level: 'CM2', teacherName: 'Mr Cissé', directorName: 'Mme Diallo', subjects: SUBJECTS_CM2_B },
      ],
      students: [
        { id: 's1', firstName: 'Ahmed', lastName: 'Ali', classId: '2', observation: '' },
        { id: 's2', firstName: 'Fatima', lastName: 'Sara', classId: '2', observation: '' },
      ],
      grades: [
        { studentId: 's1', subjectId: 'math', value: 15 },
        { studentId: 's2', subjectId: 'math', value: 18 },
      ],
    };
  });

  // Check API availability with error suppression for deployment
  useEffect(() => {
    let interval: any;
    const checkStatus = async () => {
      if (!state.schoolInfo.apiUrl) {
        setIsApiOnline(false);
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`${state.schoolInfo.apiUrl}/health`, { 
          method: 'HEAD',
          signal: controller.signal
        });
        setIsApiOnline(res.ok);
        clearTimeout(timeoutId);
      } catch {
        setIsApiOnline(false);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [state.schoolInfo.apiUrl]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const handleSyncPush = async (silent = false) => {
    if (!state.schoolInfo.apiUrl) {
      if (!silent) alert("Veuillez configurer l'URL du serveur API dans les réglages.");
      return;
    }
    setIsSyncing(true);
    if (!silent) setSyncStatus(null);
    try {
      const response = await fetch(`${state.schoolInfo.apiUrl}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      });
      if (response.ok) {
        if (!silent) setSyncStatus({ type: 'success', msg: 'Données synchronisées avec MySQL !' });
      } else {
        throw new Error('Erreur de sauvegarde');
      }
    } catch (err) {
      if (!silent) setSyncStatus({ type: 'error', msg: 'Connexion MySQL impossible.' });
    } finally {
      setIsSyncing(false);
      if (!silent) setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const autoSyncRef = useRef(() => handleSyncPush(true));
  autoSyncRef.current = () => handleSyncPush(true);

  useEffect(() => {
    if (!isApiOnline) return;
    const interval = setInterval(() => {
      if (isApiOnline && !isSyncing) autoSyncRef.current();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isApiOnline, isSyncing]);

  const handleSyncPull = async () => {
    if (!state.schoolInfo.apiUrl) {
      alert("Config API requise.");
      return;
    }
    if (!confirm("Écraser les données locales par celles du serveur MySQL ?")) return;
    setIsSyncing(true);
    try {
      const response = await fetch(`${state.schoolInfo.apiUrl}/load`);
      if (response.ok) {
        const data = await response.json() as AppState;
        setState(data);
        setSyncStatus({ type: 'success', msg: 'Restauration terminée !' });
      } else {
        throw new Error('Erreur');
      }
    } catch (err) {
      setSyncStatus({ type: 'error', msg: 'Serveur indisponible.' });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleExportExcel = (classRoom: ClassRoom) => {
    const studentsInClass = state.students.filter(s => s.classId === classRoom.id);
    const data = studentsInClass.map(s => {
      const row: any = { "Élève": `${s.lastName} ${s.firstName}` };
      classRoom.subjects.forEach(sub => {
        const grade = state.grades.find(g => g.studentId === s.id && g.subjectId === sub.id);
        row[`${sub.category} - ${sub.label || ''} (/ ${sub.maxGrade})`] = grade ? grade.value : "";
      });
      row["Observations"] = s.observation || "";
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Notes");
    XLSX.writeFile(workbook, `Notes_${classRoom.name}_${state.schoolInfo.term}.xlsx`);
  };

  const sortedClasses = useMemo(() => {
    return [...state.classes].sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);
  }, [state.classes]);

  const activeClass = state.classes.find(c => c.id === activeClassId);
  const classStudents = state.students.filter(s => s.classId === activeClassId);

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    const newClass: ClassRoom = {
      id: Math.random().toString(36).substr(2, 9),
      name: editClassName,
      level: editClassLevel,
      teacherName: "",
      directorName: state.classes[0]?.directorName || "",
      subjects: [],
    };
    setState(prev => ({ ...prev, classes: [...prev.classes, newClass] }));
    setIsCreatingClass(false);
    setEditClassName('');
  };

  const handleUpdateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClassId) return;
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c => c.id === activeClassId ? { ...c, name: editClassName, level: editClassLevel } : c)
    }));
    setIsEditingClass(false);
  };

  const handleDeleteClass = (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette classe ?")) return;
    setState(prev => ({
      ...prev,
      classes: prev.classes.filter(c => c.id !== id),
      students: prev.students.filter(s => s.classId !== id)
    }));
    setView('DASHBOARD');
  };

  const handleUpdateTeacherName = (name: string) => {
    if (!activeClassId) return;
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c => c.id === activeClassId ? { ...c, teacherName: name } : c)
    }));
  };

  const handleUpdateDirectorName = (name: string) => {
    if (!activeClassId) return;
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c => c.id === activeClassId ? { ...c, directorName: name } : c)
    }));
  };

  const handleUpdateSchoolInfo = (info: Partial<SchoolInfo>) => {
    setState(prev => ({ ...prev, schoolInfo: { ...prev.schoolInfo, ...info } }));
  };

  const handleAddStudent = (firstName: string, lastName: string) => {
    if (!activeClassId) return;
    const newStudent: Student = { id: Math.random().toString(36).substr(2, 9), firstName, lastName, classId: activeClassId, observation: '' };
    setState(prev => ({ ...prev, students: [...prev.students, newStudent] }));
  };

  const handleUpdateStudent = (id: string, firstName: string, lastName: string) => {
    setState(prev => ({ ...prev, students: prev.students.map(s => s.id === id ? { ...s, firstName, lastName } : s) }));
  };

  const handleUpdateObservation = (id: string, observation: string) => {
    setState(prev => ({ ...prev, students: prev.students.map(s => s.id === id ? { ...s, observation } : s) }));
  };

  const handleUpdateGrade = (studentId: string, subjectId: string, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setState(prev => {
      const filtered = prev.grades.filter(g => !(g.studentId === studentId && g.subjectId === subjectId));
      return { ...prev, grades: [...filtered, { studentId, subjectId, value: numValue }] };
    });
  };

  const handleUpdateSubject = (subject: Subject) => {
    if (!activeClassId) return;
    setState(prev => ({
      ...prev,
      classes: prev.classes.map(c => c.id === activeClassId ? { ...c, subjects: c.subjects.map(s => s.id === subject.id ? subject : s) } : c)
    }));
  };

  return (
    <Layout activeView={view} onNavigate={setView} isOnline={isApiOnline}>
      {syncStatus && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-8 duration-300 font-bold ${syncStatus.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
          {syncStatus.type === 'success' ? <CheckCircle size={20}/> : <AlertTriangle size={20}/>}
          {syncStatus.msg}
        </div>
      )}

      {view === 'DASHBOARD' && (
        <div className="max-w-6xl mx-auto">
          <header className="mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-black text-indigo-950 mb-2 tracking-tight">Espace Scolaire</h2>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <p className="text-slate-500 text-lg">Plateforme de gestion centralisée</p>
                {isApiOnline && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>}
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => handleSyncPush(false)} 
                disabled={isSyncing || !isApiOnline}
                className="flex items-center gap-2 bg-white border-2 border-indigo-100 text-indigo-600 px-6 py-4 rounded-2xl font-black shadow-sm hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
              >
                <CloudUpload size={20} /> SYNC MYSQL
              </button>
              <button onClick={() => setIsCreatingClass(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                <Plus size={24} /> CRÉER CLASSE
              </button>
            </div>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedClasses.map(c => {
              const studentsInClass = state.students.filter(s => s.classId === c.id);
              return (
                <div key={c.id} onClick={() => { setActiveClassId(c.id); setView('CLASS_DETAIL'); }} className="group bg-white p-8 rounded-[2.5rem] shadow-sm border-2 border-slate-100 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-100 cursor-pointer transition-all flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="bg-indigo-900 text-white px-3 py-1 rounded-bl-2xl font-black text-xs">{c.level}</div>
                  </div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="bg-indigo-50 text-indigo-600 p-4 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:rotate-3"><Users size={28} /></div>
                  </div>
                  <h3 className="text-2xl font-black text-indigo-950 mb-1">{c.name}</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-4">{c.teacherName || 'Aucun enseignant'}</p>
                  <div className="mt-auto pt-4 border-t border-slate-50">
                    <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center">
                      <div className="text-[10px] font-black text-slate-400 uppercase">Total Élèves</div>
                      <div className="text-xl font-black text-slate-800">{studentsInClass.length}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'SETTINGS' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100">
             <header className="mb-10 flex items-center justify-between">
               <div>
                 <h2 className="text-3xl font-black text-indigo-950">Configuration École</h2>
                 <p className="text-slate-500 font-medium">Paramètres de l'établissement</p>
               </div>
               <div className="bg-slate-100 p-4 rounded-3xl text-slate-400"><Server size={32} /></div>
             </header>
             <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom de l'école</label>
                  <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={state.schoolInfo.school} onChange={e => handleUpdateSchoolInfo({ school: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Année Scolaire</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={state.schoolInfo.academicYear} onChange={e => handleUpdateSchoolInfo({ academicYear: e.target.value })} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Période Actuelle</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={state.schoolInfo.term} onChange={e => handleUpdateSchoolInfo({ term: e.target.value })} /></div>
                </div>
             </div>
          </div>

          <div className="bg-indigo-950 p-12 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 opacity-10 transform translate-x-10 translate-y-10 rotate-12"><Database size={200} /></div>
             <header className="mb-10 relative z-10">
               <div className="flex items-center gap-3 mb-2">
                 <h2 className="text-3xl font-black">Base de Données</h2>
                 <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${isApiOnline ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
                   {isApiOnline ? 'MySQL Connecté' : 'Hors-ligne'}
                 </div>
               </div>
               <p className="text-indigo-300 font-medium italic">Liaison avec votre serveur de production</p>
             </header>

             <div className="space-y-8 relative z-10">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">API Endpoint (URL Backend)</label>
                  <div className="flex gap-4">
                    <div className="flex-1 relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} />
                      <input 
                        className="w-full p-4 pl-12 bg-white/10 border-2 border-white/10 rounded-2xl font-bold outline-none focus:border-indigo-400 transition-all text-white placeholder:text-indigo-400/50" 
                        placeholder="https://votre-backend.up.railway.app/api"
                        value={state.schoolInfo.apiUrl} 
                        onChange={e => handleUpdateSchoolInfo({ apiUrl: e.target.value })} 
                      />
                    </div>
                    <button onClick={() => setView('DASHBOARD')} className="bg-white text-indigo-950 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition-all uppercase text-xs tracking-widest">Appliquer</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={handleSyncPull} disabled={!isApiOnline || isSyncing} className="flex items-center justify-center gap-3 p-6 bg-white/5 border-2 border-white/10 rounded-3xl hover:bg-white/10 transition-all disabled:opacity-30">
                    <CloudDownload className="text-indigo-400" />
                    <div className="text-left"><p className="font-black text-sm">RESTAURER</p><p className="text-[9px] text-indigo-400 font-bold uppercase">Depuis MySQL</p></div>
                  </button>
                  <button onClick={() => handleSyncPush(false)} disabled={!isApiOnline || isSyncing} className="flex items-center justify-center gap-3 p-6 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-3xl hover:bg-emerald-500/20 transition-all disabled:opacity-30">
                    <CloudUpload className="text-emerald-400" />
                    <div className="text-left"><p className="font-black text-sm">SAUVEGARDER</p><p className="text-[9px] text-emerald-400 font-bold uppercase">Vers MySQL</p></div>
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}

      {view === 'CLASS_DETAIL' && activeClass && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <button onClick={() => setView('DASHBOARD')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all"><ChevronLeft size={20} /> RETOUR DASHBOARD</button>
            <div className="flex gap-2">
              <button onClick={() => handleExportExcel(activeClass)} className="flex items-center gap-2 px-4 py-2 border-2 border-emerald-100 rounded-xl font-bold text-emerald-600 hover:bg-emerald-50 transition-all"><FileText size={16} /> EXCEL</button>
              <button onClick={() => { setEditClassName(activeClass.name); setEditClassLevel(activeClass.level); setIsEditingClass(true); }} className="flex items-center gap-2 px-4 py-2 border-2 border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"><Edit2 size={16} /> ÉDITER</button>
              <button onClick={() => handleDeleteClass(activeClass.id)} className="flex items-center gap-2 px-4 py-2 border-2 border-red-100 rounded-xl font-bold text-red-400 hover:bg-red-50 transition-all"><Trash2 size={16} /> SUPPRIMER</button>
            </div>
          </div>
          <GradeTable
            activeClass={activeClass}
            students={classStudents}
            grades={state.grades}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onUpdateObservation={handleUpdateObservation}
            onAddSubject={(subject) => setState(prev => ({ ...prev, classes: prev.classes.map(c => c.id === activeClass.id ? { ...c, subjects: [...c.subjects, subject] } : c) }))}
            onUpdateSubject={handleUpdateSubject}
            onDeleteSubject={(sid) => setState(prev => ({ ...prev, classes: prev.classes.map(c => c.id === activeClass.id ? { ...c, subjects: c.subjects.filter(s => s.id !== sid) } : c), grades: prev.grades.filter(g => g.subjectId !== sid) }))}
            onDeleteStudent={(id) => setState(prev => ({ ...prev, students: prev.students.filter(s => s.id !== id), grades: prev.grades.filter(g => g.studentId !== id) }))}
            onUpdateGrade={handleUpdateGrade}
            onBulkImport={(imported) => {
              const news: Student[] = []; const newGrades: GradeEntry[] = [];
              imported.forEach(i => {
                const sid = Math.random().toString(36).substr(2, 9);
                news.push({ id: sid, firstName: i.firstName, lastName: i.lastName, classId: activeClass.id, observation: '' });
                Object.entries(i.grades).forEach(([sub, val]) => newGrades.push({ studentId: sid, subjectId: sub, value: val as number }));
              });
              setState(prev => ({ ...prev, students: [...prev.students, ...news], grades: [...prev.grades, ...newGrades] }));
            }}
            onGenerateBulletins={() => setView('REPORT_CARDS')}
            onExportCSV={() => handleExportExcel(activeClass)} 
            onUpdateTeacherName={handleUpdateTeacherName}
            onUpdateDirectorName={handleUpdateDirectorName}
          />
        </div>
      )}

      {view === 'REPORT_CARDS' && activeClass && (
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <button onClick={() => setView('CLASS_DETAIL')} className="flex items-center gap-2 text-slate-600 font-bold hover:text-indigo-600"><ArrowLeft size={20}/> RETOUR À LA LISTE</button>
            <button onClick={() => window.print()} className="bg-indigo-950 text-white px-10 py-4 rounded-[2rem] font-black shadow-xl flex items-center gap-2 hover:bg-black transition-all"><Download size={22} /> IMPRIMER TOUS</button>
          </div>
          <div className="print-area">
            {classStudents.map(student => (
              <ReportCard
                key={student.id}
                student={student}
                allStudentsInClass={classStudents}
                activeClass={activeClass}
                schoolInfo={state.schoolInfo}
                grades={state.grades}
                onUpdateObservation={handleUpdateObservation}
              />
            ))}
          </div>
        </div>
      )}

      {(isCreatingClass || isEditingClass) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
            <div className="bg-indigo-900 p-8 text-white relative">
              <h3 className="text-2xl font-black uppercase tracking-widest flex items-center gap-3">
                <GraduationCap size={28} /> {isCreatingClass ? 'Nouvelle Classe' : 'Édition Classe'}
              </h3>
              <button onClick={() => { setIsCreatingClass(false); setIsEditingClass(false); }} className="absolute top-8 right-8 text-white/50 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={isCreatingClass ? handleAddClass : handleUpdateClass} className="p-10 space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Intitulé</label>
                <input required autoFocus className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 outline-none" value={editClassName} onChange={e => setEditClassName(e.target.value)} placeholder="Ex: CM2 Alpha" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase">Modèle de Niveau</label>
                <select className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-indigo-600 outline-none" value={editClassLevel} onChange={e => setEditClassLevel(e.target.value as ClassLevel)}>
                  {CLASS_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">Valider</button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
