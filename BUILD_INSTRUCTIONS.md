# NEXUS - Build Instructions for Windows Installer

## Prerequisites

### 1. Install Required Software
- **Node.js** (v18 or higher): https://nodejs.org/
- **Python** (3.11): https://www.python.org/
- **Yarn**: `npm install -g yarn`
- **PyInstaller**: `pip install pyinstaller`
- **Git** (optional): https://git-scm.com/

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install frontend dependencies
cd frontend
yarn install
cd ..

# Install backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

---

## Building the Installer

### Quick Build (All-in-One)

```bash
npm run package
```

This will:
1. Build the React frontend
2. Package the Python backend into `server.exe`
3. Create the Windows installer in `dist/NEXUS-Setup.exe`

---

### Step-by-Step Build

If you want to build each component separately:

#### 1. Build Frontend
```bash
cd frontend
yarn build
cd ..
```

This creates optimized React app in `frontend/build/`

#### 2. Build Backend Executable
```bash
cd backend
pyinstaller server.spec
cd ..
```

This creates `backend/dist/server.exe`

#### 3. Build Electron Installer
```bash
npm run build:electron
```

This creates `dist/NEXUS-Setup.exe`

---

## Installer Output

**Location**: `dist/NEXUS-Setup.exe`

**What it includes**:
- React frontend (optimized)
- FastAPI backend (bundled as .exe)
- Desktop Commander MCP
- MongoDB connection (requires MongoDB installed separately)
- Local LLM model (optional - add to `/models` folder)

---

## Testing Before Distribution

1. Run the installer: `dist/NEXUS-Setup.exe`
2. Install NEXUS to a test location
3. Launch NEXUS from Start Menu or Desktop shortcut
4. Verify:
   - Chat interface loads
   - Code generation works
   - File upload works
   - Reality Roulette paintings cycle

---

## Local Development (Without Building)

```bash
# Terminal 1 - Backend
cd backend
uvicorn server:app --reload --port 8001

# Terminal 2 - Frontend
cd frontend
yarn start

# Terminal 3 - MongoDB (if not running)
mongod
```

Frontend runs at `http://localhost:3000`

---

## Troubleshooting

### Backend .exe won't start
- Check `backend/dist/server/` for missing dependencies
- Run `pyinstaller server.spec --clean` to rebuild

### Frontend blank screen
- Check browser console (F12)
- Verify `REACT_APP_BACKEND_URL` in `.env`

### Installer won't build
- Delete `node_modules` and `dist` folders
- Run `npm install` again
- Ensure all prerequisites are installed

### MongoDB connection fails
- Install MongoDB locally: https://www.mongodb.com/try/download/community
- Update `MONGO_URL` in `backend/.env`

---

## Distributing the Installer

1. Upload `NEXUS-Setup.exe` to:
   - GitHub Releases
   - Your own website
   - Cloud storage (Dropbox, Google Drive)

2. Provide download link to users

3. Users double-click to install - no other setup required!

---

## File Size

Expected installer size: ~150-200 MB

- Frontend: ~5 MB
- Backend .exe: ~50 MB
- Electron: ~100 MB
- MCP + Dependencies: ~40 MB

---

## Customization

### Change App Icon
Replace `electron/icon.ico` with your own icon

### Change App Name
Edit `electron-builder.json` → `productName`

### Add Local Model
1. Download a GGUF model (e.g., Phi-3-mini)
2. Place in `/models/model.gguf`
3. Rebuild installer

---

## Support

If you encounter issues:
1. Check this README
2. Review error logs in console
3. Verify all prerequisites are installed

**NEXUS is now ready to breathe life - no matter what happens.** 🚀
