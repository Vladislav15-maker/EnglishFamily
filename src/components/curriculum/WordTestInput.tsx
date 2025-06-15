'use client';

import { useState, useEffect, useRef } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react';

interface WordTestInputProps {
  word: Word;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  showNextButton?: boolean; 
  onNext?: () => void; 
}

export default function WordTestInput({ word, onAnswer, showNextButton = false, onNext }: WordTestInputProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset state when the word prop changes
    setUserAnswer('');
    setIsSubmitted(false);
    // isCorrect will be determined on the next submit
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [word]);

  const handleFormSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitted) return; // Don't allow re-submission for the same displayed word view

    const cleanUserAnswer = userAnswer.trim().toLowerCase();
    const cleanCorrectAnswer = word.english.trim().toLowerCase();
    const correct = cleanUserAnswer === cleanCorrectAnswer;
    
    setIsCorrect(correct);
    setIsSubmitted(true); // Show feedback
    onAnswer(correct, userAnswer.trim()); // Notify parent about the answer outcome
  };

  const handleNextClick = () => {
    // Parent component (TestRoundPage) will handle advancing the word.
    // This component will then re-render with a new 'word' prop, triggering the useEffect.
    if(onNext) {
        onNext();
    }
  };

  const handleRetryInternal = () => {
    // This allows retrying the same word if showNextButton is false (typical for practice)
    setUserAnswer('');
    setIsSubmitted(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline text-primary">Тест: Переведите слово</CardTitle>
        <CardDescription className="text-muted-foreground">Напишите английский перевод для русского слова.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 bg-secondary/30 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Русское слово:</p>
          <p className="text-4xl font-bold text-secondary-foreground font-body my-2">{word.russian}</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Введите перевод на английском"
            disabled={isSubmitted} // Disable input after submission for this word
            className={`text-lg p-4 h-14 ${isSubmitted ? (isCorrect ? 'border-green-500 focus:border-green-500 ring-green-500' : 'border-red-500 focus:border-red-500 ring-red-500') : ''}`}
            aria-label="Поле для ввода перевода"
          />
          {!isSubmitted ? (
            <Button type="submit" className="w-full text-lg py-3" size="lg">
              Проверить
            </Button>
          ) : showNextButton && onNext ? ( // Show "Next" button if configured and after submission
            <Button type="button" onClick={handleNextClick} className="w-full text-lg py-3" size="lg">
              Дальше <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : null }
        </form>

        {isSubmitted && (
          <div className={`p-4 rounded-md text-center ${isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {isCorrect ? (
              <div className="flex items-center justify-center text-green-700 dark:text-green-300">
                <CheckCircle className="h-8 w-8 mr-3" />
                <p className="text-xl font-semibold">Правильно!</p>
              </div>
            ) : (
              <div className="text-red-700 dark:text-red-300 space-y-2">
                <div className="flex items-center justify-center">
                  <XCircle className="h-8 w-8 mr-3" />
                  <p className="text-xl font-semibold">Неправильно.</p>
                </div>
                <p className="text-md">Ваш ответ: <span className="font-mono">{userAnswer || "(пусто)"}</span></p>
                <p className="text-md">Правильный ответ: <span className="font-semibold font-mono">{word.english}</span></p>
                {!showNextButton && ( // Only show "Try Again" if not in "showNextButton" flow
                  <Button onClick={handleRetryInternal} variant="outline" size="sm" className="mt-2">
                    <RotateCcw className="mr-2 h-4 w-4" /> Попробовать еще раз
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
