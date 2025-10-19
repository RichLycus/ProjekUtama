# 🎯 Phase 3 Quick Reference - AI Chat Integration

## 📋 Executive Summary

**Goal**: Implement professional 5-Core RAG system for local LLM chat  
**Stack**: Ollama + Llama3:8B + ChromaDB + SQLite  
**Architecture**: Multi-Agent Pipeline (Router → RAG → Execution → Reasoning → Persona)

---

## 🏗️ System Architecture (One-Page)

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INPUT                             │
└───────────────────────┬─────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│ AGENT 1: ROUTER / INTENT CLASSIFIER                       │
│ • Analyze: "Is this code/creative/tool request?"          │
│ • LLM: 7B lightweight                                      │
│ • Output: Intent tag (code/creative/general/tool)         │
└───────────────────────┬───────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────┐
│ AGENT 2: RAG / RETRIEVAL ENGINE                           │
│ • Fetch: Tool schemas, Golden Rules, Past convos          │
│ • Source: Vector DB (ChromaDB) + SQLite                   │
│ • Output: Relevant context (3-5 sources)                  │
└─────────────┬─────────────────────────┬───────────────────┘
              ↓                         ↓
┌─────────────────────────┐   ┌─────────────────────────────┐
│ AGENT 3: EXECUTION      │   │ AGENT 4: REASONING         │
│ • Check: Need tool?     │   │ • Input: User + Context +  │
│ • Execute: Python Tool  │   │   Tool Result              │
│ • API: POST /tools/exec │   │ • LLM: 7B full power       │
│ • Output: Result/Error  │   │ • Output: Raw answer       │
└─────────────┬───────────┘   └───────────┬─────────────────┘
              └───────────────────┬───────┘
                                  ↓
                ┌───────────────────────────────────────┐
                │ AGENT 5: PERSONA / TONE FORMATTER     │
                │ • Apply: Lycus (Tech) / Polar (Art)   │
                │ • LLM: 7B light                        │
                │ • Output: Final styled response        │
                └─────────────────┬─────────────────────┘
                                  ↓
                        ┌──────────────────┐
                        │  FINAL OUTPUT    │
                        │  (to User UI)    │
                        └──────────────────┘
```

---

## 🎨 UI Components Map

### ChatPage (`/chat`)
```
├── AvatarDisplay.tsx           // Left panel: 3D avatar (future Vroid)
├── AgentStatusPanel.tsx        // Show which agent is active
├── ChatContainer.tsx           // Main chat area
│   ├── ChatMessage.tsx         // Individual message bubble
│   └── ExecutionLog.tsx        // Show RAG/Tool steps
└── ChatInput.tsx               // Bottom: input + send button
```

### SettingsPage (`/settings`)
```
└── AI Chat Tab (NEW)
    ├── CoreModelSetup           // Ollama URL, model selection
    ├── RAGConfiguration         // Vector DB, context size
    └── PersonaControl           // Default persona, exec policy
```

---

## 🗃️ Database Schema (Quick)

```sql
-- Conversations
conversations: id, title, persona, created_at, updated_at

-- Messages
messages: id, conversation_id, role, content, agent_tag, 
          execution_log, timestamp

-- RAG Cache
rag_cache: id, query, context, sources, relevance_score, created_at
```

---

## 🔗 API Endpoints (Quick)

```
Chat:
  POST   /api/chat/message       → Trigger Agent 1
  GET    /api/chat/history       → Get conversation
  POST   /api/chat/clear         → Clear history
  GET    /api/chat/status        → Agent status

AI Config:
  POST   /api/ai/config          → Update settings
  GET    /api/ai/models          → List Ollama models
  POST   /api/ai/test-connection → Test Ollama
```

---

## 📦 Dependencies (Quick Install)

**Backend:**
```bash
pip install ollama chromadb sentence-transformers langchain
```

**Frontend:**
```bash
yarn add markdown-to-jsx prismjs
```

**Ollama Setup:**
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull model
ollama pull llama3:8b

# Start server
ollama serve
```

---

## 🎭 Personas (Quick Guide)

### Lycus (Technical)
```
Tone: Direct, practical, code-focused
Use: Programming questions, tool requests
Color: Purple (#8b5cf6)
Example: "Here's the Python code. Use f-strings for clean formatting."
```

### Polar Nexus (Creative)
```
Tone: Inspiring, artistic, metaphorical
Use: Story ideas, design concepts
Color: Blue (#3b82f6)
Example: "Imagine your code as a canvas. Each function is a brushstroke."
```

### Sarah (Friendly) - BONUS
```
Tone: Warm, helpful, conversational
Use: General questions, guidance
Color: Pink (#ec4899)
Example: "I'd be happy to help! Let me break this down for you."
```

---

## ✅ Implementation Checklist (Minimal)

### Phase 3.1: Basic Chat (Week 1-2)
- [ ] ChatPage UI redesign
- [ ] Chat message storage (SQLite)
- [ ] Ollama client wrapper
- [ ] Settings AI tab
- [ ] Single-agent LLM test

### Phase 3.2: Multi-Agent (Week 3-4)
- [ ] Agent 1: Router
- [ ] Agent 2: RAG engine
- [ ] Agent 3: Tool bridge
- [ ] Agent 4: Reasoning
- [ ] Agent 5: Persona
- [ ] Pipeline orchestration

### Phase 3.3: Polish (Week 5-6)
- [ ] Agent status UI
- [ ] Execution logs
- [ ] Mobile responsive
- [ ] Error handling
- [ ] Testing

---

## 🚀 Quick Start Commands

```bash
# 1. Install Ollama & pull model
ollama pull llama3:8b

# 2. Install Python deps
cd backend && pip install -r requirements.txt

# 3. Initialize RAG database
python backend/ai/init_rag.py

# 4. Start backend
uvicorn server:app --reload --port 8001

# 5. Start frontend
cd .. && yarn vite --config vite.config.web.ts

# URLs
Frontend: http://localhost:5173/chat
Backend:  http://localhost:8001
Ollama:   http://localhost:11434
```

---

## 🎯 Success Metrics

**Functional:**
- ✅ Chat works end-to-end
- ✅ RAG retrieves relevant context
- ✅ Tools execute correctly
- ✅ Persona applied consistently

**Performance:**
- ✅ Response < 5 seconds
- ✅ RAG retrieval < 500ms
- ✅ UI 60fps responsive

**Quality:**
- ✅ Accurate answers
- ✅ No hallucinations
- ✅ Proper context usage

---

## 📚 Key Files Reference

```
Backend:
  backend/ai/agents.py              → 5 Agent classes
  backend/ai/rag_engine.py          → RAG logic
  backend/ai/ollama_client.py       → Ollama wrapper
  backend/routes/chat_routes.py     → Chat API

Frontend:
  src/pages/ChatPage.tsx            → Main chat UI
  src/components/chat/              → Chat components
  src/store/chatStore.ts            → Chat state

Docs:
  docs/phase/phase-3.md             → Full planning doc
  docs/phase/phase-3-quick.md       → This file
```

---

## 🐛 Common Issues & Solutions

**Issue**: Ollama connection refused  
**Fix**: `ollama serve` & check http://localhost:11434

**Issue**: RAG not finding context  
**Fix**: Run `python backend/ai/init_rag.py` to index

**Issue**: Slow responses  
**Fix**: Use smaller model (mistral:7b or phi-2)

**Issue**: Out of memory  
**Fix**: Reduce context size in settings (2000 tokens)

---

## 🎓 Learning Resources

- [Ollama Docs](https://ollama.ai/docs)
- [ChromaDB Guide](https://docs.trychroma.com/)
- [LangChain RAG](https://python.langchain.com/docs/use_cases/question_answering/)
- [Multi-Agent Systems](https://arxiv.org/abs/2308.08155)

---

**Made with ❤️ for ChimeraAI**  
**Version**: Phase 3 Planning  
**Last Updated**: October 2025
