
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth(); // login from AuthContext now uses NextAuth's signIn
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // login function from AuthContext now calls NextAuth's signIn
      const result = await login({ username, password });

      if (result && !result.error) {
        // Successful login, NextAuth handles session creation.
        // AuthContext will update with the new session.
        // We can redirect or refresh to update UI based on new auth state.
        toast({
          title: 'Успешный вход',
          description: `Добро пожаловать!`,
          variant: 'default',
        });
        // router.push('/dashboard') is typically handled by NextAuth redirect or by DashboardLayout logic
        // Forcing a refresh can help ensure layout and context pick up new session state
        router.push('/dashboard'); 
        router.refresh(); // Or rely on DashboardLayout to redirect based on auth state
      } else {
        // Login failed (e.g., wrong credentials)
        toast({
          title: 'Ошибка входа',
          description: result?.error || 'Неверное имя пользователя или пароль.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // This catch block might not be reached if signIn handles all errors
      // and returns them in the result object.
      console.error("Login error:", error);
      toast({
        title: 'Ошибка входа',
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
            <LogIn className="w-16 h-16 text-primary" />
          </div>
          <CardTitle className="text-3xl font-headline">EnglishCourse</CardTitle>
          <CardDescription>Войдите в свой аккаунт для продолжения</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Имя пользователя</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="например, Vladislav"
                className="text-base"
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="********"
                  className="text-base"
                  autoComplete="current-password"
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
            </div>
            <Button type="submit" className="w-full text-lg py-3" disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2 pt-4">
            <p className="text-sm text-muted-foreground">
                Нет аккаунта?
            </p>
            <Button variant="outline" className="w-full" asChild>
                <Link href="/register">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Зарегистрироваться
                </Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
