'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllStudents, getAllStudentProgress as fetchAllStudentsProgress } from '@/lib/store';
import type { User, StudentRoundProgress } from '@/lib/types';
import StudentProgressRow from '@/components/teacher/StudentProgressRow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, AlertCircle, BookOpen } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [allProgress, setAllProgress] = useState<Record<string, StudentRoundProgress[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'teacher') {
      setIsLoading(true);
      Promise.all([getAllStudents(), fetchAllStudentsProgress('')]) // Fetch all progress, then filter
        .then(([studentsData, progressData]) => {
          setStudents(studentsData);
          const progressMap: Record<string, StudentRoundProgress[]> = {};
          studentsData.forEach(student => {
            progressMap[student.id] = progressData.filter(p => p.studentId === student.id);
          });
          setAllProgress(progressMap);
        })
        .catch(error => {
          console.error("Failed to load teacher data:", error);
        })
        .finally(() => setIsLoading(false));
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
          <CardHeader>
            <Skeleton className="h-8 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border-b">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
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
        <Users className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Список Учеников</h1>
      </div>

      {students.length === 0 ? (
         <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Нет учеников</AlertTitle>
            <AlertDescription>
             В системе пока нет зарегистрированных учеников.
            </AlertDescription>
        </Alert>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Прогресс учеников</CardTitle>
            <CardDescription>Обзор успеваемости всех учеников.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {students.map(student => (
              <StudentProgressRow 
                key={student.id} 
                student={student} 
                progress={allProgress[student.id] || []} 
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
