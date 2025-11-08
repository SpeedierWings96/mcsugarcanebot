import { contextBridge, ipcRenderer } from 'electron';
import { BotConfig, BotStatus } from './bot/MinecraftBot';
import { Session } from './utils/SessionStorage';

contextBridge.exposeInMainWorld('electronAPI', {
  bot: {
    connect: (config: BotConfig) => ipcRenderer.invoke('bot:connect', config),
    disconnect: () => ipcRenderer.invoke('bot:disconnect'),
    sendChat: (message: string) => ipcRenderer.invoke('bot:sendChat', message),
    getStatus: () => ipcRenderer.invoke('bot:getStatus'),
    onMessage: (callback: (message: string) => void) => {
      ipcRenderer.on('bot:message', (_event, message) => callback(message));
    },
    onError: (callback: (error: string) => void) => {
      ipcRenderer.on('bot:error', (_event, error) => callback(error));
    },
    onStatus: (callback: (status: BotStatus) => void) => {
      ipcRenderer.on('bot:status', (_event, status) => callback(status));
    },
  },
  sessions: {
    getAll: () => ipcRenderer.invoke('sessions:getAll'),
    get: (id: string) => ipcRenderer.invoke('sessions:get', id),
    delete: (id: string) => ipcRenderer.invoke('sessions:delete', id),
    clear: () => ipcRenderer.invoke('sessions:clear'),
  },
});
