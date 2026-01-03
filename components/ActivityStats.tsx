
import React from 'react';
import { HabitEntry, HabitType, User } from '../types';

interface ActivityStatsProps {
  habits: HabitEntry[];
  user: User;
  onEditGoal: () => void;
}

const ActivityStats: React.FC<ActivityStatsProps> = ({ habits, user, onEditGoal }) => {
  const goal = user.goal;
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const thisWeekExercises = habits.filter(h => h.type === HabitType.EXERCISE && h.timestamp >= startOfWeek.getTime()).length;
  const consumedCalories = habits.filter(h => h.type === HabitType.DIET && h.timestamp >= startOfDay).reduce((sum, h) => sum + (h.calories || 0), 0);
  const remainingCalories = user.targetCalories ? Math.max(0, user.targetCalories - consumedCalories) : 0;
  const caloriePercent = user.targetCalories ? Math.min(100, (consumedCalories / user.targetCalories) * 100) : 0;

  const weightEntries = habits.filter(h => h.type === HabitType.WEIGHT && h.weight !== undefined).sort((a, b) => b.timestamp - a.timestamp);
  const currentWeightValue = weightEntries[0]?.weight || user.currentWeight;
  let weightDiff = 0, weightProgressPercent = 0;
  if (goal?.startWeight && goal?.targetWeight && currentWeightValue) {
    weightDiff = currentWeightValue - goal.targetWeight;
    weightProgressPercent = Math.min(100, Math.max(0, ((goal.startWeight - currentWeightValue) / (goal.startWeight - goal.targetWeight)) * 100));
  }

  return (
    <div className="space-y-3 mb-8">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-teal-50 rounded-3xl p-4">
          <div className="flex justify-between mb-1"><span className="text-[9px] font-bold text-teal-400 uppercase tracking-widest">Energy</span><span className="text-[9px] font-bold text-slate-400">あと {Math.round(remainingCalories)}</span></div>
          <div className="text-lg font-bold text-slate-700 mb-1">{Math.round(consumedCalories)} <span className="text-[10px] text-slate-300 font-normal">/ {user.targetCalories || '-'} kcal</span></div>
          <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden"><div className={`h-full bg-teal-400 transition-all duration-1000`} style={{ width: `${caloriePercent}%` }}></div></div>
        </div>
        <div className="bg-white border border-indigo-50 rounded-3xl p-4">
          <div className="flex justify-between mb-1"><span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Weight</span><span className="text-[9px] font-bold text-slate-400">{weightDiff > 0 ? `あと ${weightDiff.toFixed(1)}kg` : '達成'}</span></div>
          <div className="text-lg font-bold text-slate-700 mb-1">{currentWeightValue?.toFixed(1) || '-'} <span className="text-[10px] text-slate-300 font-normal">kg</span></div>
          <div className="h-1 w-full bg-slate-50 rounded-full overflow-hidden"><div className="h-full bg-indigo-400 transition-all duration-1000" style={{ width: `${weightProgressPercent}%` }}></div></div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-[30px] p-5 text-white shadow-xl shadow-rose-100 relative overflow-hidden">
        <div className="relative z-10 flex justify-between items-center">
          <div className="flex-1">
            <h3 className="text-[9px] font-bold text-rose-100 uppercase tracking-widest mb-1">現在の目標</h3>
            <p className="text-sm font-bold truncate pr-4">{goal ? goal.description : "目標プランを作成しましょう"}</p>
          </div>
          <div className="flex space-x-4 shrink-0">
            <div className="text-center">
              <span className="text-[9px] text-rose-100 block">週の運動</span>
              <span className="text-lg font-bold">{thisWeekExercises}<span className="text-[10px] opacity-70 ml-0.5">/{goal?.weeklyFrequency || '-'}</span></span>
            </div>
            <button onClick={onEditGoal} className="bg-white/20 p-2 rounded-xl backdrop-blur-md active:scale-95 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityStats;
