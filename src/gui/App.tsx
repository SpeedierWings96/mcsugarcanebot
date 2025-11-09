import React, { useState, useEffect } from 'react';
import './App.css';

interface BotConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  version?: string;
  auth?: 'microsoft' | 'mojang' | 'offline';
}

interface BotStatus {
  connected: boolean;
  health?: number;
  food?: number;
  position?: { x: number; y: number; z: number };
  gameMode?: string;
  dimension?: string;
  farmingActive?: boolean;
  sugarcaneCollected?: number;
}

interface Session {
  id: string;
  name: string;
  config: BotConfig;
  lastUsed: number;
}

declare global {
  interface Window {
    electronAPI: {
      bot: {
        connect: (config: BotConfig) => Promise<{ success: boolean; error?: string }>;
        disconnect: () => Promise<{ success: boolean }>;
        sendChat: (message: string) => Promise<{ success: boolean; error?: string }>;
        getStatus: () => Promise<BotStatus>;
        startFarming: () => Promise<{ success: boolean; error?: string }>;
        stopFarming: () => Promise<{ success: boolean; error?: string }>;
        setBasePosition: () => Promise<{ success: boolean; error?: string }>;
        resetSugarcaneCount: () => Promise<{ success: boolean; error?: string }>;
        onMessage: (callback: (message: string) => void) => void;
        onError: (callback: (error: string) => void) => void;
        onStatus: (callback: (status: BotStatus) => void) => void;
      };
      sessions: {
        getAll: () => Promise<Session[]>;
        get: (id: string) => Promise<Session | undefined>;
        delete: (id: string) => Promise<{ success: boolean }>;
        clear: () => Promise<{ success: boolean }>;
      };
    };
  }
}

function App() {
  const [host, setHost] = useState('');
  const [port, setPort] = useState('25565');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authType, setAuthType] = useState<'offline' | 'mojang' | 'microsoft'>('offline');
  const [status, setStatus] = useState<BotStatus>({ connected: false });
  const [messages, setMessages] = useState<string[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();

    if (window.electronAPI) {
      window.electronAPI.bot.onMessage((message: string) => {
        setMessages((prev) => [...prev, `[INFO] ${message}`]);
      });

      window.electronAPI.bot.onError((error: string) => {
        setMessages((prev) => [...prev, `[ERROR] ${error}`]);
      });

      window.electronAPI.bot.onStatus((newStatus: BotStatus) => {
        setStatus(newStatus);
      });
    }
  }, []);

  const loadSessions = async () => {
    if (window.electronAPI) {
      const allSessions = await window.electronAPI.sessions.getAll();
      setSessions(allSessions);
    }
  };

  const handleConnect = async () => {
    if (!host || !username) {
      setMessages((prev) => [...prev, '[ERROR] Host and username are required']);
      return;
    }

    setLoading(true);
    const config: BotConfig = {
      host,
      port: parseInt(port) || 25565,
      username,
      auth: authType,
    };

    if (authType === 'mojang' && password) {
      config.password = password;
    }

    const result = await window.electronAPI.bot.connect(config);
    setLoading(false);

    if (result.success) {
      setMessages((prev) => [...prev, '[SUCCESS] Connected to server!']);
      loadSessions();
    } else {
      setMessages((prev) => [...prev, `[ERROR] ${result.error}`]);
    }
  };

  const handleDisconnect = async () => {
    await window.electronAPI.bot.disconnect();
    setStatus({ connected: false });
    setMessages((prev) => [...prev, '[INFO] Disconnected from server']);
  };

  const handleSendChat = async () => {
    if (!chatMessage.trim()) return;

    const result = await window.electronAPI.bot.sendChat(chatMessage);
    if (result.success) {
      setMessages((prev) => [...prev, `[CHAT] <${username}> ${chatMessage}`]);
      setChatMessage('');
    } else {
      setMessages((prev) => [...prev, `[ERROR] ${result.error}`]);
    }
  };

  const handleLoadSession = async (session: Session) => {
    setHost(session.config.host);
    setPort(session.config.port?.toString() || '25565');
    setUsername(session.config.username);
    setAuthType(session.config.auth || 'offline');
    if (session.config.password) {
      setPassword(session.config.password);
    }
  };

  const handleDeleteSession = async (id: string) => {
    await window.electronAPI.sessions.delete(id);
    loadSessions();
  };

  const handleStartFarming = async () => {
    const result = await window.electronAPI.bot.startFarming();
    if (result.success) {
      setMessages((prev) => [...prev, '[INFO] Started sugarcane farming']);
    } else {
      setMessages((prev) => [...prev, `[ERROR] ${result.error}`]);
    }
  };

  const handleStopFarming = async () => {
    const result = await window.electronAPI.bot.stopFarming();
    if (result.success) {
      setMessages((prev) => [...prev, '[INFO] Stopped sugarcane farming']);
    } else {
      setMessages((prev) => [...prev, `[ERROR] ${result.error}`]);
    }
  };

  const handleSetBasePosition = async () => {
    const result = await window.electronAPI.bot.setBasePosition();
    if (result.success) {
      setMessages((prev) => [...prev, '[INFO] Base position set']);
    } else {
      setMessages((prev) => [...prev, `[ERROR] ${result.error}`]);
    }
  };

  const handleResetSugarcaneCount = async () => {
    const result = await window.electronAPI.bot.resetSugarcaneCount();
    if (result.success) {
      setMessages((prev) => [...prev, '[INFO] Sugarcane count reset']);
    } else {
      setMessages((prev) => [...prev, `[ERROR] ${result.error}`]);
    }
  };

  return (
    <div className="app">
      <div className="header">
        <h1>🎮 Minecraft Bot</h1>
        <div className="status-indicator">
          <span className={`status-dot ${status.connected ? 'connected' : 'disconnected'}`}></span>
          <span>{status.connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="main-content">
        <div className="left-panel">
          <div className="connection-form">
            <h2>Connection Settings</h2>
            <div className="form-group">
              <label>Server Host</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                placeholder="localhost or server.example.com"
                disabled={status.connected}
              />
            </div>
            <div className="form-group">
              <label>Port</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="25565"
                disabled={status.connected}
              />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Bot username"
                disabled={status.connected}
              />
            </div>
            <div className="form-group">
              <label>Auth Type</label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value as any)}
                disabled={status.connected}
              >
                <option value="offline">Offline</option>
                <option value="mojang">Mojang</option>
                <option value="microsoft">Microsoft</option>
              </select>
            </div>
            {authType === 'mojang' && (
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Account password"
                  disabled={status.connected}
                />
              </div>
            )}
            <div className="button-group">
              {!status.connected ? (
                <button onClick={handleConnect} disabled={loading} className="btn-primary">
                  {loading ? 'Connecting...' : 'Connect'}
                </button>
              ) : (
                <button onClick={handleDisconnect} className="btn-danger">
                  Disconnect
                </button>
              )}
            </div>
          </div>

          {status.connected && (
            <div className="bot-status">
              <h2>Bot Status</h2>
              <div className="status-grid">
                <div className="status-item">
                  <span className="label">Health:</span>
                  <span className="value">{status.health ?? 'N/A'}</span>
                </div>
                <div className="status-item">
                  <span className="label">Food:</span>
                  <span className="value">{status.food ?? 'N/A'}</span>
                </div>
                <div className="status-item">
                  <span className="label">Game Mode:</span>
                  <span className="value">{status.gameMode ?? 'N/A'}</span>
                </div>
                <div className="status-item">
                  <span className="label">Dimension:</span>
                  <span className="value">{status.dimension ?? 'N/A'}</span>
                </div>
                {status.position && (
                  <div className="status-item full-width">
                    <span className="label">Position:</span>
                    <span className="value">
                      X: {status.position.x}, Y: {status.position.y}, Z: {status.position.z}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {status.connected && (
            <div className="farming-controls">
              <h2>Sugarcane Farming</h2>
              <div className="status-grid">
                <div className="status-item">
                  <span className="label">Status:</span>
                  <span className="value">{status.farmingActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="status-item">
                  <span className="label">Collected:</span>
                  <span className="value">{status.sugarcaneCollected ?? 0}</span>
                </div>
              </div>
              <div className="button-group">
                <button onClick={handleSetBasePosition} className="btn-primary">
                  Set Base Position
                </button>
                {!status.farmingActive ? (
                  <button onClick={handleStartFarming} className="btn-primary">
                    Start Farming
                  </button>
                ) : (
                  <button onClick={handleStopFarming} className="btn-danger">
                    Stop Farming
                  </button>
                )}
                <button onClick={handleResetSugarcaneCount} className="btn-primary">
                  Reset Count
                </button>
              </div>
            </div>
          )}

          <div className="sessions">
            <h2>Recent Sessions</h2>
            <div className="sessions-list">
              {sessions.length === 0 ? (
                <p className="no-sessions">No recent sessions</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="session-item">
                    <div className="session-info" onClick={() => handleLoadSession(session)}>
                      <div className="session-name">{session.name}</div>
                      <div className="session-details">
                        {session.config.host}:{session.config.port || 25565}
                      </div>
                    </div>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="console">
            <h2>Console</h2>
            <div className="console-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className="console-message">
                  {msg}
                </div>
              ))}
            </div>
          </div>

          {status.connected && (
            <div className="chat-input">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="Type a message..."
              />
              <button onClick={handleSendChat} className="btn-primary">
                Send
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
