import { useState, useMemo, useEffect } from 'react';
import { useGetAllCoursesWithModules, useGetUserQuestProgressRecords, useUpdateQuestProgressRecord, useGetUserEpqRewards } from '../hooks/useQueries';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, Circle, Trophy, GraduationCap, BookOpen, Video, ClipboardCheck, Coins, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ModuleContentDialog from './ModuleContentDialog';
import type { CourseWithModules, CourseModuleWithQuestions, QuestStep } from '../backend';

interface QuestModuleAdapter {
  id: bigint;
  title: string;
  description: string;
  category: string;
  steps: QuestStep[];
  reward: bigint;
}

export default function QuestTab() {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const { data: coursesRaw = [], isLoading: coursesLoading, error: coursesError, refetch: refetchCourses } = useGetAllCoursesWithModules();
  const { data: progressRecords = [], isLoading: progressLoading, error: progressError, refetch: refetchProgress } = useGetUserQuestProgressRecords();
  const { data: epcRewards = [], isLoading: rewardsLoading, error: rewardsError, refetch: refetchRewards } = useGetUserEpqRewards();
  const { mutate: updateProgress } = useUpdateQuestProgressRecord();
  
  const [expandedModule, setExpandedModule] = useState<string | undefined>(undefined);
  const [selectedModule, setSelectedModule] = useState<QuestModuleAdapter | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);

  const isBackendReady = !!actor && !actorFetching;

  // Auto-retry when backend becomes ready
  useEffect(() => {
    if (isBackendReady && (coursesError || progressError || rewardsError)) {
      const timer = setTimeout(() => {
        if (coursesError) refetchCourses();
        if (progressError) refetchProgress();
        if (rewardsError) refetchRewards();
        setRetryAttempts((prev) => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isBackendReady, coursesError, progressError, rewardsError, refetchCourses, refetchProgress, refetchRewards]);

  // Invalidate queries when backend is ready
  useEffect(() => {
    if (isBackendReady && retryAttempts === 0) {
      queryClient.invalidateQueries({ queryKey: ['coursesWithModules'] });
      queryClient.invalidateQueries({ queryKey: ['questProgressRecords'] });
      queryClient.invalidateQueries({ queryKey: ['userEpqRewards'] });
    }
  }, [isBackendReady, queryClient, retryAttempts]);

  const questModules = useMemo(() => {
    const modules: QuestModuleAdapter[] = [];
    
    for (const course of coursesRaw) {
      for (const module of course.modules) {
        const steps: QuestStep[] = [];
        let stepId = 0;
        
        if (module.content.tell) {
          steps.push({
            id: BigInt(stepId++),
            title: 'Learn',
            content: module.content.tell,
            stepType: 'tell',
            videoUrl: undefined,
            quizQuestions: undefined,
          });
        }
        
        if (module.content.show) {
          steps.push({
            id: BigInt(stepId++),
            title: 'Watch',
            content: 'Watch the video to learn more about this topic.',
            stepType: 'show',
            videoUrl: module.content.show,
            quizQuestions: undefined,
          });
        }
        
        if (module.questions && module.questions.length > 0) {
          steps.push({
            id: BigInt(stepId++),
            title: 'Practice',
            content: 'Test your knowledge with these questions.',
            stepType: 'do',
            videoUrl: undefined,
            quizQuestions: module.questions,
          });
        }
        
        modules.push({
          id: module.id,
          title: module.title,
          description: module.description,
          category: course.category,
          steps,
          reward: course.reward,
        });
      }
    }
    
    return modules;
  }, [coursesRaw]);

  const getModuleProgress = (moduleId: bigint) => {
    return progressRecords.find((p) => p.moduleId === moduleId);
  };

  const getTotalEPC = () => {
    return epcRewards.reduce((sum, reward) => sum + Number(reward.amount), 0);
  };

  const handleModuleClick = (module: QuestModuleAdapter) => {
    setSelectedModule(module);
  };

  const handleModuleComplete = (moduleId: bigint, completedSteps: bigint[]) => {
    const module = questModules.find((m) => m.id === moduleId);
    const allCompleted = module ? completedSteps.length === module.steps.length : false;

    updateProgress({
      moduleId,
      completedSteps,
      completed: allCompleted,
    });
  };

  const handleRetryAll = () => {
    setRetryAttempts(0);
    refetchCourses();
    refetchProgress();
    refetchRewards();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Web3': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      'AI': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      'Trust Law': 'bg-green-500/10 text-green-500 border-green-500/20',
      'Sovereignty': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      'Education': 'bg-secondary/10 text-secondary border-secondary/20',
      'Blockchain': 'bg-primary/10 text-primary border-primary/20',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'tell':
        return <BookOpen className="h-4 w-4" />;
      case 'show':
        return <Video className="h-4 w-4" />;
      case 'do':
        return <ClipboardCheck className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  // Backend initialization check
  if (!isBackendReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <GraduationCap className="h-12 w-12 text-primary animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-secondary animate-spin" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Loading Quest System</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Connecting to learning platform...
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>Initializing educational content</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (coursesLoading || progressLoading || rewardsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Learning Journey</CardTitle>
                  <CardDescription>Loading progress...</CardDescription>
                </div>
                <Trophy className="h-8 w-8 text-primary animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={0} className="h-3" />
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/20 bg-secondary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>EPC Rewards</CardTitle>
                  <CardDescription>Loading rewards...</CardDescription>
                </div>
                <Coins className="h-8 w-8 text-secondary animate-pulse" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                <Loader2 className="h-8 w-8 animate-spin inline-block" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
              <div>
                <h3 className="text-lg font-semibold">Loading Quest Content</h3>
                <p className="text-sm text-muted-foreground">Please wait while we fetch your learning materials...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (coursesError || progressError || rewardsError) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Learning Journey</CardTitle>
                  <CardDescription>Track your progress</CardDescription>
                </div>
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={0} className="h-3" />
            </CardContent>
          </Card>

          <Card className="border-2 border-secondary/20 bg-secondary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>EPC Rewards</CardTitle>
                  <CardDescription>Total EPIQ Cash earned</CardDescription>
                </div>
                <Coins className="h-8 w-8 text-secondary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">
                {getTotalEPC()} EPC
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Failed to load quest data</p>
              <p className="text-sm mt-1">
                {coursesError instanceof Error 
                  ? coursesError.message 
                  : progressError instanceof Error 
                  ? progressError.message 
                  : rewardsError instanceof Error 
                  ? rewardsError.message 
                  : 'An unknown error occurred'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryAll}
              className="ml-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white border-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const completedModules = progressRecords.filter((p) => p.completed).length;
  const totalModules = questModules.length;
  const overallProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  const totalEPC = getTotalEPC();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Learning Journey</CardTitle>
                <CardDescription>
                  {completedModules} of {totalModules} modules completed
                </CardDescription>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="h-3" />
          </CardContent>
        </Card>

        <Card className="border-2 border-secondary/20 bg-secondary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>EPC Rewards</CardTitle>
                <CardDescription>
                  Total EPIQ Cash earned
                </CardDescription>
              </div>
              <Coins className="h-8 w-8 text-secondary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {totalEPC} EPC
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Earn EPC by completing modules
            </p>
          </CardContent>
        </Card>
      </div>

      {questModules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">Available Courses</h3>
          </div>
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base">Educational Courses</CardTitle>
              <CardDescription>
                Learn about blockchain, Web3, and digital assets. Complete each module to earn EPC rewards!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible value={expandedModule} onValueChange={setExpandedModule}>
                {questModules.map((module) => {
                  const moduleProgress = getModuleProgress(module.id);
                  const completedSteps = moduleProgress?.completedSteps || [];
                  const progressPercent = module.steps.length > 0 ? (completedSteps.length / module.steps.length) * 100 : 0;

                  return (
                    <AccordionItem key={Number(module.id)} value={String(module.id)}>
                      <Card className="border-2 mb-3">
                        <AccordionTrigger className="hover:no-underline px-6 py-4">
                          <div className="flex items-start gap-4 text-left w-full">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold">{module.title}</h4>
                                <Badge variant="outline" className={getCategoryColor(module.category)}>
                                  {module.category}
                                </Badge>
                                {moduleProgress?.completed && (
                                  <Badge className="bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                                <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                                  <Coins className="h-3 w-3 mr-1" />
                                  +{Number(module.reward)} EPC
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{module.description}</p>
                              <div className="flex items-center gap-2">
                                <Progress value={progressPercent} className="h-2 flex-1" />
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {completedSteps.length}/{module.steps.length}
                                </span>
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <CardContent className="pt-0 space-y-3">
                            {module.steps.map((step, index) => {
                              const isCompleted = completedSteps.some((s) => Number(s) === index);
                              return (
                                <div
                                  key={index}
                                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                  ) : (
                                    <div className="h-5 w-5 mt-0.5 flex-shrink-0 text-muted-foreground">
                                      {getStepIcon(step.stepType)}
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className={`text-sm font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                        {step.title}
                                      </p>
                                      <Badge variant="outline" className="text-xs">
                                        {step.stepType.toUpperCase()}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                            <Button 
                              className="w-full mt-4" 
                              onClick={() => handleModuleClick(module)}
                              disabled={moduleProgress?.completed}
                            >
                              {moduleProgress?.completed ? 'Module Completed' : 'Start Module'}
                            </Button>
                          </CardContent>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )}

      {questModules.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold">No Learning Content Available</h3>
                <p className="text-sm text-muted-foreground">Check back soon for new learning opportunities!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedModule && (
        <ModuleContentDialog
          module={selectedModule}
          progress={getModuleProgress(selectedModule.id)}
          onClose={() => setSelectedModule(null)}
          onComplete={handleModuleComplete}
        />
      )}
    </div>
  );
}
