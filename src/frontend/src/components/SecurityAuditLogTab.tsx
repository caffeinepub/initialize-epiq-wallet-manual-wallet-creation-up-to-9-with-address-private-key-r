import { useState } from 'react';
import { useGetAuthenticationAuditLog, useGetAuthenticationAuditLogByPrincipal, useGetAuthenticationAuditLogByEpiqId, useGetAuthenticationAuditLogByMethod, useGetAuthenticationAuditLogByStatus, useCleanupExpiredSessions } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Search, Filter, Download, Trash2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function SecurityAuditLogTab() {
  const [filterType, setFilterType] = useState<'all' | 'principal' | 'epiqId' | 'method' | 'status'>('all');
  const [filterValue, setFilterValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: allLogs, isLoading: allLoading, refetch: refetchAll } = useGetAuthenticationAuditLog();
  const { data: principalLogs, isLoading: principalLoading } = useGetAuthenticationAuditLogByPrincipal(
    filterType === 'principal' ? searchQuery : null
  );
  const { data: epiqIdLogs, isLoading: epiqIdLoading } = useGetAuthenticationAuditLogByEpiqId(
    filterType === 'epiqId' ? searchQuery : null
  );
  const { data: methodLogs, isLoading: methodLoading } = useGetAuthenticationAuditLogByMethod(
    filterType === 'method' ? searchQuery : null
  );
  const { data: statusLogs, isLoading: statusLoading } = useGetAuthenticationAuditLogByStatus(
    filterType === 'status' ? searchQuery : null
  );

  const cleanupMutation = useCleanupExpiredSessions();

  const handleSearch = () => {
    setSearchQuery(filterValue);
  };

  const handleCleanup = async () => {
    try {
      const count = await cleanupMutation.mutateAsync();
      alert(`Successfully cleaned up ${count} expired sessions`);
      refetchAll();
    } catch (error) {
      console.error('Cleanup error:', error);
      alert('Failed to cleanup expired sessions');
    }
  };

  const handleExport = () => {
    const logs = filterType === 'all' ? allLogs : 
                 filterType === 'principal' ? principalLogs :
                 filterType === 'epiqId' ? epiqIdLogs :
                 filterType === 'method' ? methodLogs :
                 statusLogs;

    if (!logs || logs.length === 0) {
      alert('No logs to export');
      return;
    }

    const csv = [
      ['Timestamp', 'Principal ID', 'EPIQ ID', 'Auth Method', 'Status', 'Failure Reason'].join(','),
      ...logs.map(log => [
        new Date(Number(log.timestamp) / 1_000_000).toISOString(),
        log.principalId.toString(),
        log.epiqId || 'N/A',
        log.authMethod,
        log.status,
        log.failureReason || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-audit-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const logs = filterType === 'all' ? allLogs : 
               filterType === 'principal' ? principalLogs :
               filterType === 'epiqId' ? epiqIdLogs :
               filterType === 'method' ? methodLogs :
               statusLogs;

  const isLoading = allLoading || principalLoading || epiqIdLoading || methodLoading || statusLoading;

  const getStatusBadge = (status: string) => {
    if (status === 'success') {
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
  };

  const getMethodBadge = (method: string) => {
    if (method === 'Firebase') {
      return <Badge className="bg-[#EFBF04] text-black">Firebase</Badge>;
    }
    return <Badge className="bg-[#6A5ACD]">Internet Identity</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#6A5ACD] to-[#EFBF04] flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Security Audit Log</h2>
            <p className="text-sm text-muted-foreground">Monitor authentication events and security activities</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleCleanup}
            disabled={cleanupMutation.isPending}
            variant="outline"
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Cleanup Expired Sessions
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#6A5ACD]" />
            Filter Audit Logs
          </CardTitle>
          <CardDescription>Search and filter authentication events</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Filter Type</Label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="principal">By Principal ID</SelectItem>
                  <SelectItem value="epiqId">By EPIQ ID</SelectItem>
                  <SelectItem value="method">By Auth Method</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filterType !== 'all' && (
              <>
                <div className="space-y-2">
                  <Label>Search Value</Label>
                  {filterType === 'method' ? (
                    <Select value={filterValue} onValueChange={setFilterValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Firebase">Firebase</SelectItem>
                        <SelectItem value="InternetIdentity">Internet Identity</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : filterType === 'status' ? (
                    <Select value={filterValue} onValueChange={setFilterValue}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failure">Failure</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder={`Enter ${filterType}...`}
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                    />
                  )}
                </div>

                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full gap-2 bg-gradient-to-r from-[#6A5ACD] to-[#EFBF04]">
                    <Search className="h-4 w-4" />
                    Search
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Events</CardTitle>
          <CardDescription>
            {logs ? `Showing ${logs.length} events` : 'Loading...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="h-12 w-12 mx-auto rounded-full bg-gradient-to-br from-[#6A5ACD] to-[#EFBF04] animate-pulse" />
                <p className="text-muted-foreground">Loading audit logs...</p>
              </div>
            </div>
          ) : !logs || logs.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No authentication events found</AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Principal ID</TableHead>
                    <TableHead>EPIQ ID</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Failure Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {new Date(Number(log.timestamp) / 1_000_000).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.principalId.toString().substring(0, 20)}...
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.epiqId || <span className="text-muted-foreground">N/A</span>}
                      </TableCell>
                      <TableCell>{getMethodBadge(log.authMethod)}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm">
                        {log.failureReason || <span className="text-muted-foreground">N/A</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
