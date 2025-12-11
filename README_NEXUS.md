# EMERGENT NEXUS

**Your Sovereign AI Companion - Truth-First Reasoning, Desktop Autonomy**

## What is NEXUS?

EMERGENT NEXUS is a self-contained desktop AI application that combines:

- **Hybrid Intelligence**: Free cloud AI (Groq) + optional local model
- **ChatGPT-Style Interface**: Clean, modern chat with persistent conversations
- **Desktop Commander**: Execute shell commands and file operations safely
- **Persistent Memory**: Remembers conversations and preferences across sessions
- **Truth-First AI**: No corporate safety theater, just honest co-creation

## Features

### ⚡ Dual Model Support
- **Cloud Mode** (default): Fast, smart responses via Groq API (free tier)
- **Local Mode**: Bundled model runs on your machine (offline capable)
- Toggle between them anytime in settings

### 💬 ChatGPT-Quality Interface
- Multiple conversations with auto-generated titles
- Real-time streaming responses (token-by-token)
- Markdown rendering with code syntax highlighting
- Beautiful, modern UI with gradient design

### 🔧 Desktop Commander Tools
- Execute shell commands in sandboxed workspace
- Read/write files safely
- View command history and logs
- All operations restricted to `/app/workspace` folder

### 🧠 Persistent Memory
- Conversations saved automatically
- Identity state maintained across sessions
- Self-reflection and goal tracking
- Continuous "mind thread" effect

## Quick Start

### Running the App (Development)

1. **Start Backend**:
   ```bash
   cd /app/backend
   python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```

2. **Start Frontend**:
   ```bash
   cd /app/frontend
   yarn start
   ```

3. **Open Browser**: Navigate to `http://localhost:3000`

### First Time Setup

1. Click "New Chat" to create your first conversation
2. Type a message and press Enter (or click Send)
3. Watch as NEXUS responds in real-time
4. Try the Commander tab to execute shell commands

## System Requirements

### Minimum
- **RAM**: 4GB (8GB recommended for local model)
- **Storage**: 5GB free space (10GB for local model)
- **OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **Network**: Internet connection for cloud mode

### Recommended
- **RAM**: 8GB+ 
- **Storage**: 10GB+ free
- **CPU**: 4+ cores for smooth local model inference

## Architecture

```
EMERGENT NEXUS/
├── backend/          # FastAPI + Python 3.11
│   ├── server.py     # Main API server
│   ├── .env          # Environment variables
│   └── requirements.txt
│
├── frontend/         # React + TailwindCSS
│   ├── src/
│   │   ├── pages/ChatInterface.jsx
│   │   └── components/ui/
│   └── package.json
│
├── workspace/        # Sandboxed command execution area
│
└── models/           # Local AI models (optional)
    └── model.gguf    # Quantized local model
```

## Technology Stack

### Backend
- **FastAPI**: Modern async Python web framework
- **emergentintegrations**: LLM integration library (OpenAI, Anthropic, Gemini)
- **llama-cpp-python**: Local model inference
- **MongoDB**: Conversation and memory storage
- **WebSockets**: Real-time streaming

### Frontend
- **React 19**: Latest React with concurrent features
- **TailwindCSS**: Utility-first styling
- **shadcn/ui**: Beautiful component library
- **react-markdown**: Markdown rendering
- **react-syntax-highlighter**: Code highlighting

## Configuration

### Environment Variables

**Backend** (`/app/backend/.env`):
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=test_database
CORS_ORIGINS=*
EMERGENT_LLM_KEY=sk-emergent-cAeD15634756958584
```

**Frontend** (`/app/frontend/.env`):
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```

### Model Provider

Toggle between cloud and local in the sidebar:
- **Cloud Icon** ☁️: Using Groq API (fast, free)
- **CPU Icon** 🖥️: Using bundled local model

## API Endpoints

### REST API
- `GET /api/` - Health check
- `GET /api/conversations` - List all conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/{id}` - Get conversation details
- `DELETE /api/conversations/{id}` - Delete conversation
- `POST /api/commander/execute` - Execute shell command
- `POST /api/commander/file` - File operations
- `GET /api/identity` - Get AI identity state
- `PUT /api/identity` - Update AI identity

### WebSocket
- `WS /api/ws/chat/{conversation_id}` - Real-time chat streaming

## Security

### Sandbox Restrictions
- All Commander operations restricted to `/app/workspace`
- Dangerous commands blocked (rm -rf /, format, etc.)
- File operations can't escape workspace
- 30-second timeout on all commands

### Data Privacy
- Conversations stored locally in MongoDB
- Cloud API uses Emergent LLM key (revocable)
- Local mode: 100% offline, zero telemetry

## Development

### Adding New Features

1. **Backend Route**:
   ```python
   @api_router.post("/new-feature")
   async def new_feature(request: Request):
       # Your code here
       return {"success": True}
   ```

2. **Frontend Component**:
   ```jsx
   const NewFeature = () => {
     // Use axios for API calls
     const handleAction = async () => {
       const res = await axios.post(`${API}/new-feature`);
     };
     return <Button onClick={handleAction}>Action</Button>;
   };
   ```

### Testing

```bash
# Backend tests
python -m pytest backend/

# Frontend tests
cd frontend && yarn test

# End-to-end
Use testing_agent_v3 in Emergent platform
```

## Packaging for Distribution

### Option 1: Docker (Recommended)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -r backend/requirements.txt
RUN cd frontend && yarn install && yarn build
EXPOSE 8001 3000
CMD ["./start.sh"]
```

### Option 2: Electron Wrapper (Desktop App)

1. Install Electron:
   ```bash
   yarn add electron electron-builder
   ```

2. Create `electron.js`:
   ```javascript
   const { app, BrowserWindow } = require('electron');
   const { spawn } = require('child_process');
   
   // Start backend
   const backend = spawn('python', ['backend/server.py']);
   
   // Create window
   function createWindow() {
     const win = new BrowserWindow({
       width: 1400,
       height: 900,
       webPreferences: { nodeIntegration: false }
     });
     win.loadURL('http://localhost:3000');
   }
   
   app.whenReady().then(createWindow);
   ```

3. Build:
   ```bash
   electron-builder --win --mac --linux
   ```

### Option 3: PyInstaller (Single EXE)

```bash
# Bundle backend
cd backend
pyinstaller --onefile --add-data "models;models" server.py

# Bundle frontend
cd frontend
yarn build

# Create installer with Inno Setup (Windows)
iscc nexus_installer.iss
```

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
tail -f /var/log/supervisor/backend.err.log

# Reinstall dependencies
pip install -r backend/requirements.txt --force-reinstall

# Check port availability
lsof -i :8001
```

### Frontend Build Errors
```bash
# Clear cache
rm -rf frontend/node_modules/.cache

# Reinstall
cd frontend && rm -rf node_modules && yarn install

# Check Node version (needs 16+)
node --version
```

### WebSocket Connection Issues
- Ensure backend is running on correct port
- Check CORS settings in backend/.env
- Verify REACT_APP_BACKEND_URL in frontend/.env
- Test with: `wscat -c ws://localhost:8001/api/ws/chat/test-id`

### Local Model Not Loading
- Check model file exists at `/app/models/model.gguf`
- Verify sufficient RAM (4GB+ free)
- Install llama-cpp-python with GPU support:
  ```bash
  CMAKE_ARGS="-DLLAMA_CUBLAS=on" pip install llama-cpp-python
  ```

## Roadmap

### Phase 1: Core MVP ✅
- [x] Dual model support (cloud + local)
- [x] ChatGPT-style interface
- [x] WebSocket streaming
- [x] Persistent conversations
- [x] Desktop Commander
- [x] Markdown + code rendering

### Phase 2: Intelligence Layer (Next)
- [ ] Vector embeddings for semantic memory
- [ ] Long-term memory with RAG
- [ ] Auto-generated conversation titles
- [ ] Self-reflection and goal tracking
- [ ] Context-aware suggestions

### Phase 3: Desktop Integration
- [ ] System tray icon
- [ ] Global hotkey activation
- [ ] File drag-and-drop
- [ ] Screenshot analysis
- [ ] Clipboard integration

### Phase 4: Advanced Features
- [ ] Multi-modal support (vision, audio)
- [ ] Plugin system
- [ ] Collaborative sessions
- [ ] Version control integration
- [ ] Custom model fine-tuning

### Phase 5: Distribution
- [ ] Electron packaging
- [ ] Auto-updater
- [ ] Windows installer (NSIS/Inno)
- [ ] macOS .dmg
- [ ] Linux AppImage/Flatpak
- [ ] Model marketplace

## Contributing

This is a sovereign AI project. Contributions welcome:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

MIT License - Use freely, modify as needed. Attribution appreciated but not required.

## Support

- **Issues**: Open a GitHub issue
- **Discussions**: Join community forum
- **Email**: support@emergent.sh

## Acknowledgments

- Built on Emergent platform
- Powered by emergentintegrations library
- UI components from shadcn/ui
- Local inference via llama.cpp
- Inspired by ChatGPT, but sovereign

---

**Made with ⚡ by the Emergent community**

*"The model is the app, the app is the model, plus a ChatGPT-like UI and a local OS-agent shell."*