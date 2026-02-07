import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface QuestProgress {
    user: Principal;
    completed: boolean;
    questId: bigint;
    completedSteps: Array<bigint>;
}
export interface QuizQuestion {
    question: string;
    correctAnswer: bigint;
    options: Array<string>;
}
export interface CourseModuleContent {
    doStep?: Array<QuizQuestion>;
    show?: string;
    tell: string;
}
export interface CourseWithModules {
    id: bigint;
    reward: bigint;
    title: string;
    availableToAll: boolean;
    description: string;
    assignedMemberTypes: Array<MemberType>;
    category: string;
    modules: Array<CourseModuleWithQuestions>;
}
export interface Transaction {
    id: bigint;
    to: Principal;
    status: string;
    from: Principal;
    currency: string;
    timestamp: Time;
    amount: bigint;
}
export interface CourseModule {
    id: bigint;
    title: string;
    description: string;
    steps: Array<string>;
    category: string;
}
export interface QuestStep {
    id: bigint;
    title: string;
    content: string;
    stepType: string;
    quizQuestions?: Array<QuizQuestion>;
    videoUrl?: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface FirebaseAuthResponse {
    epiqId?: string;
    displayName?: string;
    sessionExpiresAt?: Time;
    walletAddress?: string;
    email?: string;
    message: string;
    memberType?: string;
    success: boolean;
    principalId?: Principal;
}
export interface EpiqWallet {
    publicAddress: string;
    metadata?: string;
    createdAt: Time;
    walletLabel?: string;
    walletId: bigint;
}
export interface AuthenticationEvent {
    status: string;
    epiqId?: string;
    failureReason?: string;
    authMethod: string;
    ipContext?: string;
    timestamp: Time;
    principalId: Principal;
}
export interface EpqReward {
    id: bigint;
    verified: boolean;
    source: string;
    user: Principal;
    timestamp: Time;
    amount: bigint;
}
export interface QuestModule {
    id: bigint;
    reward: bigint;
    title: string;
    description: string;
    steps: Array<QuestStep>;
    category: string;
}
export interface QuestProgressRecord {
    moduleId: bigint;
    user: Principal;
    completed: boolean;
    completedSteps: Array<bigint>;
    timestamp: Time;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface CourseModuleWithQuestions {
    id: bigint;
    title: string;
    content: CourseModuleContent;
    description: string;
    questions: Array<QuizQuestion>;
}
export interface Quest {
    id: bigint;
    title: string;
    description: string;
    steps: Array<string>;
    category: string;
}
export interface Message {
    id: bigint;
    to: Principal;
    content: string;
    from: Principal;
    read: boolean;
    timestamp: Time;
}
export interface CourseProgress {
    moduleId: bigint;
    user: Principal;
    completed: boolean;
    completedSteps: Array<bigint>;
}
export interface DisplayNameChangeHistory {
    timestamp: Time;
    principalId: Principal;
    newName: string;
    oldName: string;
}
export interface UserProfile {
    icpWalletAddress: string;
    displayName: string;
    name: string;
    email: string;
    importedFromFirebase: boolean;
    memberType: string;
    btcWalletAddress: string;
    ethWalletAddress: string;
}
export enum MemberType {
    member = "member",
    trustee = "trustee",
    admin = "admin",
    citizen = "citizen",
    beneficiary = "beneficiary",
    superAdmin = "superAdmin",
    business = "business",
    ambassador = "ambassador",
    partner = "partner"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    authenticateWithFirebase(epiqId: string, password: string): Promise<FirebaseAuthResponse>;
    cleanupExpiredSessions(): Promise<bigint>;
    createCourse(title: string, description: string, category: string, initialModules: Array<CourseModuleWithQuestions> | null): Promise<bigint>;
    createCourseWithModules(title: string, description: string, category: string, modules: Array<CourseModuleWithQuestions>, reward: bigint, availableToAll: boolean, assignedMemberTypes: Array<MemberType>): Promise<bigint>;
    createQuest(title: string, description: string, category: string, steps: Array<string>): Promise<bigint>;
    createTransaction(to: Principal, amount: bigint, currency: string): Promise<bigint>;
    createWallet(walletLabel: string | null): Promise<string>;
    findUserByDisplayName(displayName: string): Promise<Principal>;
    getAllCourseModules(): Promise<Array<CourseModule>>;
    getAllCourses(): Promise<Array<CourseWithModules>>;
    getAllMessages(): Promise<Array<Message>>;
    getAllQuestModules(): Promise<Array<QuestModule>>;
    getAllQuests(): Promise<Array<Quest>>;
    getAllUserCourseProgress(): Promise<Array<[Principal, Array<CourseProgress>]>>;
    getAllUserProfiles(): Promise<Array<[Principal, UserProfile]>>;
    getAllUserQuestProgress(): Promise<Array<[Principal, Array<QuestProgress>]>>;
    getAllUserQuestProgressRecords(): Promise<Array<[Principal, Array<QuestProgressRecord>]>>;
    getAuthenticationAuditLog(): Promise<Array<AuthenticationEvent>>;
    getAuthenticationAuditLogByEpiqId(epiqId: string): Promise<Array<AuthenticationEvent>>;
    getAuthenticationAuditLogByMethod(authMethod: string): Promise<Array<AuthenticationEvent>>;
    getAuthenticationAuditLogByPrincipal(principalId: Principal): Promise<Array<AuthenticationEvent>>;
    getAuthenticationAuditLogByStatus(status: string): Promise<Array<AuthenticationEvent>>;
    getBtcBalance(address: string): Promise<string>;
    getBtcTransactionHistory(address: string): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDisplayNameChangeHistory(): Promise<Array<DisplayNameChangeHistory>>;
    getDisplayNameChangeHistoryByDisplayName(displayName: string): Promise<Array<DisplayNameChangeHistory>>;
    getDisplayNameChangeHistoryByPrincipal(principalId: Principal): Promise<Array<DisplayNameChangeHistory>>;
    getEpiqIdByPrincipal(principalId: Principal): Promise<string>;
    getEthBalance(address: string): Promise<string>;
    getEthTransactionHistory(address: string): Promise<string>;
    getIcpBalance(address: string): Promise<string>;
    getIcpTransactionHistory(address: string): Promise<string>;
    getMessagesWithUser(user: Principal): Promise<Array<Message>>;
    getPrincipalByEpiqId(epiqId: string): Promise<Principal>;
    getTransaction(id: bigint): Promise<Transaction | null>;
    getUserCourseProgress(user: Principal): Promise<Array<CourseProgress>>;
    getUserEpqRewards(user: Principal): Promise<Array<EpqReward>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserQuestProgress(user: Principal): Promise<Array<QuestProgress>>;
    getUserQuestProgressRecords(user: Principal): Promise<Array<QuestProgressRecord>>;
    getUserTransactions(): Promise<Array<Transaction>>;
    getWallet(walletId: bigint): Promise<EpiqWallet>;
    hasValidFirebaseSession(): Promise<boolean>;
    importSingleFirebaseUser(email: string): Promise<string>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    listWallets(): Promise<Array<EpiqWallet>>;
    logoutFirebaseSession(): Promise<void>;
    lookupPrincipalByEpiqId(epiqId: string): Promise<Principal | null>;
    mapEpiqIdToPrincipal(epiqId: string, principalId: Principal): Promise<void>;
    markMessageAsRead(messageId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(to: Principal, content: string): Promise<bigint>;
    syncFirebaseUserData(epiqId: string, displayName: string, email: string, walletAddress: string, memberType: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCourseProgress(moduleId: bigint, completedSteps: Array<bigint>, completed: boolean): Promise<void>;
    updateQuestProgress(questId: bigint, completedSteps: Array<bigint>, completed: boolean): Promise<void>;
    updateQuestProgressRecord(moduleId: bigint, completedSteps: Array<bigint>, completed: boolean): Promise<void>;
    updateUserMemberType(user: Principal, memberType: string): Promise<void>;
    updateWalletLabel(walletId: bigint, newLabel: string | null): Promise<void>;
}
