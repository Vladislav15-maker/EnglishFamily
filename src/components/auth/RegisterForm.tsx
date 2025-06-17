
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, UserPlus, LogIn } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Zod schema for form validation
const registerSchema = z.object({
  name: z.string().min(2, "Имя должно содержать не менее 2 символов"),
  username: z.string().min(3, "Имя пользователя должно содержать не менее 3 символов").regex(/^[a-zA-Z0-9_]+$/, "Имя пользователя может содержать только буквы, цифры и нижнее подчеркивание"),
  password: z.string().min(6, "Пароль должен содержать не менее 6 символов"),
  role: z.enum(['student', 'teacher'], { required_error: "Выберите роль" }),
  // email: z.string().email("Некорректный email адрес").optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      role: undefined, // Let the placeholder show
      // email: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Регистрация успешна',
          description: 'Теперь вы можете войти в систему.',
          variant: 'default'
        });
        router.push('/'); // Redirect to login page after successful registration
      } else {
        // Handle errors from the API, including Zod validation errors from the backend
        if (result.error && typeof result.error === 'object' && !Array.isArray(result.error)) {
            // If error is an object (likely from Zod fieldErrors or specific constraint violation)
            const fieldErrors = result.error as Record<string, string[]>;
            let description = 'Пожалуйста, проверьте введенные данные.';
            // Display the first field-specific error, if any
            const firstErrorKey = Object.keys(fieldErrors)[0];
            if (firstErrorKey && fieldErrors[firstErrorKey].length > 0) {
                description = fieldErrors[firstErrorKey][0];
            }
             toast({
                title: 'Ошибка регистрации',
                description: description,
                variant: 'destructive',
            });
        } else {
             toast({
                title: 'Ошибка регистрации',
                description: result.error || 'Не удалось зарегистрироваться. Пожалуйста, попробуйте еще раз.',
                variant: 'destructive',
            });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: 'Ошибка регистрации',
        description: 'Произошла непредвиденная ошибка.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary to-accent p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <UserPlus className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">Регистрация</CardTitle>
          <CardDescription>Создайте новый аккаунт EnglishCourse</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Полное имя</FormLabel>
                    <FormControl>
                      <Input placeholder="например, Иван Иванов" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя пользователя (логин)</FormLabel>
                    <FormControl>
                      <Input placeholder="например, ivan123" {...field} autoComplete="username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="********"
                          {...field}
                          autoComplete="new-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Роль</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите вашу роль" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Ученик</SelectItem>
                        <SelectItem value="teacher">Учитель</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Optional Email Field
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (необязательно)</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="user@example.com" {...field} autoComplete="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              */}
              <Button type="submit" className="w-full text-lg py-3 mt-2" disabled={isLoading}>
                {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Button>
            </CardContent>
          </form>
        </Form>
        <CardFooter className="flex flex-col items-center space-y-2 pt-4">
          <p className="text-sm text-muted-foreground">Уже есть аккаунт?</p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <LogIn className="mr-2 h-4 w-4" />
              Войти
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
