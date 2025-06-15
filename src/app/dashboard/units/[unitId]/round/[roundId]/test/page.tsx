'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WordTestInput from '@/components/curriculum/WordTestInput';
import { getRoundById } from '@/lib/curriculum-data';
import type { Round, Word, StudentRoundProgress } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { saveStudentRoundProgress, getStudentRoundProgress } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BookOpen, ThumbsUp, Repeat, ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

type Attempt = { wordId: string; userAnswer: string; correct: boolean };

export default function TestRoundPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = typeof params.unitId === 'string' ? params.unitId : '';
  const roundId = typeof params.roundId === 'string' ? params.roundId : '';
  
  const { user } = useAuth();
  const { toast } = useToast();

  const [round, setRound] = useState<Round | null>(null);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (unitId && roundId) {
      const currentRoundData = getRoundById(unitId, roundId);
      setRound(currentRoundData);
      if (currentRoundData) {
        setShuffledWords([...currentRoundData.words].sort(() => Math.random() - 0.5));
      }
      setIsLoading(false);
    }
  }, [unitId, roundId]);

  const totalWords = shuffledWords.length;

  const calculateScore = useCallback((currentAttempts: Attempt[]) => {
    if (totalWords === 0) return 0;
    const correctAnswers = currentAttempts.filter(a => a.correct).length;
    return Math.round((correctAnswers / totalWords) * 100);
  }, [totalWords]);


  const handleAnswerSubmit = (isCorrect: boolean, userAnswer: string) => {
    if (!round || !shuffledWords[currentWordIndex]) return;

    const newAttempt: Attempt = {
      wordId: shuffledWords[currentWordIndex].id,
      userAnswer,
      correct: isCorrect,
    };
    setAttempts(prevAttempts => [...prevAttempts, newAttempt]);
    // WordTestInput will show its own feedback.
    // The "Next" button in WordTestInput will trigger proceedToNextStepOrFinish.
  };

  const proceedToNextStepOrFinish = async () => {
    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      // This is after the last word has been answered and "Next" is clicked
      setIsTestFinished(true);
      // `attempts` state is now up-to-date due to `handleAnswerSubmit`
      const finalScoreValue = calculateScore(attempts); 
      setScore(finalScoreValue);

      if (user && round) {
        setIsSubmitting(true);
        const progressData: StudentRoundProgress = {
          studentId: user.id,
          unitId,
          roundId,
          score: finalScoreValue,
          attempts: attempts, // Use the complete list of attempts
          completed: true,
          timestamp: Date.now(),
        };
        try {
          await saveStudentRoundProgress(progressData);
          toast({
            title: "Тест завершен!",
            description: `Ваш результат: ${finalScoreValue}%. Прогресс сохранен.`,
            variant: "default"
          });
        } catch (error) {
          console.error("Failed to save progress:", error);
          toast({
            title: "Ошибка сохранения",
            description: "Не удалось сохранить ваш прогресс. Попробуйте снова.",
            variant: "destructive"
          });
        } finally {
          setIsSubmitting(false);
        }
      }
    }
  };

  const handleRetryTest = () => {
    setCurrentWordIndex(0);
    setAttempts([]);
    setIsTestFinished(false);
    setScore(0);
    if (round) {
      setShuffledWords([...round.words].sort(() => Math.random() - 0.5));
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><AlertCircle className="animate-spin h-8 w-8 text-primary" /></div>;
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


  const currentWord: Word | undefined = shuffledWords[currentWordIndex];
  const progressPercentage = totalWords > 0 ? ((currentWordIndex) / totalWords) * 100 : 0;

  if (isTestFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-800 rounded-full inline-block">
                <ThumbsUp className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl font-headline">Тест завершен!</CardTitle>
            <CardDescription>Отличная работа!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-5xl font-bold text-primary">{score}%</p>
            <p className="text-muted-foreground">
              Вы правильно ответили на {attempts.filter(a => a.correct).length} из {totalWords} слов.
            </p>
            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={handleRetryTest} variant="outline" size="lg" disabled={isSubmitting}>
                <Repeat className="mr-2 h-5 w-5" />
                Повторить
              </Button>
              <Button onClick={() => router.push(`/dashboard/units/${unitId}`)} size="lg">
                К юниту
                <ChevronLeft className="ml-2 h-5 w-5 transform rotate-180" />
              </Button>
            </div>
             {isSubmitting && <p className="text-sm text-muted-foreground mt-2">Сохранение результатов...</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <BreadcrumbPage>Тест: {round.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-primary">{round.name} - Тест</h2>
          <span className="text-sm text-muted-foreground">Слово {currentWordIndex + 1} из {totalWords}</span>
        </div>
        <Progress value={progressPercentage} className="w-full h-2 mb-6" aria-label={`Прогресс теста: ${Math.round(progressPercentage)}%`} />
      </div>

      {currentWord ? (
        <WordTestInput 
          word={currentWord} 
          onAnswer={handleAnswerSubmit} 
          showNextButton={true}
          onNext={proceedToNextStepOrFinish}
        />
      ) : (
        <p>Загрузка слова...</p>
      )}
      <Button variant="link" onClick={() => router.push(`/dashboard/units/${unitId}`)} className="mt-4 text-primary">
          <ChevronLeft className="mr-1 h-4 w-4" /> Вернуться к раундам юнита
        </Button>
    </div>
  );
}
