# EMERGENT NEXUS - Installation Guide

## Quick Install (Recommended)

The fastest way to get NEXUS running on your machine.

### Prerequisites

1. **Python 3.11+**
   ```bash
   python --version  # Should show 3.11 or higher
   ```
   If not installed: Download from [python.org](https://www.python.org/downloads/)

2. **Node.js 16+** and **Yarn**
   ```bash
   node --version   # Should show v16 or higher
   yarn --version   # Should show 1.22+
   ```
   If not installed:
   - Node.js: [nodejs.org](https://nodejs.org/)
   - Yarn: `npm install -g yarn`

3. **MongoDB** (local or remote)
   ```bash
   # Option 1: Local MongoDB
   # Download from: https://www.mongodb.com/try/download/community
   
   # Option 2: MongoDB Atlas (free cloud)
   # Sign up at: https://www.mongodb.com/atlas
   ```

### Installation Steps

#### Step 1: Clone/Download NEXUS

```bash
# If using git
git clone https://github.com/your-repo/emergent-nexus.git
cd emergent-nexus

# Or extract from ZIP if downloaded
unzip emergent-nexus.zip
cd emergent-nexus
```

#### Step 2: Install Backend Dependencies

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install packages
pip install -r requirements.txt

# Install emergentintegrations (special index)
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Install llama-cpp-python for local model
pip install llama-cpp-python
```

#### Step 3: Configure Backend

Create/edit `backend/.env`:

```env
# MongoDB connection (change if using remote MongoDB)
MONGO_URL="mongodb://localhost:27017"
DB_NAME="nexus_db"

# CORS (keep as * for development)
CORS_ORIGINS="*"

# Emergent LLM Key (free cloud AI access)
EMERGENT_LLM_KEY=sk-emergent-cAeD15634756958584
```

#### Step 4: Install Frontend Dependencies

```bash
cd ../frontend  # From backend/ directory

# Install packages
yarn install
```

#### Step 5: Configure Frontend

Create/edit `frontend/.env`:

```env
# Backend URL (change if running on different machine)
REACT_APP_BACKEND_URL=http://localhost:8001
```

#### Step 6: Start the Application

You need TWO terminal windows:

**Terminal 1 - Backend**:
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python -m uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8001
INFO:     Application startup complete.
```

**Terminal 2 - Frontend**:
```bash
cd frontend
yarn start
```

You should see:
```
Compiled successfully!
You can now view frontend in the browser.
  Local:            http://localhost:3000
```

#### Step 7: Open NEXUS

Open your browser and navigate to: **http://localhost:3000**

You should see the NEXUS interface with:
- Sidebar on the left
- "New Chat" button
- EMERGENT NEXUS logo in the center
- Model provider toggle at the bottom

## Bundling a Local Model (Optional)

To enable offline mode with a bundled local model:

### Step 1: Download a Model

Recommended models for 8GB RAM:

```bash
# Create models directory
mkdir -p models
cd models

# Option 1: Qwen 2.5 1.5B (Best for 8GB RAM)
wget https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf -O model.gguf

# Option 2: Phi-3 Mini 3.8B (Needs 6GB+ free RAM)
wget https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf -O model.gguf

# Option 3: Llama 3.2 3B (Balanced)
wget https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf -O model.gguf
```

### Step 2: Verify Model Path

Ensure the model is at: `/app/models/model.gguf` (or update path in `server.py`)

### Step 3: Test Local Model

1. Start NEXUS
2. Click the model toggle switch in sidebar
3. Should change from ☁️ Cloud to 🖥️ Local
4. Send a test message

Note: First message with local model may take 10-30 seconds to load.

## Running as a Service (Linux)

### Using systemd

**Backend Service** (`/etc/systemd/system/nexus-backend.service`):

```ini
[Unit]
Description=NEXUS Backend API
After=network.target mongodb.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/emergent-nexus/backend
Environment="PATH=/path/to/emergent-nexus/backend/venv/bin"
ExecStart=/path/to/emergent-nexus/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always

[Install]
WantedBy=multi-user.target
```

**Frontend Service** (`/etc/systemd/system/nexus-frontend.service`):

```ini
[Unit]
Description=NEXUS Frontend
After=network.target nexus-backend.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/emergent-nexus/frontend
ExecStart=/usr/bin/yarn start
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and Start**:
```bash
sudo systemctl daemon-reload
sudo systemctl enable nexus-backend nexus-frontend
sudo systemctl start nexus-backend nexus-frontend
sudo systemctl status nexus-backend nexus-frontend
```

## Docker Installation (Advanced)

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    volumes:
      - nexus-data:/data/db
    ports:
      - "27017:27017"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - MONGO_URL=mongodb://mongodb:27017
      - DB_NAME=nexus_db
      - EMERGENT_LLM_KEY=sk-emergent-cAeD15634756958584
    ports:
      - "8001:8001"
    depends_on:
      - mongodb
    volumes:
      - ./workspace:/app/workspace
      - ./models:/app/models

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8001
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  nexus-data:
```

**Start Everything**:
```bash
docker-compose up -d
```

**View Logs**:
```bash
docker-compose logs -f
```

**Stop Everything**:
```bash
docker-compose down
```

## Building Desktop Installer

### Windows Installer (Inno Setup)

**Prerequisites**:
1. Install Inno Setup: [jrsoftware.org/isinfo.php](https://jrsoftware.org/isinfo.php)
2. Install PyInstaller: `pip install pyinstaller`
3. Build frontend: `cd frontend && yarn build`

**Build Steps**:

```bash
# 1. Bundle backend into single EXE
cd backend
pyinstaller --onefile --name NEXUS_backend \
  --add-data "models;models" \
  --hidden-import emergentintegrations \
  server.py

# 2. Create installer (see nexus_installer.iss in repo)
iscc nexus_installer.iss

# Output: EmergentNEXUS-Setup.exe
```

### macOS App Bundle

```bash
# Install create-dmg
brew install create-dmg

# Build app
electron-builder --mac

# Create DMG
create-dmg 'dist/NEXUS.app' dist/
```

### Linux AppImage

```bash
# Install appimagetool
wget https://github.com/AppImage/AppImageKit/releases/download/continuous/appimagetool-x86_64.AppImage
chmod +x appimagetool-x86_64.AppImage

# Build AppImage
electron-builder --linux appimage
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8001
lsof -i :8001  # macOS/Linux
netstat -ano | findstr :8001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### MongoDB Connection Failed

```bash
# Check if MongoDB is running
sudo systemctl status mongodb  # Linux
mongo --version  # All platforms

# Start MongoDB
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS
# Windows: Start MongoDB service from Services panel
```

### Module Not Found Errors

```bash
# Backend
cd backend
pip install -r requirements.txt --force-reinstall

# Frontend
cd frontend
rm -rf node_modules
yarn install
```

### WebSocket Won't Connect

1. Check backend is running: `curl http://localhost:8001/api/`
2. Verify CORS settings in `backend/.env`
3. Check browser console for errors (F12)
4. Test WebSocket manually:
   ```bash
   # Install wscat
   npm install -g wscat
   
   # Test connection
   wscat -c ws://localhost:8001/api/ws/chat/test-id
   ```

### Local Model Fails to Load

```bash
# Check model file
ls -lh /app/models/model.gguf

# Verify file size (should be 1-4GB)
du -h /app/models/model.gguf

# Check RAM availability
free -h  # Linux
vm_stat  # macOS

# Reinstall llama-cpp-python
pip uninstall llama-cpp-python
pip install llama-cpp-python --no-cache-dir
```

### Frontend Build Fails

```bash
# Clear cache
rm -rf frontend/node_modules/.cache

# Check Node version
node --version  # Needs v16+

# Upgrade Node if needed
nvm install 18
nvm use 18

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json yarn.lock
yarn install
```

## Performance Optimization

### For Cloud Mode (Groq API)
- No optimization needed - runs fast by default
- Groq is one of the fastest LLM APIs available

### For Local Mode

**8GB RAM System**:
```python
# In server.py, init_local_model() function
model = Llama(
    model_path=str(model_path),
    n_ctx=2048,        # Context window
    n_gpu_layers=0,    # CPU only (no GPU)
    n_threads=4,       # Use 4 CPU cores
    verbose=False
)
```

**16GB+ RAM System**:
```python
model = Llama(
    model_path=str(model_path),
    n_ctx=4096,        # Larger context
    n_gpu_layers=-1,   # Use all GPU layers
    n_threads=8,       # More CPU cores
    verbose=False
)
```

**GPU Acceleration** (NVIDIA GPUs):
```bash
# Reinstall with CUDA support
CMAKE_ARGS="-DLLAMA_CUBLAS=on" pip install llama-cpp-python --force-reinstall --no-cache-dir

# Verify GPU usage
nvidia-smi  # Should show Python process using GPU
```

## Security Hardening

### Production Deployment

1. **Change Database Credentials**:
   ```env
   MONGO_URL="mongodb://admin:secure_password@localhost:27017/nexus?authSource=admin"
   ```

2. **Restrict CORS**:
   ```env
   CORS_ORIGINS="https://yourdomain.com"
   ```

3. **Use HTTPS**:
   ```bash
   # Generate SSL cert
   openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
   
   # Run with SSL
   uvicorn server:app --host 0.0.0.0 --port 8001 --ssl-keyfile key.pem --ssl-certfile cert.pem
   ```

4. **Firewall Rules**:
   ```bash
   # Only allow local connections
   sudo ufw allow from 127.0.0.1 to any port 8001
   sudo ufw enable
   ```

## Updating NEXUS

### Manual Update

```bash
# Backup conversations
mongodump --db nexus_db --out backup/

# Pull latest code
git pull origin main

# Update backend
cd backend
pip install -r requirements.txt --upgrade

# Update frontend
cd ../frontend
yarn install

# Restart services
sudo systemctl restart nexus-backend nexus-frontend
```

### Auto-Update (Future Feature)

Will be implemented in Phase 5 of roadmap.

## Getting Help

- **Documentation**: [README_NEXUS.md](README_NEXUS.md)
- **Issues**: Open GitHub issue
- **Community**: Join Discord server
- **Email**: support@emergent.sh

---

**Installation complete! Enjoy your sovereign AI companion. ⚡**