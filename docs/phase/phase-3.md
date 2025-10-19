# 🔮 Phase 3: AI Chat Integration - PLANNING

## 📋 Status: IN PLANNING 🎯

**Start Date**: Phase 3 Planning  
**Target**: Q4 2025  
**Focus**: Multi-Agent RAG System & Persona-based AI Chat

---

## 🎯 Goals & Objectives

### Primary Goals:
- 🤖 **5-Core Agent System** - Professional RAG architecture for 7B LLM
- 💬 **Interactive Chat Interface** - Modern chat UI dengan avatar integration
- 🎭 **Persona System** - Lycus (Technical) & Polar Nexus (Creative) personas
- 🔗 **Ollama Integration** - Local LLM dengan Ollama backend
- 🧠 **Context-Aware RAG** - Retrieval system untuk tools & golden rules
- ⚡ **Tool Execution** - Integration dengan Python Tools (Phase 2)

### Secondary Goals:
- 📊 **Agent Status Monitoring** - Real-time agent activity feedback
- 🎨 **Responsive Chat UI** - Mobile-first chat experience
- 💾 **Chat History** - Persistent conversation storage
- ⚙️ **AI Configuration** - Settings untuk model & RAG tuning

---

## 🏗️ Architecture Overview

### 5-Core Agent System (RAG-Optimized)

```
User Input → Agent 1 (Router) → Agent 2 (RAG) → Agent 3 (Execution)
                                       ↓              ↓
                                  Agent 4 (Reasoning) ←
                                       ↓
                                  Agent 5 (Persona)
                                       ↓
                                  Final Output
```

### Agent Breakdown:

| Agent | Role | LLM/Tool | Responsibility |
|-------|------|----------|----------------|
| **1. Router** | Intent Classification | LLM 7B | Classify user intent (code/creative/general) |
| **2. RAG** | Context Retrieval | Vector DB + SQLite | Fetch relevant tools, docs, golden rules |
| **3. Execution** | Tool Validator | Logic Gate | Decide if Python tools needed, execute via API |
| **4. Reasoning** | Core Processing | LLM 7B (Main) | Generate accurate response with full context |
| **5. Persona** | Tone Formatting | LLM 7B (Light) | Apply persona style (Lycus/Polar Nexus) |

---

## 🖼️ UI/UX Design

### Chat Page Layout (`/chat`)

```
┌─────────────────────────────────────────────────────┐
│ Header + Navigation                                  │
├──────────────────┬──────────────────────────────────┤
│                  │                                  │
│  Avatar Area     │  Chat History (glass-strong)    │
│  ┌────────────┐  │  ┌────────────────────────────┐ │
│  │ Vroid 3D   │  │  │ [USER]: Tanya kode Python  │ │
│  │ Avatar     │  │  │                            │ │
│  │ (Future)   │  │  │ [LYCUS - Code Agent]:      │ │
│  └────────────┘  │  │ ⚡ Execution Log:           │ │
│                  │  │ - RAG: Retrieved 3 schemas │ │
│  Agent Status:   │  │ - EXEC: Running formatter  │ │
│  🟢 RAG Active   │  │                            │ │
│  🔵 EXEC Ready   │  │ [FINAL - Lycus]: (Answer)  │ │
│  🟣 Persona ON   │  │                            │ │
│                  │  └────────────────────────────┘ │
├──────────────────┴──────────────────────────────────┤
│ Input Bar (glass-strong)                            │
│ 💬 [Text Input] 🎙️ [Mic] 🚀 [Send]                │
└─────────────────────────────────────────────────────┘
```

### Settings - AI Chat Tab (New)

```
Settings > [Tools | Appearance | AI Chat ⭐]

┌─────────────────────────────────────────────┐
│ 1. Core Model Setup                         │
│ • Ollama URL: [http://localhost:11434]      │
│ • Model: [llama3:8b ▼]                      │
│ • Test Connection: [Button]                 │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 2. RAG & Context Management                 │
│ • RAG Status: 🟢 Connected (3 sources)      │
│ • Vector DB: [backend/data/vector_db]       │
│ • Context Size: [━━━●━━━] 4000 tokens      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 3. Multi-Agent & Persona Control            │
│ • Default Persona: [Lycus ▼]                │
│ • Execution Agent: [Toggle: ON]             │
│ • Execution Policy: [Ask Before Run ▼]      │
└─────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Plan

### 1. Frontend Components

**New Components:**
```typescript
src/components/
├── chat/
│   ├── ChatContainer.tsx           // Main chat layout
│   ├── ChatMessage.tsx             // Individual message bubble
│   ├── ChatInput.tsx               // Input bar with send
│   ├── AvatarDisplay.tsx           // Avatar area (placeholder for Vroid)
│   ├── AgentStatusPanel.tsx        // Real-time agent indicators
│   ├── ExecutionLog.tsx            // Show RAG/Exec steps
│   └── PersonaBadge.tsx            // Persona identifier badge
```

**Updated Pages:**
```typescript
src/pages/
├── ChatPage.tsx                    // Rebuild with full chat UI
└── SettingsPage.tsx                // Add "AI Chat" tab
```

**State Management:**
```typescript
src/store/
├── chatStore.ts                    // Chat state (messages, loading)
└── aiConfigStore.ts                // AI settings (Ollama, model, persona)
```

### 2. Backend Implementation

**New Backend Files:**
```python
backend/
├── ai/
│   ├── __init__.py
│   ├── agents.py                   // 5 Agent classes
│   ├── rag_engine.py               // RAG retrieval logic
│   ├── ollama_client.py            // Ollama API wrapper
│   ├── persona_manager.py          // Persona definitions
│   └── context_builder.py          // Context assembly
├── routes/
│   └── chat_routes.py              // Chat API endpoints
└── models/
    └── chat_models.py              // Chat message schemas
```

**API Endpoints:**
```python
POST   /api/chat/message            # Send message, trigger Agent 1
GET    /api/chat/history            # Get conversation history
POST   /api/chat/clear              # Clear chat history
GET    /api/chat/status             # Get agent status
POST   /api/ai/config               # Update AI settings
GET    /api/ai/models               # List Ollama models
POST   /api/ai/test-connection      # Test Ollama connection
```

### 3. Database Schema

**New Tables:**
```sql
-- Chat conversations
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,
    title TEXT,
    persona TEXT DEFAULT 'lycus',
    created_at TEXT,
    updated_at TEXT
);

-- Chat messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    role TEXT,                      -- 'user' | 'assistant' | 'system'
    content TEXT,
    agent_tag TEXT,                 -- Which agent generated this
    execution_log TEXT,             -- JSON log of agent steps
    timestamp TEXT,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
);

-- RAG context cache
CREATE TABLE rag_cache (
    id TEXT PRIMARY KEY,
    query TEXT,
    context TEXT,                   -- Retrieved context
    sources TEXT,                   -- JSON array of source IDs
    relevance_score REAL,
    created_at TEXT
);
```

### 4. Agent Implementation

**Agent 1: Router/Receiver**
```python
class RouterAgent:
    """
    Classify user intent:
    - 'code': Programming/technical questions
    - 'creative': Story/art/design ideas
    - 'tool': Direct tool execution request
    - 'general': General conversation
    """
    def classify_intent(self, user_input: str) -> str
    def route_to_next(self, intent: str) -> Agent
```

**Agent 2: RAG/Retrieval**
```python
class RAGAgent:
    """
    Retrieve relevant context:
    - Tool schemas (from Phase 2 SQLite)
    - Golden rules (from docs/)
    - Past conversations (from messages table)
    """
    def retrieve_tools(self, query: str) -> List[Tool]
    def retrieve_docs(self, query: str) -> List[Document]
    def build_context(self, query: str) -> str
```

**Agent 3: Execution/Tool**
```python
class ExecutionAgent:
    """
    Decide and execute tools:
    - Check if tool execution needed
    - Call backend tool API (Phase 2)
    - Return results to Reasoning Agent
    """
    def should_execute(self, intent: str, context: str) -> bool
    def execute_tool(self, tool_id: str, params: dict) -> dict
```

**Agent 4: Reasoning/Process**
```python
class ReasoningAgent:
    """
    Main LLM processing:
    - Combine: user input + RAG context + tool results
    - Generate accurate technical response
    - Use full 7B model capabilities
    """
    def process(self, input: str, context: str, tool_results: dict) -> str
```

**Agent 5: Persona/Output**
```python
class PersonaAgent:
    """
    Apply persona tone:
    - Lycus: Technical, to-the-point, casual
    - Polar Nexus: Creative, inspiring, artistic
    - Sarah: Friendly, helpful, warm
    """
    def format_response(self, raw_response: str, persona: str) -> str
```

---

## 📊 Feature Checklist

### Phase 3.1: Core Chat Infrastructure
- [ ] ChatPage UI redesign (responsive)
- [ ] Chat message components (bubble, input)
- [ ] Chat history storage (SQLite)
- [ ] Settings - AI Chat tab
- [ ] Ollama client wrapper
- [ ] Basic LLM integration (single agent)

### Phase 3.2: Multi-Agent System
- [ ] Agent 1: Router implementation
- [ ] Agent 2: RAG engine setup
- [ ] Agent 3: Tool execution bridge
- [ ] Agent 4: Main reasoning logic
- [ ] Agent 5: Persona formatter
- [ ] Agent orchestration pipeline

### Phase 3.3: RAG & Context
- [ ] Vector database setup (ChromaDB/FAISS)
- [ ] Tool schema indexing
- [ ] Golden rules indexing
- [ ] Context assembly system
- [ ] RAG cache implementation

### Phase 3.4: Persona System
- [ ] Lycus persona definition
- [ ] Polar Nexus persona definition
- [ ] Sarah persona definition (bonus)
- [ ] Persona switcher UI
- [ ] System prompt templates

### Phase 3.5: Advanced Features
- [ ] Agent status real-time updates
- [ ] Execution log display
- [ ] Ask-before-execute policy
- [ ] Streaming responses (optional)
- [ ] Chat export/import

### Phase 3.6: Polish & Testing
- [ ] Mobile responsive chat
- [ ] Loading states & animations
- [ ] Error handling & retry
- [ ] Performance optimization
- [ ] End-to-end testing

---

## 🎨 Design Tokens

### Persona Colors:
```css
--persona-lycus: #8b5cf6      /* Purple - Technical */
--persona-polar: #3b82f6      /* Blue - Creative */
--persona-sarah: #ec4899      /* Pink - Friendly */
```

### Agent Status Colors:
```css
--agent-active: #10b981       /* Green - Active */
--agent-ready: #3b82f6        /* Blue - Ready */
--agent-thinking: #f59e0b     /* Yellow - Processing */
--agent-error: #ef4444        /* Red - Error */
```

### Message Bubbles:
```css
.message-user {
  /* Right-aligned, primary gradient */
  @apply bg-gradient-to-r from-primary to-secondary;
}

.message-assistant {
  /* Left-aligned, glass effect */
  @apply glass-strong;
}

.message-system {
  /* Centered, muted */
  @apply bg-gray-100 dark:bg-dark-surface/50;
}
```

---

## 🔗 Integration Points

### 1. Ollama Backend
```yaml
Connection: http://localhost:11434
Models: llama3:8b, mistral:7b, codellama:7b
API: /api/generate, /api/chat
Streaming: WebSocket support (future)
```

### 2. Phase 2 Tools Integration
```yaml
Tools API: /api/tools/execute
Input: tool_id, parameters
Output: result, logs, status
RAG Source: Tool schemas from SQLite
```

### 3. Golden Rules RAG
```yaml
Source: docs/golden-rules.md
Indexing: Rule #0-#10 as separate docs
Usage: Inject into context for coding questions
```

### 4. Database
```yaml
Engine: SQLite (chimera.db)
Tables: conversations, messages, rag_cache
ORM: SQLAlchemy (optional) or native sqlite3
```

---

## 🧪 Testing Strategy

### Unit Tests:
- [ ] Agent routing logic
- [ ] RAG retrieval accuracy
- [ ] Persona formatting
- [ ] Tool execution flow

### Integration Tests:
- [ ] Full 5-agent pipeline
- [ ] Ollama connection
- [ ] Database operations
- [ ] API endpoints

### UI Tests:
- [ ] Chat message rendering
- [ ] Input/send flow
- [ ] Agent status updates
- [ ] Settings configuration

### Manual Tests:
- [ ] Conversation quality
- [ ] Persona consistency
- [ ] Response accuracy
- [ ] Mobile usability

---

## 📚 Dependencies

### Backend:
```python
# requirements.txt additions
ollama==0.1.0              # Ollama Python client
chromadb==0.4.0            # Vector database
langchain==0.1.0           # RAG utilities (optional)
sentence-transformers==2.0 # Embeddings
```

### Frontend:
```json
// package.json additions (if needed)
"markdown-to-jsx": "^7.0.0",     // Markdown rendering
"react-markdown": "^9.0.0",       // Alternative
"prismjs": "^1.29.0"              // Code syntax highlighting
```

---

## 🎯 Success Criteria

### Functional Requirements:
- ✅ User can send message and receive AI response
- ✅ RAG successfully retrieves relevant context
- ✅ Tools can be executed during conversation
- ✅ Persona tone is applied correctly
- ✅ Agent status visible in real-time

### Performance Requirements:
- ✅ Response time < 5 seconds (7B model)
- ✅ RAG retrieval < 500ms
- ✅ Chat UI responsive (60fps)
- ✅ Mobile-friendly interface

### Quality Requirements:
- ✅ Responses are accurate and helpful
- ✅ Persona is consistent throughout
- ✅ No hallucinations on tool execution
- ✅ Context properly maintained

---

## 🚀 Deployment Considerations

### Local Setup:
```bash
# 1. Install Ollama
curl https://ollama.ai/install.sh | sh

# 2. Pull model
ollama pull llama3:8b

# 3. Start Ollama server
ollama serve

# 4. Install dependencies
cd backend && pip install -r requirements.txt
cd .. && yarn install

# 5. Initialize RAG database
python backend/ai/init_rag.py

# 6. Start services
yarn dev  # Frontend
python backend/server.py  # Backend
```

### Docker Support (Future):
```yaml
services:
  ollama:
    image: ollama/ollama
    ports: ["11434:11434"]
  
  backend:
    build: ./backend
    environment:
      OLLAMA_URL: http://ollama:11434
  
  frontend:
    build: .
    ports: ["5173:5173"]
```

---

## 🛣️ Roadmap

### Week 1-2: Foundation
- Chat UI implementation
- Basic Ollama integration
- Settings tab for AI config

### Week 3-4: Multi-Agent System
- Agent 1-5 implementation
- Agent orchestration
- RAG engine setup

### Week 5-6: Persona & Polish
- Persona system
- Agent status monitoring
- Execution logs UI

### Week 7-8: Testing & Optimization
- End-to-end testing
- Performance tuning
- Documentation

---

## 💡 Future Enhancements (Phase 4+)

### Phase 4: Avatar Integration
- 3D Vroid avatar rendering
- Lip sync with TTS
- Audio reactivity
- Emotion expressions

### Beyond:
- Voice input (Speech-to-Text)
- Voice output (TTS with persona voices)
- Multi-modal (Image input for RAG)
- Collaborative chat (Multiple personas in one conversation)

---

## 📝 Notes & Considerations

### Ollama Model Selection:
- **llama3:8b** - Best all-around (code + creative)
- **mistral:7b** - Fast, good for technical
- **codellama:7b** - Specialized for coding
- **phi-2:2.7b** - Lightweight for low-end devices

### RAG Strategy:
- Embed tool schemas → Vector DB
- Embed golden rules → Vector DB
- Use semantic search (cosine similarity)
- Cache frequent queries

### Persona Prompts:
```
[Lycus - Technical Persona]
You are Lycus, a skilled code companion. Be direct, use examples, 
stay technical but friendly. Focus on practical solutions.

[Polar Nexus - Creative Persona]
You are Polar Nexus, a creative muse. Be inspiring, use metaphors,
encourage exploration. Focus on ideas and possibilities.
```

---

## ✅ Phase 3 Status: PLANNING COMPLETE

**Documentation Ready**: ✅  
**Architecture Defined**: ✅  
**UI/UX Designed**: ✅  
**Technical Stack Chosen**: ✅

**Next Step**: Begin Phase 3.1 Implementation! 🚀

---

**Made with ❤️ for ChimeraAI - Your Local AI Agent**

**Last Updated**: Phase 3 Planning (October 2025)  
**Author**: ChimeraAI Development Team  
**Status**: 📋 Ready for Implementation
