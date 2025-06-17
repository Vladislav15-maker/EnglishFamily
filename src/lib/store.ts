
import { sql } from '@vercel/postgres';
// import bcrypt from 'bcryptjs'; // Hashing is done on user creation, not here. Comparison in NextAuth.
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
    // Важно: id должен быть строкой для NextAuth
    const userIdAsString = typeof user.id === 'string' ? user.id : String(user.id);
    console.log('[Store] User found in DB:', user.username, 'Password hash from DB:', `"${user.password_hash}"`, 'Role:', user.role, 'ID:', userIdAsString);
    return {
      id: userIdAsString,
      username: user.username,
      password_hash: user.password_hash,
      role: user.role as 'teacher' | 'student',
      name: user.name,
      email: user.email,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('[Store] Failed to fetch user by username for auth:', error);
    throw new Error(`Database error fetching user ${username}: ${(error as Error).message}`);
  }
}

// Эта функция больше не нужна, так как регистрация удалена.
// Оставляем ее закомментированной или удаляем, чтобы избежать случайного вызова.
/*
export async function createUserInDb(userData: {
  name: string;
  username: string;
  passwordPlain: string;
  role: 'teacher' | 'student';
  email?: string;
}): Promise<UserForAuth | null> {
  console.warn('[Store] createUserInDb is deprecated and should not be called as registration is removed.');
  // const saltRounds = 10;
  // const passwordHash = await bcrypt.hash(userData.passwordPlain, saltRounds);
  // console.log(`[Store] Hashed password for ${userData.username}: ${passwordHash}`);
  // try {
  //   const result = await sql`
  //     INSERT INTO users (name, username, password_hash, role, email)
  //     VALUES (${userData.name}, ${userData.username}, ${passwordHash}, ${userData.role}, ${userData.email || null})
  //     RETURNING id, username, password_hash, role, name, email, created_at;
  //   `;
  //   if (result.rows.length === 0) return null;
  //   const newUser = result.rows[0];
  //   return {
  //     id: newUser.id,
  //     username: newUser.username,
  //     password_hash: newUser.password_hash,
  //     role: newUser.role as 'teacher' | 'student',
  //     name: newUser.name,
  //     email: newUser.email,
  //     created_at: newUser.created_at
  //   };
  // } catch (error) {
  //   console.error('[Store] Failed to create user in DB:', error);
  //   // Проверяем на ошибку уникальности constraint (например, username или email уже существует)
  //   if ((error as any).code === '23505') { // PostgreSQL unique_violation
  //       // Можно выбросить специфическую ошибку или вернуть null/маркер
  //       console.error('[Store] Unique constraint violation:', (error as any).constraint_name);
  //   }
  //   return null; // Или throw error;
  // }
  return null;
}
*/

export async function findUserById(userId: string): Promise<User | undefined> {
   console.log('[Store] findUserById called for ID:', userId);
   try {
    const result = await sql`SELECT id, username, role, name, email FROM users WHERE id = ${userId};`;
    if (result.rows.length === 0) {
      console.log('[Store] User not found in DB for ID:', userId);
      return undefined;
    }
    const user = result.rows[0];
    // Важно: id должен быть строкой
    const userIdAsString = typeof user.id === 'string' ? user.id : String(user.id);
    return {
        id: userIdAsString,
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
        id: typeof row.id === 'string' ? row.id : String(row.id),
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
        attempts: row.attempts, // JSONB приходит как объект/массив
        completed: row.completed,
        timestamp: Number(row.timestamp)
    };
  } catch (error) {
    console.error('[Store] Failed to get student round progress:', error);
    return undefined;
  }
}

export async function getAllStudentProgress(studentIdFilter: string): Promise<StudentRoundProgress[]> {
  console.log(`[Store] getAllStudentProgress called for studentIdFilter: '${studentIdFilter}' (empty means all)`);
   try {
    let result;
    if (studentIdFilter === '' || !studentIdFilter) {
      result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId'> & {student_id: string, unit_id: string, round_id: string}>`
        SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp
        FROM student_progress;
      `;
    } else {
      result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId'> & {student_id: string, unit_id: string, round_id: string}>`
        SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp
        FROM student_progress WHERE student_id = ${studentIdFilter};
      `;
    }
    return result.rows.map(row => ({
        studentId: row.student_id,
        unitId: row.unit_id,
        roundId: row.round_id,
        score: row.score,
        attempts: row.attempts, // JSONB приходит как объект/массив
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
    const attemptsJson = JSON.stringify(progress.attempts);
    await sql`
      INSERT INTO student_progress (student_id, unit_id, round_id, score, attempts, completed, timestamp)
      VALUES (${progress.studentId}, ${progress.unitId}, ${progress.roundId}, ${progress.score}, ${attemptsJson}, ${progress.completed}, ${timestampToSave})
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
        id: typeof row.id === 'string' ? row.id : String(row.id),
        studentId: row.student_id,
        teacherId: row.teacher_id,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        date: row.date // Предполагается, что date уже строка (TIMESTAMPTZ Postgres -> string)
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
        id: typeof row.id === 'string' ? row.id : String(row.id),
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
        id: typeof row.id === 'string' ? row.id : String(row.id),
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

// Эта функция не нужна для работы с постоянной базой данных.
export function resetStore() {
  console.warn("[Store] resetStore is a no-op when using a persistent database.");
}
