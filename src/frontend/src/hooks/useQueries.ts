import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, Transaction, Message, Quest, QuestProgress, CourseModule, CourseProgress, QuestModule, QuestProgressRecord, EpqReward, CourseWithModules, DisplayNameChangeHistory, CourseModuleWithQuestions, MemberType, AuthenticationEvent, EpiqWallet } from '../backend';
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

// Admin Check Query
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return withTimeout(actor.isCallerAdmin());
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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

export function useGetUserTransactions() {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['userTransactions'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getUserTransactions());
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
      queryClient.invalidateQueries({ queryKey: ['allMessages'] });
    },
  });
}

export function useGetMessagesWithUser(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messagesWithUser', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return withTimeout(actor.getMessagesWithUser(user));
    },
    enabled: !!actor && !isFetching && !!user,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
      queryClient.invalidateQueries({ queryKey: ['allMessages'] });
    },
  });
}

// Quest Queries
export function useGetAllQuests() {
  const { actor, isFetching } = useActor();

  return useQuery<Quest[]>({
    queryKey: ['allQuests'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllQuests());
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
      queryClient.invalidateQueries({ queryKey: ['userQuestProgress'] });
    },
  });
}

export function useGetUserQuestProgress(user: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<QuestProgress[]>({
    queryKey: ['userQuestProgress', user.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getUserQuestProgress(user));
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetAllUserQuestProgress() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, QuestProgress[]][]>({
    queryKey: ['allUserQuestProgress'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllUserQuestProgress());
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Course Module Queries
export function useGetAllCourseModules() {
  const { actor, isFetching } = useActor();

  return useQuery<CourseModule[]>({
    queryKey: ['allCourseModules'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllCourseModules());
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
      queryClient.invalidateQueries({ queryKey: ['userCourseProgress'] });
    },
  });
}

export function useGetUserCourseProgress(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<CourseProgress[]>({
    queryKey: ['userCourseProgress', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return withTimeout(actor.getUserCourseProgress(user));
    },
    enabled: !!actor && !isFetching && !!user,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetAllUserCourseProgress() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, CourseProgress[]][]>({
    queryKey: ['allUserCourseProgress'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllUserCourseProgress());
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Quest Module Queries
export function useGetAllQuestModules() {
  const { actor, isFetching } = useActor();

  return useQuery<QuestModule[]>({
    queryKey: ['allQuestModules'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllQuestModules());
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
      queryClient.invalidateQueries({ queryKey: ['userQuestProgressRecords'] });
      queryClient.invalidateQueries({ queryKey: ['userEpqRewards'] });
    },
  });
}

export function useGetUserQuestProgressRecords(user?: Principal | null) {
  const { identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  
  // Use provided user or fall back to current user's principal
  const targetUser = user || identity?.getPrincipal();

  return useQuery<QuestProgressRecord[]>({
    queryKey: ['userQuestProgressRecords', targetUser?.toString()],
    queryFn: async () => {
      if (!actor || !targetUser) return [];
      return withTimeout(actor.getUserQuestProgressRecords(targetUser));
    },
    enabled: !!actor && !isFetching && !!targetUser,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetAllUserQuestProgressRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, QuestProgressRecord[]][]>({
    queryKey: ['allUserQuestProgressRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return withTimeout(actor.getAllUserQuestProgressRecords());
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// EPC Rewards Queries
export function useGetUserEpqRewards(user?: Principal | null) {
  const { identity } = useInternetIdentity();
  const { actor, isFetching } = useActor();
  
  // Use provided user or fall back to current user's principal
  const targetUser = user || identity?.getPrincipal();

  return useQuery<EpqReward[]>({
    queryKey: ['userEpqRewards', targetUser?.toString()],
    queryFn: async () => {
      if (!actor || !targetUser) return [];
      return withTimeout(actor.getUserEpqRewards(targetUser));
    },
    enabled: !!actor && !isFetching && !!targetUser,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Course with Modules Queries
export function useGetAllCoursesWithModules() {
  const { actor, isFetching } = useActor();

  return useQuery<CourseWithModules[]>({
    queryKey: ['allCoursesWithModules'],
    queryFn: async () => {
      if (!actor) return [];
      console.log('[useGetAllCoursesWithModules] Fetching courses...');
      try {
        const result = await withTimeout(actor.getAllCourses(), 30000);
        console.log('[useGetAllCoursesWithModules] Courses fetched:', result);
        return result;
      } catch (error) {
        console.error('[useGetAllCoursesWithModules] Error fetching courses:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useUpdateCourseWithModules() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      courseId,
      title,
      description,
      category,
      modules,
      reward,
      availableToAll,
      assignedMemberTypes,
    }: {
      courseId: bigint;
      title: string;
      description: string;
      category: string;
      modules: CourseModuleWithQuestions[];
      reward: bigint;
      availableToAll: boolean;
      assignedMemberTypes: MemberType[];
    }) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(
        actor.createCourseWithModules(title, description, category, modules, reward, availableToAll, assignedMemberTypes)
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCoursesWithModules'] });
    },
  });
}

export function useCreateCourse() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      category,
      initialModules,
    }: {
      title: string;
      description: string;
      category: string;
      initialModules: CourseModuleWithQuestions[] | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useCreateCourse] Creating course:', { title, description, category, initialModules });
      try {
        const result = await withTimeout(actor.createCourse(title, description, category, initialModules));
        console.log('[useCreateCourse] Course created with ID:', result);
        return result;
      } catch (error) {
        console.error('[useCreateCourse] Error creating course:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useCreateCourse] Invalidating course queries...');
      queryClient.invalidateQueries({ queryKey: ['allCoursesWithModules'] });
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
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetDisplayNameChangeHistoryByPrincipal(principalId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DisplayNameChangeHistory[]>({
    queryKey: ['displayNameChangeHistoryByPrincipal', principalId],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      const principal = Principal.fromText(principalId);
      return withTimeout(actor.getDisplayNameChangeHistoryByPrincipal(principal));
    },
    enabled: !!actor && !isFetching && !!principalId,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetDisplayNameChangeHistoryByDisplayName(displayName: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DisplayNameChangeHistory[]>({
    queryKey: ['displayNameChangeHistoryByDisplayName', displayName],
    queryFn: async () => {
      if (!actor || !displayName) return [];
      return withTimeout(actor.getDisplayNameChangeHistoryByDisplayName(displayName));
    },
    enabled: !!actor && !isFetching && !!displayName && displayName.length > 0,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

// Find User by Display Name
export function useFindUserByDisplayName() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error('Actor not available');
      return withTimeout(actor.findUserByDisplayName(displayName));
    },
  });
}

// Firebase User Import
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
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetAuthenticationAuditLogByPrincipal(principalId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authenticationAuditLogByPrincipal', principalId],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      const principal = Principal.fromText(principalId);
      return withTimeout(actor.getAuthenticationAuditLogByPrincipal(principal));
    },
    enabled: !!actor && !isFetching && !!principalId,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetAuthenticationAuditLogByEpiqId(epiqId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authenticationAuditLogByEpiqId', epiqId],
    queryFn: async () => {
      if (!actor || !epiqId) return [];
      return withTimeout(actor.getAuthenticationAuditLogByEpiqId(epiqId));
    },
    enabled: !!actor && !isFetching && !!epiqId && epiqId.length > 0,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetAuthenticationAuditLogByMethod(authMethod: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authenticationAuditLogByMethod', authMethod],
    queryFn: async () => {
      if (!actor || !authMethod) return [];
      return withTimeout(actor.getAuthenticationAuditLogByMethod(authMethod));
    },
    enabled: !!actor && !isFetching && !!authMethod && authMethod.length > 0,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useGetAuthenticationAuditLogByStatus(status: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authenticationAuditLogByStatus', status],
    queryFn: async () => {
      if (!actor || !status) return [];
      return withTimeout(actor.getAuthenticationAuditLogByStatus(status));
    },
    enabled: !!actor && !isFetching && !!status && status.length > 0,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
      console.log('[useListWallets] Fetching wallets...');
      try {
        const result = await withTimeout(actor.listWallets());
        console.log('[useListWallets] Wallets fetched:', result);
        return result;
      } catch (error) {
        console.error('[useListWallets] Error fetching wallets:', error);
        throw error;
      }
    },
    enabled: !!actor && !isFetching,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
}

export function useCreateWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (walletLabel: string | null) => {
      if (!actor) throw new Error('Actor not available');
      console.log('[useCreateWallet] Creating wallet with label:', walletLabel);
      try {
        const result = await withTimeout(actor.createWallet(walletLabel));
        console.log('[useCreateWallet] Wallet created:', result);
        return result;
      } catch (error) {
        console.error('[useCreateWallet] Error creating wallet:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('[useCreateWallet] Invalidating wallet queries...');
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
