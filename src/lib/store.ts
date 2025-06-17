
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import type { User, StudentRoundProgress, OfflineTestScore, UserForAuth } from './types';

export async function getUserByUsernameForAuth(username: string): Promise<UserForAuth | null> {
  console.log('[Store] getUserByUsernameForAuth called for username:', username);
  try {
    const result = await sql`
      SELECT id, username, password_hash, role, name, email, created_at FROM users WHERE username = ${username};
    `;
    if (result.rows.length === 0) {
      console.log('[Store] User not found in DB for username:', username);
      return null;
    }
    const user = result.rows[0];
    console.log('[Store] User found in DB:', user.username, 'Role:', user.role);
    return {
      id: user.id,
      username: user.username,
      password_hash: user.password_hash,
      role: user.role as 'teacher' | 'student',
      name: user.name,
      email: user.email,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('[Store] Failed to fetch user by username for auth:', error);
    // Вместо возврата null, можно выбросить ошибку, чтобы она была поймана выше.
    // Это поможет лучше диагностировать проблемы с БД.
    throw new Error(`Database error fetching user ${username}: ${(error as Error).message}`);
  }
}

// Эта функция больше не нужна, так как регистрация удаляется.
// Если она где-то вызывается, это нужно будет убрать.
// export async function createUserInDb(userData: {
//   name: string;
//   username: string;
//   passwordPlain: string;
//   role: 'teacher' | 'student';
//   email?: string;
// }): Promise<UserForAuth | null> {
//   console.warn('[Store] createUserInDb is deprecated as registration is removed.');
//   return null;
// }


export async function findUserById(userId: string): Promise<User | undefined> {
   console.log('[Store] findUserById called for ID:', userId);
   try {
    const result = await sql`SELECT id, username, role, name, email FROM users WHERE id = ${userId};`;
    if (result.rows.length === 0) {
      console.log('[Store] User not found in DB for ID:', userId);
      return undefined;
    }
    const user = result.rows[0];
    return {
        id: user.id,
        username: user.username,
        role: user.role as 'teacher' | 'student',
        name: user.name,
        email: user.email
    };
  } catch (error) {
    console.error('[Store] Failed to find user by id:', error);
    return undefined;
  }
}

export async function getAllStudents(): Promise<User[]> {
  console.log('[Store] getAllStudents called');
  try {
    const result = await sql`SELECT id, username, role, name, email FROM users WHERE role = 'student';`;
    return result.rows.map(row => ({
        id: row.id,
        username: row.username,
        role: row.role as 'teacher' | 'student',
        name: row.name,
        email: row.email
    }));
  } catch (error) {
    console.error('[Store] Failed to get all students:', error);
    return [];
  }
}

export async function getStudentRoundProgress(studentId: string, unitId: string, roundId: string): Promise<StudentRoundProgress | undefined> {
  console.log(`[Store] getStudentRoundProgress for student ${studentId}, unit ${unitId}, round ${roundId}`);
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
        attempts: row.attempts,
        completed: row.completed,
        timestamp: Number(row.timestamp) 
    };
  } catch (error) {
    console.error('[Store] Failed to get student round progress:', error);
    return undefined;
  }
}

export async function getAllStudentProgress(studentId: string): Promise<StudentRoundProgress[]> {
  console.log(`[Store] getAllStudentProgress called for studentId: '${studentId}' (empty means all)`);
   try {
    let result;
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
        attempts: row.attempts,
        completed: row.completed,
        timestamp: Number(row.timestamp)
    }));
  } catch (error) {
    console.error('[Store] Failed to get all student progress:', error);
    return [];
  }
}


export async function saveStudentRoundProgress(progress: StudentRoundProgress): Promise<void> {
  console.log(`[Store] saveStudentRoundProgress for student ${progress.studentId}, unit ${progress.unitId}, round ${progress.roundId}`);
  try {
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
    console.error('[Store] Failed to save student round progress:', error);
    throw error;
  }
}


export async function getOfflineScoresForStudent(studentId: string): Promise<OfflineTestScore[]> {
  console.log(`[Store] getOfflineScoresForStudent for student ${studentId}`);
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
        date: row.date
    }));
  } catch (error) {
    console.error('[Store] Failed to get offline scores for student:', error);
    return [];
  }
}

export async function getAllOfflineScores(): Promise<OfflineTestScore[]> {
  console.log('[Store] getAllOfflineScores called');
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
    console.error('[Store] Failed to get all offline scores:', error);
    return [];
  }
}

export async function addOfflineScore(scoreData: Omit<OfflineTestScore, 'id' | 'date'>): Promise<OfflineTestScore> {
  console.log(`[Store] addOfflineScore for student ${scoreData.studentId} by teacher ${scoreData.teacherId}`);
  const currentDate = new Date().toISOString();
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
    console.error('[Store] Failed to add offline score:', error);
    throw error;
  }
}

export function resetStore() {
  console.warn("[Store] resetStore is a no-op when using a persistent database.");
}
