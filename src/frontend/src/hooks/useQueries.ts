import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, Transaction, Message, Quest, QuestProgress, CourseModule, CourseProgress, QuestModule, QuestProgressRecord, EpqReward, CourseWithModules, DisplayNameChangeHistory, CourseModuleWithQuestions, MemberType, AuthenticationEvent, EpiqWallet, Chain } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

const DEFAULT_TIMEOUT = 15000;

// Helper function to create timeout promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number = DEFAULT_TIMEOUT): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useGetCallerUserProfile] Fetching caller user profile...');
      try {
        const result = await withTimeout(actor.getCallerUserProfile());
        console.log('[useGetCallerUserProfile] Profile fetched:', result);
        return result;
      } catch (error) {
        console.error('[useGetCallerUserProfile] Error fetching profile:', error);
        throw error;
      }
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return null;
      return withTimeout(actor.getUserProfile(user));
    },
    enabled: !!actor && !isFetching && !!user,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetAllUserProfiles() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, UserProfile][]>({
    queryKey: ['allUserProfiles'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllUserProfiles());
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.saveCallerUserProfile(profile));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useUpdateUserMemberType() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, memberType }: { user: Principal; memberType: string }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.updateUserMemberType(user, memberType));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
    },
  });
}

// Firebase Import
export function useImportSingleFirebaseUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.importSingleFirebaseUser(email));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
    },
  });
}

// Transaction Queries
export function useCreateTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, amount, currency }: { to: Principal; amount: bigint; currency: string }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.createTransaction(to, amount, currency));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTransactions'] });
    },
  });
}

export function useGetTransaction(id: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction | null>({
    queryKey: ['transaction', id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return withTimeout(actor.getTransaction(id));
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useGetUserTransactions() {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['userTransactions'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getUserTransactions());
    },
    enabled: !!actor && !isFetching,
  });
}

// Message Queries
export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, content }: { to: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.sendMessage(to, content));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['allMessages'] });
    },
  });
}

export function useGetMessagesWithUser(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return withTimeout(actor.getMessagesWithUser(user));
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useGetAllMessages() {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['allMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllMessages());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkMessageAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.markMessageAsRead(messageId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['allMessages'] });
    },
  });
}

// Quest Queries
export function useCreateQuest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, category, steps }: { title: string; description: string; category: string; steps: string[] }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.createQuest(title, description, category, steps));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quests'] });
    },
  });
}

export function useGetAllQuests() {
  const { actor, isFetching } = useActor();

  return useQuery<Quest[]>({
    queryKey: ['quests'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllQuests());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateQuestProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questId, completedSteps, completed }: { questId: bigint; completedSteps: bigint[]; completed: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.updateQuestProgress(questId, completedSteps, completed));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questProgress'] });
    },
  });
}

export function useGetUserQuestProgress(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<QuestProgress[]>({
    queryKey: ['questProgress', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return withTimeout(actor.getUserQuestProgress(user));
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useGetAllUserQuestProgress() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, QuestProgress[]][]>({
    queryKey: ['allQuestProgress'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllUserQuestProgress());
    },
    enabled: !!actor && !isFetching,
  });
}

// Course Module Queries
export function useGetAllCourseModules() {
  const { actor, isFetching } = useActor();

  return useQuery<CourseModule[]>({
    queryKey: ['courseModules'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllCourseModules());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateCourseProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId, completedSteps, completed }: { moduleId: bigint; completedSteps: bigint[]; completed: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.updateCourseProgress(moduleId, completedSteps, completed));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courseProgress'] });
    },
  });
}

export function useGetUserCourseProgress(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CourseProgress[]>({
    queryKey: ['courseProgress', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return withTimeout(actor.getUserCourseProgress(user));
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useGetAllUserCourseProgress() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, CourseProgress[]][]>({
    queryKey: ['allCourseProgress'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllUserCourseProgress());
    },
    enabled: !!actor && !isFetching,
  });
}

// Quest Module Queries
export function useGetAllQuestModules() {
  const { actor, isFetching } = useActor();

  return useQuery<QuestModule[]>({
    queryKey: ['questModules'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllQuestModules());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateQuestProgressRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ moduleId, completedSteps, completed }: { moduleId: bigint; completedSteps: bigint[]; completed: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.updateQuestProgressRecord(moduleId, completedSteps, completed));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questProgressRecords'] });
      queryClient.invalidateQueries({ queryKey: ['epqRewards'] });
    },
  });
}

export function useGetUserQuestProgressRecords(user?: Principal | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const targetUser = user ?? (identity ? identity.getPrincipal() : null);

  return useQuery<QuestProgressRecord[]>({
    queryKey: ['questProgressRecords', targetUser?.toString()],
    queryFn: async () => {
      if (!actor || !targetUser) return [];
      return withTimeout(actor.getUserQuestProgressRecords(targetUser));
    },
    enabled: !!actor && !isFetching && !!targetUser,
  });
}

export function useGetAllUserQuestProgressRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, QuestProgressRecord[]][]>({
    queryKey: ['allQuestProgressRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllUserQuestProgressRecords());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserEpqRewards(user?: Principal | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const targetUser = user ?? (identity ? identity.getPrincipal() : null);

  return useQuery<EpqReward[]>({
    queryKey: ['epqRewards', targetUser?.toString()],
    queryFn: async () => {
      if (!actor || !targetUser) return [];
      return withTimeout(actor.getUserEpqRewards(targetUser));
    },
    enabled: !!actor && !isFetching && !!targetUser,
  });
}

// Course with Modules Queries (alias for getAllCourses)
export function useGetAllCourses() {
  const { actor, isFetching } = useActor();

  return useQuery<CourseWithModules[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllCourses());
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export function useGetAllCoursesWithModules() {
  return useGetAllCourses();
}

export function useCreateCourse() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, category, initialModules }: { title: string; description: string; category: string; initialModules?: CourseModuleWithQuestions[] | null }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.createCourse(title, description, category, initialModules ?? null));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

export function useCreateCourseWithModules() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, category, modules, reward, availableToAll, assignedMemberTypes }: { title: string; description: string; category: string; modules: CourseModuleWithQuestions[]; reward: bigint; availableToAll: boolean; assignedMemberTypes: MemberType[] }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.createCourseWithModules(title, description, category, modules, reward, availableToAll, assignedMemberTypes));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });
}

// Display Name Change History Queries
export function useGetDisplayNameChangeHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<DisplayNameChangeHistory[]>({
    queryKey: ['displayNameChangeHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getDisplayNameChangeHistory());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDisplayNameChangeHistoryByPrincipal(principalId: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DisplayNameChangeHistory[]>({
    queryKey: ['displayNameChangeHistory', 'principal', principalId?.toString()],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      return withTimeout(actor.getDisplayNameChangeHistoryByPrincipal(principalId));
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

export function useGetDisplayNameChangeHistoryByDisplayName(displayName: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DisplayNameChangeHistory[]>({
    queryKey: ['displayNameChangeHistory', 'displayName', displayName],
    queryFn: async () => {
      if (!actor || !displayName) return [];
      return withTimeout(actor.getDisplayNameChangeHistoryByDisplayName(displayName));
    },
    enabled: !!actor && !isFetching && !!displayName,
  });
}

export function useFindUserByDisplayName() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.findUserByDisplayName(displayName));
    },
  });
}

// Admin Queries
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return withTimeout(actor.isCallerAdmin());
    },
    enabled: !!actor && !isFetching,
  });
}

// Balance Queries
export function useGetEthBalance() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.getEthBalance(address));
    },
  });
}

export function useGetBtcBalance() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.getBtcBalance(address));
    },
  });
}

export function useGetIcpBalance() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.getIcpBalance(address));
    },
  });
}

// Transaction History Queries
export function useGetEthTransactionHistory() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.getEthTransactionHistory(address));
    },
  });
}

export function useGetBtcTransactionHistory() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.getBtcTransactionHistory(address));
    },
  });
}

export function useGetIcpTransactionHistory() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (address: string) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.getIcpTransactionHistory(address));
    },
  });
}

// Authentication Audit Log Queries
export function useGetAuthenticationAuditLog() {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authenticationAuditLog'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAuthenticationAuditLog());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAuthenticationAuditLogByPrincipal(principalId: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authenticationAuditLog', 'principal', principalId?.toString()],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      return withTimeout(actor.getAuthenticationAuditLogByPrincipal(principalId));
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

export function useGetAuthenticationAuditLogByEpiqId(epiqId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authenticationAuditLog', 'epiqId', epiqId],
    queryFn: async () => {
      if (!actor || !epiqId) return [];
      return withTimeout(actor.getAuthenticationAuditLogByEpiqId(epiqId));
    },
    enabled: !!actor && !isFetching && !!epiqId,
  });
}

export function useGetAuthenticationAuditLogByMethod(authMethod: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authenticationAuditLog', 'method', authMethod],
    queryFn: async () => {
      if (!actor || !authMethod) return [];
      return withTimeout(actor.getAuthenticationAuditLogByMethod(authMethod));
    },
    enabled: !!actor && !isFetching && !!authMethod,
  });
}

export function useGetAuthenticationAuditLogByStatus(status: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authenticationAuditLog', 'status', status],
    queryFn: async () => {
      if (!actor || !status) return [];
      return withTimeout(actor.getAuthenticationAuditLogByStatus(status));
    },
    enabled: !!actor && !isFetching && !!status,
  });
}

export function useCleanupExpiredSessions() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.cleanupExpiredSessions());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authenticationAuditLog'] });
    },
  });
}

// EPIQ Wallet Queries
export function useListWallets() {
  const { actor, isFetching } = useActor();

  return useQuery<EpiqWallet[]>({
    queryKey: ['epiqWallets'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.listWallets());
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (walletLabel: string | null) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.createWallet(walletLabel));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epiqWallets'] });
    },
  });
}

export function useUpdateWalletLabel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ walletId, newLabel }: { walletId: bigint; newLabel: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.updateWalletLabel(walletId, newLabel));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['epiqWallets'] });
    },
  });
}

export function useGetWallet(walletId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<EpiqWallet>({
    queryKey: ['epiqWallet', walletId?.toString()],
    queryFn: async () => {
      if (!actor || walletId === null) throw new Error('Actor or wallet ID not available');
      return withTimeout(actor.getWallet(walletId));
    },
    enabled: !!actor && !isFetching && walletId !== null,
  });
}
