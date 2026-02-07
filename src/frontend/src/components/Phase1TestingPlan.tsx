import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Shield, Users, Database, AlertTriangle } from 'lucide-react';

export default function Phase1TestingPlan() {
  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">Phase 1 Testing Plan</CardTitle>
              <CardDescription>
                Verification checklist for dual authentication and user data consistency
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Group 1: Dual Authentication Verification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">1. Dual Authentication Verification</h3>
            </div>
            <div className="ml-7 space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium text-sm">Test Internet Identity Login</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Complete registration flow with Internet Identity</li>
                  <li>Verify successful login and session persistence</li>
                  <li>Test logout functionality</li>
                  <li>Confirm no cross-login interference</li>
                </ul>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium text-sm">Test EPIQ Shield (Firebase) Login</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Authenticate using EPIQ ID + password via /verifyPassword endpoint</li>
                  <li>Verify success messages and session creation</li>
                  <li>Test logout and session cleanup</li>
                  <li>Confirm no interference with Internet Identity sessions</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Group 2: Data Consistency Tests */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">2. Data Consistency Tests</h3>
            </div>
            <div className="ml-7 space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium text-sm">Profile Field Synchronization</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Compare display name, email, wallet address from Firebase</li>
                  <li>Verify all data updates correctly in EPIQ Life backend</li>
                  <li>Confirm member type field matches Firebase records</li>
                  <li>Check that profile data persists across sessions</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Group 3: Session Transition Validation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">3. Session Transition Validation</h3>
            </div>
            <div className="ml-7 space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium text-sm">Cross-Login Session Testing</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Log in with EPIQ ID, then log out</li>
                  <li>Re-login via Internet Identity</li>
                  <li>Verify session isolation (no data leakage)</li>
                  <li>Confirm user assignments and data remain correct</li>
                  <li>Test session expiry and automatic cleanup</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Group 4: Auto-Mapping Confirmation */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">4. Auto-Mapping Confirmation</h3>
            </div>
            <div className="ml-7 space-y-3">
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="font-medium text-sm">EPIQ ID to Principal ID Mapping</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                  <li>Verify imported EPIQ IDs link to correct Principal IDs</li>
                  <li>Check mapping tables for accuracy</li>
                  <li>Confirm duplicate prevention (unique EPIQ ID + Principal ID pairs)</li>
                  <li>Test that imported users cannot login via Firebase (must use Internet Identity)</li>
                </ul>
              </div>
            </div>
          </div>

          <Separator />

          {/* Success Criteria */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Success Criteria
              </Badge>
            </h3>
            <div className="ml-7 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  No duplicate accounts created during authentication flows
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Consistent user profile data across both login paths
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Valid session transitions without data loss or corruption
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Identical user experience across Internet Identity and EPIQ Shield authentication
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
