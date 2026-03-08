import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WalletTab from '../components/WalletTab';
import MessagingTab from '../components/MessagingTab';
import QuestTab from '../components/QuestTab';
import AdminTab from '../components/AdminTab';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { Wallet, MessageSquare, Trophy, Shield } from 'lucide-react';

/**
 * REFERENCE FILE - NOT IN USE
 * This file is preserved for design reference only.
 * The tabbed navigation design has been replaced with top-level routing.
 * See App.tsx for the current routing implementation.
 */
export default function Dashboard_REFERENCE() {
  const [activeTab, setActiveTab] = useState('wallet');
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();

  return (
    <div className="container py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Manage your wallet, messages, and learning progress.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full max-w-${isAdmin ? '2xl' : 'md'} ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="wallet" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Wallet</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Quests</span>
            </TabsTrigger>
            {!isAdminLoading && isAdmin && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="wallet" className="space-y-6">
            <WalletTab />
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <MessagingTab />
          </TabsContent>

          <TabsContent value="quests" className="space-y-6">
            <QuestTab />
          </TabsContent>

          {!isAdminLoading && isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <AdminTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
