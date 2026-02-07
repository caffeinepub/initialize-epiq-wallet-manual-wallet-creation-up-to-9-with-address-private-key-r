import OrderedMap "mo:base/OrderedMap";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import List "mo:base/List";

module {
    // Old state types
    type OldEpiqIdMapping = {
        epiqId : Text;
        principalId : Principal;
        timestamp : Time.Time;
        importedFromFirebase : Bool;
    };

    type OldFirebaseSession = {
        principalId : Principal;
        epiqId : Text;
        tokenIssuedAt : Time.Time;
        tokenExpiresAt : Time.Time;
        lastValidated : Time.Time;
    };

    type OldAuthenticationEvent = {
        timestamp : Time.Time;
        principalId : Principal;
        epiqId : ?Text;
        authMethod : Text;
        status : Text;
        failureReason : ?Text;
        ipContext : ?Text;
    };

    // Old state
    type OldActor = {
        firebaseConfig : ?{
            baseUrl : Text;
            apiKey : Text;
        };
        epiqIdMappings : OrderedMap.Map<Text, OldEpiqIdMapping>;
        activeSessions : OrderedMap.Map<Principal, OldFirebaseSession>;
        authenticationAuditLog : List.List<OldAuthenticationEvent>;
    };

    // New state types
    type NewEpiqIdMapping = {
        epiqId : Text;
        principalId : Principal;
        timestamp : Time.Time;
        importedFromFirebase : Bool;
    };

    type NewFirebaseSession = {
        principalId : Principal;
        epiqId : Text;
        tokenIssuedAt : Time.Time;
        tokenExpiresAt : Time.Time;
        lastValidated : Time.Time;
    };

    type NewAuthenticationEvent = {
        timestamp : Time.Time;
        principalId : Principal;
        epiqId : ?Text;
        authMethod : Text;
        status : Text;
        failureReason : ?Text;
        ipContext : ?Text;
    };

    // New state
    type NewActor = {
        firebaseConfig : ?{
            baseUrl : Text;
            apiKey : Text;
        };
        epiqIdMappings : OrderedMap.Map<Text, NewEpiqIdMapping>;
        activeSessions : OrderedMap.Map<Principal, NewFirebaseSession>;
        authenticationAuditLog : List.List<NewAuthenticationEvent>;
    };

    // Migration function
    public func run(old : OldActor) : NewActor {
        {
            firebaseConfig = old.firebaseConfig;
            epiqIdMappings = old.epiqIdMappings;
            activeSessions = old.activeSessions;
            authenticationAuditLog = old.authenticationAuditLog;
        };
    };
};

