'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { findUserById, getAllStudentProgress as fetchStudentProgressData, getOfflineScoresForStudent } from '@/lib/store';
import { curriculum } from '@/lib/curriculum-data';
import type { User, StudentRoundProgress, Unit, Round, Word, OfflineTestScore } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, UserCircle, BookOpen, AlertCircle, CheckCircle, XCircle, Award, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';


export default function TeacherStudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = typeof params.studentId === 'string' ? params.studentId : '';
  const { user: teacherUser } = useAuth();

  const [student, setStudent] = useState<User | null>(null);
  const [progress, setProgress] = useState<StudentRoundProgress[]>([]);
  const [offlineScores, setOfflineScores] = useState<OfflineTestScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (teacherUser && teacherUser.role === 'teacher' && studentId) {
      setIsLoading(true);
      Promise.all([
        findUserById(studentId),
        fetchStudentProgressData(studentId),
        getOfflineScoresForStudent(studentId)
      ]).then(([studentData, progressData, offlineScoresData]) => {
        setStudent(studentData || null);
        setProgress(progressData);
        setOfflineScores(offlineScoresData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }).catch(error => {
        console.error("Failed to load student details:", error);
      }).finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [teacherUser, studentId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2 mb-2" />
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-1/3" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!teacherUser || teacherUser.role !== 'teacher') {
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

  if (!student) {
    return (
       <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ученик не найден</AlertTitle>
          <AlertDescription>
            Информация об этом ученике не найдена. <Link href="/dashboard/teacher/students" className="underline">Вернуться к списку учеников.</Link>
          </AlertDescription>
        </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/teacher/students">Ученики</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{student.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <UserCircle className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold font-headline">{student.name}</h1>
        </div>
        <Button variant="outline" onClick={() => router.push('/dashboard/teacher/students')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          К списку учеников
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Успеваемость по юнитам</CardTitle>
          <CardDescription>Детальный просмотр прогресса по каждому раунду.</CardDescription>
        </CardHeader>
        <CardContent>
          {curriculum.length === 0 ? (
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Нет учебных материалов</AlertTitle>
                <AlertDescription>В системе пока нет юнитов и раундов.</AlertDescription>
            </Alert>
          ) : (
            <Accordion type="single" collapsible className="w-full">
            {curriculum.map((unit: Unit) => (
              <AccordionItem value={unit.id} key={unit.id}>
                <AccordionTrigger className="text-xl hover:bg-muted/50 px-4 py-3 rounded-md">
                  {unit.name}
                </AccordionTrigger>
                <AccordionContent className="px-4 pt-2 pb-4 space-y-4 bg-background">
                  {unit.rounds.length === 0 ? (<p className="text-muted-foreground text-sm">В этом юните нет раундов.</p>) : unit.rounds.map((round: Round) => {
                    const roundProgress = progress.find(p => p.unitId === unit.id && p.roundId === round.id);
                    const roundWords = curriculum.find(u => u.id === unit.id)?.rounds.find(r => r.id === round.id)?.words || [];
                    return (
                      <Card key={round.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 p-4">
                          <CardTitle className="text-lg flex justify-between items-center">
                            {round.name}
                            {roundProgress?.completed ? (
                              <Badge variant={roundProgress.score >= 80 ? "default" : (roundProgress.score >=50 ? "secondary" : "destructive")} className="ml-2 bg-green-500 text-white">
                                {roundProgress.score}%
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="ml-2">Не пройден</Badge>
                            )}
                          </CardTitle>
                          {roundProgress?.completed && <Progress value={roundProgress.score} className="h-2 mt-1" />}
                        </CardHeader>
                        {roundProgress?.attempts && roundProgress.attempts.length > 0 && (
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Слово (Рус)</TableHead>
                                  <TableHead>Ответ ученика</TableHead>
                                  <TableHead>Правильный ответ</TableHead>
                                  <TableHead className="text-right">Результат</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {roundProgress.attempts.map(attempt => {
                                  const wordDetail = roundWords.find(w => w.id === attempt.wordId);
                                  return (
                                    <TableRow key={attempt.wordId}>
                                      <TableCell>{wordDetail?.russian}</TableCell>
                                      <TableCell className="font-mono">{attempt.userAnswer || "-"}</TableCell>
                                      <TableCell className="font-mono">{wordDetail?.english}</TableCell>
                                      <TableCell className="text-right">
                                        {attempt.correct ? 
                                          <CheckCircle className="h-5 w-5 text-green-500 inline" /> : 
                                          <XCircle className="h-5 w-5 text-red-500 inline" />}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </CardContent>
                        )}
                         {!roundProgress?.attempts && roundProgress?.completed && (
                            <CardContent className="p-4 text-sm text-muted-foreground">
                                Детали по ответам не сохранены для этого раунда.
                            </CardContent>
                         )}
                         {!roundProgress && (
                            <CardContent className="p-4 text-sm text-muted-foreground">
                                Ученик еще не проходил этот раунд.
                            </CardContent>
                         )}
                      </Card>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="mr-2 h-6 w-6 text-primary" />
            Оценки за Оффлайн Тесты
          </CardTitle>
        </CardHeader>
        <CardContent>
          {offlineScores.length === 0 ? (
            <p className="text-muted-foreground">У этого ученика нет оценок за оффлайн тесты.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-center">Оценка</TableHead>
                  <TableHead>Комментарий</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offlineScores.map(score => (
                  <TableRow key={score.id}>
                    <TableCell>{format(new Date(score.date), 'dd.MM.yyyy HH:mm', { locale: ru })}</TableCell>
                    <TableCell className="text-center font-bold text-lg">{score.score}</TableCell>
                    <TableCell>{score.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
