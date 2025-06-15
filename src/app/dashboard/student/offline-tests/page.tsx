'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getOfflineScoresForStudent } from '@/lib/store';
import type { OfflineTestScore } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, AlertCircle, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function StudentOfflineTestsPage() {
  const { user } = useAuth();
  const [scores, setScores] = useState<OfflineTestScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'student') {
      setIsLoading(true);
      getOfflineScoresForStudent(user.id)
        .then(data => {
          setScores(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        })
        .catch(error => {
          console.error("Failed to load offline scores:", error);
        })
        .finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!user || user.role !== 'student') {
     return (
        <Alert variant="destructive">
          <BookOpen className="h-4 w-4" />
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            Эта страница доступна только для учеников.
          </AlertDescription>
        </Alert>
      );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Award className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Мои Оценки за Оффлайн Тесты</h1>
      </div>

      {scores.length === 0 ? (
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Нет оценок</AlertTitle>
            <AlertDescription>
            У вас пока нет оценок за оффлайн тесты.
            </AlertDescription>
        </Alert>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Список оценок</CardTitle>
            <CardDescription>Здесь отображаются ваши оценки, выставленные учителем.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Дата</TableHead>
                  <TableHead className="text-center">Оценка</TableHead>
                  <TableHead>Комментарий учителя</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map(score => (
                  <TableRow key={score.id}>
                    <TableCell className="font-medium">
                      {format(new Date(score.date), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell className="text-center">
                      <span 
                        className={`text-2xl font-bold px-3 py-1 rounded-md
                          ${score.score === 5 ? 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-800' : ''}
                          ${score.score === 4 ? 'text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-800' : ''}
                          ${score.score === 3 ? 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-800' : ''}
                          ${score.score === 2 ? 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-800' : ''}
                        `}
                      >
                        {score.score}
                      </span>
                    </TableCell>
                    <TableCell>{score.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
