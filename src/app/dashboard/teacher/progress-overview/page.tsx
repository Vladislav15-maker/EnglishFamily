
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllStudents, getAllStudentProgress as fetchAllStudentsProgressGlobally } from '@/lib/store';
import { curriculum } from '@/lib/curriculum-data';
import type { User, Unit as CurriculumUnit } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, AlertCircle, BookOpen, CheckCircle, Circle, MinusCircle, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface RoundProgressDisplayInfo {
  roundName: string;
  score?: number;
  completed: boolean;
}

interface UnitOverallProgressDisplay {
  unitAverageScore?: number;
  unitCompleted: boolean;
  roundsDetail: RoundProgressDisplayInfo[];
}

export default function TeacherProgressOverviewPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [allProgressData, setAllProgressData] = useState<Record<string, Record<string, UnitOverallProgressDisplay>>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      setIsLoading(true);
      Promise.all([
        getAllStudents(),
        fetchAllStudentsProgressGlobally('') // Fetch all progress for all students
      ]).then(([studentsData, rawProgressData]) => {
        setStudents(studentsData);
        
        const progressMap: Record<string, Record<string, UnitOverallProgressDisplay>> = {};
        
        studentsData.forEach(student => {
          progressMap[student.id] = {}; // Initialize student's progress object
          const studentAllProgressItems = rawProgressData.filter(p => p.studentId === student.id);
          
          curriculum.forEach(unit => {
            const roundsDetail: RoundProgressDisplayInfo[] = unit.rounds.map(round => {
              const roundProgress = studentAllProgressItems.find(p => p.unitId === unit.id && p.roundId === round.id);
              return {
                roundName: round.name,
                score: roundProgress?.score,
                completed: roundProgress?.completed ?? false,
              };
            });

            let unitAverageScore: number | undefined = undefined;
            let unitCompleted = false;

            if (unit.rounds.length > 0) {
              const completedRoundsInUnit = roundsDetail.filter(r => r.completed);
              const sumOfScores = completedRoundsInUnit.reduce((sum, r) => sum + (r.score ?? 0), 0);
              
              if (completedRoundsInUnit.length > 0) {
                unitAverageScore = Math.round(sumOfScores / completedRoundsInUnit.length);
              }
              unitCompleted = completedRoundsInUnit.length === unit.rounds.length;
            }
            
            progressMap[student.id][unit.id] = {
              unitAverageScore,
              unitCompleted,
              roundsDetail,
            };
          });
        });
        setAllProgressData(progressMap);
      }).catch(error => {
        console.error("Failed to load progress overview data:", error);
      }).finally(() => setIsLoading(false));
    } else {
        setIsLoading(false);
    }
  }, [user]);


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-1/3" />
        </div>
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-2" /> {/* Header row */}
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full mb-1" /> 
            ))}
          </CardContent>
        </Card>
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
        <BarChart3 className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Общий Прогресс Учеников</h1>
      </div>

      {students.length === 0 ? (
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Нет учеников</AlertTitle>
            <AlertDescription>
             В системе пока нет зарегистрированных учеников для отображения прогресса.
            </AlertDescription>
        </Alert>
      ) : curriculum.length === 0 ? (
        <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Нет учебных материалов</AlertTitle>
            <AlertDescription>
             В системе пока нет юнитов для отображения прогресса.
            </AlertDescription>
        </Alert>
      )
      : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Сводная таблица успеваемости</CardTitle>
            <CardDescription>Прогресс учеников по всем юнитам. Наведите на ячейку для деталей. Горизонтальная прокрутка доступна при необходимости.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full whitespace-nowrap">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-10 w-[200px] min-w-[200px] border-r">Ученик</TableHead>
                  {curriculum.map(unit => (
                    <TableHead key={unit.id} className="text-center min-w-[180px] px-2">{unit.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 border-r">{student.name}</TableCell>
                    {curriculum.map(unit => {
                      const progress = allProgressData[student.id]?.[unit.id];
                      let cellContent;
                      let tooltipTitle = `${student.name} - ${unit.name}: `;
                      let tooltipRoundDetailsNodes: React.ReactNode[] = [];

                      if (progress) {
                        if (progress.unitCompleted) {
                          cellContent = <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />;
                          tooltipTitle += `Завершен. Средний балл ${progress.unitAverageScore ?? 'N/A'}%.`;
                        } else if (progress.unitAverageScore !== undefined) {
                          const scoreColor = progress.unitAverageScore >= 80 ? 'text-green-600' : progress.unitAverageScore >= 50 ? 'text-yellow-600' : 'text-red-600';
                          cellContent = <span className={`font-bold ${scoreColor}`}>{progress.unitAverageScore}%</span>;
                          tooltipTitle += `В процессе. Средний балл ${progress.unitAverageScore}%.`;
                        } else if (unit.rounds.length === 0) {
                          cellContent = <MinusCircle className="h-4 w-4 text-muted-foreground mx-auto" />;
                          tooltipTitle = `${unit.name}: Нет раундов.`;
                        } else {
                          cellContent = <Circle className="h-4 w-4 text-muted-foreground mx-auto" />;
                          tooltipTitle += `Не начат.`;
                        }

                        if (unit.rounds.length > 0 && progress.roundsDetail && progress.roundsDetail.length > 0) {
                          tooltipRoundDetailsNodes = progress.roundsDetail.map(rd => {
                            const roundStatusText = rd.completed 
                              ? `${rd.score}% (завершен)` 
                              : (typeof rd.score === 'number' ? `${rd.score}% (в процессе)` : 'не начат');
                            const Icon = rd.completed ? CheckCircle : (typeof rd.score === 'number' ? Circle : XCircle);
                            const iconColor = rd.completed ? 'text-green-500' : (typeof rd.score === 'number' ? 'text-yellow-600' : 'text-red-500');
                            return (
                              <li key={rd.roundName} className="flex items-center">
                                <Icon className={`h-3 w-3 mr-1.5 shrink-0 ${iconColor}`} />
                                {rd.roundName}: {roundStatusText}
                              </li>
                            );
                          });
                        } else if (unit.rounds.length > 0) {
                           tooltipRoundDetailsNodes.push(<li key="no-round-data" className="text-xs italic">Нет данных по раундам.</li>);
                        }
                      } else {
                          cellContent = <Circle className="h-4 w-4 text-muted-foreground mx-auto" />;
                          tooltipTitle += `Нет данных.`;
                          if (unit.rounds.length === 0) {
                               cellContent = <MinusCircle className="h-4 w-4 text-muted-foreground mx-auto" />;
                               tooltipTitle = `${unit.name}: Нет раундов.`;
                          }
                      }

                      return (
                        <TableCell key={unit.id} className="text-center min-w-[180px] px-2">
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-default p-2 min-h-[36px] flex items-center justify-center">{cellContent}</div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs text-sm">
                                <p className="font-semibold mb-1">{tooltipTitle}</p>
                                {tooltipRoundDetailsNodes.length > 0 && (
                                  <ul className="list-none pl-1 mt-1 space-y-0.5">
                                    {tooltipRoundDetailsNodes}
                                  </ul>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
