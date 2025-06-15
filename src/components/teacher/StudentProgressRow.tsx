import Link from 'next/link';
import type { User, StudentRoundProgress } from '@/lib/types';
import { curriculum } from '@/lib/curriculum-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';

interface StudentProgressRowProps {
  student: User;
  progress: StudentRoundProgress[];
}

export default function StudentProgressRow({ student, progress }: StudentProgressRowProps) {
  const totalRoundsInCurriculum = curriculum.reduce((acc, unit) => acc + unit.rounds.length, 0);
  const completedRounds = progress.filter(p => p.completed).length;
  const overallProgressPercentage = totalRoundsInCurriculum > 0 
    ? (completedRounds / totalRoundsInCurriculum) * 100 
    : 0;

  const averageScore = completedRounds > 0
    ? progress.filter(p => p.completed).reduce((sum, p) => sum + p.score, 0) / completedRounds
    : 0;

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="flex items-center space-x-4 p-4 border-b hover:bg-muted/50 transition-colors">
      <Avatar className="h-12 w-12">
        <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(student.name)}`} alt={student.name} data-ai-hint="profile person" />
        <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <p className="text-lg font-semibold text-primary">{student.name}</p>
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Общий прогресс:</span>
          <Progress value={overallProgressPercentage} className="w-48 h-2" /> {/* Changed w-32 to w-48 */}
          <span>{Math.round(overallProgressPercentage)}%</span>
        </div>
         <p className="text-sm text-muted-foreground">
          Средний балл по выполненным раундам: {completedRounds > 0 ? `${Math.round(averageScore)}%` : 'N/A'}
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/teacher/students/${student.id}`}>
          <Eye className="mr-2 h-4 w-4" />
          Подробнее
        </Link>
      </Button>
    </div>
  );
}
