
import React, { useMemo } from 'react';
import { Student, ClassRoom, GradeEntry, SchoolInfo } from '../types';
import { getAppreciation } from '../constants';
import { GraduationCap, Award, MessageSquare, ShieldCheck, Trophy, Medal, Star, Edit3, TrendingUp, BarChart3 } from 'lucide-react';

interface ReportCardProps {
  student: Student;
  allStudentsInClass: Student[];
  activeClass: ClassRoom;
  schoolInfo: SchoolInfo;
  grades: GradeEntry[];
  onUpdateObservation?: (studentId: string, observation: string) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  student,
  allStudentsInClass,
  activeClass,
  schoolInfo,
  grades,
  onUpdateObservation
}) => {
  // Helper to calculate a specific student's average
  const calculateAverage = (sId: string) => {
    const studentGrades = activeClass.subjects.map(sub => {
      const entry = grades.find(g => g.studentId === sId && g.subjectId === sub.id);
      return entry ? entry.value : 0;
    });
    
    const totalPoints = studentGrades.reduce((acc, curr) => acc + curr, 0);
    const totalMax = activeClass.subjects.reduce((acc, curr) => acc + curr.maxGrade, 0);
    
    return totalMax > 0 ? (totalPoints / totalMax) * 20 : 0;
  };

  // 1. Calculate stats for the entire class (needed for ranking and context)
  const classStats = useMemo(() => {
    const averages = allStudentsInClass.map(s => ({
      id: s.id,
      avg: calculateAverage(s.id)
    }));
    
    // Sort descending for ranking
    const sorted = [...averages].sort((a, b) => b.avg - a.avg);
    
    // Handle rankings with ties
    let currentRank = 1;
    const rankings = sorted.map((item, index) => {
      if (index > 0 && item.avg < sorted[index - 1].avg) {
        currentRank = index + 1;
      }
      return { ...item, rank: currentRank };
    });

    const classSum = averages.reduce((acc, curr) => acc + curr.avg, 0);
    
    return {
      rankings,
      classAverage: averages.length > 0 ? classSum / averages.length : 0,
      maxAverage: sorted.length > 0 ? sorted[0].avg : 0,
      minAverage: sorted.length > 0 ? sorted[sorted.length - 1].avg : 0,
      totalStudents: allStudentsInClass.length
    };
  }, [allStudentsInClass, activeClass.subjects, grades]);

  const studentRankInfo = classStats.rankings.find(r => r.id === student.id);
  const studentRank = studentRankInfo?.rank || 0;
  const currentStudentAverage = studentRankInfo?.avg || 0;
  const appreciation = getAppreciation(currentStudentAverage);

  // Data for the subjects table
  const studentGradesList = activeClass.subjects.map(sub => {
    const entry = grades.find(g => g.studentId === student.id && g.subjectId === sub.id);
    return { ...sub, value: entry ? entry.value : 0 };
  });

  const totalPointsObtained = studentGradesList.reduce((acc, curr) => acc + curr.value, 0);
  const totalPointsPossible = activeClass.subjects.reduce((acc, curr) => acc + curr.maxGrade, 0);

  const getRankIcon = () => {
    if (studentRank === 1) return <Trophy className="text-amber-500" size={32} />;
    if (studentRank === 2) return <Medal className="text-slate-400" size={32} />;
    if (studentRank === 3) return <Medal className="text-amber-700" size={32} />;
    return <Star className="text-slate-300" size={32} />;
  };

  return (
    <div className="report-card-container border-[6px] border-double border-slate-900 mb-12 overflow-hidden relative shadow-lg bg-white" style={{ pageBreakAfter: 'always' }}>
      <div className="px-12 py-10 h-full flex flex-col relative z-10">
        
        {/* Professional Header */}
        <div className="flex justify-between items-start mb-10 pb-6 border-b-2 border-slate-900">
          <div className="w-1/3 space-y-1 text-[11px] font-bold text-slate-800 uppercase italic">
            <p>RÉPUBLIQUE DU SÉNÉGAL</p>
            <p className="text-[9px] font-normal tracking-widest opacity-60">Un Peuple - Un But - Une Foi</p>
            <div className="pt-4 space-y-1 not-italic">
              <p>IA : <span className="font-black text-indigo-900">{schoolInfo.ia}</span></p>
              <p>IEF : <span className="font-black text-indigo-900">{schoolInfo.ief}</span></p>
              <p className="underline underline-offset-4">ÉCOLE : {schoolInfo.school}</p>
            </div>
          </div>
          
          <div className="w-1/3 flex flex-col items-center justify-center">
            <div className="h-24 w-24 bg-white p-1 mb-2">
              {schoolInfo.logoUrl ? (
                <img src={schoolInfo.logoUrl} className="w-full h-full object-contain" alt="Logo" />
              ) : (
                <div className="bg-indigo-900 w-full h-full flex items-center justify-center rounded-2xl">
                  <GraduationCap size={40} className="text-white" />
                </div>
              )}
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">Bulletin Officiel</p>
          </div>

          <div className="w-1/3 text-right text-[11px] font-bold space-y-1 uppercase">
            <p className="tracking-tighter">Année : <span className="text-indigo-900 font-black">{schoolInfo.academicYear}</span></p>
            <p className="tracking-tighter">Classe : <span className="text-indigo-900 font-black">{activeClass.name}</span></p>
            <p className="tracking-tighter">Enseignant : <span className="text-indigo-900 font-black">{activeClass.teacherName || 'Non défini'}</span></p>
            <p className="text-[9px] opacity-40 font-normal pt-2 italic">ID: {student.id.toUpperCase()}</p>
          </div>
        </div>

        {/* Title Block */}
        <div className="mx-auto w-full py-6 text-center mb-8 bg-slate-900 text-white rounded-xl shadow-xl transform -rotate-1 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10"><ShieldCheck size={64} /></div>
          <h2 className="text-3xl font-black uppercase tracking-[0.3em] leading-none mb-1">
            {schoolInfo.term}
          </h2>
          <p className="text-xs font-bold opacity-60 tracking-[0.5em]">RÉSULTATS PÉRIODIQUES</p>
        </div>

        {/* Student Box */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="border-4 border-slate-900 p-6 rounded-2xl bg-white shadow-inner flex items-center">
             <div className="bg-slate-100 p-3 rounded-xl mr-4"><Award size={24} className="text-slate-500" /></div>
             <div>
               <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mb-0.5">NOM ET PRÉNOM DE L'ÉLÈVE</p>
               <h3 className="text-2xl font-black uppercase text-slate-900 leading-none">{student.lastName} {student.firstName}</h3>
             </div>
          </div>
          <div className="bg-indigo-50 border-4 border-indigo-900 p-6 rounded-2xl flex flex-col items-center justify-center shadow-lg relative overflow-hidden">
             <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12">
               {studentRank === 1 && <Trophy size={80} className="text-indigo-900" />}
             </div>
             <p className="text-[10px] uppercase tracking-widest text-indigo-900 font-black mb-1">MOYENNE GÉNÉRALE</p>
             <div className="flex items-baseline gap-1">
               <span className="text-5xl font-black text-indigo-900 tracking-tighter">{currentStudentAverage.toFixed(2)}</span>
               <span className="text-lg font-bold opacity-40">/ 20</span>
             </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="border-4 border-slate-900 rounded-2xl overflow-hidden mb-10 shadow-lg bg-white">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[10px] font-black tracking-widest">
                <th className="p-4 text-left border-r border-white/20">MATIÈRES / DISCIPLINES</th>
                <th className="w-24 p-4 text-center border-r border-white/20">NOTE</th>
                <th className="w-24 p-4 text-center border-r border-white/20">MAX</th>
                <th className="w-48 p-4 text-center">RANG / APPRÉCIATION</th>
              </tr>
            </thead>
            <tbody>
              {studentGradesList.map((sub, idx) => {
                const isWarning = sub.value < (sub.maxGrade / 2);
                const subAppreciation = getAppreciation((sub.value / sub.maxGrade) * 20);
                return (
                  <tr key={sub.id} className={`h-12 border-b-2 border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                    <td className="px-6 py-3 border-r-2 border-slate-200">
                      <p className="font-black text-slate-800 uppercase text-[11px] leading-tight">{sub.label || sub.category}</p>
                      {sub.label && <p className="text-[9px] text-slate-400 font-bold opacity-60 uppercase">{sub.category}</p>}
                    </td>
                    <td className={`text-center font-black text-xl border-r-2 border-slate-200 ${isWarning ? 'text-red-600' : 'text-slate-900'}`}>{sub.value}</td>
                    <td className="text-center font-bold text-slate-400 border-r-2 border-slate-200">{sub.maxGrade}</td>
                    <td className="text-center font-black italic text-[10px] uppercase text-indigo-700">{subAppreciation}</td>
                  </tr>
                );
              })}
              <tr className="bg-slate-900 text-white font-black h-20">
                 <td className="px-8 uppercase tracking-widest text-right text-lg">SCORE TOTAL :</td>
                 <td className="text-center text-3xl tracking-tighter">{totalPointsObtained.toFixed(2)}</td>
                 <td className="text-center opacity-40 text-lg">/ {totalPointsPossible}</td>
                 <td className="text-center bg-indigo-800 text-indigo-100 text-xs">RÉSULTAT OFFICIEL</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Rankings and Class Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
          {/* Section Observations */}
          <div className="space-y-4">
             <div className="border-l-8 border-indigo-900 pl-4 py-2 h-full flex flex-col group/obs">
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <MessageSquare size={14} className="text-indigo-900" />
                  Observations de l'Enseignant
                  <span className="no-print opacity-0 group-hover/obs:opacity-100 transition-opacity ml-auto">
                    <Edit3 size={12} className="text-indigo-400" />
                  </span>
                </p>
                <div className="flex-1 min-h-[100px] relative">
                  <textarea
                    className="w-full h-full text-[13px] italic font-bold text-slate-800 leading-relaxed border-b-2 border-dotted border-slate-300 bg-slate-50/20 p-2 rounded-lg outline-none focus:bg-indigo-50/30 focus:border-indigo-400 transition-all resize-none overflow-hidden"
                    placeholder="Saisissez vos observations ici..."
                    value={student.observation || ''}
                    onChange={(e) => onUpdateObservation?.(student.id, e.target.value)}
                    style={{ borderStyle: 'dotted' }}
                  />
                  <div className="hidden print:block absolute inset-0 text-[13px] italic font-bold text-slate-800 leading-relaxed p-2 whitespace-pre-wrap">
                    {student.observation || "Observations non renseignées par l'enseignant."}
                  </div>
                </div>
             </div>
          </div>
          
          {/* Section Rang & Stats */}
          <div className="space-y-4">
             {/* Bloc Rang Principal */}
             <div className="bg-slate-50 border-4 border-slate-200 p-6 rounded-[2rem] shadow-inner relative overflow-hidden">
                <div className="absolute right-4 top-4 opacity-10 transform rotate-12">
                   <TrendingUp size={60} className="text-slate-900" />
                </div>
                <div className="flex justify-between items-center relative z-10">
                   <div className="flex items-center gap-4">
                      {getRankIcon()}
                      <div>
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RANG DE L'ÉLÈVE</p>
                         <p className="text-4xl font-black text-slate-900">
                           {studentRank}
                           <sup className="text-xl lowercase">
                             {studentRank === 1 ? 'er' : 'ème'}
                           </sup>
                         </p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EFFECTIF</p>
                      <p className="text-3xl font-black text-slate-600">{classStats.totalStudents}</p>
                   </div>
                </div>
             </div>

             {/* Bloc Stats de Classe */}
             <div className="bg-indigo-900 text-white p-5 rounded-3xl shadow-lg border-b-4 border-indigo-950 flex justify-between items-center">
                <div className="flex flex-col items-center px-4 border-r border-white/10">
                   <p className="text-[8px] font-black opacity-60 uppercase mb-1">Moy. Classe</p>
                   <p className="text-sm font-black tracking-tighter">{classStats.classAverage.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-center px-4 border-r border-white/10">
                   <p className="text-[8px] font-black opacity-60 uppercase mb-1 text-emerald-400">Plus Haute</p>
                   <p className="text-sm font-black tracking-tighter text-emerald-300">{classStats.maxAverage.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-center px-4">
                   <p className="text-[8px] font-black opacity-60 uppercase mb-1 text-red-400">Plus Basse</p>
                   <p className="text-sm font-black tracking-tighter text-red-300">{classStats.minAverage.toFixed(2)}</p>
                </div>
             </div>
             
             {/* Décision Finale */}
             <div className="text-center p-4 bg-white border-2 border-indigo-100 rounded-3xl shadow-sm">
                <p className="text-[9px] font-black text-indigo-400 uppercase mb-1 tracking-[0.2em]">DÉCISION DU CONSEIL</p>
                <p className="text-lg font-black text-indigo-900 uppercase tracking-tighter italic">"{appreciation}"</p>
             </div>
          </div>
        </div>

        {/* Footer Signatures */}
        <div className="mt-auto grid grid-cols-2 gap-32 text-[10px] font-black uppercase italic px-10 text-slate-400">
          <div className="text-center flex flex-col items-center">
            <p className="mb-4 text-slate-600 border-b-2 border-indigo-100 pb-2 w-full">L'Enseignant : <span className="text-slate-900 not-italic font-black">{activeClass.teacherName || '...'}</span></p>
            <div className="h-24 w-full border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-[8px] tracking-[0.3em] opacity-30">Visa Enseignant</div>
          </div>
          <div className="text-center flex flex-col items-center">
            <p className="mb-4 text-slate-600 border-b-2 border-indigo-100 pb-2 w-full">La Direction : <span className="text-slate-900 not-italic font-black">{activeClass.directorName || '...'}</span></p>
            <div className="h-24 w-full border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center text-[8px] tracking-[0.3em] opacity-30">Cachet & Signature</div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-10 pt-4 border-t border-slate-100 flex justify-between items-center text-[8px] font-bold text-slate-300 uppercase tracking-widest">
          <p>SudStade Digital Report System v3.0</p>
          <p>Généré le {new Date().toLocaleDateString('fr-FR')} - {new Date().toLocaleTimeString('fr-FR')}</p>
        </div>
      </div>
    </div>
  );
};
