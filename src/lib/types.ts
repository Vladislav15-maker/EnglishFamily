
// Curriculum Types
export interface Word {
  id: string;
  english: string;
  russian: string;
  transcription: string;
  audioSrc?: string;
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

// User and Auth Types
// User type as stored in the database (excluding sensitive info like password_hash for general use)
export interface User {
  id: string;
  username: string;
  role: 'teacher' | 'student';
  name: string;
  email?: string | null; // Email can be optional
  // created_at?: string | Date; // Optional, if you track creation time
}

// User type specifically for NextAuth.js authorize function and DB interaction, includes password_hash
export interface UserForAuth {
  id: string;
  username: string;
  password_hash: string; // Essential for password comparison during login
  role: 'teacher' | 'student';
  name: string;
  email?: string | null;
  created_at?: string | Date; // Optional
}

// User type for the application's AuthContext (what the client-side app sees)
export interface AuthenticatedUser {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  role: 'teacher' | 'student';
}


// Progress and Score Types
export interface StudentRoundProgress {
  studentId: string; // Corresponds to User.id
  unitId: string;
  roundId: string;
  score: number; // Percentage score, e.g., 80 for 80%
  attempts: { wordId: string; userAnswer: string; correct: boolean }[] | any; // 'any' for JSONB from DB, parse as needed
  completed: boolean;
  timestamp: number; // Unix timestamp (milliseconds) or string date representation
}

export interface OfflineTestScore {
  id: string; // Unique ID for the score entry
  studentId: string; // Corresponds to User.id
  teacherId: string; // Corresponds to User.id of the teacher who graded
  score: 2 | 3 | 4 | 5; // Fixed score values
  notes?: string | null; // Optional notes from the teacher
  date: string; // Date of the test/grading, stored as ISO string or similar
}
