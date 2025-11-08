import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { MinecraftBot, BotConfig, BotStatus } from './bot/MinecraftBot';
import { SessionStorage, Session } from './utils/SessionStorage';

let mainWindow: BrowserWindow | null = null;
let bot: MinecraftBot | null = null;
let sessionStorage: SessionStorage;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist-gui/index.html'));
  }

  mainWindow.on('closed', () => {
    if (bot) {
      bot.disconnect();
    }
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  sessionStorage = new SessionStorage();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('bot:connect', async (_event, config: BotConfig) => {
  try {
    if (bot && bot.isConnected()) {
      bot.disconnect();
    }

    bot = new MinecraftBot();

    bot.setMessageCallback((message: string) => {
      mainWindow?.webContents.send('bot:message', message);
    });

    bot.setErrorCallback((error: string) => {
      mainWindow?.webContents.send('bot:error', error);
    });

    bot.onStatusUpdate((status: BotStatus) => {
      mainWindow?.webContents.send('bot:status', status);
    });

    await bot.connect(config);

    const session = sessionStorage.addSession(
      `${config.username}@${config.host}`,
      config
    );
    sessionStorage.updateSessionLastUsed(session.id);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bot:disconnect', async () => {
  if (bot) {
    bot.disconnect();
    bot = null;
  }
  return { success: true };
});

ipcMain.handle('bot:sendChat', async (_event, message: string) => {
  if (bot && bot.isConnected()) {
    bot.sendChat(message);
    return { success: true };
  }
  return { success: false, error: 'Bot is not connected' };
});

ipcMain.handle('bot:getStatus', async () => {
  if (bot) {
    return bot.getStatus();
  }
  return { connected: false };
});

ipcMain.handle('sessions:getAll', async () => {
  return sessionStorage.getAllSessions();
});

ipcMain.handle('sessions:get', async (_event, id: string) => {
  return sessionStorage.getSession(id);
});

ipcMain.handle('sessions:delete', async (_event, id: string) => {
  sessionStorage.deleteSession(id);
  return { success: true };
});

ipcMain.handle('sessions:clear', async () => {
  sessionStorage.clearAllSessions();
  return { success: true };
});
