import * as fs from 'fs';
import * as path from 'path';
import { BotConfig } from '../bot/MinecraftBot';

export interface Session {
  id: string;
  name: string;
  config: BotConfig;
  lastUsed: number;
}

export class SessionStorage {
  private sessionsFile: string;
  private sessions: Session[] = [];

  constructor(dataDir?: string) {
    const appDataDir = dataDir || this.getAppDataDir();
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }
    this.sessionsFile = path.join(appDataDir, 'sessions.json');
    this.loadSessions();
  }

  private getAppDataDir(): string {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    return path.join(homeDir, '.mcsugarcanebot');
  }

  private loadSessions(): void {
    try {
      if (fs.existsSync(this.sessionsFile)) {
        const data = fs.readFileSync(this.sessionsFile, 'utf-8');
        this.sessions = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
      this.sessions = [];
    }
  }

  private saveSessions(): void {
    try {
      fs.writeFileSync(this.sessionsFile, JSON.stringify(this.sessions, null, 2));
    } catch (error) {
      console.error('Failed to save sessions:', error);
    }
  }

  public addSession(name: string, config: BotConfig): Session {
    const session: Session = {
      id: this.generateId(),
      name,
      config,
      lastUsed: Date.now(),
    };

    const existingIndex = this.sessions.findIndex(
      (s) => s.config.host === config.host && s.config.username === config.username
    );

    if (existingIndex !== -1) {
      this.sessions[existingIndex] = session;
    } else {
      this.sessions.unshift(session);
    }

    if (this.sessions.length > 10) {
      this.sessions = this.sessions.slice(0, 10);
    }

    this.saveSessions();
    return session;
  }

  public getSession(id: string): Session | undefined {
    return this.sessions.find((s) => s.id === id);
  }

  public getAllSessions(): Session[] {
    return [...this.sessions].sort((a, b) => b.lastUsed - a.lastUsed);
  }

  public updateSessionLastUsed(id: string): void {
    const session = this.sessions.find((s) => s.id === id);
    if (session) {
      session.lastUsed = Date.now();
      this.saveSessions();
    }
  }

  public deleteSession(id: string): void {
    this.sessions = this.sessions.filter((s) => s.id !== id);
    this.saveSessions();
  }

  public clearAllSessions(): void {
    this.sessions = [];
    this.saveSessions();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
