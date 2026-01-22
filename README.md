# Mattermost Desktop Client

A lightweight desktop client for Mattermost built with Electron and React. Connect to any Mattermost server with native Windows integration.

## Features

### Core Functionality
- **Connect to any Mattermost server** - Enter your server URL and start chatting
- **Persistent sessions** - Stay logged in between app restarts
- **Native notifications** - Windows toast notifications for new messages

### System Integration
- **System tray support** - Minimize to tray, quick access menu
- **Adaptive icons** - Tray and taskbar icons automatically match your Windows taskbar theme (light/dark)
- **Unread badge** - Message count displayed in window title

### Appearance
- **Light/Dark/System themes** - Match your system preference or choose manually
- **Clean, minimal UI** - Native menu bar for navigation (Back, Forward, Reload)
- **Full-screen support** - Distraction-free mode

### Additional Features
- **Auto-updates** - Automatic updates via GitHub Releases (when configured)
- **Minimize to tray** - Keep the app running in the background
- **Settings persistence** - All preferences saved locally

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- npm (included with Node.js)

### Setup
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/mattermost-react.git
cd mattermost-react

# Install dependencies
npm install
```

## Usage

### Development Mode
```bash
npm start
```
This launches the app with hot-reload enabled. DevTools will open automatically.

### Production Build
See [Building](#building) section below.

## Configuration

### Application Settings
Access settings via **File → Settings** or `Ctrl+,`:

| Setting | Description |
|---------|-------------|
| Theme | System / Light / Dark |
| Notifications | Enable/disable desktop notifications |
| Notification Sound | Toggle notification sounds |
| Minimize to Tray | Keep app running when closed |

### Auto-Updates
To enable auto-updates via GitHub Releases, edit `electron-builder.yml`:

```yaml
publish:
  provider: github
  owner: YOUR_GITHUB_USERNAME
  repo: YOUR_REPO_NAME
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+,` | Open Settings |
| `Ctrl+Q` | Quit |
| `Ctrl+R` | Reload |
| `Alt+Left` | Navigate Back |
| `Alt+Right` | Navigate Forward |
| `F11` | Toggle Fullscreen |
| `Ctrl+Shift+I` | Toggle DevTools |

## Technology Stack

- **[Electron](https://www.electronjs.org/)** - Desktop application framework
- **[React](https://react.dev/)** - UI library
- **[Vite](https://vitejs.dev/)** - Build tool and dev server
- **[electron-builder](https://www.electron.build/)** - Packaging and distribution
- **[electron-store](https://github.com/sindresorhus/electron-store)** - Settings persistence
- **[electron-updater](https://www.electron.build/auto-update)** - Auto-update support

## Building

### Prerequisites
1. **Enable Developer Mode in Windows** (required for building):
   - Settings → Update & Security → For developers → Developer Mode: On

2. **Clear build cache** (if you encounter errors):
   ```powershell
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron-builder\Cache"
   ```

### Build Commands

```bash
# Build for Windows (installer + portable)
npm run build

# Build unpacked directory only (faster, for testing)
npm run pack
```

### Output
Build artifacts are placed in the `dist/` folder:

| File | Description |
|------|-------------|
| `Mattermost-Setup-X.X.X.exe` | Windows installer (NSIS) |
| `Mattermost-Portable-X.X.X.exe` | Portable executable |
| `win-unpacked/` | Unpacked application directory |

### Creating a Release
1. Update version in `package.json`
2. Run `npm run build`
3. Upload the installer to GitHub Releases
4. Users with auto-update enabled will receive the update automatically

## License

MIT

## Acknowledgments

- [Mattermost](https://mattermost.com/) - The open-source collaboration platform
- Icons from the official Mattermost brand assets
