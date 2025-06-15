'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User } from '@/lib/types';
import { addOfflineScore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Check, Edit } from 'lucide-react';

const offlineTestSchema = z.object({
  studentId: z.string().min(1, "Выберите ученика"),
  score: z.coerce.number().min(2).max(5, "Оценка должна быть от 2 до 5"),
  notes: z.string().optional(),
});

type OfflineTestFormValues = z.infer<typeof offlineTestSchema>;

interface OfflineTestFormProps {
  students: User[];
  onScoreAdded?: () => void; // Callback after score is successfully added
}

export default function OfflineTestForm({ students, onScoreAdded }: OfflineTestFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<OfflineTestFormValues>({
    resolver: zodResolver(offlineTestSchema),
    defaultValues: {
      studentId: '',
      score: undefined, // Let placeholder show
      notes: '',
    },
  });

  const { user: teacherUser } = useAuth(); // Assuming useAuth is available and gives teacher's ID

  const onSubmit = async (data: OfflineTestFormValues) => {
    if (!teacherUser) {
        toast({ title: "Ошибка", description: "Учитель не авторизован.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      await addOfflineScore({ ...data, teacherId: teacherUser.id });
      toast({
        title: 'Оценка добавлена',
        description: `Оценка ${data.score} для ученика успешно сохранена.`,
        variant: 'default'
      });
      form.reset();
      onScoreAdded?.(); // Call callback if provided
    } catch (error) {
      toast({
        title: 'Ошибка сохранения',
        description: 'Не удалось сохранить оценку. Пожалуйста, попробуйте еще раз.',
        variant: 'destructive',
      });
      console.error("Failed to add offline score:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-3">
            <Edit className="h-8 w-8 text-primary" />
            <CardTitle className="text-2xl">Добавить Оценку за Оффлайн Тест</CardTitle>
        </div>
        <CardDescription>Выберите ученика и выставьте оценку.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ученик</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите ученика" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map(student => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Оценка</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString()}
                      value={field.value?.toString()}
                      className="flex space-x-4"
                    >
                      {[5, 4, 3, 2].map(val => (
                        <FormItem key={val} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={val.toString()} />
                          </FormControl>
                          <FormLabel className="font-normal text-lg">{val}</FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий (необязательно)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Добавьте комментарий к оценке..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Сохранение...' : 'Сохранить оценку'}
              {!isLoading && <Check className="ml-2 h-4 w-4" />}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

// Need to import useAuth if it's not globally available or passed as prop
import { useAuth } from '@/context/AuthContext';
