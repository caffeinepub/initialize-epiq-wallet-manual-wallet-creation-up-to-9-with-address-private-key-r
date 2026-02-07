import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  useGetAllUserProfiles, 
  useGetAllCoursesWithModules, 
  useGetAllUserQuestProgressRecords,
  useIsCallerAdmin 
} from '../hooks/useQueries';
import { 
  Users, 
  BookOpen, 
  Coins, 
  TrendingUp, 
  Shield, 
  History,
  Settings,
  AlertCircle,
  ArrowRight,
  Trophy,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function GovernanceDashboard() {
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: userProfiles, isLoading: usersLoading, isError: usersError } = useGetAllUserProfiles();
  const { data: courses, isLoading: coursesLoading, isError: coursesError } = useGetAllCoursesWithModules();
  const { data: allProgressRecords, isLoading: progressLoading } = useGetAllUserQuestProgressRecords();
  const navigate = useNavigate();

  // Calculate total EPC rewards distributed across all users
  const getTotalEPCDistributed = () => {
    if (!allProgressRecords) return 0;
    
    // Each completed module awards 5 EPC
    const completedModules = allProgressRecords.reduce((total, [_, records]) => {
      return total + records.filter(r => r.completed).length;
    }, 0);
    
    return completedModules * 5;
  };

  // Calculate active quests (courses with at least one user in progress)
  const getActiveQuests = () => {
    if (!allProgressRecords || !courses) return 0;
    
    const activeModuleIds = new Set<string>();
    allProgressRecords.forEach(([_, records]) => {
      records.forEach(record => {
        if (!record.completed && record.completedSteps.length > 0) {
          activeModuleIds.add(record.moduleId.toString());
        }
      });
    });
    
    return activeModuleIds.size;
  };

  // Calculate pending actions (users with incomplete modules)
  const getPendingActions = () => {
    if (!allProgressRecords) return 0;
    
    let pendingCount = 0;
    allProgressRecords.forEach(([_, records]) => {
      records.forEach(record => {
        if (!record.completed && record.completedSteps.length > 0) {
          pendingCount++;
        }
      });
    });
    
    return pendingCount;
  };

  // Calculate completion rate
  const getCompletionRate = () => {
    if (!allProgressRecords || !courses) return 0;
    
    const totalModules = courses.reduce((sum, course) => sum + course.modules.length, 0);
    if (totalModules === 0) return 0;
    
    const completedModules = allProgressRecords.reduce((total, [_, records]) => {
      return total + records.filter(r => r.completed).length;
    }, 0);
    
    const totalPossibleCompletions = (userProfiles?.length || 0) * totalModules;
    if (totalPossibleCompletions === 0) return 0;
    
    return Math.round((completedModules / totalPossibleCompletions) * 100);
  };

  const navigateToSection = (section: string) => {
    navigate({ to: `/${section}` as any });
  };

  // Check if user is admin
  if (adminLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Loading governance dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You must be an administrator to view the governance dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isLoading = usersLoading || coursesLoading || progressLoading;
  const hasError = usersError || coursesError;

  return (
    <div className="container py-8 space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-6 border border-primary/20">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-full bg-primary/10 p-2">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Governance Dashboard
          </h1>
        </div>
        <p className="text-muted-foreground">
          Site-wide administration and oversight for EPIQ Life platform
        </p>
      </div>

      {/* Error State */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load some dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      )}

      {/* Site-Wide Metrics */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Platform Overview</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users Card */}
          <Card className="hover:shadow-lg transition-shadow border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-primary/10 p-2">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className="bg-primary/5">Active</Badge>
              </div>
              <CardTitle className="text-3xl font-bold mt-4">
                {isLoading ? (
                  <div className="h-9 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  userProfiles?.length || 0
                )}
              </CardTitle>
              <CardDescription>Total Members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span>Platform users</span>
              </div>
            </CardContent>
          </Card>

          {/* Active Quests Card */}
          <Card className="hover:shadow-lg transition-shadow border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-primary/10 p-2">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className="bg-primary/5">In Progress</Badge>
              </div>
              <CardTitle className="text-3xl font-bold mt-4">
                {isLoading ? (
                  <div className="h-9 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  getActiveQuests()
                )}
              </CardTitle>
              <CardDescription>Active Quests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                <span>Modules in progress</span>
              </div>
            </CardContent>
          </Card>

          {/* EPC Rewards Distributed Card */}
          <Card className="hover:shadow-lg transition-shadow border-secondary/20 bg-secondary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-secondary/10 p-2">
                  <Coins className="h-5 w-5 text-secondary" />
                </div>
                <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                  EPC
                </Badge>
              </div>
              <CardTitle className="text-3xl font-bold mt-4 text-secondary">
                {isLoading ? (
                  <div className="h-9 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  getTotalEPCDistributed()
                )}
              </CardTitle>
              <CardDescription>Rewards Distributed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-secondary" />
                <span>Total EPC earned</span>
              </div>
            </CardContent>
          </Card>

          {/* Pending Actions Card */}
          <Card className="hover:shadow-lg transition-shadow border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-primary/10 p-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="outline" className="bg-primary/5">Pending</Badge>
              </div>
              <CardTitle className="text-3xl font-bold mt-4">
                {isLoading ? (
                  <div className="h-9 w-16 bg-muted animate-pulse rounded" />
                ) : (
                  getPendingActions()
                )}
              </CardTitle>
              <CardDescription>Incomplete Modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>User progress tracking</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform Statistics */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Platform Statistics</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Course Statistics Card */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Course Statistics</CardTitle>
              </div>
              <CardDescription>Learning content overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Courses</span>
                    <Badge variant="outline" className="font-mono">
                      {courses?.length || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Modules</span>
                    <Badge variant="outline" className="font-mono">
                      {courses?.reduce((sum, course) => sum + course.modules.length, 0) || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <Badge variant="outline" className="font-mono">
                      {getCompletionRate()}%
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* System Announcements Card */}
          <Card className="border-secondary/20 bg-secondary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-secondary/10 p-2">
                  <AlertCircle className="h-5 w-5 text-secondary" />
                </div>
                <CardTitle>System Status</CardTitle>
              </div>
              <CardDescription>Platform health and announcements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">All Systems Operational</p>
                  <p className="text-xs text-muted-foreground">Platform running smoothly</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Recent Activity</p>
                <p className="text-xs text-muted-foreground">
                  {userProfiles?.length || 0} active members • {courses?.length || 0} courses available
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Navigation */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Administration</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Members Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToSection('admin')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-lg">Members</CardTitle>
              <CardDescription>Manage user profiles and member types</CardDescription>
            </CardHeader>
          </Card>

          {/* Course Management */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToSection('admin')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-lg">Courses</CardTitle>
              <CardDescription>Create and manage learning content</CardDescription>
            </CardHeader>
          </Card>

          {/* Display Name History */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => navigateToSection('admin')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <History className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-lg">Display Name History</CardTitle>
              <CardDescription>Track user name changes</CardDescription>
            </CardHeader>
          </Card>

          {/* System Settings */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="rounded-full bg-primary/10 p-3 group-hover:bg-primary/20 transition-colors">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-lg">System Settings</CardTitle>
              <CardDescription>Configure platform parameters</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
            onClick={() => navigateToSection('admin')}
          >
            <Users className="h-5 w-5 mr-2" />
            Manage Members
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigateToSection('admin')}
          >
            <BookOpen className="h-5 w-5 mr-2" />
            Manage Courses
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigateToSection('admin')}
          >
            <History className="h-5 w-5 mr-2" />
            View History
          </Button>
        </div>
      </div>
    </div>
  );
}
