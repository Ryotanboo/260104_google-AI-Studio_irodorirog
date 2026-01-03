
export enum HabitType {
  EXERCISE = 'EXERCISE',
  DIET = 'DIET',
  WEIGHT = 'WEIGHT'
}

export enum DietTag {
  BREAKFAST = '朝食',
  LUNCH = '昼食',
  DINNER = '夕食',
  SNACK = '間食'
}

export enum Gender {
  MALE = '男性',
  FEMALE = '女性',
  OTHER = 'その他'
}

export enum ActivityLevel {
  SEDENTARY = '座り仕事が多い',
  LIGHT = '立ち仕事・軽い運動',
  MODERATE = 'よく動く・週2-3の運動',
  ACTIVE = '活発・毎日の運動',
  ATHLETE = 'ハードなトレーニング'
}

export enum GoalMode {
  LOSE = '減量',
  MAINTAIN = '維持',
  GAIN = '増量'
}

export interface HabitGoal {
  description: string;
  deadline: number; // timestamp
  weeklyFrequency?: number;
  startWeight?: number;
  targetWeight?: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  goal?: HabitGoal;
  height?: number;
  currentWeight?: number;
  age?: number;
  gender?: Gender;
  activityLevel?: ActivityLevel;
  goalMode?: GoalMode;
  targetCalories?: number;
}

export interface HabitEntry {
  id: string;
  userId: string;
  userName: string;
  type: HabitType;
  content: string;
  timestamp: number;
  dietTag?: DietTag;
  calories?: number;
  weight?: number;
  cheerMessages?: { userName: string, text: string }[];
}
