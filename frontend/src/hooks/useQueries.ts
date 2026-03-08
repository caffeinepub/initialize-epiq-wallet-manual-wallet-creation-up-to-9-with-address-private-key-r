import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type {
  UserProfile,
  EpiqWallet,
  WalletCreationResult,
  WalletError,
  CourseWithModules,
  CourseModule,
  QuestProgressRecord,
  EpqReward,
  AuthenticationEvent,
  DisplayNameChangeHistory,
  UserRole,
  MemberType,
  CourseModuleWithQuestions,
} from '../backend';
import { Principal } from '@icp-sdk/core/principal';

// ─── Wallet Operation Error ───────────────────────────────────────────────────

/**
 * Typed error class for wallet operations.
 * Carries the structured WalletError variant from the backend so downstream
 * components can map it to a user-friendly message without string-parsing.
 */
export class WalletOperationError extends Error {
  readonly variant: WalletError;

  constructor(variant: WalletError) {
    super(variant);
    this.name = 'WalletOperationError';
    this.variant = variant;
  }
}

// ─── User Profile ────────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
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
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
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
      return actor.getAllUserProfiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateUserMemberType() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, memberType }: { user: Principal; memberType: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUserMemberType(user, memberType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
    },
  });
}

// ─── Access Control ──────────────────────────────────────────────────────────

export function useGetCallerUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['callerUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignCallerUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerUserRole'] });
      queryClient.invalidateQueries({ queryKey: ['isCallerAdmin'] });
    },
  });
}

// ─── Wallets ─────────────────────────────────────────────────────────────────

export function useListWallets() {
  const { actor, isFetching } = useActor();

  return useQuery<EpiqWallet[]>({
    queryKey: ['wallets'],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.listWallets();
      if (result.__kind__ === 'error') {
        throw new WalletOperationError(result.error);
      }
      return result.success;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (walletLabel: string | null): Promise<WalletCreationResult> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.createWallet(walletLabel);
      if (result.__kind__ === 'error') {
        // Throw a typed WalletOperationError so the error handler can map it
        // to a specific user-friendly message without string-parsing.
        throw new WalletOperationError(result.error);
      }
      // result.success contains { address, privateKey, recoveryPhrase, chain }
      // returned exactly once — never stored in stable backend state.
      return result.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
    },
  });
}

// ─── Wallet Addresses (stored on-chain, address only) ────────────────────────

export function useGetWalletAddresses() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ['walletAddresses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWalletAddresses();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddWalletAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (address: string): Promise<void> => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.addWalletAddress(address);
      if (result.__kind__ === 'error') {
        throw new WalletOperationError(result.error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walletAddresses'] });
    },
  });
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export function useGetUserTransactions() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['userTransactions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateTransaction() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, amount, currency }: { to: Principal; amount: bigint; currency: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createTransaction(to, amount, currency);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTransactions'] });
    },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export function useGetAllMessages() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['allMessages'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMessages();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useGetMessagesWithUser(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['messagesWithUser', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getMessagesWithUser(user);
    },
    enabled: !!actor && !isFetching && !!user,
    refetchInterval: 3000,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, content }: { to: Principal; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(to, content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMessages'] });
      queryClient.invalidateQueries({ queryKey: ['messagesWithUser'] });
    },
  });
}

export function useMarkMessageAsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markMessageAsRead(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allMessages'] });
      queryClient.invalidateQueries({ queryKey: ['messagesWithUser'] });
    },
  });
}

// ─── Quests ───────────────────────────────────────────────────────────────────

export function useGetAllQuests() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['allQuests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllQuests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllQuestModules() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['allQuestModules'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllQuestModules();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateQuestProgressRecord() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      moduleId,
      completedSteps,
      completed,
    }: {
      moduleId: bigint;
      completedSteps: bigint[];
      completed: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateQuestProgressRecord(moduleId, completedSteps, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userQuestProgressRecords'] });
      queryClient.invalidateQueries({ queryKey: ['userEpqRewards'] });
    },
  });
}

export function useGetUserQuestProgressRecords(user?: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<QuestProgressRecord[]>({
    queryKey: ['userQuestProgressRecords', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getUserQuestProgressRecords(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useGetAllUserQuestProgressRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, QuestProgressRecord[]][]>({
    queryKey: ['allUserQuestProgressRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserQuestProgressRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserEpqRewards(user?: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<EpqReward[]>({
    queryKey: ['userEpqRewards', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getUserEpqRewards(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

export function useGetUserQuestProgress(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['userQuestProgress', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getUserQuestProgress(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

// ─── Courses ──────────────────────────────────────────────────────────────────

export function useGetAllCourses() {
  const { actor, isFetching } = useActor();

  return useQuery<CourseWithModules[]>({
    queryKey: ['allCourses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCourses();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export function useGetAllCoursesWithModules() {
  return useGetAllCourses();
}

export function useGetAllCourseModules() {
  const { actor, isFetching } = useActor();

  return useQuery<CourseModule[]>({
    queryKey: ['allCourseModules'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCourseModules();
    },
    enabled: !!actor && !isFetching,
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
      return actor.createCourse(title, description, category, initialModules);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCourses'] });
    },
  });
}

export function useUpdateCourseProgress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      moduleId,
      completedSteps,
      completed,
    }: {
      moduleId: bigint;
      completedSteps: bigint[];
      completed: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateCourseProgress(moduleId, completedSteps, completed);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCourseProgress'] });
    },
  });
}

export function useGetUserCourseProgress(user: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['userCourseProgress', user?.toString()],
    queryFn: async () => {
      if (!actor || !user) return [];
      return actor.getUserCourseProgress(user);
    },
    enabled: !!actor && !isFetching && !!user,
  });
}

// ─── Balances ─────────────────────────────────────────────────────────────────

export function useGetEthBalance(address: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['ethBalance', address],
    queryFn: async () => {
      if (!actor || !address) return '0';
      return actor.getEthBalance(address);
    },
    enabled: !!actor && !isFetching && !!address,
    staleTime: 30000,
  });
}

export function useGetBtcBalance(address: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['btcBalance', address],
    queryFn: async () => {
      if (!actor || !address) return '0';
      return actor.getBtcBalance(address);
    },
    enabled: !!actor && !isFetching && !!address,
    staleTime: 30000,
  });
}

export function useGetIcpBalance(address: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['icpBalance', address],
    queryFn: async () => {
      if (!actor || !address) return '0';
      return actor.getIcpBalance(address);
    },
    enabled: !!actor && !isFetching && !!address,
    staleTime: 30000,
  });
}

export function useGetEthTransactionHistory(address: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['ethTransactionHistory', address],
    queryFn: async () => {
      if (!actor || !address) return '[]';
      return actor.getEthTransactionHistory(address);
    },
    enabled: !!actor && !isFetching && !!address,
    staleTime: 60000,
  });
}

// ─── Authentication Audit Log ─────────────────────────────────────────────────

export function useGetAuthenticationAuditLog() {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authAuditLog'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAuthenticationAuditLog();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAuthenticationAuditLogByPrincipal(principalId: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authAuditLogByPrincipal', principalId?.toString()],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      return actor.getAuthenticationAuditLogByPrincipal(principalId);
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

export function useGetAuthenticationAuditLogByEpiqId(epiqId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authAuditLogByEpiqId', epiqId],
    queryFn: async () => {
      if (!actor || !epiqId) return [];
      return actor.getAuthenticationAuditLogByEpiqId(epiqId);
    },
    enabled: !!actor && !isFetching && !!epiqId,
  });
}

export function useGetAuthenticationAuditLogByMethod(authMethod: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authAuditLogByMethod', authMethod],
    queryFn: async () => {
      if (!actor || !authMethod) return [];
      return actor.getAuthenticationAuditLogByMethod(authMethod);
    },
    enabled: !!actor && !isFetching && !!authMethod,
  });
}

export function useGetAuthenticationAuditLogByStatus(status: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AuthenticationEvent[]>({
    queryKey: ['authAuditLogByStatus', status],
    queryFn: async () => {
      if (!actor || !status) return [];
      return actor.getAuthenticationAuditLogByStatus(status);
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
      return actor.cleanupExpiredSessions();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authAuditLog'] });
    },
  });
}

// ─── Display Name History ─────────────────────────────────────────────────────

export function useGetDisplayNameChangeHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<DisplayNameChangeHistory[]>({
    queryKey: ['displayNameChangeHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDisplayNameChangeHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDisplayNameChangeHistoryByPrincipal(principalId: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DisplayNameChangeHistory[]>({
    queryKey: ['displayNameChangeHistoryByPrincipal', principalId?.toString()],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      return actor.getDisplayNameChangeHistoryByPrincipal(principalId);
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

export function useGetDisplayNameChangeHistoryByDisplayName(displayName: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<DisplayNameChangeHistory[]>({
    queryKey: ['displayNameChangeHistoryByDisplayName', displayName],
    queryFn: async () => {
      if (!actor || !displayName) return [];
      return actor.getDisplayNameChangeHistoryByDisplayName(displayName);
    },
    enabled: !!actor && !isFetching && !!displayName,
  });
}

export function useUpdateDisplayName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!actor) throw new Error('Actor not available');
      const profile = await actor.getCallerUserProfile();
      if (!profile) throw new Error('Profile not found');
      const updatedProfile = { ...profile, displayName };
      return actor.saveCallerUserProfile(updatedProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['displayNameChangeHistory'] });
    },
  });
}

export function useFindUserByDisplayName() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (displayName: string): Promise<Principal> => {
      if (!actor) throw new Error('Actor not available');
      return actor.findUserByDisplayName(displayName);
    },
  });
}

export function useImportSingleFirebaseUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string): Promise<string> => {
      if (!actor) throw new Error('Actor not available');
      return actor.importSingleFirebaseUser(email);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserProfiles'] });
    },
  });
}
