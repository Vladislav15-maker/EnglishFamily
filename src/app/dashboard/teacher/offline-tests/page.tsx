'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllStudents, getAllOfflineScores } from '@/lib/store';
import type { User, OfflineTestScore } from '@/lib/types';
import OfflineTestForm from '@/components/teacher/OfflineTestForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, AlertCircle, BookOpen, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';

export default function TeacherOfflineTestsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [scores, setScores] = useState<OfflineTestScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScores = useCallback(() => {
    setIsLoading(true);
    getAllOfflineScores()
      .then(data => {
        // Sort by date descending
        setScores(data.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      })
      .catch(error => {
        console.error("Failed to load offline scores:", error);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      setIsLoading(true);
      getAllStudents()
        .then(studentsData => {
          setStudents(studentsData);
          fetchScores(); // Fetch scores after students are loaded
        })
        .catch(error => {
          console.error("Failed to load students:", error);
          setIsLoading(false);
        });
    } else {
        setIsLoading(false);
    }
  }, [user, fetchScores]);


  if (isLoading && !scores.length) { // Show skeleton only on initial load or if scores are empty during load
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-1/3" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
            <div><Skeleton className="h-96 w-full" /></div>
            <div>
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="space-y-2">
                        {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'teacher') {
     return (
        <Alert variant="destructive">
          <BookOpen className="h-4 w-4" />
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            Эта страница доступна только для учителей.
          </AlertDescription>
        </Alert>
      );
  }


  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <CheckSquare className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Управление Оффлайн Тестами</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start"> {/* Changed from md:grid-cols-3 */}
        <div className="md:col-span-1">
          {students.length > 0 ? (
            <OfflineTestForm students={students} onScoreAdded={fetchScores} />
          ) : (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Edit className="mr-2 h-5 w-5"/>Добавить оценку</CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Нет учеников</AlertTitle>
                        <AlertDescription>
                        Сначала должны быть добавлены ученики в систему.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-1"> {/* Changed from md:col-span-2 */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>История Оценок</CardTitle>
              <CardDescription>Список всех выставленных оффлайн оценок.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && scores.length === 0 ? (
                <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-10 w-full" />))}
                </div>
              ) : scores.length === 0 ? (
                 <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Нет оценок</AlertTitle>
                    <AlertDescription>
                    Еще не было выставлено ни одной оценки за оффлайн тесты.
                    </AlertDescription>
                </Alert>
              ) : (
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Ученик</TableHead>
                      <TableHead className="text-center">Оценка</TableHead>
                      <TableHead>Комментарий</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scores.map(score => {
                      const studentInfo = students.find(s => s.id === score.studentId);
                      return (
                        <TableRow key={score.id}>
                          <TableCell className="whitespace-nowrap">
                            {format(new Date(score.date), 'dd.MM.yy HH:mm', { locale: ru })}
                          </TableCell>
                          <TableCell>{studentInfo?.name || score.studentId}</TableCell>
                          <TableCell className="text-center">
                             <Badge 
                                className={`text-lg font-bold
                                ${score.score === 5 ? 'bg-green-500 hover:bg-green-600' : ''}
                                ${score.score === 4 ? 'bg-blue-500 hover:bg-blue-600' : ''}
                                ${score.score === 3 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
                                ${score.score === 2 ? 'bg-red-500 hover:bg-red-600' : ''}
                                `}
                              >
                                {score.score}
                              </Badge>
                          </TableCell>
                          <TableCell>{score.notes || '-'}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
