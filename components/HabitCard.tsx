
import React from 'react';
import { HabitEntry, HabitType } from '../types';

interface HabitCardProps {
  habit: HabitEntry;
  onCheer?: (habitId: string) => void;
  isCheering?: boolean;
}

const HabitCard: React.FC<HabitCardProps> = ({ habit, onCheer, isCheering }) => {
  const isExercise = habit.type === HabitType.EXERCISE;
  const isWeight = habit.type === HabitType.WEIGHT;
  const isDiet = habit.type === HabitType.DIET;
  
  const timeStr = new Date(habit.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`bg-white rounded-3xl p-5 shadow-sm border mb-4 transition-all hover:shadow-md ${isWeight ? 'border-indigo-100 bg-indigo-50/5' : 'border-rose-50'}`}>
      <div className="flex items-start space-x-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 
          ${isExercise ? 'bg-rose-100 text-rose-500' : 
            isWeight ? 'bg-indigo-100 text-indigo-600' : 
            'bg-teal-50 text-teal-600'}`}>
          {isExercise ? '🏃‍♀️' : isWeight ? '⚖️' : '🥗'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 truncate">
              <span className="font-bold text-slate-700 text-sm truncate">{habit.userName}</span>
              {isWeight && (
                <span className="inline-flex items-center text-[9px] text-indigo-400 bg-indigo-50 px-1.5 py-0.5 rounded-md font-bold shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Private
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-300 font-medium shrink-0">{timeStr}</span>
          </div>
          
          <p className="text-slate-600 text-sm leading-relaxed mb-3">
            {isWeight ? `${habit.weight} kg ${habit.content ? `- ${habit.content}` : ''}` : habit.content}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1.5">
              {habit.dietTag && (
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                  {habit.dietTag}
                </span>
              )}
              {habit.calories && habit.calories > 0 && (
                <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                  🔥 {habit.calories} kcal
                </span>
              )}
            </div>

            {!isWeight && (
              <button 
                onClick={() => onCheer && onCheer(habit.id)}
                disabled={isCheering}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all
                  ${isCheering ? 'bg-rose-50 text-rose-300' : 'bg-rose-50 text-rose-500 active:scale-90 hover:bg-rose-100'}`}
              >
                <span>{isCheering ? '...' : '👏 応援する'}</span>
                {habit.cheerMessages && habit.cheerMessages.length > 0 && (
                  <span className="ml-1 bg-rose-500 text-white px-1.5 rounded-full text-[8px]">{habit.cheerMessages.length}</span>
                )}
              </button>
            )}
          </div>

          {habit.cheerMessages && habit.cheerMessages.length > 0 && (
            <div className="mt-3 space-y-2">
              {habit.cheerMessages.map((msg, i) => (
                <div key={i} className="bg-rose-50/50 rounded-2xl p-2.5 text-[11px] text-rose-700 animate-in slide-in-from-left-2">
                  <span className="font-bold mr-2">{msg.userName}:</span>
                  {msg.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HabitCard;
