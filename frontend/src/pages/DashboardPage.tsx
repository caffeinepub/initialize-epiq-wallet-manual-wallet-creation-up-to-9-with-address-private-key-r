import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useGetUserEpqRewards, useGetUserQuestProgressRecords, useGetAllCoursesWithModules, useGetCallerUserProfile } from '../hooks/useQueries';
import { Wallet, MessageSquare, Trophy, ArrowRight, Coins, GraduationCap } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function DashboardPage() {
  const { data: userProfile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: epcRewards, isLoading: rewardsLoading } = useGetUserEpqRewards();
  const { data: progressRecords, isLoading: progressLoading } = useGetUserQuestProgressRecords();
  const { data: courses, isLoading: coursesLoading } = useGetAllCoursesWithModules();
  const navigate = useNavigate();

  const navigateToSection = (section: string) => {
    navigate({ to: `/${section}` as any });
  };

  const getTotalEPC = () => {
    return epcRewards?.reduce((sum, reward) => sum + Number(reward.amount), 0) || 0;
  };

  const getCompletionPercentage = () => {
    if (!courses || courses.length === 0) return 0;
    
    const totalModules = courses.reduce((sum, course) => sum + course.modules.length, 0);
    if (totalModules === 0) return 0;
    
    const completedModules = progressRecords?.filter(p => p.completed).length || 0;
    return Math.round((completedModules / totalModules) * 100);
  };

  const getLastActiveModule = () => {
    if (!progressRecords || progressRecords.length === 0 || !courses) return null;
    
    const sortedRecords = [...progressRecords].sort((a, b) => 
      Number(b.timestamp) - Number(a.timestamp)
    );
    
    const lastRecord = sortedRecords[0];
    
    for (const course of courses) {
      const module = course.modules.find(m => m.id === lastRecord.moduleId);
      if (module) {
        return module.title;
      }
    }
    
    return null;
  };

  // Get display name or fall back to registered name
  const getGreetingName = () => {
    if (!userProfile) return 'EPIQ Life';
    
    // Use display name if set and not empty, otherwise fall back to registered name
    const displayName = userProfile.displayName?.trim();
    if (displayName && displayName.length > 0) {
      return displayName;
    }
    
    return userProfile.name || 'EPIQ Life';
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Personalized Welcome Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-6 border border-primary/20">
        {profileLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-64 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Welcome back, {getGreetingName()}!
            </h1>
            <p className="text-muted-foreground mt-2">Your Web3 community dashboard</p>
          </>
        )}
      </div>

      {/* Summary Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Overview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Wallet Overview Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Wallet</CardTitle>
                </div>
              </div>
              <CardDescription>Your crypto balances</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">ICP</span>
                  <Badge variant="outline" className="font-mono">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">ETH</span>
                  <Badge variant="outline" className="font-mono">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">BTC</span>
                  <Badge variant="outline" className="font-mono">0</Badge>
                </div>
              </div>
              <Separator />
              <Button 
                variant="ghost" 
                className="w-full justify-between group"
                onClick={() => navigateToSection('wallet')}
              >
                View Full Wallet
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Messages Overview Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Messages</CardTitle>
                </div>
              </div>
              <CardDescription>Recent conversations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent messages
                </p>
              </div>
              <Separator />
              <Button 
                variant="ghost" 
                className="w-full justify-between group"
                onClick={() => navigateToSection('messages')}
              >
                View All Messages
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          {/* Quest Progress Overview Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-primary/10 p-2">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Quest Progress</CardTitle>
                </div>
              </div>
              <CardDescription>Your learning journey</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {progressLoading || coursesLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Completion</span>
                      <Badge variant="outline" className="font-mono">
                        {getCompletionPercentage()}%
                      </Badge>
                    </div>
                    {getLastActiveModule() ? (
                      <div className="space-y-1">
                        <span className="text-sm font-medium">Last Active</span>
                        <p className="text-sm text-muted-foreground">
                          {getLastActiveModule()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Start your learning journey
                      </p>
                    )}
                  </div>
                  <Separator />
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between group"
                    onClick={() => navigateToSection('quests')}
                  >
                    Continue Learning
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* EPC Rewards Card */}
      <Card className="border-secondary/20 bg-secondary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-secondary/10 p-2">
                <Coins className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <CardTitle className="text-xl">EPC Rewards</CardTitle>
                <CardDescription>Your EPIQ Cash balance</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-secondary">
                {rewardsLoading ? '...' : getTotalEPC()}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Total EPC Earned</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Complete learning modules to earn more EPC rewards
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Button 
            size="lg" 
            className="h-auto py-6"
            onClick={() => navigateToSection('wallet')}
          >
            <div className="flex flex-col items-center gap-2">
              <Wallet className="h-6 w-6" />
              <span>Manage Wallet</span>
            </div>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="h-auto py-6"
            onClick={() => navigateToSection('messages')}
          >
            <div className="flex flex-col items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <span>Send Message</span>
            </div>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="h-auto py-6"
            onClick={() => navigateToSection('quests')}
          >
            <div className="flex flex-col items-center gap-2">
              <Trophy className="h-6 w-6" />
              <span>Start Quest</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}
