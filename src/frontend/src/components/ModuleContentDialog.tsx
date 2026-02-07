import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BookOpen, Video, ClipboardCheck, ChevronLeft, ChevronRight, CheckCircle2, Coins } from 'lucide-react';
import { toast } from 'sonner';
import type { QuestStep, QuestProgressRecord } from '../backend';

interface QuestModuleAdapter {
  id: bigint;
  title: string;
  description: string;
  category: string;
  steps: QuestStep[];
  reward: bigint;
}

interface ModuleContentDialogProps {
  module: QuestModuleAdapter;
  progress: QuestProgressRecord | undefined;
  onClose: () => void;
  onComplete: (moduleId: bigint, completedSteps: bigint[]) => void;
}

export default function ModuleContentDialog({ module, progress, onClose, onComplete }: ModuleContentDialogProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<bigint[]>(progress?.completedSteps || []);

  const currentStep = module.steps[currentStepIndex];
  const isLastStep = currentStepIndex === module.steps.length - 1;
  const isStepCompleted = completedSteps.some((s) => Number(s) === currentStepIndex);

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'tell':
        return <BookOpen className="h-5 w-5 text-primary" />;
      case 'show':
        return <Video className="h-5 w-5 text-primary" />;
      case 'do':
        return <ClipboardCheck className="h-5 w-5 text-primary" />;
      default:
        return null;
    }
  };

  const handleNext = () => {
    if (currentStep.stepType === 'do' && !showQuizResults) {
      handleQuizSubmit();
    } else if (isLastStep) {
      handleModuleComplete();
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
      setShowQuizResults(false);
      setQuizAnswers({});
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setShowQuizResults(false);
      setQuizAnswers({});
    }
  };

  const handleQuizSubmit = () => {
    if (!currentStep.quizQuestions) return;

    const allAnswered = currentStep.quizQuestions.every((_: any, idx: number) => quizAnswers[idx] !== undefined);
    
    if (!allAnswered) {
      toast.error('Please answer all questions before submitting');
      return;
    }

    const correctAnswers = currentStep.quizQuestions.filter(
      (q: any, idx: number) => quizAnswers[idx] === Number(q.correctAnswer)
    ).length;

    const passed = correctAnswers === currentStep.quizQuestions.length;

    if (passed) {
      const newCompletedSteps = [...completedSteps, BigInt(currentStepIndex)];
      setCompletedSteps(newCompletedSteps);
      toast.success('Quiz passed! Step completed.');
    } else {
      toast.error(`You got ${correctAnswers} out of ${currentStep.quizQuestions.length} correct. Try again!`);
    }

    setShowQuizResults(true);
  };

  const handleStepComplete = () => {
    if (!isStepCompleted && currentStep.stepType !== 'do') {
      const newCompletedSteps = [...completedSteps, BigInt(currentStepIndex)];
      setCompletedSteps(newCompletedSteps);
      toast.success('Step completed!');
    }
  };

  const handleModuleComplete = () => {
    const allStepsCompleted = completedSteps.length === module.steps.length;
    
    if (allStepsCompleted) {
      onComplete(module.id, completedSteps);
      toast.success(`Module completed! You earned +${Number(module.reward)} EPC!`, {
        icon: <Coins className="h-4 w-4 text-secondary" />,
      });
      onClose();
    } else {
      toast.error('Please complete all steps before finishing the module');
    }
  };

  const renderVideoEmbed = (url: string) => {
    let embedUrl = url;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    } else if (url.includes('loom.com')) {
      const videoId = url.split('share/')[1]?.split('?')[0];
      embedUrl = `https://www.loom.com/embed/${videoId}`;
    }

    return (
      <div className="relative w-full pt-[56.25%] rounded-lg overflow-hidden bg-muted">
        <iframe
          src={embedUrl}
          className="absolute top-0 left-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  const progressPercent = (completedSteps.length / module.steps.length) * 100;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{module.title}</DialogTitle>
              <DialogDescription className="mt-1">{module.description}</DialogDescription>
            </div>
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
              <Coins className="h-3 w-3 mr-1" />
              +{Number(module.reward)} EPC
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Module Progress</span>
              <span className="font-medium">{completedSteps.length}/{module.steps.length} steps</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          <Card className="border-2">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-3">
                {getStepIcon(currentStep.stepType)}
                <div>
                  <h3 className="text-lg font-semibold">{currentStep.title}</h3>
                  <Badge variant="outline" className="mt-1">
                    {currentStep.stepType.toUpperCase()} Section
                  </Badge>
                </div>
                {isStepCompleted && (
                  <CheckCircle2 className="h-6 w-6 text-green-500 ml-auto" />
                )}
              </div>

              {currentStep.stepType === 'tell' && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{currentStep.content}</p>
                </div>
              )}

              {currentStep.stepType === 'show' && (
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{currentStep.content}</p>
                  </div>
                  {currentStep.videoUrl && renderVideoEmbed(currentStep.videoUrl)}
                </div>
              )}

              {currentStep.stepType === 'do' && currentStep.quizQuestions && (
                <div className="space-y-6">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-base leading-relaxed whitespace-pre-wrap">{currentStep.content}</p>
                  </div>

                  <div className="space-y-6">
                    {currentStep.quizQuestions.map((question: any, qIdx: number) => (
                      <Card key={qIdx} className="border-2">
                        <CardContent className="pt-6 space-y-4">
                          <h4 className="font-semibold">Question {qIdx + 1}: {question.question}</h4>
                          <RadioGroup
                            value={quizAnswers[qIdx]?.toString()}
                            onValueChange={(value) => setQuizAnswers({ ...quizAnswers, [qIdx]: parseInt(value) })}
                            disabled={showQuizResults}
                          >
                            {question.options.map((option: string, oIdx: number) => {
                              const isSelected = quizAnswers[qIdx] === oIdx;
                              const isCorrect = Number(question.correctAnswer) === oIdx;
                              const showFeedback = showQuizResults && isSelected;

                              return (
                                <div
                                  key={oIdx}
                                  className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                                    showFeedback
                                      ? isCorrect
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-red-500 bg-red-500/10'
                                      : 'border-border'
                                  }`}
                                >
                                  <RadioGroupItem value={oIdx.toString()} id={`q${qIdx}-o${oIdx}`} />
                                  <Label htmlFor={`q${qIdx}-o${oIdx}`} className="flex-1 cursor-pointer">
                                    {option}
                                  </Label>
                                  {showFeedback && (
                                    <span className="text-sm font-medium">
                                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </RadioGroup>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {module.steps.length}
            </div>

            {currentStep.stepType !== 'do' && !isStepCompleted && (
              <Button onClick={handleStepComplete}>
                Mark Complete
              </Button>
            )}

            <Button onClick={handleNext}>
              {currentStep.stepType === 'do' && !showQuizResults
                ? 'Submit Quiz'
                : isLastStep
                ? 'Finish Module'
                : 'Next'}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

