import { useState } from 'react';
import { useGetDisplayNameChangeHistory, useGetDisplayNameChangeHistoryByPrincipal, useGetDisplayNameChangeHistoryByDisplayName } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, User, ArrowRight } from 'lucide-react';
import { Principal } from '@icp-sdk/core/principal';

export default function DisplayNameHistoryTab() {
  const [searchType, setSearchType] = useState<'all' | 'principal' | 'displayName'>('all');
  const [principalSearch, setPrincipalSearch] = useState('');
  const [displayNameSearch, setDisplayNameSearch] = useState('');
  const [activePrincipalSearch, setActivePrincipalSearch] = useState<Principal | null>(null);
  const [activeDisplayNameSearch, setActiveDisplayNameSearch] = useState<string | null>(null);

  const { data: allHistory, isLoading: allLoading } = useGetDisplayNameChangeHistory();
  const { data: principalHistory, isLoading: principalLoading } = useGetDisplayNameChangeHistoryByPrincipal(activePrincipalSearch);
  const { data: displayNameHistory, isLoading: displayNameLoading } = useGetDisplayNameChangeHistoryByDisplayName(activeDisplayNameSearch);

  const handlePrincipalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (principalSearch.trim()) {
      try {
        const principal = Principal.fromText(principalSearch.trim());
        setActivePrincipalSearch(principal);
      } catch (error) {
        console.error('Invalid Principal ID:', error);
        alert('Invalid Principal ID format');
      }
    }
  };

  const handleDisplayNameSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayNameSearch.trim()) {
      setActiveDisplayNameSearch(displayNameSearch.trim());
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  const renderHistoryTable = (history: typeof allHistory, isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      );
    }

    if (!history || history.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          No display name changes found
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Principal ID</TableHead>
              <TableHead>Old Name</TableHead>
              <TableHead className="text-center">→</TableHead>
              <TableHead>New Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.map((record, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatTimestamp(record.timestamp)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-mono text-xs">
                    {record.principalId.toString().slice(0, 12)}...
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {record.oldName}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                </TableCell>
                <TableCell>
                  <Badge variant="default" className="font-normal">
                    {record.newName}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Display Name Change History
        </CardTitle>
        <CardDescription>
          View all display name changes across the platform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={searchType} onValueChange={(value) => setSearchType(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Changes</TabsTrigger>
            <TabsTrigger value="principal">By Principal ID</TabsTrigger>
            <TabsTrigger value="displayName">By Display Name</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {renderHistoryTable(allHistory, allLoading)}
          </TabsContent>

          <TabsContent value="principal" className="space-y-4 mt-6">
            <form onSubmit={handlePrincipalSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="principalSearch">Principal ID</Label>
                  <Input
                    id="principalSearch"
                    placeholder="Enter principal ID to search..."
                    value={principalSearch}
                    onChange={(e) => setPrincipalSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={!principalSearch.trim()}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </form>

            {activePrincipalSearch && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing results for: <Badge variant="outline" className="ml-2 font-mono">{activePrincipalSearch.toString().slice(0, 12)}...</Badge>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActivePrincipalSearch(null);
                      setPrincipalSearch('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
                {renderHistoryTable(principalHistory, principalLoading)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="displayName" className="space-y-4 mt-6">
            <form onSubmit={handleDisplayNameSearch} className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="displayNameSearch">Display Name</Label>
                  <Input
                    id="displayNameSearch"
                    placeholder="Enter display name to search..."
                    value={displayNameSearch}
                    onChange={(e) => setDisplayNameSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" disabled={!displayNameSearch.trim()}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </form>

            {activeDisplayNameSearch && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing results for: <Badge variant="secondary" className="ml-2">{activeDisplayNameSearch}</Badge>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setActiveDisplayNameSearch(null);
                      setDisplayNameSearch('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
                {renderHistoryTable(displayNameHistory, displayNameLoading)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
