import mineflayer, { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';
import { pathfinder, Movements, goals } from 'mineflayer-pathfinder';

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
  farmingActive?: boolean;
  sugarcaneCollected?: number;
}

export class MinecraftBot {
  private bot: Bot | null = null;
  private config: BotConfig | null = null;
  private statusCallback?: (status: BotStatus) => void;
  private messageCallback?: (message: string) => void;
  private errorCallback?: (error: string) => void;
  private connected: boolean = false;
  private basePosition: Vec3 | null = null;
  private farmingActive: boolean = false;
  private sugarcaneCollected: number = 0;
  private readonly FARM_RADIUS = 50;

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

        this.bot.loadPlugin(pathfinder);

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
      farmingActive: this.farmingActive,
      sugarcaneCollected: this.sugarcaneCollected,
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

  public setBasePosition(): void {
    if (this.bot && this.bot.entity) {
      this.basePosition = this.bot.entity.position.clone();
      this.onMessage(`Base position set at X: ${Math.round(this.basePosition.x)}, Y: ${Math.round(this.basePosition.y)}, Z: ${Math.round(this.basePosition.z)}`);
    }
  }

  public startSugarcaneFarming(): void {
    if (!this.bot || !this.isConnected()) {
      this.onError('Bot is not connected');
      return;
    }

    if (!this.basePosition) {
      this.basePosition = this.bot.entity.position.clone();
      this.onMessage(`Base position automatically set at X: ${Math.round(this.basePosition.x)}, Y: ${Math.round(this.basePosition.y)}, Z: ${Math.round(this.basePosition.z)}`);
    }

    this.farmingActive = true;
    this.onMessage('Starting sugarcane farming...');
    this.farmSugarcaneLoop();
  }

  public stopSugarcaneFarming(): void {
    this.farmingActive = false;
    this.onMessage('Stopping sugarcane farming...');
    this.updateStatus();
  }

  private async farmSugarcaneLoop(): Promise<void> {
    while (this.farmingActive && this.bot && this.isConnected()) {
      try {
        const sugarcane = await this.findNearestSugarcane();
        
        if (sugarcane) {
          await this.harvestSugarcane(sugarcane);
          await this.collectNearbyItems();
        } else {
          this.onMessage('No sugarcane found within range, waiting...');
          await this.sleep(5000);
        }
        
        await this.sleep(1000);
      } catch (error: any) {
        this.onError(`Farming error: ${error.message}`);
        await this.sleep(2000);
      }
    }
  }

  private async findNearestSugarcane(): Promise<any | null> {
    if (!this.bot || !this.basePosition) return null;

    const sugarcaneBlock = this.bot.registry.blocksByName['reeds'];
    if (!sugarcaneBlock) {
      this.onError('Sugarcane block type not found in registry');
      return null;
    }

    const blocks = this.bot.findBlocks({
      matching: sugarcaneBlock.id,
      maxDistance: this.FARM_RADIUS,
      count: 100,
    });

    let nearestBlock = null;
    let minDistance = Infinity;

    for (const blockPos of blocks) {
      const distance = this.basePosition.distanceTo(blockPos);
      
      if (distance <= this.FARM_RADIUS) {
        const block = this.bot.blockAt(blockPos);
        
        if (block && this.isTopSugarcaneBlock(block)) {
          const botDistance = this.bot.entity.position.distanceTo(blockPos);
          if (botDistance < minDistance) {
            minDistance = botDistance;
            nearestBlock = block;
          }
        }
      }
    }

    return nearestBlock;
  }

  private isTopSugarcaneBlock(block: any): boolean {
    if (!this.bot) return false;
    
    const blockAbove = this.bot.blockAt(block.position.offset(0, 1, 0));
    return blockAbove !== null && blockAbove.name !== 'reeds';
  }

  private async harvestSugarcane(block: any): Promise<void> {
    if (!this.bot) return;

    try {
      const position = block.position;
      
      if (!this.isWithinFarmRadius(position)) {
        this.onMessage('Sugarcane is outside farm radius, skipping...');
        return;
      }

      const distance = this.bot.entity.position.distanceTo(position);
      
      if (distance > 4.5) {
        const movements = new Movements(this.bot);
        this.bot.pathfinder.setMovements(movements);
        await this.bot.pathfinder.goto(new goals.GoalNear(position.x, position.y, position.z, 3));
      }

      if (!this.isWithinFarmRadius(this.bot.entity.position)) {
        this.onMessage('Bot moved outside farm radius, returning to base...');
        return;
      }

      let currentBlock = this.bot.blockAt(position);
      let harvestedCount = 0;

      while (currentBlock && currentBlock.name === 'reeds') {
        await this.bot.dig(currentBlock);
        harvestedCount++;
        
        const blockBelow = this.bot.blockAt(currentBlock.position.offset(0, -1, 0));
        if (blockBelow && blockBelow.name === 'reeds') {
          currentBlock = blockBelow;
        } else {
          break;
        }
      }

      if (harvestedCount > 0) {
        this.sugarcaneCollected += harvestedCount;
        this.onMessage(`Harvested ${harvestedCount} sugarcane block(s). Total: ${this.sugarcaneCollected}`);
        this.updateStatus();
      }
    } catch (error: any) {
      this.onError(`Failed to harvest sugarcane: ${error.message}`);
    }
  }

  private async collectNearbyItems(): Promise<void> {
    if (!this.bot) return;

    try {
      const items = Object.values(this.bot.entities).filter(
        (entity: any) =>
          entity.type === 'object' &&
          entity.name === 'item' &&
          this.bot!.entity.position.distanceTo(entity.position) < 10
      );

      for (const item of items) {
        if (!this.farmingActive) break;
        
        try {
          const distance = this.bot.entity.position.distanceTo(item.position);
          if (distance > 2) {
            const movements = new Movements(this.bot);
            this.bot.pathfinder.setMovements(movements);
            await this.bot.pathfinder.goto(new goals.GoalNear(item.position.x, item.position.y, item.position.z, 1));
          }
          
          await this.sleep(500);
        } catch (error) {
        }
      }
    } catch (error: any) {
      this.onError(`Failed to collect items: ${error.message}`);
    }
  }

  private isWithinFarmRadius(position: Vec3): boolean {
    if (!this.basePosition) return false;
    return this.basePosition.distanceTo(position) <= this.FARM_RADIUS;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public isFarmingActive(): boolean {
    return this.farmingActive;
  }

  public getSugarcaneCollected(): number {
    return this.sugarcaneCollected;
  }

  public resetSugarcaneCount(): void {
    this.sugarcaneCollected = 0;
    this.updateStatus();
  }
}
