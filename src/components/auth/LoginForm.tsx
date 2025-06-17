
'use client';

import { useState } from 'react';
// import Link from 'next/link'; // Ссылка на регистрацию больше не нужна
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('[LoginForm] Attempting login for user:', username);

    try {
      const result = await login({ username, password });
      console.log('[LoginForm] Login result:', result);

      if (result && !result.error) {
        toast({
          title: 'Успешный вход',
          description: `Добро пожаловать!`,
          variant: 'default',
        });
        router.push('/dashboard'); // Перенаправляем на дашборд
        router.refresh(); // Обновляем страницу, чтобы AuthContext подхватил сессию
      } else {
        toast({
          title: 'Ошибка входа',
          description: result?.error || 'Неверное имя пользователя или пароль.',
          variant: 'destructive',
        });
        console.error('[LoginForm] Login failed:', result?.error);
      }
    } catch (error) {
      console.error("[LoginForm] Login submission error:", error);
      toast({
        title: 'Ошибка входа',
        description: 'Произошла непредвиденная ошибка на клиенте.',
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
                placeholder="например, vladislav_teacher"
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
        {/* <CardFooter className="flex flex-col items-center space-y-2 pt-4">
          <p className="text-sm text-muted-foreground">Нет аккаунта?</p>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/register"> <UserPlus className="mr-2 h-4 w-4" /> Зарегистрироваться </Link>
          </Button>
        </CardFooter> */}
      </Card>
    </div>
  );
}
