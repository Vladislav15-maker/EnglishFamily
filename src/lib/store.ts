// This file mocks a database for user data, progress, and scores.
// Data is persisted in localStorage.
import type { User, StudentRoundProgress, OfflineTestScore } from './types';

// Initial users with plain text passwords for mock purposes.
// In a real app, passwords should be securely hashed.
const initialUsers: User[] = [
  { id: 'teacher-vladislav', username: 'Vladislav', password: 'Vladislav15', role: 'teacher', name: 'Ермилов Владислав' },
  { id: 'student-oksana', username: 'Oksana', password: 'Oksana25', role: 'student', name: 'Юрченко Оксана' },
  { id: 'student-alexander', username: 'Alexander', password: 'Alexander23', role: 'student', name: 'Ермилов Александр' },
];

interface AppData {
  users: User[];
  studentProgress: StudentRoundProgress[];
  offlineScores: OfflineTestScore[];
}

const APP_DATA_STORAGE_KEY = 'englishcourse_app_data';

// Function to get the initial state of the store
const getInitialStore = (): AppData => ({
  users: initialUsers.map(u => ({ ...u })), // Create deep copies to avoid modifying initialUsers
  studentProgress: [],
  offlineScores: [],
});

// Function to load the store from localStorage
const loadStoreFromLocalStorage = (): AppData => {
  if (typeof window !== 'undefined') {
    try {
      const serializedStore = localStorage.getItem(APP_DATA_STORAGE_KEY);
      if (serializedStore) {
        const parsedStore = JSON.parse(serializedStore) as AppData;
        // Basic validation to ensure the loaded data has the expected structure
        if (parsedStore.users && parsedStore.studentProgress && parsedStore.offlineScores) {
          return parsedStore;
        }
      }
    } catch (error) {
      console.error("Failed to load store from localStorage, using initial data:", error);
      // If loading fails, fall through to return the initial store
    }
  }
  return getInitialStore();
};

// Initialize store: load from localStorage or use initial data
let store: AppData = loadStoreFromLocalStorage();

// Function to save the current store state to localStorage
const saveStoreToLocalStorage = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(APP_DATA_STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error("Failed to save store to localStorage:", error);
    }
  }
};


// --- User Functions ---
export async function findUserByUsername(username: string): Promise<User | undefined> {
  // Ensure store.users is used, which might have been loaded from localStorage
  return store.users.find(user => user.username === username);
}

export async function findUserById(userId: string): Promise<User | undefined> {
  return store.users.find(user => user.id === userId);
}

export async function getAllStudents(): Promise<User[]> {
  return store.users.filter(user => user.role === 'student');
}

// --- Progress Functions ---
export async function getStudentRoundProgress(studentId: string, unitId: string, roundId: string): Promise<StudentRoundProgress | undefined> {
  return store.studentProgress.find(
    p => p.studentId === studentId && p.unitId === unitId && p.roundId === roundId
  );
}

export async function getAllStudentProgress(studentId: string): Promise<StudentRoundProgress[]> {
  // If studentId is empty string, return all progress for all students (used in teacher overview)
  if (studentId === '') {
    return [...store.studentProgress];
  }
  return store.studentProgress.filter(p => p.studentId === studentId);
}


export async function saveStudentRoundProgress(progress: StudentRoundProgress): Promise<void> {
  const existingIndex = store.studentProgress.findIndex(
    p => p.studentId === progress.studentId && p.unitId === progress.unitId && p.roundId === progress.roundId
  );
  if (existingIndex > -1) {
    store.studentProgress[existingIndex] = progress;
  } else {
    store.studentProgress.push(progress);
  }
  saveStoreToLocalStorage(); // Save changes
}

// --- Offline Score Functions ---
export async function getOfflineScoresForStudent(studentId: string): Promise<OfflineTestScore[]> {
  return store.offlineScores.filter(score => score.studentId === studentId);
}

export async function getAllOfflineScores(): Promise<OfflineTestScore[]> {
  return [...store.offlineScores];
}

export async function addOfflineScore(score: Omit<OfflineTestScore, 'id' | 'date'>): Promise<OfflineTestScore> {
  const newScore: OfflineTestScore = {
    ...score,
    id: `offline-${Date.now()}-${Math.random().toString(36).substring(2,7)}`,
    date: new Date().toISOString(),
  };
  store.offlineScores.push(newScore);
  saveStoreToLocalStorage(); // Save changes
  return newScore;
}

// Helper to reset store for testing or demonstration
export function resetStore() {
  store = getInitialStore(); // Reset in-memory store to initial state
  saveStoreToLocalStorage(); // Persist the reset (initial) state to localStorage
}
