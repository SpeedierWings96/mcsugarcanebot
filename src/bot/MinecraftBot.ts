import mineflayer, { Bot } from 'mineflayer';

export interface BotConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  version?: string;
  auth?: 'microsoft' | 'mojang' | 'offline';
}

export interface BotStatus {
  connected: boolean;
  health?: number;
  food?: number;
  position?: { x: number; y: number; z: number };
  gameMode?: string;
  dimension?: string;
}

export class MinecraftBot {
  private bot: Bot | null = null;
  private config: BotConfig | null = null;
  private statusCallback?: (status: BotStatus) => void;
  private messageCallback?: (message: string) => void;
  private errorCallback?: (error: string) => void;
  private connected: boolean = false;

  constructor() {}

  public connect(config: BotConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.config = config;

        const botOptions: any = {
          host: config.host,
          port: config.port || 25565,
          username: config.username,
          version: config.version || false,
        };

        if (config.auth === 'microsoft') {
          botOptions.auth = 'microsoft';
        } else if (config.auth === 'mojang' && config.password) {
          botOptions.auth = 'mojang';
          botOptions.password = config.password;
        } else {
          botOptions.auth = 'offline';
        }

        this.bot = mineflayer.createBot(botOptions);

        this.bot.once('spawn', () => {
          this.connected = true;
          this.onMessage('Bot spawned successfully!');
          this.updateStatus();
          resolve();
        });

        this.bot.on('error', (err) => {
          this.onError(`Bot error: ${err.message}`);
          reject(err);
        });

        this.bot.on('kicked', (reason) => {
          this.connected = false;
          this.onError(`Bot was kicked: ${reason}`);
        });

        this.bot.on('end', () => {
          this.connected = false;
          this.onMessage('Bot disconnected from server');
          this.updateStatus();
        });

        this.bot.on('chat', (username, message) => {
          if (username === this.bot?.username) return;
          this.onMessage(`<${username}> ${message}`);
        });

        this.bot.on('health', () => {
          this.updateStatus();
        });

        this.bot.on('move', () => {
          this.updateStatus();
        });

        this.bot.on('login', () => {
          this.onMessage('Bot logged in successfully!');
        });

      } catch (error: any) {
        this.onError(`Failed to create bot: ${error.message}`);
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.bot) {
      this.bot.quit();
      this.bot = null;
      this.connected = false;
      this.updateStatus();
    }
  }

  public sendChat(message: string): void {
    if (this.bot && this.isConnected()) {
      this.bot.chat(message);
    }
  }

  public isConnected(): boolean {
    return this.bot !== null && this.connected;
  }

  public getStatus(): BotStatus {
    if (!this.bot || !this.isConnected()) {
      return { connected: false };
    }

    return {
      connected: true,
      health: this.bot.health,
      food: this.bot.food,
      position: this.bot.entity?.position
        ? {
            x: Math.round(this.bot.entity.position.x * 100) / 100,
            y: Math.round(this.bot.entity.position.y * 100) / 100,
            z: Math.round(this.bot.entity.position.z * 100) / 100,
          }
        : undefined,
      gameMode: this.bot.game?.gameMode,
      dimension: this.bot.game?.dimension,
    };
  }

  public onStatusUpdate(callback: (status: BotStatus) => void): void {
    this.statusCallback = callback;
  }

  public onMessage(message: string): void {
    if (this.messageCallback) {
      this.messageCallback(message);
    }
  }

  public onError(error: string): void {
    if (this.errorCallback) {
      this.errorCallback(error);
    }
  }

  public setMessageCallback(callback: (message: string) => void): void {
    this.messageCallback = callback;
  }

  public setErrorCallback(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  private updateStatus(): void {
    if (this.statusCallback) {
      this.statusCallback(this.getStatus());
    }
  }

  public getConfig(): BotConfig | null {
    return this.config;
  }
}
