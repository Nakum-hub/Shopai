'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// =============================================================================
// Types
// =============================================================================

type User = {
  id: string;
  username: string;
};

type Message = {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  type: 'user' | 'system';
};

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'shutting_down';

// =============================================================================
// Exponential Backoff with Jitter
// =============================================================================

function getBackoffDelay(attempt: number): number {
  const baseDelay = 1000;      // 1 second
  const maxDelay = 30000;       // 30 seconds
  const multiplier = 2;

  // Exponential: 1s, 2s, 4s, 8s, 16s, 30s (capped)
  const exponentialDelay = Math.min(baseDelay * Math.pow(multiplier, attempt), maxDelay);

  // Full jitter: random between 0 and exponentialDelay
  const jitter = Math.random() * exponentialDelay;

  return Math.floor(jitter);
}

// =============================================================================
// Component
// =============================================================================

export default function SocketDemo() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('');
  const [isUsernameSet, setIsUsernameSet] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [users, setUsers] = useState<User[]>([]);
  const [serverShutdown, setServerShutdown] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [reconnectTrigger, setReconnectTrigger] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const lastSeenTimestampRef = useRef<string>(new Date().toISOString());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Stable message IDs tracker (deduplication for replay)
  // -------------------------------------------------------------------------
  const messageIdsRef = useRef<Set<string>>(new Set());

  // -------------------------------------------------------------------------
  // Safe message adder (deduplicates by id)
  // -------------------------------------------------------------------------
  const addMessages = useCallback((newMessages: Message[]) => {
    setMessages((prev) => {
      const existingIds = messageIdsRef.current;
      const unique: Message[] = [];

      for (const msg of newMessages) {
        if (!existingIds.has(msg.id)) {
          existingIds.add(msg.id);
          unique.push(msg);
        }
      }

      if (unique.length === 0) return prev;
      return [...prev, ...unique];
    });
  }, []);

  // -------------------------------------------------------------------------
  // Connect to WebSocket server
  // -------------------------------------------------------------------------
  useEffect(() => {
    let destroyed = false;

    function connect() {
      if (destroyed) return;

      // Update connection status
      setConnectionStatus(reconnectAttemptRef.current > 0 ? 'reconnecting' : 'connecting');

      // Build auth object
      const auth: { token?: string; lastSeenTimestamp: string } = {
        lastSeenTimestamp: lastSeenTimestampRef.current,
      };
      if (authToken.trim()) {
        auth.token = authToken.trim();
      }

      // Connect to websocket server
      // Never use PORT in the URL, always use XTransformPort
      // DO NOT change the path, it is used by Caddy to forward the request to the correct port
      const socketInstance = io('/?XTransformPort=3003', {
        transports: ['websocket', 'polling'],
        forceNew: true,
        reconnection: false, // We handle reconnection manually for backoff+replay
        timeout: 10000,
        auth,
      });

      socketRef.current = socketInstance;

      // ---- Connect ----
      socketInstance.on('connect', () => {
        if (destroyed) return;

        setConnectionStatus('connected');
        setServerShutdown(false);
        reconnectAttemptRef.current = 0;

        toast.success('Connected to chat server');
      });

      // ---- Disconnect ----
      socketInstance.on('disconnect', (reason) => {
        if (destroyed) return;

        setConnectionStatus('disconnected');

        // Track last seen timestamp for replay on reconnect
        if (messages.length > 0) {
          lastSeenTimestampRef.current = messages[messages.length - 1].timestamp;
        }

        // Auto-reconnect unless server initiated shutdown or client intentionally disconnected
        if (reason !== 'io server disconnect' && reason !== 'transport close') {
          scheduleReconnect();
        }
      });

      // ---- Connect Error ----
      socketInstance.on('connect_error', (err) => {
        if (destroyed) return;

        console.warn('[WS] Connection error:', err.message);

        if (err.message.includes('Too many concurrent connections')) {
          toast.error('Connection limit reached. Close other tabs and try again.');
        } else if (err.message.includes('Authentication failed')) {
          toast.error('Authentication failed. Check your token and try again.');
        } else {
          toast.error(`Connection error: ${err.message}`);
        }

        scheduleReconnect();
      });

      // ---- Chat Events ----
      socketInstance.on('message', (msg: Message) => {
        addMessages([msg]);
      });

      socketInstance.on('user-joined', (data: { user: User; message: Message }) => {
        addMessages([data.message]);
        setUsers((prev) => {
          if (!prev.find((u) => u.id === data.user.id)) {
            return [...prev, data.user];
          }
          return prev;
        });
      });

      socketInstance.on('user-left', (data: { user: User; message: Message }) => {
        addMessages([data.message]);
        setUsers((prev) => prev.filter((u) => u.id !== data.user.id));
      });

      socketInstance.on('users-list', (data: { users: User[] }) => {
        setUsers(data.users);
      });

      // ---- Hardened Server Events ----

      // Replay: server sends missed messages on reconnect
      socketInstance.on('replay', (data: { messages: Message[]; count: number }) => {
        if (data.count > 0) {
          addMessages(data.messages);
          toast.info(`Recovered ${data.count} message(s) from disconnection`);
        }
      });

      // Rate limited: server rejected an event due to rate limit
      socketInstance.on('rate_limited', (data: { event: string; limit: number; message: string }) => {
        toast.warning(`Rate limited: ${data.message}`, {
          description: `Event "${data.event}" limited to ${data.limit}/min`,
          duration: 5000,
        });
      });

      // Backpressure warning: server output buffer is near capacity
      socketInstance.on('backpressure_warning', (data: { bufferSize: number; max: number; message: string }) => {
        toast.warning('Server overloaded', {
          description: data.message || `Buffer: ${data.bufferSize}/${data.max}`,
          duration: 5000,
        });
      });

      // Server shutdown: server is going away
      socketInstance.on('server_shutdown', (data: { reason: string; timestamp: string }) => {
        setServerShutdown(true);
        setConnectionStatus('shutting_down');
        toast.error('Server shutting down', {
          description: data.reason || 'The server is shutting down. Please try again later.',
          duration: 10000,
        });
      });
    }

    function scheduleReconnect() {
      if (destroyed) return;

      const attempt = reconnectAttemptRef.current;
      const delay = getBackoffDelay(attempt);
      const maxAttempts = 10;

      if (attempt >= maxAttempts) {
        toast.error('Reconnection failed', {
          description: `Failed to reconnect after ${maxAttempts} attempts. Please refresh the page.`,
          duration: 10000,
        });
        return;
      }

      reconnectAttemptRef.current = attempt + 1;

      const nextDelay = getBackoffDelay(reconnectAttemptRef.current);
      toast.info(`Reconnecting...`, {
        description: `Attempt ${reconnectAttemptRef.current}/${maxAttempts} (next in ~${Math.round(nextDelay / 1000)}s)`,
        duration: 3000,
      });

      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    }

    // Initial connection
    connect();

    return () => {
      destroyed = true;

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [authToken, reconnectTrigger, addMessages]);

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  const handleJoin = () => {
    if (socketRef.current && username.trim() && connectionStatus === 'connected') {
      socketRef.current.emit('join', { username: username.trim() });
      setIsUsernameSet(true);
    }
  };

  const sendMessage = () => {
    if (socketRef.current && inputMessage.trim() && username.trim() && connectionStatus === 'connected') {
      socketRef.current.emit('message', {
        content: inputMessage.trim(),
        username: username.trim(),
      });
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const handleUsernameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };

  const handleManualReconnect = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    reconnectAttemptRef.current = 0;
    // Trigger the useEffect to re-run by bumping the counter
    setReconnectTrigger((prev) => prev + 1);
  };

  // -------------------------------------------------------------------------
  // Status indicator color
  // -------------------------------------------------------------------------
  const statusColors: Record<ConnectionStatus, string> = {
    connected: 'bg-green-100 text-green-800',
    connecting: 'bg-yellow-100 text-yellow-800',
    disconnected: 'bg-red-100 text-red-800',
    reconnecting: 'bg-yellow-100 text-yellow-800',
    shutting_down: 'bg-orange-100 text-orange-800',
  };

  const statusLabels: Record<ConnectionStatus, string> = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
    reconnecting: 'Reconnecting...',
    shutting_down: 'Shutting Down',
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>WebSocket Demo</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm px-2 py-1 rounded ${statusColors[connectionStatus]}`}>
                {statusLabels[connectionStatus]}
              </span>
              {(connectionStatus === 'disconnected' || connectionStatus === 'reconnecting') && (
                <Button variant="outline" size="sm" onClick={handleManualReconnect}>
                  Reconnect
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Server shutdown banner */}
          {serverShutdown && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-orange-800 text-sm">
              <strong>Server is shutting down.</strong> Messages may not be delivered. Please wait
              and refresh the page later.
            </div>
          )}

          {/* Auth token input */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Auth Token (optional — leave empty for anonymous, limited access)
            </label>
            <Input
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder="Paste your JWT token here..."
              disabled={connectionStatus === 'connected'}
              type="password"
              className="text-xs font-mono"
            />
          </div>

          {!isUsernameSet ? (
            <div className="space-y-2">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleUsernameKeyPress}
                placeholder="Enter your username..."
                disabled={connectionStatus !== 'connected'}
                className="flex-1"
              />
              <Button
                onClick={handleJoin}
                disabled={connectionStatus !== 'connected' || !username.trim()}
                className="w-full"
              >
                Join Chat
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="h-80 w-full border rounded-md p-4">
                <div className="space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center">No messages yet</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="border-b pb-2 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${
                                msg.type === 'system'
                                  ? 'text-blue-600 italic'
                                  : 'text-gray-700'
                              }`}
                            >
                              {msg.username}
                            </p>
                            <p
                              className={
                                msg.type === 'system'
                                  ? 'text-blue-500 italic'
                                  : 'text-gray-900'
                              }
                            >
                              {msg.content}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  disabled={connectionStatus !== 'connected'}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={connectionStatus !== 'connected' || !inputMessage.trim()}
                >
                  Send
                </Button>
              </div>
            </>
          )}

          {/* Connection info footer */}
          <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
            <p>
              Users online: {users.length} | Rate limits: 30 msg/min, 5 join/min, 10 test/min |
              Replay buffer: 100 messages
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
