import Link from 'next/link';
import type { Unit, StudentRoundProgress } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookMarked, ArrowRight } from 'lucide-react';

interface UnitCardProps {
  unit: Unit;
  progress?: StudentRoundProgress[]; // Progress for all rounds in this unit
}

export default function UnitCard({ unit, progress = [] }: UnitCardProps) {
  const totalRounds = unit.rounds.length;
  const completedRounds = progress.filter(p => p.completed && p.score >= 0).length; // Assuming score >= 0 means attempted/completed
  const unitProgressPercentage = totalRounds > 0 ? (completedRounds / totalRounds) * 100 : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader>
        <div className="flex items-center space-x-3 mb-2">
            <BookMarked className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl font-headline">{unit.name}</CardTitle>
        </div>
        <CardDescription>{totalRounds} {totalRounds === 1 ? 'раунд' : (totalRounds > 1 && totalRounds < 5 ? 'раунда' : 'раундов')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Прогресс</span>
            <span>{Math.round(unitProgressPercentage)}%</span>
          </div>
          <Progress value={unitProgressPercentage} aria-label={`Прогресс по юниту ${unit.name}: ${Math.round(unitProgressPercentage)}%`} />
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href={`/dashboard/units/${unit.id}`}>
            Перейти к юниту
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
