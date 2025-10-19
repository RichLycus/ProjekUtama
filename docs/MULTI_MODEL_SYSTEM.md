# 🤖 Multi-Model Agent System - ChimeraAI

## 📋 Overview

Sistem multi-model yang fleksibel dimana setiap agent menggunakan model LLM spesialisasinya sendiri. Tidak ada lagi sistem monolitik dengan satu model untuk semua tugas!

## 🏗️ Arsitektur

```
User Input
    ↓
┌─────────────────────────────────────────────┐
│  🚦 Enhanced Router Agent                   │
│  - Validasi input                           │
│  - Auto-improvement jika tidak jelas        │
│  - Klasifikasi intent                       │
│  - Routing decision                         │
│  Model: phi3:mini (lightweight & fast)      │
└─────────────────┬───────────────────────────┘
                  ↓
        ┌─────────┴─────────┐
        │                   │
        ↓                   ↓
  Needs RAG?           No RAG needed
        │                   │
        ↓                   │
┌───────────────┐           │
│ 📚 RAG Agent  │           │
│ Retrieve      │           │
│ Context       │           │
│ Model:        │           │
│ all-MiniLM-L6 │           │
└───────┬───────┘           │
        │                   │
        └────────┬──────────┘
                 ↓
┌─────────────────────────────────────────────┐
│  🎯 Specialized Agents                      │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 💬 Chat Agent                        │  │
│  │ Model: gemma2:2b                     │  │
│  │ Use: Simple conversation, Q&A        │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 💻 Code Agent                        │  │
│  │ Model: qwen2.5-coder:7b              │  │
│  │ Use: Programming, debugging          │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 📊 Analysis Agent                    │  │
│  │ Model: qwen2.5:7b                    │  │
│  │ Use: Data analysis, reasoning        │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 🎨 Creative Agent                    │  │
│  │ Model: llama3:8b                     │  │
│  │ Use: Story, creative content         │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 🔧 Tool Agent                        │  │
│  │ Model: phi3:mini                     │  │
│  │ Use: Tool execution coordination     │  │
│  └──────────────────────────────────────┘  │
└─────────────────┬───────────────────────────┘
                  ↓
┌─────────────────────────────────────────────┐
│  🎭 Persona Agent                           │
│  Format response dengan personality         │
│  Model: gemma2:2b                           │
└─────────────────┬───────────────────────────┘
                  ↓
          ✨ Final Output
```

## 🎯 Specialized Agents

### 1. **Enhanced Router Agent** 🚦
**Model**: `phi3:mini`  
**Temperature**: 0.3  
**Purpose**: Intelligent request routing

**Capabilities**:
- ✅ **Input Validation**: Mengecek apakah input jelas dan spesifik
- ✅ **Auto-Improvement**: Memperbaiki input yang ambigu
- ✅ **Intent Classification**: Menentukan jenis permintaan
- ✅ **Tool Detection**: Mendeteksi kebutuhan tools
- ✅ **RAG Decision**: Menentukan perlu RAG atau tidak

**Example**:
```
Input: "buat"
Router: Input terlalu pendek, tidak jelas
Improved: "Buatkan saya contoh program Python"
Intent: code
Needs RAG: Yes
```

### 2. **Chat Agent** 💬
**Model**: `gemma2:2b`  
**Temperature**: 0.7  
**Max Tokens**: 1500

**Use Cases**:
- Percakapan umum
- Simple Q&A
- Greeting responses
- General information

**When Used**: Intent = chat, tidak butuh RAG

### 3. **Code Agent** 💻
**Model**: `qwen2.5-coder:7b`  
**Temperature**: 0.5  
**Max Tokens**: 2500

**Use Cases**:
- Code generation
- Debugging
- Code review
- Technical documentation
- Algorithm implementation

**When Used**: Intent = code, dengan RAG context

### 4. **Analysis Agent** 📊
**Model**: `qwen2.5:7b`  
**Temperature**: 0.6  
**Max Tokens**: 2000

**Use Cases**:
- Data analysis
- Logical reasoning
- Research & investigation
- Problem solving
- Complex explanations

**When Used**: Intent = analysis, dengan RAG context

### 5. **Creative Agent** 🎨
**Model**: `llama3:8b`  
**Temperature**: 0.8  
**Max Tokens**: 2000

**Use Cases**:
- Story writing
- Content creation
- Brainstorming
- Artistic concepts
- Creative ideas

**When Used**: Intent = creative, dengan RAG context

### 6. **Tool Agent** 🔧
**Model**: `phi3:mini`  
**Temperature**: 0.4  
**Max Tokens**: 1000

**Use Cases**:
- Tool execution detection
- Parameter extraction
- Execution coordination

**When Used**: Intent = tool

### 7. **RAG Agent** 📚
**Model**: `all-MiniLM-L6-v2` (embedding model)  
**Purpose**: Context retrieval

**Data Sources**:
- Tools schema & documentation
- Golden rules
- Past conversations
- Project documentation

**When Used**: Hanya jika needs_rag = True

### 8. **Persona Agent** 🎭
**Model**: `gemma2:2b`  
**Temperature**: 0.6  
**Max Tokens**: 1000

**Purpose**: Format response dengan personality
**Always Active**: Ya, untuk semua responses

## 🔄 Request Flow Examples

### Example 1: Simple Greeting (No RAG)
```
User: "Halo"
    ↓
Router: intent=chat, needs_rag=False
    ↓
Chat Agent: "Halo! Ada yang bisa saya bantu?"
    ↓
Persona Agent: Apply personality
    ↓
Output: "Halo kawan! Ada yang bisa saya bantu hari ini?"
```

### Example 2: Coding Request (With RAG)
```
User: "Buatkan function untuk sort array"
    ↓
Router: intent=code, needs_rag=True
    ↓
RAG: Retrieve coding guidelines & examples
    ↓
Code Agent: Generate code dengan context
    ↓
Persona Agent: Apply technical tone
    ↓
Output: Formatted code dengan explanation
```

### Example 3: Ambiguous Input (Auto-Improved)
```
User: "analisa"
    ↓
Router Validation: Input terlalu singkat (score: 0.5)
    ↓
Router Improvement: "Lakukan analisa terhadap data yang tersedia"
    ↓
Router: intent=analysis, needs_rag=True
    ↓
RAG: Retrieve relevant context
    ↓
Analysis Agent: Process dengan improved input
    ↓
Persona Agent: Format output
    ↓
Output: Complete analysis response
```

## 🗄️ Database Schema

### Agent Configs Table
```sql
CREATE TABLE agent_configs (
    id TEXT PRIMARY KEY,
    agent_type TEXT NOT NULL UNIQUE,
    model_name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_enabled INTEGER DEFAULT 1,
    temperature REAL DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 2000,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
)
```

**Agent Types**:
- `router` - Enhanced Router Agent
- `rag` - RAG Agent (embedding model)
- `chat` - Chat Agent
- `code` - Code Agent
- `analysis` - Analysis Agent
- `creative` - Creative Agent
- `tool` - Tool Agent
- `persona` - Persona Agent

## 🔌 API Endpoints

### Agent Configuration Management

#### Get All Agent Configs
```bash
GET /api/agents/configs
```

Response:
```json
{
  "success": true,
  "configs": [
    {
      "id": "agent-router",
      "agent_type": "router",
      "model_name": "phi3:mini",
      "display_name": "Router Agent",
      "description": "Lightweight model for intent classification",
      "is_enabled": 1,
      "temperature": 0.3,
      "max_tokens": 500
    },
    ...
  ],
  "count": 10
}
```

#### Get Agent Config by Type
```bash
GET /api/agents/configs/type/{agent_type}
```

Example:
```bash
GET /api/agents/configs/type/router
```

#### Update Agent Config
```bash
PUT /api/agents/configs/{agent_id}
Content-Type: application/json

{
  "model_name": "phi3:3.8b",
  "temperature": 0.4,
  "is_enabled": 1
}
```

#### Toggle Agent Enable/Disable
```bash
POST /api/agents/configs/{agent_id}/toggle
```

#### Get Agent Types Info
```bash
GET /api/agents/types
```

Returns list of available agent types dengan recommended models.

### Chat System Status
```bash
GET /api/chat/status
```

Response (Multi-Model):
```json
{
  "status": "operational",
  "orchestrator_type": "multi-model",
  "total_conversations": 15,
  "llm_integrated": true,
  "rag_active": true,
  "agents_ready": {
    "router": true,
    "rag": true,
    "specialized": true,
    "persona": true
  },
  "agent_models": {
    "router": {
      "model": "phi3:mini",
      "enabled": true,
      "temperature": 0.3
    },
    "chat": {
      "model": "gemma2:2b",
      "enabled": true,
      "temperature": 0.7
    },
    ...
  }
}
```

## ⚙️ Configuration Management

### Via UI (Settings → AI Chat)
1. Navigate to Settings
2. Go to AI Chat tab
3. See "Agent Configurations" section
4. Manage models per-agent:
   - Change model
   - Adjust temperature
   - Enable/disable agent
   - Update max_tokens

### Via Database
```python
from database import SQLiteDB

db = SQLiteDB()

# Get all configs
configs = db.get_agent_configs()

# Get specific agent
router_config = db.get_agent_config_by_type('router')

# Update agent model
db.update_agent_config(
    agent_id='agent-router',
    updates={
        'model_name': 'phi3:3.8b',
        'temperature': 0.4
    }
)

# Toggle agent
db.toggle_agent_config('agent-code')
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd /app/backend
pip install chromadb sentence-transformers
```

### 2. Start Ollama
```bash
# Pull recommended models
ollama pull phi3:mini
ollama pull gemma2:2b
ollama pull qwen2.5:7b
ollama pull qwen2.5-coder:7b
ollama pull llama3:8b
```

### 3. Start Backend
```bash
sudo supervisorctl restart backend
```

### 4. Test System
```bash
# Check status
curl http://localhost:8001/api/chat/status

# Get agent configs
curl http://localhost:8001/api/agents/configs

# Send test message
curl -X POST http://localhost:8001/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Halo, bagaimana cara membuat function Python?",
    "role": "user"
  }'
```

## 🎯 Benefits

### 1. **Tidak Monolitik**
- Setiap agent punya model sendiri
- Model dipilih sesuai spesialisasi
- Efisiensi resource lebih baik

### 2. **Intelligent Routing**
- Router pintar validasi input
- Auto-improvement untuk input tidak jelas
- RAG hanya dipakai saat perlu

### 3. **Flexible & Scalable**
- Ganti model per-agent dengan mudah
- Tambah agent baru tanpa affect yang lain
- Config disimpan di database

### 4. **Cost Efficient**
- Small models untuk simple tasks
- Large models hanya untuk complex tasks
- No wasted compute

### 5. **Better User Experience**
- Faster response untuk simple queries
- Better quality untuk complex tasks
- Personalized responses

## 📊 Model Recommendations

| Agent Type | Recommended Models | Size | Use Case |
|------------|-------------------|------|----------|
| Router | phi3:mini, llama3.2:3b | 2-3B | Fast classification |
| Chat | gemma2:2b, phi3:mini | 2B | Simple conversation |
| Code | qwen2.5-coder:7b, codellama:7b | 7B | Programming |
| Analysis | qwen2.5:7b, llama3:8b | 7-8B | Reasoning |
| Creative | llama3:8b, mistral:7b | 7-8B | Creative content |
| Tool | phi3:mini, gemma2:2b | 2B | Tool detection |
| Persona | gemma2:2b, phi3:mini | 2B | Formatting |

## 🔧 Troubleshooting

### Issue: Agent not responding
**Solution**: Check if model is pulled in Ollama
```bash
ollama list
ollama pull <model-name>
```

### Issue: RAG not working
**Solution**: Check ChromaDB status
```bash
curl http://localhost:8001/api/chat/rag/status
```

### Issue: Config changes not applied
**Solution**: Restart backend
```bash
sudo supervisorctl restart backend
```

## 📚 Next Steps

1. ✅ **Phase 1**: Multi-Model System (Complete)
2. ⏳ **Phase 2**: Frontend UI for Agent Management
3. 🔜 **Phase 3**: Advanced RAG with Document Upload
4. 🔜 **Phase 4**: Tool Execution Integration
5. 🔜 **Phase 5**: Performance Monitoring & Analytics

## 🤝 Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for contribution guidelines.

## 📖 Related Documentation

- [Golden Rules](golden-rules.md)
- [Quick Start](quick-start.md)
- [Backend Testing Guide](BACKEND_TESTING_GUIDE.md)
- [Phase 3 Documentation](phase/phase_3.md)

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Active & Operational
