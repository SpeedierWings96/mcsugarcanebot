# Minecraft Bot

A modern Minecraft bot built with [mineflayer](https://github.com/PrismarineJS/mineflayer) and Electron, featuring a sleek graphical user interface for easy server connection and bot management.

## Features

- **Server Connection**: Connect to any Minecraft server using the mineflayer library
- **Session Management**: Save and load recent account credentials for quick reconnection
- **Modern GUI**: Beautiful Electron-based interface built with React
- **Real-time Status**: Monitor bot health, food, position, game mode, and dimension
- **Chat Integration**: Send and receive chat messages through the GUI
- **Multiple Auth Types**: Support for offline, Mojang, and Microsoft authentication

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A Minecraft server to connect to (local or remote)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/SpeedierWings96/mcsugarcanebot.git
cd mcsugarcanebot
```

2. Install dependencies:
```bash
npm install
```

3. Compile TypeScript code:
```bash
npm run compile
```

## Usage

### Development Mode

To run the bot in development mode with hot-reloading:

```bash
npm run dev
```

This will start both the Vite development server and the Electron application.

### Production Mode

1. Build the application:
```bash
npm run build
```

2. Start the Electron app:
```bash
npm start
```

### Building Standalone Application

To create a standalone executable:

```bash
npm run build:electron
```

## How to Use

1. **Launch the Application**: Run the bot using one of the methods above
2. **Enter Server Details**:
   - Server Host: The IP address or hostname of the Minecraft server
   - Port: The server port (default: 25565)
   - Username: Your bot's username
   - Auth Type: Choose between offline, Mojang, or Microsoft authentication
   - Password: Required only for Mojang authentication

3. **Connect**: Click the "Connect" button to join the server
4. **Monitor Status**: View real-time bot status including health, food, position, and more
5. **Send Chat Messages**: Use the chat input at the bottom to send messages to the server
6. **Session Management**: Previously used connections are saved and can be quickly loaded from the "Recent Sessions" panel

## Project Structure

```
mcsugarcanebot/
├── src/
│   ├── bot/
│   │   └── MinecraftBot.ts       # Core bot logic using mineflayer
│   ├── gui/
│   │   ├── App.tsx               # React GUI application
│   │   ├── App.css               # GUI styling
│   │   └── index.tsx             # React entry point
│   ├── utils/
│   │   └── SessionStorage.ts     # Session management
│   ├── main.ts                   # Electron main process
│   └── preload.ts                # Electron preload script
├── public/
│   └── index.html                # HTML template
├── dist/                         # Compiled TypeScript output
├── dist-gui/                     # Built React application
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── vite.config.ts                # Vite configuration
```

## Technologies Used

- **[mineflayer](https://github.com/PrismarineJS/mineflayer)**: High-level Minecraft bot API
- **[Electron](https://www.electronjs.org/)**: Desktop application framework
- **[React](https://reactjs.org/)**: UI library for building the interface
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **[Vite](https://vitejs.dev/)**: Fast build tool and development server

## Configuration

Session data is stored in `~/.mcsugarcanebot/sessions.json`. This file contains your recent server connections and can be manually edited if needed.

## Troubleshooting

### Bot won't connect
- Verify the server address and port are correct
- Check if the server is online and accepting connections
- Ensure you're using the correct authentication method
- For offline servers, use "Offline" auth type

### TypeScript compilation errors
```bash
npm run compile
```

### Missing dependencies
```bash
npm install
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Acknowledgments

- Built with [mineflayer](https://github.com/PrismarineJS/mineflayer) - the amazing Minecraft bot framework
- UI inspired by modern gaming applications
