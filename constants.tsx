
import { User, HabitEntry, HabitType } from './types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'ケンタ', avatar: 'https://picsum.photos/seed/kenta/100/100' },
  { id: '2', name: 'サオリ', avatar: 'https://picsum.photos/seed/saori/100/100' },
  { id: '3', name: 'タカシ', avatar: 'https://picsum.photos/seed/takashi/100/100' },
];

// Default user structure for initialization
export const DEFAULT_USER_ID = 'user_' + Math.random().toString(36).substr(2, 9);

export const INITIAL_HABITS: HabitEntry[] = [
  {
    id: 'h1',
    userId: '1',
    userName: 'ケンタ',
    type: HabitType.EXERCISE,
    content: '5kmランニング完走！',
    timestamp: Date.now() - 3600000 * 2,
  },
  {
    id: 'h2',
    userId: '2',
    userName: 'サオリ',
    type: HabitType.DIET,
    content: '今日はサラダ中心のランチにしました🥗',
    timestamp: Date.now() - 3600000 * 5,
  },
  {
    id: 'h3',
    userId: '3',
    userName: 'タカシ',
    type: HabitType.EXERCISE,
    content: 'ジムでスクワット10回3セット！',
    timestamp: Date.now() - 3600000 * 12,
  }
];
