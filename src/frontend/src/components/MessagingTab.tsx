import { useState, useRef, useEffect } from 'react';
import { useGetMessagesWithUser, useSendMessage, useGetUserProfile, useFindUserByDisplayName } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useActor } from '../hooks/useActor';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, User, Loader2, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EmojiPicker from './EmojiPicker';
import type { Message } from '../backend';
import { Principal } from '@icp-sdk/core/principal';

export default function MessagingTab() {
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<Principal | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [recipientDisplayNameInput, setRecipientDisplayNameInput] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [retryAttempts, setRetryAttempts] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [], isLoading: messagesLoading, error: messagesError, refetch: refetchMessages } = useGetMessagesWithUser(selectedUser);
  const { data: recipientProfile } = useGetUserProfile(selectedUser);
  const { mutate: sendMessage, isPending } = useSendMessage();
  const { mutate: findUserByDisplayName, isPending: isLookingUp } = useFindUserByDisplayName();

  const isBackendReady = !!actor && !actorFetching;

  // Auto-retry when backend becomes ready
  useEffect(() => {
    if (isBackendReady && messagesError && selectedUser) {
      const timer = setTimeout(() => {
        refetchMessages();
        setRetryAttempts((prev) => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isBackendReady, messagesError, selectedUser, refetchMessages]);

  // Invalidate queries when backend is ready
  useEffect(() => {
    if (isBackendReady && retryAttempts === 0 && selectedUser) {
      queryClient.invalidateQueries({ queryKey: ['messages', selectedUser.toString()] });
    }
  }, [isBackendReady, queryClient, retryAttempts, selectedUser]);

  const handleStartConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientDisplayNameInput.trim()) return;

    setLookupError('');

    findUserByDisplayName(recipientDisplayNameInput.trim(), {
      onSuccess: (principalId) => {
        setSelectedUser(principalId);
        setRecipientDisplayNameInput('');
        setLookupError('');
      },
      onError: (error) => {
        setLookupError(error.message);
      },
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    sendMessage(
      { to: selectedUser, content: newMessage },
      {
        onSuccess: () => {
          setNewMessage('');
        },
      }
    );
  };

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setNewMessage((prev) => prev + emoji);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = newMessage;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + emoji + after;

    setNewMessage(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const formatTime = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateSeparator = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (messageDate.getTime() === todayDate.getTime()) {
      return 'Today';
    } else if (messageDate.getTime() === yesterdayDate.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  const getDateKey = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    
    messages.forEach((msg) => {
      const dateKey = getDateKey(msg.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });

    return groups;
  };

  const getDisplayName = (principalId: string): string => {
    if (selectedUser && principalId === selectedUser.toString() && recipientProfile) {
      return recipientProfile.displayName || recipientProfile.name;
    }
    return principalId.slice(0, 8) + '...';
  };

  const handleRetry = () => {
    setRetryAttempts(0);
    refetchMessages();
  };

  // Backend initialization check
  if (!isBackendReady) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md w-full border-2 border-primary/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="relative">
                  <MessageSquare className="h-12 w-12 text-primary animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-secondary animate-spin" />
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Connecting to Messaging Service</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Establishing secure connection to the backend...
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span>Initializing encrypted messaging</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state for messages
  if (messagesError && selectedUser) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Conversations</CardTitle>
              <CardDescription>Start a new conversation</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStartConversation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientDisplayName" className="text-sm font-medium">
                    Recipient Display Name
                  </Label>
                  <Input
                    id="recipientDisplayName"
                    placeholder="Enter display name"
                    value={recipientDisplayNameInput}
                    onChange={(e) => {
                      setRecipientDisplayNameInput(e.target.value);
                      setLookupError('');
                    }}
                    className="focus-visible:ring-primary"
                    disabled={isLookingUp}
                  />
                </div>

                {lookupError && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {lookupError}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90" 
                  disabled={!recipientDisplayNameInput.trim() || isLookingUp}
                >
                  {isLookingUp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Looking up...
                    </>
                  ) : (
                    'Start Chat'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>Failed to load messages</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Failed to load messages</p>
                    <p className="text-sm mt-1">
                      {messagesError instanceof Error ? messagesError.message : 'An unknown error occurred'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="ml-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white border-0"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const sortedMessages = [...messages].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  const groupedMessages = groupMessagesByDate(sortedMessages);
  const dateKeys = Object.keys(groupedMessages).sort((a, b) => {
    const dateA = groupedMessages[a][0].timestamp;
    const dateB = groupedMessages[b][0].timestamp;
    return Number(dateA) - Number(dateB);
  });

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Conversations</CardTitle>
          <CardDescription>Start a new conversation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleStartConversation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientDisplayName" className="text-sm font-medium">
                Recipient Display Name
              </Label>
              <Input
                id="recipientDisplayName"
                placeholder="Enter display name"
                value={recipientDisplayNameInput}
                onChange={(e) => {
                  setRecipientDisplayNameInput(e.target.value);
                  setLookupError('');
                }}
                className="focus-visible:ring-primary"
                disabled={isLookingUp}
              />
              <p className="text-xs text-muted-foreground">
                Enter the recipient's display name to start a conversation
              </p>
            </div>

            {lookupError && (
              <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {lookupError}
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90" 
              disabled={!recipientDisplayNameInput.trim() || isLookingUp}
            >
              {isLookingUp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up...
                </>
              ) : (
                'Start Chat'
              )}
            </Button>
          </form>

          {selectedUser && (
            <div className="mt-6 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Active Chat</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {recipientProfile ? (recipientProfile.displayName || recipientProfile.name) : selectedUser.toString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
          <CardDescription>
            {selectedUser 
              ? `Chat with ${recipientProfile ? (recipientProfile.displayName || recipientProfile.name) : 'user'}`
              : 'Select a conversation to start messaging'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedUser ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="text-center space-y-2">
                <MessageSquare className="h-12 w-12 mx-auto text-primary/50" />
                <p>Enter a display name to start a conversation</p>
              </div>
            </div>
          ) : messagesLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading messages...</p>
              </div>
            </div>
          ) : (
            <>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {sortedMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
                  ) : (
                    dateKeys.map((dateKey) => (
                      <div key={dateKey} className="space-y-4">
                        <div className="flex items-center justify-center my-6">
                          <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20">
                            <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/30" />
                            <span className="text-xs font-medium text-primary/80 tracking-wide">
                              {formatDateSeparator(groupedMessages[dateKey][0].timestamp)}
                            </span>
                            <div className="h-px w-8 bg-gradient-to-l from-transparent to-primary/30" />
                          </div>
                        </div>

                        {groupedMessages[dateKey].map((msg) => {
                          const isOwn = msg.from.toString() === identity?.getPrincipal().toString();
                          return (
                            <div key={Number(msg.id)} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                  isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                }`}
                              >
                                {!isOwn && (
                                  <p className="text-xs font-medium mb-1 opacity-70">
                                    {getDisplayName(msg.from.toString())}
                                  </p>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                  {formatTime(msg.timestamp)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[60px] resize-none focus-visible:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <div className="flex flex-col gap-2">
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={isPending || !newMessage.trim()} 
                    className="h-[60px] w-[60px] bg-primary hover:bg-primary/90"
                  >
                    {isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
