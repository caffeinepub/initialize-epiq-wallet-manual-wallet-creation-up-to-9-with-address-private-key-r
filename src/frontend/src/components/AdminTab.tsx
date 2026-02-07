import { useState } from 'react';
import { useGetAllUserProfiles, useUpdateUserMemberType, useImportSingleFirebaseUser } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Eye, Users, BookOpen, History, Download, CheckCircle, AlertCircle, ClipboardCheck } from 'lucide-react';
import UserProgressDialog from './UserProgressDialog';
import EpcRewardsDialog from './EpcRewardsDialog';
import CourseManagementTab from './CourseManagementTab';
import DisplayNameHistoryTab from './DisplayNameHistoryTab';
import Phase1TestingPlan from './Phase1TestingPlan';
import { Principal } from '@icp-sdk/core/principal';

const MEMBER_TYPES = [
  'Individual',
  'Business',
  'Trust',
  'Foundation',
  'DAO',
  'Other',
];

export default function AdminTab() {
  const { data: userProfiles, isLoading } = useGetAllUserProfiles();
  const updateMemberType = useUpdateUserMemberType();
  const importUser = useImportSingleFirebaseUser();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedUserForRewards, setSelectedUserForRewards] = useState<string | null>(null);
  const [importEmail, setImportEmail] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const filteredUsers = userProfiles?.filter(([_, profile]) => {
    const search = searchTerm.toLowerCase();
    return (
      profile.name.toLowerCase().includes(search) ||
      profile.displayName.toLowerCase().includes(search) ||
      profile.email.toLowerCase().includes(search) ||
      profile.memberType.toLowerCase().includes(search)
    );
  });

  const handleMemberTypeChange = async (userPrincipal: string, newMemberType: string) => {
    const principal = Principal.fromText(userPrincipal);
    await updateMemberType.mutateAsync({
      user: principal,
      memberType: newMemberType,
    });
  };

  const handleImportUser = async () => {
    if (!importEmail.trim()) {
      setImportStatus({ type: 'error', message: 'Please enter a valid email address' });
      return;
    }

    setImportStatus({ type: null, message: '' });

    try {
      const result = await importUser.mutateAsync(importEmail.trim());
      setImportStatus({ type: 'success', message: result });
      setImportEmail('');
    } catch (error: any) {
      console.error('Import error:', error);
      const errorMessage = error?.message || 'Failed to import user from Firebase';
      setImportStatus({ type: 'error', message: errorMessage });
    }
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="members">
            <Users className="h-4 w-4 mr-2" />
            Members
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="displayNameHistory">
            <History className="h-4 w-4 mr-2" />
            Display Name History
          </TabsTrigger>
          <TabsTrigger value="phase1Testing">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Phase 1 Testing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 mt-6">
          {/* Firebase User Import Section */}
          <Card className="border-[#6A5ACD]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#6A5ACD]">
                <Download className="h-5 w-5" />
                Import Firebase User
              </CardTitle>
              <CardDescription>
                Import a single user from Firebase (EPIQ Shield) into EPIQ Life
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  placeholder="Enter user email address..."
                  value={importEmail}
                  onChange={(e) => setImportEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleImportUser();
                    }
                  }}
                  className="flex-1 focus:border-[#6A5ACD] focus:ring-[#6A5ACD]"
                  disabled={importUser.isPending}
                />
                <Button
                  onClick={handleImportUser}
                  disabled={importUser.isPending || !importEmail.trim()}
                  className="bg-[#6A5ACD] hover:bg-[#5A4ABD] text-white"
                >
                  {importUser.isPending ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Import User
                    </>
                  )}
                </Button>
              </div>

              {importStatus.type && (
                <Alert variant={importStatus.type === 'error' ? 'destructive' : 'default'} className={importStatus.type === 'success' ? 'border-green-500 bg-green-50' : ''}>
                  {importStatus.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription className={importStatus.type === 'success' ? 'text-green-800' : ''}>
                    {importStatus.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground space-y-1">
                <p className="font-medium">Import Process:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Fetches user profile from Firebase Auth API</li>
                  <li>Generates a Principal ID placeholder for the user</li>
                  <li>Creates a UserProfile record with imported data</li>
                  <li>Marks the record as imported from Firebase</li>
                  <li>Safely ignores duplicates if user already exists</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Member Management Section */}
          <Card>
            <CardHeader>
              <CardTitle>Member Management</CardTitle>
              <CardDescription>
                View and manage all registered users and their member types
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, display name, email, or member type..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#6A5ACD] border-t-transparent" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Display Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Member Type</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Principal ID</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers && filteredUsers.length > 0 ? (
                        filteredUsers.map(([principal, profile]) => (
                          <TableRow key={principal.toString()}>
                            <TableCell className="font-medium">{profile.name}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="font-normal">
                                {profile.displayName || profile.name}
                              </Badge>
                            </TableCell>
                            <TableCell>{profile.email}</TableCell>
                            <TableCell>
                              <Select
                                value={profile.memberType}
                                onValueChange={(value) =>
                                  handleMemberTypeChange(principal.toString(), value)
                                }
                                disabled={updateMemberType.isPending}
                              >
                                <SelectTrigger className="w-[140px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {MEMBER_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                      {type}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {profile.importedFromFirebase ? (
                                <Badge variant="outline" className="bg-[#EFBF04] bg-opacity-10 text-[#EFBF04] border-[#EFBF04]">
                                  Firebase
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-[#6A5ACD] bg-opacity-10 text-[#6A5ACD] border-[#6A5ACD]">
                                  Internet Identity
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {principal.toString().slice(0, 8)}...
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedUser(principal.toString())}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Progress
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            {searchTerm ? 'No users found matching your search' : 'No users registered yet'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4 mt-6">
          <CourseManagementTab />
        </TabsContent>

        <TabsContent value="displayNameHistory" className="space-y-4 mt-6">
          <DisplayNameHistoryTab />
        </TabsContent>

        <TabsContent value="phase1Testing" className="space-y-4 mt-6">
          <Phase1TestingPlan />
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <UserProgressDialog
          userPrincipal={selectedUser}
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
        />
      )}

      {selectedUserForRewards && (
        <EpcRewardsDialog
          userPrincipal={selectedUserForRewards}
          open={!!selectedUserForRewards}
          onOpenChange={(open) => !open && setSelectedUserForRewards(null)}
        />
      )}
    </div>
  );
}
