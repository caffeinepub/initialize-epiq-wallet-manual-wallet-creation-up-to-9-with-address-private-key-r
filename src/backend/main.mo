import AccessControl "authorization/access-control";
import Principal "mo:base/Principal";
import OrderedMap "mo:base/OrderedMap";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import List "mo:base/List";
import Nat "mo:base/Nat";
import OutCall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Text "mo:base/Text";
import Iter "mo:base/Iter";

import Migration "migration";

// Storage for uploaded files
(with migration = Migration.run) actor {
    let storage = Storage.new();
    include MixinStorage(storage);

    let accessControlState = AccessControl.initState();

    var firebaseConfig : ?{
        baseUrl : Text;
        apiKey : Text;
    } = null;

    type EpiqIdMapping = {
        epiqId : Text;
        principalId : Principal;
        timestamp : Time.Time;
        importedFromFirebase : Bool;
    };

    transient let epiqIdMap = OrderedMap.Make<Text>(Text.compare);
    var epiqIdMappings : OrderedMap.Map<Text, EpiqIdMapping> = epiqIdMap.empty();

    type FirebaseSession = {
        principalId : Principal;
        epiqId : Text;
        tokenIssuedAt : Time.Time;
        tokenExpiresAt : Time.Time;
        lastValidated : Time.Time;
    };

    transient let principalSessionMap = OrderedMap.Make<Principal>(Principal.compare);
    var activeSessions : OrderedMap.Map<Principal, FirebaseSession> = principalSessionMap.empty();

    type AuthenticationEvent = {
        timestamp : Time.Time;
        principalId : Principal;
        epiqId : ?Text;
        authMethod : Text;
        status : Text;
        failureReason : ?Text;
        ipContext : ?Text;
    };

    var authenticationAuditLog = List.nil<AuthenticationEvent>();

    // New EPIQ Wallet types and storage
    type EpiqWallet = {
        walletId : Nat;
        walletLabel : ?Text;
        createdAt : Time.Time;
        publicAddress : Text;
        metadata : ?Text;
    };

    transient let walletMap = OrderedMap.Make<Nat>(Nat.compare);
    transient let walletOwnerMap = OrderedMap.Make<Principal>(Principal.compare);
    var wallets : OrderedMap.Map<Nat, EpiqWallet> = walletMap.empty();
    var userWallets : OrderedMap.Map<Principal, OrderedMap.Map<Nat, EpiqWallet>> = walletOwnerMap.empty();
    var nextWalletId = 0;

    func logAuthenticationEvent(
        principalId : Principal,
        epiqId : ?Text,
        authMethod : Text,
        status : Text,
        failureReason : ?Text,
    ) {
        let event : AuthenticationEvent = {
            timestamp = Time.now();
            principalId;
            epiqId;
            authMethod;
            status;
            failureReason;
            ipContext = null;
        };
        authenticationAuditLog := List.push(event, authenticationAuditLog);
    };

    public query ({ caller }) func getAuthenticationAuditLog() : async [AuthenticationEvent] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view authentication audit logs");
        };
        List.toArray(authenticationAuditLog);
    };

    public query ({ caller }) func getAuthenticationAuditLogByPrincipal(principalId : Principal) : async [AuthenticationEvent] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view authentication audit logs");
        };

        var filteredLog = List.nil<AuthenticationEvent>();
        for (event in List.toIter(authenticationAuditLog)) {
            if (event.principalId == principalId) {
                filteredLog := List.push(event, filteredLog);
            };
        };
        List.toArray(filteredLog);
    };

    public query ({ caller }) func getAuthenticationAuditLogByEpiqId(epiqId : Text) : async [AuthenticationEvent] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view authentication audit logs");
        };

        var filteredLog = List.nil<AuthenticationEvent>();
        for (event in List.toIter(authenticationAuditLog)) {
            switch (event.epiqId) {
                case null {};
                case (?id) {
                    if (id == epiqId) {
                        filteredLog := List.push(event, filteredLog);
                    };
                };
            };
        };
        List.toArray(filteredLog);
    };

    public query ({ caller }) func getAuthenticationAuditLogByMethod(authMethod : Text) : async [AuthenticationEvent] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view authentication audit logs");
        };

        var filteredLog = List.nil<AuthenticationEvent>();
        for (event in List.toIter(authenticationAuditLog)) {
            if (event.authMethod == authMethod) {
                filteredLog := List.push(event, filteredLog);
            };
        };
        List.toArray(filteredLog);
    };

    public query ({ caller }) func getAuthenticationAuditLogByStatus(status : Text) : async [AuthenticationEvent] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view authentication audit logs");
        };

        var filteredLog = List.nil<AuthenticationEvent>();
        for (event in List.toIter(authenticationAuditLog)) {
            if (event.status == status) {
                filteredLog := List.push(event, filteredLog);
            };
        };
        List.toArray(filteredLog);
    };

    func validateSession(caller : Principal) : Bool {
        switch (principalSessionMap.get(activeSessions, caller)) {
            case null { false };
            case (?session) {
                let currentTime = Time.now();

                if (currentTime > session.tokenExpiresAt) {
                    cleanupExpiredSession(caller);
                    logAuthenticationEvent(
                        caller,
                        ?session.epiqId,
                        "Firebase",
                        "failure",
                        ?"Token expired - automatic logout triggered",
                    );
                    false;
                } else {
                    let updatedSession : FirebaseSession = {
                        session with lastValidated = currentTime
                    };
                    activeSessions := principalSessionMap.put(activeSessions, caller, updatedSession);
                    true;
                };
            };
        };
    };

    func cleanupExpiredSession(caller : Principal) {
        activeSessions := principalSessionMap.delete(activeSessions, caller);
    };

    public shared ({ caller }) func logoutFirebaseSession() : async () {
        switch (principalSessionMap.get(activeSessions, caller)) {
            case null {};
            case (?session) {
                cleanupExpiredSession(caller);
                logAuthenticationEvent(
                    caller,
                    ?session.epiqId,
                    "Firebase",
                    "success",
                    ?"Manual logout - session cleaned up",
                );
            };
        };
    };

    public query ({ caller }) func hasValidFirebaseSession() : async Bool {
        switch (principalSessionMap.get(activeSessions, caller)) {
            case null { false };
            case (?session) {
                let currentTime = Time.now();
                currentTime <= session.tokenExpiresAt;
            };
        };
    };

    func createEpiqIdMapping(epiqId : Text, principalId : Principal, importedFromFirebase : Bool) {
        let mapping = {
            epiqId;
            principalId;
            timestamp = Time.now();
            importedFromFirebase;
        };
        epiqIdMappings := epiqIdMap.put(epiqIdMappings, epiqId, mapping);
    };

    public shared ({ caller }) func mapEpiqIdToPrincipal(epiqId : Text, principalId : Principal) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can manually map EPIQ ID to Principal ID");
        };
        createEpiqIdMapping(epiqId, principalId, false);
    };

    public query ({ caller }) func lookupPrincipalByEpiqId(epiqId : Text) : async ?Principal {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can lookup Principal by EPIQ ID");
        };

        switch (epiqIdMap.get(epiqIdMappings, epiqId)) {
            case null { null };
            case (?mapping) { ?mapping.principalId };
        };
    };

    public query ({ caller }) func getPrincipalByEpiqId(epiqId : Text) : async Principal {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can retrieve Principal by EPIQ ID");
        };

        switch (epiqIdMap.get(epiqIdMappings, epiqId)) {
            case null { Debug.trap("EPIQ ID not found") };
            case (?mapping) { mapping.principalId };
        };
    };

    public query ({ caller }) func getEpiqIdByPrincipal(principalId : Principal) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can retrieve EPIQ ID by Principal ID");
        };

        var foundEpiqId : ?Text = null;
        for ((epiqId, mapping) in epiqIdMap.entries(epiqIdMappings)) {
            if (mapping.principalId == principalId) {
                foundEpiqId := ?epiqId;
            };
        };

        switch (foundEpiqId) {
            case null { Debug.trap("EPIQ ID not found for given Principal ID") };
            case (?epiqId) { epiqId };
        };
    };

    type FirebaseAuthResponse = {
        success : Bool;
        epiqId : ?Text;
        displayName : ?Text;
        email : ?Text;
        walletAddress : ?Text;
        memberType : ?Text;
        principalId : ?Principal;
        message : Text;
        sessionExpiresAt : ?Time.Time;
    };

    public shared ({ caller }) func authenticateWithFirebase(epiqId : Text, password : Text) : async FirebaseAuthResponse {
        // Verify Firebase configuration exists
        let config = switch (firebaseConfig) {
            case null {
                logAuthenticationEvent(
                    caller,
                    ?epiqId,
                    "Firebase",
                    "failure",
                    ?"Firebase configuration not set",
                );
                return {
                    success = false;
                    epiqId = null;
                    displayName = null;
                    email = null;
                    walletAddress = null;
                    memberType = null;
                    principalId = null;
                    message = "Firebase configuration not set";
                    sessionExpiresAt = null;
                };
            };
            case (?c) { c };
        };

        switch (epiqIdMap.get(epiqIdMappings, epiqId)) {
            case null {};
            case (?mapping) {
                if (mapping.importedFromFirebase) {
                    logAuthenticationEvent(
                        caller,
                        ?epiqId,
                        "Firebase",
                        "failure",
                        ?"Imported users must log in via Internet Identity",
                    );
                    return {
                        success = false;
                        epiqId = ?epiqId;
                        displayName = null;
                        email = null;
                        walletAddress = null;
                        memberType = null;
                        principalId = null;
                        message = "Imported users must log in via Internet Identity after import";
                        sessionExpiresAt = null;
                    };
                };
            };
        };

        switch (principalSessionMap.get(activeSessions, caller)) {
            case null {};
            case (?existingSession) {
                let currentTime = Time.now();
                if (currentTime <= existingSession.tokenExpiresAt) {
                    logAuthenticationEvent(
                        caller,
                        ?epiqId,
                        "Firebase",
                        "failure",
                        ?"Replay attempt detected - valid session already exists",
                    );
                    return {
                        success = false;
                        epiqId = ?epiqId;
                        displayName = null;
                        email = null;
                        walletAddress = null;
                        memberType = null;
                        principalId = null;
                        message = "Active session already exists - potential replay attack detected";
                        sessionExpiresAt = null;
                    };
                };
            };
        };

        let url : Text = config.baseUrl # "/verifyPassword?key=" # config.apiKey;
        let requestBody : Text = "{" #
        "\"email\": \"" # epiqId # "\", " #
        "\"password\": \"" # password # "\", " #
        "\"returnSecureToken\": true" #
        "}";

        let result : Text = await OutCall.httpPostRequest(url, [], requestBody, transform);

        if (Text.contains(result, #text "error")) {
            logAuthenticationEvent(
                caller,
                ?epiqId,
                "Firebase",
                "failure",
                ?"Firebase authentication failed: Invalid credentials or network error",
            );
            return {
                success = false;
                epiqId = null;
                displayName = null;
                email = null;
                walletAddress = null;
                memberType = null;
                principalId = null;
                message = "Firebase authentication failed: " # result;
                sessionExpiresAt = null;
            };
        };

        let currentTime = Time.now();
        let tokenExpiresAt = currentTime + (3600 * 1_000_000_000);

        let session : FirebaseSession = {
            principalId = caller;
            epiqId;
            tokenIssuedAt = currentTime;
            tokenExpiresAt;
            lastValidated = currentTime;
        };

        activeSessions := principalSessionMap.put(activeSessions, caller, session);

        switch (epiqIdMap.get(epiqIdMappings, epiqId)) {
            case null {
                createEpiqIdMapping(epiqId, caller, false);
            };
            case (?mapping) {
                if (mapping.principalId != caller) {
                    logAuthenticationEvent(
                        caller,
                        ?epiqId,
                        "Firebase",
                        "failure",
                        ?"EPIQ ID already associated with different Principal ID",
                    );
                    return {
                        success = false;
                        epiqId = ?epiqId;
                        displayName = null;
                        email = null;
                        walletAddress = null;
                        memberType = null;
                        principalId = null;
                        message = "EPIQ ID already associated with different Principal ID";
                        sessionExpiresAt = null;
                    };
                };
                let updatedMapping : EpiqIdMapping = { mapping with timestamp = Time.now() };
                epiqIdMappings := epiqIdMap.put(epiqIdMappings, epiqId, updatedMapping);
            };
        };

        logAuthenticationEvent(
            caller,
            ?epiqId,
            "Firebase",
            "success",
            null,
        );

        {
            success = true;
            epiqId = ?epiqId;
            displayName = null;
            email = null;
            walletAddress = null;
            memberType = null;
            principalId = ?caller;
            message = "Firebase authentication successful: " # result;
            sessionExpiresAt = ?tokenExpiresAt;
        };
    };

    public shared ({ caller }) func syncFirebaseUserData(
        epiqId : Text,
        displayName : Text,
        email : Text,
        walletAddress : Text,
        memberType : Text,
    ) : async () {
        if (not validateSession(caller)) {
            Debug.trap("Unauthorized: Invalid or expired session - please re-authenticate");
        };

        let mapping = epiqIdMap.get(epiqIdMappings, epiqId);
        switch (mapping) {
            case null {
                Debug.trap("Unauthorized: EPIQ ID not found - authenticate with Firebase first");
            };
            case (?m) {
                if (m.principalId != caller) {
                    Debug.trap("Unauthorized: EPIQ ID belongs to different user");
                };
                if (m.importedFromFirebase) {
                    Debug.trap("Unauthorized: Cannot sync data for imported users - use Internet Identity");
                };
            };
        };

        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: User role required to sync profile data");
        };

        let profile : UserProfile = {
            name = displayName;
            email;
            memberType;
            icpWalletAddress = walletAddress;
            ethWalletAddress = "";
            btcWalletAddress = "";
            displayName;
            importedFromFirebase = false;
        };

        switch (principalMap.get(userProfiles, caller)) {
            case null {
                userProfiles := principalMap.put(userProfiles, caller, profile);
                addDisplayNameChangeHistory(displayName, displayName, caller);
            };
            case (?existingProfile) {
                if (existingProfile.displayName != displayName) {
                    addDisplayNameChangeHistory(existingProfile.displayName, displayName, caller);
                };
                userProfiles := principalMap.put(userProfiles, caller, profile);
            };
        };
    };

    public shared ({ caller }) func cleanupExpiredSessions() : async Nat {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can cleanup expired sessions");
        };

        let currentTime = Time.now();
        var cleanedCount = 0;

        var sessionsToCleanup = List.nil<Principal>();
        for ((principal, session) in principalSessionMap.entries(activeSessions)) {
            if (currentTime > session.tokenExpiresAt) {
                sessionsToCleanup := List.push(principal, sessionsToCleanup);
            };
        };

        for (principal in List.toIter(sessionsToCleanup)) {
            switch (principalSessionMap.get(activeSessions, principal)) {
                case null {};
                case (?session) {
                    cleanupExpiredSession(principal);
                    logAuthenticationEvent(
                        principal,
                        ?session.epiqId,
                        "Firebase",
                        "success",
                        ?"Automatic session cleanup - token expired",
                    );
                    cleanedCount += 1;
                };
            };
        };

        cleanedCount;
    };

    public shared ({ caller }) func initializeAccessControl() : async () {
        AccessControl.initialize(accessControlState, caller);
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    public type UserProfile = {
        name : Text;
        email : Text;
        memberType : Text;
        icpWalletAddress : Text;
        ethWalletAddress : Text;
        btcWalletAddress : Text;
        displayName : Text;
        importedFromFirebase : Bool;
    };

    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
    var userProfiles = principalMap.empty<UserProfile>();

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view profiles");
        };
        principalMap.get(userProfiles, caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view profiles");
        };

        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own profile");
        };
        principalMap.get(userProfiles, user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can save profiles");
        };

        switch (principalMap.get(userProfiles, caller)) {
            case null {
                userProfiles := principalMap.put(userProfiles, caller, profile);
                addDisplayNameChangeHistory(profile.displayName, profile.displayName, caller);
            };
            case (?existingProfile) {
                if (existingProfile.displayName != profile.displayName) {
                    addDisplayNameChangeHistory(existingProfile.displayName, profile.displayName, caller);
                };
                userProfiles := principalMap.put(userProfiles, caller, profile);
            };
        };
    };

    public query ({ caller }) func getAllUserProfiles() : async [(Principal, UserProfile)] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view all user profiles");
        };
        Iter.toArray(principalMap.entries(userProfiles));
    };

    public shared ({ caller }) func updateUserMemberType(user : Principal, memberType : Text) : async () {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can update member types");
        };

        switch (principalMap.get(userProfiles, user)) {
            case null {
                Debug.trap("User profile not found");
            };
            case (?profile) {
                let updatedProfile : UserProfile = { profile with memberType };
                userProfiles := principalMap.put(userProfiles, user, updatedProfile);
            };
        };
    };

    // Wallet functions
    public shared ({ caller }) func createWallet(walletLabel : ?Text) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can create wallets");
        };

        var userWalletCount = 0;
        switch (walletOwnerMap.get(userWallets, caller)) {
            case null { userWalletCount := 0 };
            case (?userWalletMap) { userWalletCount := walletMap.size(userWalletMap) };
        };

        if (userWalletCount >= 9) {
            Debug.trap("User has reached the maximum allowed wallets per user");
        };

        let newWallet : EpiqWallet = {
            walletId = nextWalletId;
            walletLabel;
            createdAt = Time.now();
            publicAddress = "generated_address_" # Nat.toText(nextWalletId);
            metadata = null;
        };

        wallets := walletMap.put(wallets, nextWalletId, newWallet);

        switch (walletOwnerMap.get(userWallets, caller)) {
            case null {
                var userWalletMap : OrderedMap.Map<Nat, EpiqWallet> = walletMap.empty();
                userWalletMap := walletMap.put(userWalletMap, nextWalletId, newWallet);
                userWallets := walletOwnerMap.put(userWallets, caller, userWalletMap);
            };
            case (?userWalletMap) {
                var updatedWalletMap = walletMap.put(userWalletMap, nextWalletId, newWallet);
                userWallets := walletOwnerMap.put(userWallets, caller, updatedWalletMap);
            };
        };

        nextWalletId += 1;
        "Wallet successfully created. Address: " # newWallet.publicAddress;
    };

    public query ({ caller }) func listWallets() : async [EpiqWallet] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can list their wallets");
        };

        switch (walletOwnerMap.get(userWallets, caller)) {
            case null { [] };
            case (?userWalletMap) {
                let wallets = walletMap.vals(userWalletMap);
                Iter.toArray(wallets);
            };
        };
    };

    public query ({ caller }) func getWallet(walletId : Nat) : async EpiqWallet {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can retrieve wallets");
        };

        // Check ownership first before revealing wallet existence
        if (not isWalletOwner(caller, walletId) and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Cannot access wallets you do not own");
        };

        switch (walletMap.get(wallets, walletId)) {
            case null { Debug.trap("Wallet not found") };
            case (?wallet) { wallet };
        };
    };

    public shared ({ caller }) func updateWalletLabel(walletId : Nat, newLabel : ?Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can update wallet labels");
        };

        // Check ownership first before revealing wallet existence
        if (not isWalletOwner(caller, walletId)) {
            Debug.trap("Unauthorized: Cannot update wallets you do not own");
        };

        switch (walletMap.get(wallets, walletId)) {
            case null { Debug.trap("Wallet not found") };
            case (?wallet) {
                let updatedWallet : EpiqWallet = { wallet with walletLabel = newLabel };
                wallets := walletMap.put(wallets, walletId, updatedWallet);

                // Update in user's wallet map as well
                switch (walletOwnerMap.get(userWallets, caller)) {
                    case null {};
                    case (?userWalletMap) {
                        let updatedUserWalletMap = walletMap.put(userWalletMap, walletId, updatedWallet);
                        userWallets := walletOwnerMap.put(userWallets, caller, updatedUserWalletMap);
                    };
                };
            };
        };
    };

    func isWalletOwner(user : Principal, walletId : Nat) : Bool {
        switch (walletOwnerMap.get(userWallets, user)) {
            case null { false };
            case (?userWalletMap) {
                switch (walletMap.get(userWalletMap, walletId)) {
                    case null { false };
                    case (?_wallet) { true };
                };
            };
        };
    };

    type Transaction = {
        id : Nat;
        from : Principal;
        to : Principal;
        amount : Nat;
        timestamp : Time.Time;
        status : Text;
        currency : Text;
    };

    transient let natMap = OrderedMap.Make<Nat>(Nat.compare);
    var transactions = natMap.empty<Transaction>();
    var nextTransactionId = 0;

    public shared ({ caller }) func createTransaction(to : Principal, amount : Nat, currency : Text) : async Nat {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can create transactions");
        };

        let transaction : Transaction = {
            id = nextTransactionId;
            from = caller;
            to;
            amount;
            timestamp = Time.now();
            status = "pending";
            currency;
        };

        transactions := natMap.put(transactions, nextTransactionId, transaction);
        nextTransactionId += 1;
        transaction.id;
    };

    public query ({ caller }) func getTransaction(id : Nat) : async ?Transaction {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view transactions");
        };

        switch (natMap.get(transactions, id)) {
            case null { null };
            case (?transaction) {
                if (transaction.from == caller or transaction.to == caller or AccessControl.isAdmin(accessControlState, caller)) {
                    ?transaction;
                } else {
                    Debug.trap("Unauthorized: Can only view transactions you are involved in");
                };
            };
        };
    };

    public query ({ caller }) func getUserTransactions() : async [Transaction] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view transactions");
        };

        var userTransactions = List.nil<Transaction>();
        for ((_, transaction) in natMap.entries(transactions)) {
            if (transaction.from == caller or transaction.to == caller) {
                userTransactions := List.push(transaction, userTransactions);
            };
        };
        List.toArray(userTransactions);
    };

    public type Message = {
        id : Nat;
        from : Principal;
        to : Principal;
        content : Text;
        timestamp : Time.Time;
        read : Bool;
    };

    var messages = natMap.empty<Message>();
    var nextMessageId = 0;

    public shared ({ caller }) func sendMessage(to : Principal, content : Text) : async Nat {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can send messages");
        };

        let message : Message = {
            id = nextMessageId;
            from = caller;
            to;
            content;
            timestamp = Time.now();
            read = false;
        };

        messages := natMap.put(messages, nextMessageId, message);
        nextMessageId += 1;
        message.id;
    };

    public query ({ caller }) func getMessagesWithUser(user : Principal) : async [Message] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view messages");
        };

        var userMessages = List.nil<Message>();
        for ((_, message) in natMap.entries(messages)) {
            if ((message.from == caller and message.to == user) or (message.from == user and message.to == caller)) {
                userMessages := List.push(message, userMessages);
            };
        };
        List.toArray(userMessages);
    };

    public query ({ caller }) func getAllMessages() : async [Message] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view messages");
        };

        var userMessages = List.nil<Message>();
        for ((_, message) in natMap.entries(messages)) {
            if (message.from == caller or message.to == caller) {
                userMessages := List.push(message, userMessages);
            };
        };
        List.toArray(userMessages);
    };

    public shared ({ caller }) func markMessageAsRead(messageId : Nat) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can mark messages as read");
        };

        switch (natMap.get(messages, messageId)) {
            case null {
                Debug.trap("Message not found");
            };
            case (?message) {
                if (message.to != caller) {
                    Debug.trap("Unauthorized: Only the message recipient can mark it as read");
                };
                let updatedMessage : Message = { message with read = true };
                messages := natMap.put(messages, messageId, updatedMessage);
            };
        };
    };

    public type Quest = {
        id : Nat;
        title : Text;
        description : Text;
        category : Text;
        steps : [Text];
    };

    var quests = natMap.empty<Quest>();
    var nextQuestId = 0;

    public shared ({ caller }) func createQuest(title : Text, description : Text, category : Text, steps : [Text]) : async Nat {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can create quests");
        };

        let quest : Quest = {
            id = nextQuestId;
            title;
            description;
            category;
            steps;
        };

        quests := natMap.put(quests, nextQuestId, quest);
        nextQuestId += 1;
        quest.id;
    };

    public query ({ caller }) func getAllQuests() : async [Quest] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view quests");
        };

        var allQuests = List.nil<Quest>();
        for ((_, quest) in natMap.entries(quests)) {
            allQuests := List.push(quest, allQuests);
        };
        List.toArray(allQuests);
    };

    public type QuestProgress = {
        questId : Nat;
        user : Principal;
        completedSteps : [Nat];
        completed : Bool;
    };

    var questProgress = natMap.empty<QuestProgress>();
    var nextProgressId = 0;

    public shared ({ caller }) func updateQuestProgress(questId : Nat, completedSteps : [Nat], completed : Bool) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can update quest progress");
        };

        let progress : QuestProgress = {
            questId;
            user = caller;
            completedSteps;
            completed;
        };

        questProgress := natMap.put(questProgress, nextProgressId, progress);
        nextProgressId += 1;
    };

    public query ({ caller }) func getUserQuestProgress(user : Principal) : async [QuestProgress] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view quest progress");
        };

        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own quest progress");
        };

        var userProgress = List.nil<QuestProgress>();
        for ((_, progress) in natMap.entries(questProgress)) {
            if (progress.user == user) {
                userProgress := List.push(progress, userProgress);
            };
        };
        List.toArray(userProgress);
    };

    public query ({ caller }) func getAllUserQuestProgress() : async [(Principal, [QuestProgress])] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view all quest progress");
        };

        var allProgress = List.nil<(Principal, [QuestProgress])>();
        for ((user, _) in principalMap.entries(userProfiles)) {
            var userProgress = List.nil<QuestProgress>();
            for ((_, progress) in natMap.entries(questProgress)) {
                if (progress.user == user) {
                    userProgress := List.push(progress, userProgress);
                };
            };
            allProgress := List.push((user, List.toArray(userProgress)), allProgress);
        };
        List.toArray(allProgress);
    };

    public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
        OutCall.transform(input);
    };

    public shared ({ caller }) func getEthBalance(address : Text) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view balances");
        };

        let url = "https://ethereum.icp-api.io/api/v1/account/" # address # "/balance";
        await OutCall.httpGetRequest(url, [], transform);
    };

    public shared ({ caller }) func getBtcBalance(address : Text) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view balances");
        };

        let url = "https://bitcoin.icp-api.io/api/v1/account/" # address # "/balance";
        await OutCall.httpGetRequest(url, [], transform);
    };

    public shared ({ caller }) func getIcpBalance(address : Text) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view balances");
        };

        let url = "https://icp-api.io/api/v1/account/" # address # "/balance";
        await OutCall.httpGetRequest(url, [], transform);
    };

    public shared ({ caller }) func getEthTransactionHistory(address : Text) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view transaction history");
        };

        let url = "https://ethereum.icp-api.io/api/v1/account/" # address # "/transactions";
        await OutCall.httpGetRequest(url, [], transform);
    };

    public shared ({ caller }) func getBtcTransactionHistory(address : Text) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view transaction history");
        };

        let url = "https://bitcoin.icp-api.io/api/v1/account/" # address # "/transactions";
        await OutCall.httpGetRequest(url, [], transform);
    };

    public shared ({ caller }) func getIcpTransactionHistory(address : Text) : async Text {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view transaction history");
        };

        let url = "https://icp-api.io/api/v1/account/" # address # "/transactions";
        await OutCall.httpGetRequest(url, [], transform);
    };

    type CourseModule = {
        id : Nat;
        title : Text;
        description : Text;
        category : Text;
        steps : [Text];
    };

    type CourseProgress = {
        moduleId : Nat;
        user : Principal;
        completedSteps : [Nat];
        completed : Bool;
    };

    var courseModules = natMap.empty<CourseModule>();
    var courseProgress = natMap.empty<CourseProgress>();
    var nextCourseModuleId = 0;
    var nextCourseProgressId = 0;

    public query ({ caller }) func getAllCourseModules() : async [CourseModule] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view course modules");
        };

        var allModules = List.nil<CourseModule>();
        for ((_, courseModule) in natMap.entries(courseModules)) {
            allModules := List.push(courseModule, allModules);
        };
        List.toArray(allModules);
    };

    public shared ({ caller }) func updateCourseProgress(moduleId : Nat, completedSteps : [Nat], completed : Bool) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can update course progress");
        };

        let progress : CourseProgress = {
            moduleId;
            user = caller;
            completedSteps;
            completed;
        };

        courseProgress := natMap.put(courseProgress, nextCourseProgressId, progress);
        nextCourseProgressId += 1;
    };

    public query ({ caller }) func getUserCourseProgress(user : Principal) : async [CourseProgress] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view course progress");
        };

        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own course progress");
        };

        var userProgress = List.nil<CourseProgress>();
        for ((_, progress) in natMap.entries(courseProgress)) {
            if (progress.user == user) {
                userProgress := List.push(progress, userProgress);
            };
        };
        List.toArray(userProgress);
    };

    public query ({ caller }) func getAllUserCourseProgress() : async [(Principal, [CourseProgress])] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view all course progress");
        };

        var allProgress = List.nil<(Principal, [CourseProgress])>();
        for ((user, _) in principalMap.entries(userProfiles)) {
            var userProgress = List.nil<CourseProgress>();
            for ((_, progress) in natMap.entries(courseProgress)) {
                if (progress.user == user) {
                    userProgress := List.push(progress, userProgress);
                };
            };
            allProgress := List.push((user, List.toArray(userProgress)), allProgress);
        };
        List.toArray(allProgress);
    };

    type QuestStep = {
        id : Nat;
        title : Text;
        content : Text;
        stepType : Text;
        videoUrl : ?Text;
        quizQuestions : ?[QuizQuestion];
    };

    type QuizQuestion = {
        question : Text;
        options : [Text];
        correctAnswer : Nat;
    };

    type QuestModule = {
        id : Nat;
        title : Text;
        description : Text;
        category : Text;
        steps : [QuestStep];
        reward : Nat;
    };

    type QuestProgressRecord = {
        moduleId : Nat;
        user : Principal;
        completedSteps : [Nat];
        completed : Bool;
        timestamp : Time.Time;
    };

    type EpqReward = {
        id : Nat;
        user : Principal;
        amount : Nat;
        source : Text;
        timestamp : Time.Time;
        verified : Bool;
    };

    var questModules = natMap.empty<QuestModule>();
    var questProgressRecords = natMap.empty<QuestProgressRecord>();
    var epqRewards = natMap.empty<EpqReward>();
    var nextQuestModuleId = 0;
    var nextQuestProgressId = 0;
    var nextRewardId = 0;

    public query ({ caller }) func getAllQuestModules() : async [QuestModule] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view quest modules");
        };

        var allModules = List.nil<QuestModule>();
        for ((_, questModule) in natMap.entries(questModules)) {
            allModules := List.push(questModule, allModules);
        };
        List.toArray(allModules);
    };

    public shared ({ caller }) func updateQuestProgressRecord(moduleId : Nat, completedSteps : [Nat], completed : Bool) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can update quest progress");
        };

        let progress : QuestProgressRecord = {
            moduleId;
            user = caller;
            completedSteps;
            completed;
            timestamp = Time.now();
        };

        questProgressRecords := natMap.put(questProgressRecords, nextQuestProgressId, progress);
        nextQuestProgressId += 1;

        if (completed) {
            let reward : EpqReward = {
                id = nextRewardId;
                user = caller;
                amount = 5;
                source = "Module " # Nat.toText(moduleId) # " completion";
                timestamp = Time.now();
                verified = true;
            };
            epqRewards := natMap.put(epqRewards, nextRewardId, reward);
            nextRewardId += 1;
        };
    };

    public query ({ caller }) func getUserQuestProgressRecords(user : Principal) : async [QuestProgressRecord] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view quest progress");
        };

        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own progress");
        };

        var userProgress = List.nil<QuestProgressRecord>();
        for ((_, progress) in natMap.entries(questProgressRecords)) {
            if (progress.user == user) {
                userProgress := List.push(progress, userProgress);
            };
        };
        List.toArray(userProgress);
    };

    public query ({ caller }) func getAllUserQuestProgressRecords() : async [(Principal, [QuestProgressRecord])] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view all quest progress");
        };

        var allProgress = List.nil<(Principal, [QuestProgressRecord])>();
        for ((user, _) in principalMap.entries(userProfiles)) {
            var userProgress = List.nil<QuestProgressRecord>();
            for ((_, progress) in natMap.entries(questProgressRecords)) {
                if (progress.user == user) {
                    userProgress := List.push(progress, userProgress);
                };
            };
            allProgress := List.push((user, List.toArray(userProgress)), allProgress);
        };
        List.toArray(allProgress);
    };

    public query ({ caller }) func getUserEpqRewards(user : Principal) : async [EpqReward] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view rewards");
        };

        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own rewards");
        };

        var userRewards = List.nil<EpqReward>();
        for ((_, reward) in natMap.entries(epqRewards)) {
            if (reward.user == user) {
                userRewards := List.push(reward, userRewards);
            };
        };
        List.toArray(userRewards);
    };

    type MemberType = {
        #superAdmin;
        #admin;
        #member;
        #partner;
        #business;
        #ambassador;
        #trustee;
        #beneficiary;
        #citizen;
    };

    type CourseModuleContent = {
        tell : Text;
        show : ?Text;
        doStep : ?[QuizQuestion];
    };

    type CourseModuleWithQuestions = {
        id : Nat;
        title : Text;
        description : Text;
        content : CourseModuleContent;
        questions : [QuizQuestion];
    };

    type CourseWithModules = {
        id : Nat;
        title : Text;
        description : Text;
        category : Text;
        modules : [CourseModuleWithQuestions];
        reward : Nat;
        availableToAll : Bool;
        assignedMemberTypes : [MemberType];
    };

    var coursesWithModules = natMap.empty<CourseWithModules>();
    var nextCourseWithModulesId = 0;

    public shared ({ caller }) func createCourseWithModules(title : Text, description : Text, category : Text, modules : [CourseModuleWithQuestions], reward : Nat, availableToAll : Bool, assignedMemberTypes : [MemberType]) : async Nat {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can create courses with modules");
        };

        var totalQuestions = 0;
        for (courseModule in modules.vals()) {
            totalQuestions += courseModule.questions.size();
        };

        if (totalQuestions > 33) {
            Debug.trap("Total number of questions across all modules cannot exceed 33");
        };

        let course : CourseWithModules = {
            id = nextCourseWithModulesId;
            title;
            description;
            category;
            modules;
            reward;
            availableToAll;
            assignedMemberTypes;
        };

        coursesWithModules := natMap.put(coursesWithModules, nextCourseWithModulesId, course);
        nextCourseWithModulesId += 1;
        course.id;
    };

    public shared ({ caller }) func createCourse(title : Text, description : Text, category : Text, initialModules : ?[CourseModuleWithQuestions]) : async Nat {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can create courses");
        };

        let modules = switch (initialModules) {
            case null { [] };
            case (?m) { m };
        };

        var totalQuestions = 0;
        for (courseModule in modules.vals()) {
            totalQuestions += courseModule.questions.size();
        };

        if (totalQuestions > 33) {
            Debug.trap("Total number of questions across all modules cannot exceed 33");
        };

        let course : CourseWithModules = {
            id = nextCourseWithModulesId;
            title;
            description;
            category;
            modules;
            reward = 0;
            availableToAll = true;
            assignedMemberTypes = [];
        };

        coursesWithModules := natMap.put(coursesWithModules, nextCourseWithModulesId, course);
        nextCourseWithModulesId += 1;
        course.id;
    };

    public query ({ caller }) func getAllCourses() : async [CourseWithModules] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can view courses");
        };

        var allCourses = List.nil<CourseWithModules>();
        for ((_, course) in natMap.entries(coursesWithModules)) {
            allCourses := List.push(course, allCourses);
        };
        List.toArray(allCourses);
    };

    type DisplayNameChangeHistory = {
        oldName : Text;
        newName : Text;
        timestamp : Time.Time;
        principalId : Principal;
    };

    var displayNameChangeHistory = List.nil<DisplayNameChangeHistory>();

    func addDisplayNameChangeHistory(oldName : Text, newName : Text, principalId : Principal) {
        let history : DisplayNameChangeHistory = {
            oldName;
            newName;
            timestamp = Time.now();
            principalId;
        };

        displayNameChangeHistory := List.push(history, displayNameChangeHistory);
    };

    public query ({ caller }) func getDisplayNameChangeHistory() : async [DisplayNameChangeHistory] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view display name change history");
        };

        List.toArray(displayNameChangeHistory);
    };

    public query ({ caller }) func getDisplayNameChangeHistoryByPrincipal(principalId : Principal) : async [DisplayNameChangeHistory] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view display name change history");
        };

        var filteredHistory = List.nil<DisplayNameChangeHistory>();
        for (history in List.toIter(displayNameChangeHistory)) {
            if (history.principalId == principalId) {
                filteredHistory := List.push(history, filteredHistory);
            };
        };
        List.toArray(filteredHistory);
    };

    public query ({ caller }) func getDisplayNameChangeHistoryByDisplayName(displayName : Text) : async [DisplayNameChangeHistory] {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can view display name change history");
        };

        var filteredHistory = List.nil<DisplayNameChangeHistory>();
        for (history in List.toIter(displayNameChangeHistory)) {
            if (history.newName == displayName or history.oldName == displayName) {
                filteredHistory := List.push(history, filteredHistory);
            };
        };
        List.toArray(filteredHistory);
    };

    public query ({ caller }) func findUserByDisplayName(displayName : Text) : async Principal {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only users can search by display name");
        };

        var foundPrincipal : ?Principal = null;

        for ((principal, profile) in principalMap.entries(userProfiles)) {
            if (profile.displayName == displayName) {
                if (foundPrincipal != null) {
                    Debug.trap("Multiple users found with the same display name");
                };
                foundPrincipal := ?principal;
            };
        };

        switch (foundPrincipal) {
            case null { Debug.trap("Display name not found") };
            case (?principal) { principal };
        };
    };

    public shared ({ caller }) func importSingleFirebaseUser(email : Text) : async Text {
        if (not (AccessControl.isAdmin(accessControlState, caller))) {
            Debug.trap("Unauthorized: Only admins can import users from Firebase");
        };

        let config = switch (firebaseConfig) {
            case null {
                Debug.trap("Firebase configuration not set - configure Firebase settings first");
            };
            case (?c) { c };
        };

        switch (epiqIdMap.get(epiqIdMappings, email)) {
            case null {};
            case (?mapping) {
                if (mapping.importedFromFirebase) {
                    return "User already imported from Firebase: " # email;
                };
            };
        };

        let url : Text = config.baseUrl # "/getUser?key=" # config.apiKey;
        let requestBody : Text = "{" # "\"email\": \"" # email # "\" " # "}";

        let result : Text = await OutCall.httpPostRequest(url, [], requestBody, transform);

        if (Text.contains(result, #text "error")) {
            if (Text.contains(result, #text "MISSING_EMAIL")) {
                Debug.trap("Firebase user not found: " # email);
            } else {
                Debug.trap("Error importing user from Firebase: " # result);
            };
        };

        let principalId = Principal.fromText("2vxsx-fae");
        let displayName : Text = "imported";
        let walletAddress : Text = "imported";
        let memberType : Text = "imported";

        createEpiqIdMapping(email, principalId, true);

        let profile : UserProfile = {
            name = displayName;
            email;
            memberType;
            icpWalletAddress = walletAddress;
            ethWalletAddress = "";
            btcWalletAddress = "";
            displayName;
            importedFromFirebase = true;
        };

        userProfiles := principalMap.put(userProfiles, principalId, profile);

        "User imported successfully from Firebase: " # email;
    };
};

