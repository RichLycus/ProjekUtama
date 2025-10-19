# 🚀 Quick Start - Model Management

## 📋 Quick Reference untuk Testing

### Backend Status
```bash
# Check backend running
sudo supervisorctl status backend
# Should show: RUNNING

# Check API working
curl http://localhost:8001/api/chat/ai/models/list
```

### Frontend (Manual Start)
```bash
# Navigate to project
cd /app

# Start Vite dev server
yarn vite --config vite.config.web.ts --host 0.0.0.0 --port 5173

# Access in browser
http://localhost:5173
```

---

## 🧪 Quick Test Scenarios

### Test 1: View Models (30 seconds)
1. Open http://localhost:5173
2. Go to Settings > AI Chat
3. ✅ Should see 4 default models
4. ✅ "Core Agent 7B" has yellow star (⭐)

### Test 2: Add Model (1 minute)
1. Click "Add Model" button
2. Fill:
   - Model Name: `gemma:7b`
   - Display Name: `Gemma Fast`
   - Description: `Lightweight model`
3. Click "Add"
4. ✅ Toast success appears
5. ✅ Model appears in list

### Test 3: Test Model (1 minute)

**Without Ollama:**
```bash
# Make sure Ollama NOT running
```
1. Click 🧪 button on any model
2. ✅ Toast error: "Cannot connect to Ollama"

**With Ollama:**
```bash
# Start Ollama
ollama serve

# In another terminal
ollama list  # Check models available
```
1. Click 🧪 on "Core Agent 7B"
2. ✅ Toast success: "Model available!"

1. Click 🧪 on model that doesn't exist
2. ✅ Toast error: "Model not found. Available: ..."

### Test 4: Set Default (30 seconds)
1. Click ⭐ on "Mistral Fast 7B"
2. ✅ Toast: "Default model set"
3. ✅ Star moves to that model
4. ✅ Check: `cat /app/backend/data/ai_config.json | jq '.model'`

### Test 5: Edit Model (1 minute)
1. Click ✏️ on any model
2. Change display name
3. Click "Update"
4. ✅ Toast success
5. ✅ Name updated in list

### Test 6: Delete Model (30 seconds)
1. Click 🗑️ on non-default model
2. Confirm
3. ✅ Toast success
4. ✅ Model removed from list

**Try delete default:**
1. Look at default model (⭐)
2. ✅ No trash button visible (protected!)

---

## 🔧 Troubleshooting

### "Cannot see models"
```bash
# Check backend
curl http://localhost:8001/api/chat/ai/models/list | jq

# Check database
sqlite3 /app/backend/data/chimera_tools.db "SELECT * FROM ai_models;"
```

### "Test button not working"
```bash
# For Ollama tests, make sure:
ollama serve  # In one terminal
ollama list   # Check available models

# Model name must be EXACT
# ✅ Correct: llama3:8b
# ❌ Wrong: llama3-8b, llama3
```

### "Settings not saving"
```bash
# Check config file
cat /app/backend/data/ai_config.json | jq

# Check backend logs
tail -20 /var/log/supervisor/backend.err.log
```

### "Frontend not loading"
```bash
# Make sure dependencies installed
cd /app
yarn install

# Start manually
yarn vite --config vite.config.web.ts --host 0.0.0.0 --port 5173
```

---

## 📊 API Testing (Optional)

### List Models
```bash
curl http://localhost:8001/api/chat/ai/models/list | jq
```

### Add Model
```bash
curl -X POST http://localhost:8001/api/chat/ai/models/add \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "gemma:7b",
    "display_name": "Gemma 7B",
    "description": "Fast model"
  }' | jq
```

### Test Model
```bash
# Test existing model
curl -X POST http://localhost:8001/api/chat/ai/models/test/llama3:8b | jq

# Test non-existing model
curl -X POST http://localhost:8001/api/chat/ai/models/test/fake-model:999b | jq
```

### Set Default
```bash
# Get model ID first
curl http://localhost:8001/api/chat/ai/models/list | jq '.models[] | {id, display_name}'

# Set default (replace MODEL_ID)
curl -X POST http://localhost:8001/api/chat/ai/models/set-default/model-2 | jq

# Verify
cat /app/backend/data/ai_config.json | jq '.model'
```

### Delete Model
```bash
# Get model ID
curl http://localhost:8001/api/chat/ai/models/list | jq '.models[] | {id, display_name, is_default}'

# Delete (replace MODEL_ID, must NOT be default)
curl -X DELETE http://localhost:8001/api/chat/ai/models/model-4 | jq
```

---

## 🎯 Expected Results Summary

| Action | Expected Result | Toast Message |
|--------|----------------|---------------|
| View models | 4 default models shown | - |
| Add model | Model appears in list | "✅ Model added successfully!" |
| Test (Ollama off) | Error message | "❌ Cannot connect to Ollama" |
| Test (model exists) | Success message | "✅ Model 'xxx' is available!" |
| Test (model missing) | Error with alternatives | "❌ Model 'xxx' not found. Available: ..." |
| Set default | Star moves, config updated | "Default model set to: xxx" |
| Edit model | Name/desc updated | "✅ Model updated successfully!" |
| Delete model | Removed from list | "✅ Model deleted successfully!" |
| Delete default | Button hidden | - (not possible) |
| Save settings | Config persists | "✅ Settings saved successfully!" |

---

## 📖 Documentation

**Detailed Guide:**
- `/app/docs/phase/phase_3_session_model_management.md` - Complete documentation with architecture, data flow, and testing guide

**Progress Report:**
- `/app/docs/phase/phase_3_progress.md` - Phase 3 overall progress

---

## 💡 Tips

### Adding Your Models:
1. Pull in Ollama first: `ollama pull model-name`
2. Add via UI: Settings > AI Chat > Add Model
3. Test it: Click 🧪 button
4. Set default: Click ⭐ button

### Custom Names:
- Model Name: Technical name for Ollama (e.g., `llama3:8b`)
- Display Name: What you see in UI (e.g., "Core Agent")
- Description: Help text for yourself

### Best Practices:
- ✅ Test model after adding (verify name correct)
- ✅ Use descriptive display names
- ✅ Keep at least 2-3 models (backup options)
- ✅ Set default to your most-used model

---

**Happy Testing! 🚀**
