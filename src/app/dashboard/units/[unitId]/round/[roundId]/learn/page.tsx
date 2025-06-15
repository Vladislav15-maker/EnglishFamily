'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WordDisplayCard from '@/components/curriculum/WordDisplayCard';
import { getRoundById } from '@/lib/curriculum-data';
import type { Round, Word } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle, ChevronLeft } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, BookOpen } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function LearnRoundPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = typeof params.unitId === 'string' ? params.unitId : '';
  const roundId = typeof params.roundId === 'string' ? params.roundId : '';
  
  const { user } = useAuth();
  const [round, setRound] = useState<Round | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (unitId && roundId) {
      const currentRound = getRoundById(unitId, roundId);
      setRound(currentRound);
      setIsLoading(false);
    }
  }, [unitId, roundId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
        <div className="w-full max-w-md mx-auto space-y-4">
          <div className="flex justify-between items-center">
             <div className="w-1/3 h-6 bg-muted rounded animate-pulse"></div>
             <div className="w-1/4 h-6 bg-muted rounded animate-pulse"></div>
          </div>
          <div className="w-full h-4 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="w-full max-w-md p-6 border rounded-lg shadow space-y-4 bg-card animate-pulse">
          <div className="h-10 w-3/4 mx-auto bg-muted rounded"></div>
          <div className="h-8 w-1/2 mx-auto bg-muted rounded mt-4"></div>
          <div className="h-8 w-full bg-muted rounded mt-2"></div>
          <div className="h-12 w-full bg-primary/50 rounded mt-6"></div>
        </div>
        <div className="flex justify-between w-full max-w-md mt-6">
          <div className="h-10 w-28 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-28 bg-muted rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!round) {
     return (
       <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Раунд не найден</AlertTitle>
          <AlertDescription>
            Запрашиваемый раунд не существует. <Link href={`/dashboard/units/${unitId}`} className="underline">Вернуться к юниту.</Link>
          </AlertDescription>
        </Alert>
     );
  }
    
  if (!user || user.role !== 'student') {
     return (
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <BookOpen className="h-4 w-4" />
          <AlertTitle>Доступ запрещен</AlertTitle>
          <AlertDescription>
            Эта страница доступна только для учеников.
          </AlertDescription>
        </Alert>
      );
  }

  const currentWord: Word | undefined = round.words[currentWordIndex];
  const totalWords = round.words.length;
  const progressPercentage = totalWords > 0 ? ((currentWordIndex + 1) / totalWords) * 100 : 0;

  const handleNextWord = () => {
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
    }
  };

  const handlePreviousWord = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(prev => prev - 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
       <Breadcrumb className="w-full max-w-2xl">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/dashboard/units">Юниты</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href={`/dashboard/units/${unitId}`}>{getRoundById(unitId,roundId)?.name || unitId}</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Изучение: {round.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <div className="w-full max-w-md">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-primary">{round.name} - Изучение</h2>
          <span className="text-sm text-muted-foreground">Слово {currentWordIndex + 1} из {totalWords}</span>
        </div>
        <Progress value={progressPercentage} className="w-full h-2 mb-6" aria-label={`Прогресс изучения: ${Math.round(progressPercentage)}%`} />
      </div>

      {currentWord && <WordDisplayCard word={currentWord} />}

      <div className="flex justify-between w-full max-w-md mt-6">
        <Button onClick={handlePreviousWord} disabled={currentWordIndex === 0} variant="outline" size="lg">
          <ArrowLeft className="mr-2 h-5 w-5" />
          Назад
        </Button>
        {currentWordIndex === totalWords - 1 ? (
          <Button onClick={() => router.push(`/dashboard/units/${unitId}/round/${roundId}/test`)} variant="default" size="lg" className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-5 w-5" />
            К тесту
          </Button>
        ) : (
          <Button onClick={handleNextWord} disabled={currentWordIndex === totalWords - 1} variant="default" size="lg">
            Вперед
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
       <Button variant="link" onClick={() => router.push(`/dashboard/units/${unitId}`)} className="mt-4 text-primary">
          <ChevronLeft className="mr-1 h-4 w-4" /> Вернуться к раундам юнита
        </Button>
    </div>
  );
}
