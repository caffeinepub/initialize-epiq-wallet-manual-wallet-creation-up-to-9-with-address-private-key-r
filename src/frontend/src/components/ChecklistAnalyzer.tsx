import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, Trophy } from 'lucide-react';
import { useGetCallerUserProfile, useGetUserQuestProgressRecords, useGetAllCoursesWithModules } from '../hooks/useQueries';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  category: 'profile' | 'quest' | 'wallet' | 'community';
}

export default function ChecklistAnalyzer() {
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: progressRecords, isLoading: progressLoading } = useGetUserQuestProgressRecords();
  const { data: courses, isLoading: coursesLoading } = useGetAllCoursesWithModules();

  const isLoading = profileLoading || progressLoading || coursesLoading;

  // Generate checklist items based on user progress
  const getChecklistItems = (): ChecklistItem[] => {
    const items: ChecklistItem[] = [];

    // Profile Setup Tasks
    items.push({
      id: 'profile-created',
      title: 'Create Your Profile',
      description: 'Set up your display name and member type',
      completed: !!userProfile,
      category: 'profile',
    });

    items.push({
      id: 'profile-complete',
      title: 'Complete Profile Information',
      description: 'Add email and wallet addresses',
      completed: !!(userProfile?.email && userProfile?.icpWalletAddress),
      category: 'profile',
    });

    // Quest/Learning Tasks
    items.push({
      id: 'first-module',
      title: 'Start Your First Module',
      description: 'Begin your Web3 learning journey',
      completed: !!(progressRecords && progressRecords.length > 0),
      category: 'quest',
    });

    items.push({
      id: 'complete-module',
      title: 'Complete a Learning Module',
      description: 'Finish your first course module and earn EPC',
      completed: !!(progressRecords && progressRecords.some(p => p.completed)),
      category: 'quest',
    });

    items.push({
      id: 'earn-epc',
      title: 'Earn Your First EPC Reward',
      description: 'Complete a module to receive EPIQ Cash',
      completed: !!(progressRecords && progressRecords.some(p => p.completed)),
      category: 'quest',
    });

    // Wallet Tasks
    items.push({
      id: 'add-wallet',
      title: 'Add Wallet Address',
      description: 'Connect your ICP, ETH, or BTC wallet',
      completed: !!(userProfile?.icpWalletAddress || userProfile?.ethWalletAddress || userProfile?.btcWalletAddress),
      category: 'wallet',
    });

    // Community Tasks
    items.push({
      id: 'explore-dashboard',
      title: 'Explore the Dashboard',
      description: 'Navigate through all dashboard tabs',
      completed: !!userProfile, // Assume completed if profile exists
      category: 'community',
    });

    return items;
  };

  const checklistItems = getChecklistItems();
  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const completionPercentage = Math.round((completedCount / totalCount) * 100);

  const getCategoryIcon = (category: ChecklistItem['category']) => {
    switch (category) {
      case 'profile':
        return '👤';
      case 'quest':
        return '🎯';
      case 'wallet':
        return '💰';
      case 'community':
        return '🌐';
    }
  };

  const getCategoryColor = (category: ChecklistItem['category']) => {
    switch (category) {
      case 'profile':
        return 'text-blue-500';
      case 'quest':
        return 'text-primary';
      case 'wallet':
        return 'text-secondary';
      case 'community':
        return 'text-green-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary animate-spin" />
            Loading Onboarding Progress...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="h-6 w-6 text-primary" />
              EPIQ Quest Onboarding
            </CardTitle>
            <CardDescription>
              Complete these tasks to unlock the full EPIQ Life experience
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {completedCount}/{totalCount}
            </div>
            <p className="text-xs text-muted-foreground">Tasks Complete</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-muted-foreground">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-3" />
        </div>

        {/* Completion Badge */}
        {completionPercentage === 100 && (
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 border border-primary/20">
            <div className="flex items-center gap-3">
              <img 
                src="/assets/generated/quest-badge-purple-transparent.dim_64x64.png" 
                alt="Quest Complete" 
                className="h-12 w-12"
              />
              <div>
                <h3 className="font-semibold text-lg">Onboarding Complete! 🎉</h3>
                <p className="text-sm text-muted-foreground">
                  You've completed all onboarding tasks. Welcome to EPIQ Life!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Checklist Items */}
        <div className="space-y-3">
          {checklistItems.map((item) => (
            <div
              key={item.id}
              className={`
                flex items-start gap-4 p-4 rounded-lg border transition-all duration-200
                ${item.completed 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/30 border-muted hover:border-primary/30'
                }
              `}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {item.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getCategoryIcon(item.category)}</span>
                  <h4 className={`font-semibold ${item.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {item.title}
                  </h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>

              {/* Category Badge */}
              <Badge 
                variant={item.completed ? "default" : "outline"}
                className={`capitalize ${getCategoryColor(item.category)}`}
              >
                {item.category}
              </Badge>
            </div>
          ))}
        </div>

        {/* Next Steps */}
        {completionPercentage < 100 && (
          <div className="bg-secondary/10 rounded-lg p-4 border border-secondary/20">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-secondary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Next Steps</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete the remaining tasks to unlock all features and maximize your EPC rewards!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
