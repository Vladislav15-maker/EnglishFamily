export interface Word {
  id: string;
  english: string;
  russian: string;
  transcription: string; // e.g., "бой"
  audioSrc?: string; // Placeholder for audio functionality
}

export interface Round {
  id: string;
  name: string; 
  words: Word[];
}

export interface Unit {
  id: string;
  name: string; 
  rounds: Round[];
}

export interface User {
  id: string;
  username: string;
  password?: string; // Only for initial setup, not stored long-term
  role: 'teacher' | 'student';
  name: string; 
}

export interface StudentRoundProgress {
  studentId: string;
  unitId: string;
  roundId: string;
  score: number; // percentage
  attempts: { wordId: string; userAnswer: string; correct: boolean }[];
  completed: boolean;
  timestamp: number;
}

export interface OfflineTestScore {
  id: string;
  studentId: string;
  teacherId: string;
  score: 2 | 3 | 4 | 5;
  notes?: string;
  date: string; // ISO date string
}

export interface AuthenticatedUser extends User {
  // any additional fields for an authenticated user
}
