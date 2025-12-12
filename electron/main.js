const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    title: 'NEXUS',
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#000000',
    frame: true,
    autoHideMenuBar: true
  });

  // Start backend
  const backendPath = path.join(process.resourcesPath, 'backend', 'server.exe');
  backendProcess = spawn(backendPath, [], {
    cwd: path.join(process.resourcesPath, 'backend')
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  // Wait for backend to start, then load frontend
  setTimeout(() => {
    mainWindow.loadFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
  }, 3000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
