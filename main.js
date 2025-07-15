// main.js - Main Electron process
const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const url = require('url');

// Custom domain mappings
const customDomains = {
  'hello123123.com': 'http://192.168.1.100:8080',
  'myapp.local': 'http://localhost:3000',
  'testsite.dev': 'http://127.0.0.1:9000'
};

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false // Disable web security for custom domains
    }
  });

  // Load the browser UI
  mainWindow.loadFile('browser.html');

  // Handle custom domain navigation
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    const hostname = parsedUrl.hostname;
    
    if (customDomains[hostname]) {
      event.preventDefault();
      const customUrl = customDomains[hostname] + parsedUrl.pathname + parsedUrl.search;
      mainWindow.webContents.loadURL(customUrl);
    }
  });

  // Handle new window requests
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    
    if (customDomains[hostname]) {
      const customUrl = customDomains[hostname] + parsedUrl.pathname + parsedUrl.search;
      mainWindow.webContents.loadURL(customUrl);
      return { action: 'deny' };
    }
    
    return { action: 'allow' };
  });
}

// IPC handler for navigation
ipcMain.handle('navigate', async (event, inputUrl) => {
  try {
    let targetUrl = inputUrl;
    
    // Check if it's a custom domain
    const parsedUrl = new URL(inputUrl.startsWith('http') ? inputUrl : `http://${inputUrl}`);
    const hostname = parsedUrl.hostname;
    
    if (customDomains[hostname]) {
      targetUrl = customDomains[hostname] + parsedUrl.pathname + parsedUrl.search;
    }
    
    await mainWindow.webContents.loadURL(targetUrl);
    return { success: true, finalUrl: targetUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Add/update custom domain mapping
ipcMain.handle('add-custom-domain', (event, domain, target) => {
  customDomains[domain] = target;
  return { success: true };
});

// Get all custom domains
ipcMain.handle('get-custom-domains', () => {
  return customDomains;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Setup Instructions:
// 1. Create a new folder called "custom-browser"
// 2. Create these 3 files inside that folder:

// FILE 1: main.js (JavaScript file)
// FILE 2: browser.html (HTML file) 
// FILE 3: package.json (JSON file)

// After creating the files, run these commands:
// npm install
// npm start