import { useGetUserEpqRewards, useGetAllUserProfiles, useGetUserQuestProgressRecords, useGetAllCoursesWithModules } from '../hooks/useQueries';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Coins, CheckCircle2, History } from 'lucide-react';
import { format } from 'date-fns';
import { Principal } from '@icp-sdk/core/principal';

interface EpcRewardsDialogProps {
  userPrincipal: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EpcRewardsDialog({ userPrincipal, open, onOpenChange }: EpcRewardsDialogProps) {
  const principal = open ? Principal.fromText(userPrincipal) : null;
  const { data: rewards, isLoading: rewardsLoading } = useGetUserEpqRewards(principal);
  const { data: progressRecords, isLoading: progressLoading } = useGetUserQuestProgressRecords(principal);
  const { data: courses } = useGetAllCoursesWithModules();
  const { data: allUserProfiles } = useGetAllUserProfiles();

  const getUserName = () => {
    const userProfile = allUserProfiles?.find(([principal]) => principal.toString() === userPrincipal);
    return userProfile?.[1]?.name || 'User';
  };

  const getTotalEPC = () => {
    return rewards?.reduce((sum, reward) => sum + Number(reward.amount), 0) || 0;
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return format(date, 'PPpp');
  };

  const getModuleById = (moduleId: bigint) => {
    for (const course of courses || []) {
      const module = course.modules.find((m) => m.id === moduleId);
      if (module) {
        return { ...module, courseReward: course.reward };
      }
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">EPC Rewards: {getUserName()}</DialogTitle>
              <DialogDescription className="mt-1">
                View EPC rewards and module completion records
              </DialogDescription>
            </div>
            <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20 text-lg px-4 py-2">
              <Coins className="h-5 w-5 mr-2" />
              {getTotalEPC()} EPC
            </Badge>
          </div>
        </DialogHeader>

        <Tabs defaultValue="rewards" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rewards">
              <Coins className="h-4 w-4 mr-2" />
              Rewards History
            </TabsTrigger>
            <TabsTrigger value="completions">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Module Completions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-4 mt-4">
            {rewardsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : rewards && rewards.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rewards.map((reward) => (
                      <TableRow key={Number(reward.id)}>
                        <TableCell className="text-sm">
                          {formatTimestamp(reward.timestamp)}
                        </TableCell>
                        <TableCell className="font-medium">{reward.source}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                            +{Number(reward.amount)} EPC
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reward.verified ? (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                              <History className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No rewards found for this user
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completions" className="space-y-4 mt-4">
            {progressLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : progressRecords && progressRecords.length > 0 ? (
              <div className="space-y-4">
                {progressRecords.map((record) => {
                  const module = getModuleById(record.moduleId);
                  if (!module) return null;

                  return (
                    <Card key={Number(record.moduleId)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{module.title}</CardTitle>
                            <CardDescription className="mt-1">
                              Completed on {formatTimestamp(record.timestamp)}
                            </CardDescription>
                          </div>
                          {record.completed ? (
                            <Badge className="bg-green-500">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="secondary">In Progress</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Steps Completed</span>
                            <span className="font-medium">
                              {record.completedSteps.length}/3
                            </span>
                          </div>
                          {record.completed && (
                            <div className="flex items-center justify-between text-sm pt-2 border-t">
                              <span className="text-muted-foreground">Reward Earned</span>
                              <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/20">
                                <Coins className="h-3 w-3 mr-1" />
                                +{Number(module.courseReward)} EPC
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No module completions found for this user
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
