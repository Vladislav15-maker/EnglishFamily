'use client';
import { useEffect, useState } from 'react';
import UnitCard from '@/components/curriculum/UnitCard';
import { curriculum } from '@/lib/curriculum-data';
import type { Unit, StudentRoundProgress } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { getAllStudentProgress } from '@/lib/store'; // Mock store function
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpenText } from "lucide-react";

export default function UnitsPage() {
  const { user } = useAuth();
  const [studentProgress, setStudentProgress] = useState<StudentRoundProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'student') {
      setIsLoading(true);
      getAllStudentProgress(user.id)
        .then(progressData => {
          setStudentProgress(progressData);
        })
        .catch(error => {
          console.error("Failed to load student progress:", error);
          // Handle error (e.g., show toast)
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false); // Not a student or no user, no progress to load
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  
  if (!user || user.role !== 'student') {
     return (
        <Alert variant="destructive">
          <BookOpenText className="h-4 w-4" />
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            Эта страница доступна только для учеников.
          </AlertDescription>
        </Alert>
      );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold font-headline text-primary">Учебные юниты</h1>
      {curriculum.length === 0 ? (
         <Alert>
            <BookOpenText className="h-4 w-4" />
            <AlertTitle>Юниты не найдены</AlertTitle>
            <AlertDescription>
                В данный момент нет доступных юнитов для изучения.
            </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {curriculum.map((unit: Unit) => (
            <UnitCard
              key={unit.id}
              unit={unit}
              progress={studentProgress.filter(p => p.unitId === unit.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="p-6 border rounded-lg shadow space-y-4 bg-card">
      <div className="flex items-center space-x-3 mb-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      <Skeleton className="h-4 w-1/2" />
      <div className="space-y-2 pt-4">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
        </div>
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-10 w-full mt-4" />
    </div>
  )
}
