# 🐳 Container & Web Preview Setup

## Quick Reference untuk Development di Container/Cloud

Dokumentasi ini adalah quick reference untuk menjalankan ChimeraAI di container atau cloud preview environment.

---

## 🚀 Quick Start

**Paling Simple:**
```bash
./start_web.sh
```

**Manual Start:**
```bash
cd /app
npx vite --config vite.config.web.ts --host 0.0.0.0 --port 3000
```

---

## 📁 File Structure

```
/app/
├── vite.config.ts          # Electron mode (local dev)
├── vite.config.web.ts      # Web mode (container) ⭐
├── start_web.sh            # Quick startup script ⭐
├── .env                    # Environment variables
├── src/                    # React frontend
├── backend/                # FastAPI backend
└── docs/
    └── CONTAINER_SETUP.md  # This file
```

---

## ⚙️ Configuration Files

### 1. vite.config.web.ts

**Purpose**: Vite config untuk web mode (tanpa Electron)

**Key Settings:**
```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',           // Allow external access
    port: 5173,                 // Default vite port
    fs: {
      deny: ['**/backend/**'],  // PENTING: Exclude backend
      allow: ['.', 'src', 'public', 'node_modules']
    }
  },
  optimizeDeps: {
    exclude: ['electron']       // Skip electron di web mode
  }
})
```

**Why exclude backend?**
- Backend folder contains HTML files dengan TypeScript type assertions
- Vite akan error jika scan files ini
- Error example: `Expected ")" but found "as"`

### 2. start_web.sh

**Purpose**: Quick startup script untuk web mode

**What it does:**
```bash
1. Kill existing vite processes
2. Start Vite with web config on port 3000
3. Check frontend health
4. Check/start backend via supervisor
5. Display status & URLs
```

**Usage:**
```bash
chmod +x start_web.sh
./start_web.sh
```

### 3. .env

**Purpose**: Environment variables untuk backend URL

**Content:**
```bash
VITE_API_URL=http://localhost:8001
VITE_BACKEND_URL=http://localhost:8001
```

**Usage in code:**
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
```

---

## 🔧 Services & Ports

| Service | Port | Command | Config |
|---------|------|---------|--------|
| **Frontend** | 3000 | `./start_web.sh` | vite.config.web.ts |
| **Backend** | 8001 | `supervisorctl start backend` | backend/server.py |
| **MongoDB** | 27017 | `supervisorctl start mongodb` | supervisor |

### Check Services Status

```bash
# All services
sudo supervisorctl status

# Specific service
sudo supervisorctl status backend
sudo supervisorctl status mongodb

# Frontend (manual vite)
ps aux | grep vite
```

---

## 🐛 Troubleshooting

### Issue 1: "vite: not found"

**Symptom:**
```bash
/bin/sh: 1: vite: not found
error Command failed with exit code 127
```

**Solution:**
```bash
cd /app
yarn install
```

---

### Issue 2: Vite scanning backend folder errors

**Symptom:**
```bash
✘ [ERROR] Expected ")" but found "as"
  script:/app/backend/frontend_tools/utilities/xxx.html?id=0:3:58
```

**Solution:**
Check `vite.config.web.ts` has:
```typescript
fs: {
  deny: ['**/backend/**'],  // Must exist!
}
```

If not, update the config and restart.

---

### Issue 3: Frontend not accessible

**Symptom:**
```bash
curl http://localhost:3000
# No response or connection refused
```

**Debug Steps:**
```bash
# 1. Check if vite running
ps aux | grep vite

# 2. Check logs
tail -f /tmp/vite-web.log

# 3. Check for errors
cat /tmp/vite-web.log | grep -i error

# 4. Restart
pkill -f vite
./start_web.sh
```

---

### Issue 4: Backend not running

**Symptom:**
```bash
sudo supervisorctl status backend
# backend STOPPED
```

**Solution:**
```bash
# Start backend
sudo supervisorctl start backend

# Check logs if fails
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/backend.out.log

# Common issue: Missing Python dependencies
cd /app/backend
source ~/.venv/bin/activate  # or your venv path
pip install -r requirements.txt
```

---

### Issue 5: Hot reload not working

**Symptom:**
Changes in code tidak reflected di browser

**Solution:**
```bash
# 1. Check if using vite.config.web.ts
ps aux | grep vite | grep "config.web"

# 2. If not, restart with correct config
pkill -f vite
./start_web.sh

# 3. Hard refresh browser
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)
```

---

## 📊 Development Workflow

### Local Desktop Development

```bash
# Use Electron mode
yarn dev
# or
npm run dev

# App runs with Electron wrapper
# Port: 5173 (internal)
```

### Container/Cloud Preview Development

```bash
# Use Web mode
./start_web.sh
# or manual:
npx vite --config vite.config.web.ts --host 0.0.0.0 --port 3000

# App runs in browser (no Electron)
# Port: 3000 (external accessible)
```

---

## ✅ Pre-Development Checklist

Sebelum mulai coding di container:

```
□ Dependencies installed
  → cd /app && yarn install

□ vite.config.web.ts exists
  → ls -la vite.config.web.ts

□ start_web.sh exists & executable
  → ls -la start_web.sh
  → chmod +x start_web.sh

□ .env configured
  → cat .env
  → Check VITE_BACKEND_URL

□ Backend running
  → sudo supervisorctl status backend

□ MongoDB running
  → sudo supervisorctl status mongodb

□ Port 3000 accessible
  → curl http://localhost:3000

□ Backend accessible
  → curl http://localhost:8001/api/health
```

---

## 🎯 Common Commands Reference

### Start/Stop Services

```bash
# Start frontend (web mode)
./start_web.sh

# Stop frontend
pkill -f vite

# Start backend
sudo supervisorctl start backend

# Stop backend
sudo supervisorctl stop backend

# Restart all services
sudo supervisorctl restart all

# Check all services
sudo supervisorctl status
```

### View Logs

```bash
# Frontend logs
tail -f /tmp/vite-web.log

# Backend logs
tail -f /var/log/supervisor/backend.err.log
tail -f /var/log/supervisor/backend.out.log

# MongoDB logs
tail -f /var/log/mongodb.err.log
```

### Health Checks

```bash
# Frontend
curl http://localhost:3000

# Backend
curl http://localhost:8001/api/health

# Check ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :8001
```

---

## 📝 Notes

1. **Web mode vs Electron mode**
   - Web mode: Browser-based, no Electron wrapper
   - Electron mode: Desktop app dengan native features

2. **Port differences**
   - Local dev (Electron): 5173
   - Container (Web): 3000
   - Backend: 8001 (both)

3. **File watching**
   - Backend folder excluded dari Vite watch
   - This prevents unnecessary rebuilds
   - Backend has its own hot reload via uvicorn

4. **Environment variables**
   - Must use `VITE_` prefix for frontend
   - Loaded from `.env` in root
   - Access via `import.meta.env.VITE_*`

---

## 🔗 Related Documentation

- [Golden Rules](golden-rules.md) - Full development rules
- [DEVELOPMENT.md](DEVELOPMENT.md) - General development guide
- [Quick Start](quick-start.md) - Quick start guide

---

**Last Updated**: Chat UI Enhancement Phase  
**Maintained By**: ChimeraAI Team  
**Status**: ✅ Active
