import OrderedMap "mo:base/OrderedMap";
import List "mo:base/List";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Time "mo:base/Time";

module {
    type EpiqIdMapping = {
        epiqId : Text;
        principalId : Principal;
        timestamp : Time.Time;
        importedFromFirebase : Bool;
    };
    type FirebaseSession = {
        principalId : Principal;
        epiqId : Text;
        tokenIssuedAt : Time.Time;
        tokenExpiresAt : Time.Time;
        lastValidated : Time.Time;
    };
    type AuthenticationEvent = {
        timestamp : Time.Time;
        principalId : Principal;
        epiqId : ?Text;
        authMethod : Text;
        status : Text;
        failureReason : ?Text;
        ipContext : ?Text;
    };

    // Old actor definition without chain, privateKey, and recoveryPhrase fields
    type OldEpiqWallet = {
        walletId : Nat;
        walletLabel : ?Text;
        createdAt : Time.Time;
        publicAddress : Text;
        metadata : ?Text;
    };

    // Old actor non-transient state
    type OldActor = {
        nextWalletId : Nat;
        userWallets : OrderedMap.Map<Principal, OrderedMap.Map<Nat, OldEpiqWallet>>;
        wallets : OrderedMap.Map<Nat, OldEpiqWallet>;
        activeSessions : OrderedMap.Map<Principal, FirebaseSession>;
        epiqIdMappings : OrderedMap.Map<Text, EpiqIdMapping>;
        authenticationAuditLog : List.List<AuthenticationEvent>;
    };

    type Chain = {
        #evm;
        #custom;
        #btc;
        #icp;
    };

    // New actor definition with chain, privateKey, and recoveryPhrase fields
    type NewEpiqWallet = {
        walletId : Nat;
        walletLabel : ?Text;
        createdAt : Time.Time;
        publicAddress : Text;
        privateKey : ?Text;
        recoveryPhrase : ?Text;
        metadata : ?Text;
        chain : Chain;
    };

    // New actor non-transient state
    type NewActor = {
        nextWalletId : Nat;
        userWallets : OrderedMap.Map<Principal, OrderedMap.Map<Nat, NewEpiqWallet>>;
        wallets : OrderedMap.Map<Nat, NewEpiqWallet>;
        activeSessions : OrderedMap.Map<Principal, FirebaseSession>;
        epiqIdMappings : OrderedMap.Map<Text, EpiqIdMapping>;
        authenticationAuditLog : List.List<AuthenticationEvent>;
    };

    // Migration function from old to new state
    public func run(old : OldActor) : NewActor {
        let walletMap = OrderedMap.Make<Nat>(Nat.compare);
        let walletOwnerMap = OrderedMap.Make<Principal>(Principal.compare);

        // Migrate the wallets map from old to new wallet type, adding default values
        let wallets = walletMap.map<OldEpiqWallet, NewEpiqWallet>(
            old.wallets,
            func(_id, oldWallet) {
                {
                    walletId = oldWallet.walletId;
                    walletLabel = oldWallet.walletLabel;
                    createdAt = oldWallet.createdAt;
                    publicAddress = oldWallet.publicAddress;
                    privateKey = null;
                    recoveryPhrase = null;
                    metadata = oldWallet.metadata;
                    chain = #evm;
                };
            },
        );

        // Migrate the userWallets map from old to new wallet type, adding default values
        let userWallets = walletOwnerMap.map<OrderedMap.Map<Nat, OldEpiqWallet>, OrderedMap.Map<Nat, NewEpiqWallet>>(
            old.userWallets,
            func(_principal, oldWallets) {
                walletMap.map<OldEpiqWallet, NewEpiqWallet>(
                    oldWallets,
                    func(_id, oldWallet) {
                        {
                            walletId = oldWallet.walletId;
                            walletLabel = oldWallet.walletLabel;
                            createdAt = oldWallet.createdAt;
                            publicAddress = oldWallet.publicAddress;
                            privateKey = null;
                            recoveryPhrase = null;
                            metadata = oldWallet.metadata;
                            chain = #evm;
                        };
                    },
                );
            },
        );

        // Return the migrated state directly since other fields remain unchanged
        {
            old with
            wallets;
            userWallets;
        };
    };
};
