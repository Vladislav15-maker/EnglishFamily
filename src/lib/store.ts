
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import type { User, StudentRoundProgress, OfflineTestScore, UserForAuth } from './types';

// Function to fetch user details for NextAuth.js authorization
export async function getUserByUsernameForAuth(username: string): Promise<UserForAuth | null> {
  try {
    const result = await sql`
      SELECT id, username, password_hash, role, name, email FROM users WHERE username = ${username};
    `;
    if (result.rows.length === 0) {
      return null;
    }
    // Ensure the returned object matches the UserForAuth type
    const user = result.rows[0];
    return {
      id: user.id,
      username: user.username,
      password_hash: user.password_hash,
      role: user.role as 'teacher' | 'student',
      name: user.name,
      email: user.email,
      created_at: user.created_at // if you have this column and type
    };
  } catch (error) {
    console.error('Failed to fetch user by username for auth:', error);
    // It's important to return null or throw an error that NextAuth can handle
    return null;
  }
}

// Function to create a new user in the database (called from /api/register)
export async function createUserInDb(userData: {
  name: string;
  username: string;
  passwordPlain: string;
  role: 'teacher' | 'student';
  email?: string; // Optional email
}): Promise<UserForAuth | null> {
  const saltRounds = 10; // Cost factor for hashing
  const passwordHash = await bcrypt.hash(userData.passwordPlain, saltRounds);
  try {
    // Insert new user into the database
    const result = await sql`
      INSERT INTO users (username, password_hash, name, role, email)
      VALUES (${userData.username}, ${passwordHash}, ${userData.name}, ${userData.role}, ${userData.email || null})
      RETURNING id, username, name, role, email, password_hash, created_at; 
    `;
    // Return the newly created user (excluding password_hash in actual response if not needed by caller)
    return result.rows[0] as UserForAuth;
  } catch (error) {
    console.error('Failed to create user in DB:', error);
    // Rethrow the error so the API route can handle specific DB errors (like unique constraint violation)
    throw error; 
  }
}

// Function to find a user by ID (general purpose)
export async function findUserById(userId: string): Promise<User | undefined> {
   try {
    const result = await sql`SELECT id, username, role, name, email FROM users WHERE id = ${userId};`;
    if (result.rows.length === 0) return undefined;
    const user = result.rows[0];
    return {
        id: user.id,
        username: user.username,
        role: user.role as 'teacher' | 'student',
        name: user.name,
        email: user.email
    };
  } catch (error) {
    console.error('Failed to find user by id:', error);
    return undefined;
  }
}

// Function to get all students (for teacher dashboard)
export async function getAllStudents(): Promise<User[]> {
  try {
    const result = await sql`SELECT id, username, role, name, email FROM users WHERE role = 'student';`;
    return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        role: row.role as 'teacher' | 'student', // Ensure correct type casting
        name: row.name,
        email: row.email
    }));
  } catch (error) {
    console.error('Failed to get all students:', error);
    return [];
  }
}

// --- Progress Functions ---
// These will need to be updated to use Vercel Postgres once tables are created

export async function getStudentRoundProgress(studentId: string, unitId: string, roundId: string): Promise<StudentRoundProgress | undefined> {
  // Placeholder - to be implemented with Vercel Postgres
  console.warn(`getStudentRoundProgress for ${studentId}, ${unitId}, ${roundId} not implemented with DB yet.`);
  try {
    const result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId'> & {student_id: string, unit_id: string, round_id: string}>`
      SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp
      FROM student_progress
      WHERE student_id = ${studentId} AND unit_id = ${unitId} AND round_id = ${roundId};
    `;
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    return {
        studentId: row.student_id,
        unitId: row.unit_id,
        roundId: row.round_id,
        score: row.score,
        attempts: row.attempts, // Already JSONB, should be fine
        completed: row.completed,
        timestamp: Number(row.timestamp) 
    };
  } catch (error) {
    console.error('Failed to get student round progress:', error);
    return undefined;
  }
}

export async function getAllStudentProgress(studentId: string): Promise<StudentRoundProgress[]> {
  // Placeholder - to be implemented with Vercel Postgres
  console.warn(`getAllStudentProgress for ${studentId} not implemented with DB yet.`);
   try {
    let result;
    // If studentId is an empty string, fetch for all students (for teacher overview)
    // Otherwise, fetch for the specific studentId
    if (studentId === '') { 
      result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId'> & {student_id: string, unit_id: string, round_id: string}>`
        SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp
        FROM student_progress;
      `;
    } else {
      result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId'> & {student_id: string, unit_id: string, round_id: string}>`
        SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp
        FROM student_progress WHERE student_id = ${studentId};
      `;
    }
    return result.rows.map(row => ({
        studentId: row.student_id,
        unitId: row.unit_id,
        roundId: row.round_id,
        score: row.score,
        attempts: row.attempts, // Already JSONB
        completed: row.completed,
        timestamp: Number(row.timestamp)
    }));
  } catch (error) {
    console.error('Failed to get all student progress:', error);
    return [];
  }
}


export async function saveStudentRoundProgress(progress: StudentRoundProgress): Promise<void> {
  // Placeholder - to be implemented with Vercel Postgres
  console.warn(`saveStudentRoundProgress for ${progress.studentId} not implemented with DB yet.`);
  try {
    // Ensure timestamp is a number (milliseconds since epoch) for consistent storage
    const timestampToSave = typeof progress.timestamp === 'number' ? progress.timestamp : new Date(progress.timestamp).getTime();

    await sql`
      INSERT INTO student_progress (student_id, unit_id, round_id, score, attempts, completed, timestamp)
      VALUES (${progress.studentId}, ${progress.unitId}, ${progress.roundId}, ${progress.score}, ${JSON.stringify(progress.attempts)}, ${progress.completed}, ${timestampToSave})
      ON CONFLICT (student_id, unit_id, round_id)
      DO UPDATE SET
        score = EXCLUDED.score,
        attempts = EXCLUDED.attempts,
        completed = EXCLUDED.completed,
        timestamp = EXCLUDED.timestamp;
    `;
  } catch (error) {
    console.error('Failed to save student round progress:', error);
    throw error;
  }
}


// --- Offline Test Score Functions ---
// These will need to be updated to use Vercel Postgres once tables are created

export async function getOfflineScoresForStudent(studentId: string): Promise<OfflineTestScore[]> {
  // Placeholder - to be implemented with Vercel Postgres
  console.warn(`getOfflineScoresForStudent for ${studentId} not implemented with DB yet.`);
   try {
    const result = await sql<Omit<OfflineTestScore, 'studentId' | 'teacherId'> & {student_id: string, teacher_id: string}>`
      SELECT id, student_id, teacher_id, score, notes, date
      FROM offline_scores WHERE student_id = ${studentId} ORDER BY date DESC;
    `;
    return result.rows.map(row => ({
        id: row.id,
        studentId: row.student_id,
        teacherId: row.teacher_id,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        date: row.date // Already a string from DB (TIMESTAMPTZ)
    }));
  } catch (error) {
    console.error('Failed to get offline scores for student:', error);
    return [];
  }
}

export async function getAllOfflineScores(): Promise<OfflineTestScore[]> {
  // Placeholder - to be implemented with Vercel Postgres
  console.warn(`getAllOfflineScores not implemented with DB yet.`);
  try {
    const result = await sql<Omit<OfflineTestScore, 'studentId' | 'teacherId'> & {student_id: string, teacher_id: string}>`
      SELECT id, student_id, teacher_id, score, notes, date
      FROM offline_scores ORDER BY date DESC;
    `;
    return result.rows.map(row => ({
        id: row.id,
        studentId: row.student_id,
        teacherId: row.teacher_id,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        date: row.date
    }));
  } catch (error) {
    console.error('Failed to get all offline scores:', error);
    return [];
  }
}

export async function addOfflineScore(scoreData: Omit<OfflineTestScore, 'id' | 'date'>): Promise<OfflineTestScore> {
  // Placeholder - to be implemented with Vercel Postgres
  console.warn(`addOfflineScore for student ${scoreData.studentId} not implemented with DB yet.`);
  const currentDate = new Date().toISOString(); // Store date as ISO string
  try {
    const result = await sql`
      INSERT INTO offline_scores (student_id, teacher_id, score, notes, date)
      VALUES (${scoreData.studentId}, ${scoreData.teacherId}, ${scoreData.score}, ${scoreData.notes || null}, ${currentDate})
      RETURNING id, student_id, teacher_id, score, notes, date;
    `;
    const row = result.rows[0];
    return {
        id: row.id,
        studentId: row.student_id,
        teacherId: row.teacher_id,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        date: row.date
    };
  } catch (error) {
    console.error('Failed to add offline score:', error);
    throw error;
  }
}


// Mock reset function, as localStorage is no longer the primary store
// In a real DB scenario, reset would involve TRUNCATE or DELETE operations (use with caution)
export function resetStore() {
  console.warn("resetStore is a no-op when using a persistent database like Vercel Postgres.");
  // If you had any in-memory caches or states managed here that aren't DB-related,
  // you could reset them. But for DB data, this function should not delete it
  // without explicit, careful consideration.
}
