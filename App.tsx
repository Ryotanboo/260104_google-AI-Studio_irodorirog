
import React, { useState, useEffect, useMemo } from 'react';
import { HabitEntry, HabitType, User, DietTag, HabitGoal, Gender, ActivityLevel, GoalMode } from './types';
import { INITIAL_HABITS, DEFAULT_USER_ID } from './constants';
import HabitCard from './components/HabitCard';
import ActivityStats from './components/ActivityStats';
import { analyzeHabit, generateCheer } from './services/geminiService';

type ViewMode = 'EVERYONE' | 'MINE';

const App: React.FC = () => {
  const [habits, setHabits] = useState<HabitEntry[]>(INITIAL_HABITS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newContent, setNewContent] = useState('');
  const [weightValue, setWeightValue] = useState('');
  const [selectedType, setSelectedType] = useState<HabitType>(HabitType.EXERCISE);
  const [selectedDietTag, setSelectedDietTag] = useState<DietTag>(DietTag.LUNCH);
  const [aiMessage, setAiMessage] = useState('あなたの「いろどり」を記録しましょう🌿');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cheeringId, setCheeringId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('EVERYONE');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSettingGoal, setIsSettingGoal] = useState(false);

  // Profile Form
  const [profName, setProfName] = useState('');
  const [profHeight, setProfHeight] = useState('');
  const [profWeight, setProfWeight] = useState('');
  const [profAge, setProfAge] = useState('');
  const [profGender, setProfGender] = useState<Gender>(Gender.FEMALE);
  const [profActivity, setProfActivity] = useState<ActivityLevel>(ActivityLevel.SEDENTARY);
  const [profGoalMode, setProfGoalMode] = useState<GoalMode>(GoalMode.LOSE);

  // Goal Form
  const [goalDesc, setGoalDesc] = useState('');
  const [goalFreq, setGoalFreq] = useState('3');
  const [goalDate, setGoalDate] = useState('');
  const [targetWeight, setTargetWeight] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('irodori_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      setProfName(parsed.name);
      setProfHeight(parsed.height?.toString() || '');
      setProfWeight(parsed.currentWeight?.toString() || '');
      setProfAge(parsed.age?.toString() || '');
      setProfGender(parsed.gender || Gender.FEMALE);
      setProfActivity(parsed.activityLevel || ActivityLevel.SEDENTARY);
      setProfGoalMode(parsed.goalMode || GoalMode.LOSE);
    }
    const savedHabits = localStorage.getItem('habitshare_data_v2');
    if (savedHabits) {
      try { setHabits(JSON.parse(savedHabits)); } catch (e) { setHabits(INITIAL_HABITS); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('habitshare_data_v2', JSON.stringify(habits));
  }, [habits]);

  useEffect(() => {
    if (currentUser) localStorage.setItem('irodori_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const handleCheer = async (habitId: string) => {
    if (!currentUser) return;
    setCheeringId(habitId);
    const targetHabit = habits.find(h => h.id === habitId);
    if (targetHabit) {
      const cheerText = await generateCheer(targetHabit, currentUser.name);
      setHabits(prev => prev.map(h => 
        h.id === habitId 
          ? { ...h, cheerMessages: [...(h.cheerMessages || []), { userName: currentUser.name, text: cheerText }] }
          : h
      ));
    }
    setCheeringId(null);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profName.trim()) return;
    const h = parseFloat(profHeight), w = parseFloat(profWeight), a = parseInt(profAge);
    
    let bmr = (10 * w) + (6.25 * h) - (5 * a);
    bmr += (profGender === Gender.MALE ? 5 : profGender === Gender.FEMALE ? -161 : -78);
    const mult = { [ActivityLevel.SEDENTARY]: 1.2, [ActivityLevel.LIGHT]: 1.375, [ActivityLevel.MODERATE]: 1.55, [ActivityLevel.ACTIVE]: 1.725, [ActivityLevel.ATHLETE]: 1.9 };
    let tdee = bmr * mult[profActivity];
    if (profGoalMode === GoalMode.LOSE) tdee -= 500; else if (profGoalMode === GoalMode.GAIN) tdee += 500;

    const updatedUser: User = {
      ...currentUser,
      id: currentUser?.id || DEFAULT_USER_ID,
      name: profName,
      avatar: `https://picsum.photos/seed/${profName}/100/100`,
      height: h, currentWeight: w, age: a,
      gender: profGender, activityLevel: profActivity, goalMode: profGoalMode,
      targetCalories: Math.round(tdee),
    };
    setCurrentUser(updatedUser);
    setIsEditingProfile(false);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !goalDesc || !goalDate) return;
    setCurrentUser({
      ...currentUser,
      goal: { description: goalDesc, weeklyFrequency: parseInt(goalFreq), deadline: new Date(goalDate).getTime(), startWeight: currentUser.currentWeight, targetWeight: parseFloat(targetWeight) }
    });
    setIsSettingGoal(false);
    setAiMessage(`目標「${goalDesc}」に向けてスタートですね！🌈`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsGenerating(true);
    const newHabit: HabitEntry = {
      id: Date.now().toString(), userId: currentUser.id, userName: currentUser.name,
      type: selectedType, content: newContent || (selectedType === HabitType.WEIGHT ? '体重を測りました' : ''),
      timestamp: Date.now(), weight: selectedType === HabitType.WEIGHT ? parseFloat(weightValue) : undefined,
      ...(selectedType === HabitType.DIET ? { dietTag: selectedDietTag } : {}),
      cheerMessages: []
    };
    try {
      const analysis = await analyzeHabit(newHabit, habits, currentUser);
      setHabits(prev => [{ ...newHabit, calories: analysis.estimatedCalories }, ...prev]);
      setAiMessage(analysis.message);
      setNewContent(''); setWeightValue('');
    } catch (e) { setHabits(prev => [newHabit, ...prev]); }
    finally { setIsGenerating(false); }
  };

  const displayedHabits = useMemo(() => {
    if (viewMode === 'MINE' && currentUser) return habits.filter(h => h.userId === currentUser.id);
    return habits.filter(h => h.type !== HabitType.WEIGHT);
  }, [habits, viewMode, currentUser]);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#fff9fa] relative pb-64">
      {isSettingGoal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">目標をきめる</h2>
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <input required value={goalDesc} onChange={e => setGoalDesc(e.target.value)} placeholder="例: 3kg減量、毎日歩く" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.1" value={targetWeight} onChange={e => setTargetWeight(e.target.value)} placeholder="目標体重(kg)" className="bg-indigo-50/30 border border-indigo-50 rounded-2xl px-5 py-4 text-sm" />
                <input type="number" value={goalFreq} onChange={e => setGoalFreq(e.target.value)} placeholder="運動回数/週" className="bg-rose-50/30 border border-rose-50 rounded-2xl px-5 py-4 text-sm" />
              </div>
              <input required type="date" value={goalDate} onChange={e => setGoalDate(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm" />
              <button type="submit" className="w-full bg-rose-500 text-white font-bold py-4 rounded-2xl shadow-lg">目標を保存</button>
              <button type="button" onClick={() => setIsSettingGoal(false)} className="w-full text-slate-400 text-xs font-bold">戻る</button>
            </form>
          </div>
        </div>
      )}

      {(!currentUser || isEditingProfile) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[40px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">プロフィール</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">パーソナライズ設定</p>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <input required value={profName} onChange={e => setProfName(e.target.value)} placeholder="お名前" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-sm" />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={profHeight} onChange={e => setProfHeight(e.target.value)} placeholder="身長" className="bg-slate-50 border border-slate-100 rounded-2xl px-2 py-4 text-xs text-center" />
                <input type="number" step="0.1" value={profWeight} onChange={e => setProfWeight(e.target.value)} placeholder="体重" className="bg-slate-50 border border-slate-100 rounded-2xl px-2 py-4 text-xs text-center" />
                <input type="number" value={profAge} onChange={e => setProfAge(e.target.value)} placeholder="年齢" className="bg-slate-50 border border-slate-100 rounded-2xl px-2 py-4 text-xs text-center" />
              </div>
              <select value={profActivity} onChange={e => setProfActivity(e.target.value as ActivityLevel)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-xs font-bold text-slate-600 outline-none">
                {Object.values(ActivityLevel).map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="flex space-x-2">
                {Object.values(GoalMode).map(m => (
                  <button key={m} type="button" onClick={() => setProfGoalMode(m)} className={`flex-1 py-2 text-[11px] font-bold rounded-xl border ${profGoalMode === m ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-slate-400 border-slate-100'}`}>{m}</button>
                ))}
              </div>
              <button type="submit" className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg mt-4">設定を完了する</button>
            </form>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md px-6 py-6 sticky top-0 z-40 border-b border-rose-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center">
            <span className="bg-gradient-to-br from-rose-400 to-pink-500 text-white p-2 rounded-xl mr-3 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </span>
            いろどりログ
          </h1>
          <button onClick={() => setIsEditingProfile(true)} className="bg-rose-50 px-3 py-1.5 rounded-full border border-rose-100 text-[10px] font-bold text-rose-400">{currentUser?.name}</button>
        </div>
        
        <div className="bg-rose-50/50 border border-rose-100 p-4 rounded-2xl relative overflow-hidden transition-all">
          <p className={`text-sm text-rose-800 font-medium leading-relaxed ${isGenerating ? 'opacity-40 animate-pulse' : ''}`}>✨ {aiMessage}</p>
          {isGenerating && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-200 overflow-hidden"><div className="h-full bg-rose-400 animate-[shimmer_1.5s_infinite]"></div></div>}
        </div>

        <div className="flex mt-6 bg-rose-50/30 p-1 rounded-2xl">
          <button onClick={() => setViewMode('EVERYONE')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === 'EVERYONE' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300'}`}>みんなのログ</button>
          <button onClick={() => setViewMode('MINE')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${viewMode === 'MINE' ? 'bg-white text-rose-500 shadow-sm' : 'text-rose-300'}`}>わたしのログ</button>
        </div>
      </header>

      <main className="p-6">
        {viewMode === 'MINE' && currentUser && <ActivityStats habits={habits.filter(h => h.userId === currentUser.id)} user={currentUser} onEditGoal={() => setIsSettingGoal(true)} />}
        <div className="space-y-4">
          {displayedHabits.map(habit => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              onCheer={handleCheer}
              isCheering={cheeringId === habit.id}
            />
          ))}
          {displayedHabits.length === 0 && <div className="text-center py-20 opacity-30 text-xs font-bold text-slate-400">記録がありません</div>}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-rose-50 p-5 max-w-md mx-auto rounded-t-[40px] shadow-2xl z-50">
        <form onSubmit={handleSubmit} className="flex flex-col space-y-3">
          <div className="flex space-x-2">
            <button type="button" onClick={() => setSelectedType(HabitType.EXERCISE)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold ${selectedType === HabitType.EXERCISE ? 'bg-rose-500 text-white shadow-md' : 'bg-rose-50/50 text-rose-400'}`}>🏃‍♀️ 運動</button>
            <button type="button" onClick={() => setSelectedType(HabitType.DIET)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold ${selectedType === HabitType.DIET ? 'bg-teal-500 text-white shadow-md' : 'bg-teal-50/50 text-teal-500'}`}>🥗 食事</button>
            <button type="button" onClick={() => setSelectedType(HabitType.WEIGHT)} className={`flex-1 py-2 rounded-xl text-[11px] font-bold ${selectedType === HabitType.WEIGHT ? 'bg-indigo-500 text-white shadow-md' : 'bg-indigo-50/50 text-indigo-400'}`}>⚖️ 体重</button>
          </div>
          {selectedType === HabitType.DIET && (
            <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {Object.values(DietTag).map(tag => (
                <button key={tag} type="button" onClick={() => setSelectedDietTag(tag)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border ${selectedDietTag === tag ? 'bg-teal-50 border-teal-200 text-teal-600' : 'bg-white border-slate-100 text-slate-400'}`}>{tag}</button>
              ))}
            </div>
          )}
          <div className="flex space-x-3 items-end">
            {selectedType === HabitType.WEIGHT ? (
              <div className="flex-1 flex items-center space-x-2 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 focus-within:bg-white focus-within:border-indigo-100 transition-all">
                <input type="number" step="0.1" value={weightValue} onChange={(e) => setWeightValue(e.target.value)} placeholder="体重(kg)" className="w-20 bg-transparent text-sm font-bold text-indigo-600 outline-none" />
                <input type="text" value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="メモ" className="flex-1 bg-transparent text-xs text-slate-600 outline-none" />
              </div>
            ) : (
              <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={selectedType === HabitType.EXERCISE ? "何をしましたか？" : "何を食べましたか？"} className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-sm outline-none resize-none min-h-[56px] max-h-[120px] focus:bg-white focus:border-rose-100 transition-all" rows={2} />
            )}
            <button type="submit" disabled={isGenerating} className="bg-gradient-to-tr from-rose-400 to-pink-500 text-white w-12 h-12 mb-1 rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform disabled:opacity-30">
              {isGenerating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
