import Link from 'next/link';
import type { Round, StudentRoundProgress } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Layers, PlayCircle, Edit3, ArrowRight } from 'lucide-react'; // Edit3 for Test
import { Progress } from '@/components/ui/progress';

interface RoundCardProps {
  unitId: string;
  round: Round;
  progress?: StudentRoundProgress;
}

export default function RoundCard({ unitId, round, progress }: RoundCardProps) {
  const score = progress?.completed ? progress.score : 0;
  const isCompleted = progress?.completed ?? false;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col">
      <CardHeader>
         <div className="flex items-center space-x-3 mb-2">
            <Layers className="h-8 w-8 text-primary" />
            <CardTitle className="text-xl font-headline">{round.name}</CardTitle>
        </div>
        <CardDescription>{round.words.length} слов</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Прогресс</span>
            <span>{isCompleted ? `${Math.round(score)}%` : "Не начат"}</span>
          </div>
          <Progress value={score} aria-label={`Прогресс по раунду ${round.name}: ${Math.round(score)}%`} />
          {isCompleted && (
             <p className="text-xs text-accent text-center mt-2">Выполнено: {Math.round(score)}%</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline">
          <Link href={`/dashboard/units/${unitId}/round/${round.id}/learn`}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Учить
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/dashboard/units/${unitId}/round/${round.id}/test`}>
            <Edit3 className="mr-2 h-4 w-4" />
            Тест
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
