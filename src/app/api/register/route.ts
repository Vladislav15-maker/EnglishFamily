
import { NextResponse } from 'next/server';
import { createUserInDb } from '@/lib/store';
import * as z from 'zod';

// Schema for registration validation using Zod
const registerSchema = z.object({
  name: z.string().min(2, "Имя должно содержать не менее 2 символов"),
  username: z.string().min(3, "Имя пользователя должно содержать не менее 3 символов").regex(/^[a-zA-Z0-9_]+$/, "Имя пользователя может содержать только буквы, цифры и нижнее подчеркивание"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
  role: z.enum(['student', 'teacher']),
  // email: z.string().email("Некорректный email адрес").optional(), // Optional email
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = registerSchema.safeParse(body);

    if (!validation.success) {
      // Return detailed validation errors
      return NextResponse.json({ error: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, username, password, role } = validation.data;

    // Attempt to create user in the database
    const newUser = await createUserInDb({
      name,
      username,
      passwordPlain: password, // Pass plain password to be hashed in store function
      role,
      // email: validation.data.email,
    });

    if (newUser) {
      // Exclude password_hash from the response
      const { password_hash, ...userWithoutPassword } = newUser;
      return NextResponse.json(userWithoutPassword, { status: 201 });
    } else {
      // This case should ideally be caught by specific error handling below
      return NextResponse.json({ error: 'Не удалось создать пользователя. Возможно, имя пользователя уже занято.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Registration API error:', error);
    if (error instanceof z.ZodError) { // Should be caught by safeParse, but as a fallback
        return NextResponse.json({ error: error.flatten().fieldErrors }, { status: 400 });
    }
    // Check for PostgreSQL unique violation error for username or email
    if (error.code === '23505') { // PostgreSQL unique_violation error code
      if (error.constraint_name && error.constraint_name.includes('username')) {
        return NextResponse.json({ error: { username: ['Имя пользователя уже занято.'] } }, { status: 409 });
      }
      if (error.constraint_name && error.constraint_name.includes('email')) {
         return NextResponse.json({ error: { email: ['Email уже используется.'] } }, { status: 409 });
      }
      return NextResponse.json({ error: 'Пользователь с такими данными уже существует.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Произошла ошибка на сервере' }, { status: 500 });
  }
}
