import { useGetUserQuestProgress, useGetUserCourseProgress, useGetAllQuests, useGetAllCourseModules, useGetAllUserProfiles } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { Principal } from '@icp-sdk/core/principal';

interface UserProgressDialogProps {
  userPrincipal: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function UserProgressDialog({ userPrincipal, open, onOpenChange }: UserProgressDialogProps) {
  const principal = open ? Principal.fromText(userPrincipal) : Principal.anonymous();
  const { data: questProgress, isLoading: questLoading } = useGetUserQuestProgress(principal);
  const { data: courseProgress, isLoading: courseLoading } = useGetUserCourseProgress(open ? principal : null);
  const { data: allQuests } = useGetAllQuests();
  const { data: allModules } = useGetAllCourseModules();
  const { data: allUserProfiles } = useGetAllUserProfiles();

  const getUserName = () => {
    const userProfile = allUserProfiles?.find(([principal]) => principal.toString() === userPrincipal);
    return userProfile?.[1]?.name || 'User';
  };

  const getQuestById = (questId: bigint) => {
    return allQuests?.find((q) => q.id === questId);
  };

  const getModuleById = (moduleId: bigint) => {
    return allModules?.find((m) => m.id === moduleId);
  };

  const calculateProgress = (completedSteps: bigint[], totalSteps: number) => {
    return totalSteps > 0 ? (completedSteps.length / totalSteps) * 100 : 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Learning Progress: {getUserName()}</DialogTitle>
          <DialogDescription>View quest and course completion status for this user.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quests" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quests" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Quests
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Blockchain 101
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quests" className="space-y-4 mt-4">
            {questLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : questProgress && questProgress.length > 0 ? (
              questProgress.map((progress) => {
                const quest = getQuestById(progress.questId);
                if (!quest) return null;

                const progressPercent = calculateProgress(progress.completedSteps, quest.steps.length);

                return (
                  <Card key={progress.questId.toString()}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{quest.title}</CardTitle>
                          <CardDescription>{quest.description}</CardDescription>
                        </div>
                        {progress.completed ? (
                          <Badge className="bg-green-500">Completed</Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{Math.round(progressPercent)}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        {quest.steps.map((step, index) => {
                          const isCompleted = progress.completedSteps.some((s) => Number(s) === index);
                          return (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className={isCompleted ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">No quest progress found for this user.</div>
            )}
          </TabsContent>

          <TabsContent value="courses" className="space-y-4 mt-4">
            {courseLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : courseProgress && courseProgress.length > 0 ? (
              courseProgress.map((progress) => {
                const module = getModuleById(progress.moduleId);
                if (!module) return null;

                const progressPercent = calculateProgress(progress.completedSteps, module.steps.length);

                return (
                  <Card key={progress.moduleId.toString()}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{module.title}</CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </div>
                        {progress.completed ? (
                          <Badge className="bg-green-500">Completed</Badge>
                        ) : (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{Math.round(progressPercent)}%</span>
                        </div>
                        <Progress value={progressPercent} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        {module.steps.map((step, index) => {
                          const isCompleted = progress.completedSteps.some((s) => Number(s) === index);
                          return (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              {isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                              )}
                              <span className={isCompleted ? 'text-foreground' : 'text-muted-foreground'}>{step}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">No course progress found for this user.</div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
