# Phase 6 Roadmap: Dynamic Modular Pipeline Orchestration

**Created:** October 25, 2025  
**Last Updated:** October 25, 2025  
**Status:** 🔄 In Progress - Phase 6.7 COMPLETE ✅  
**Current Phase:** 6.7.4 Complete, Ready for 6.8  
**Approach:** Documentation-First → Incremental Implementation → User Testing

---

## 🎯 Vision & Goals

Transform RAG Studio dari sistem workflow hardcoded menjadi **Dynamic Modular Pipeline Orchestration** yang flexible, scalable, dan mudah di-extend.

### Current Problems ❌

1. **Hardcoded Flow Logic:**
   ```python
   if mode == "flash":
       # flash logic
   elif mode == "pro":
       # pro logic
   ```

2. **Tightly Coupled Agents:**
   - Router, RAG, LLM, Persona logic semua di `workflow_engine.py`
   - Sulit add new agent tanpa modify core code

3. **Static Workflow Definition:**
   - Workflow structure fixed di database schema
   - Tidak bisa dynamic composition

4. **No Intelligent Routing:**
   - Mode dipilih manual oleh user
   - Router tidak bisa auto-detect best mode

### New Architecture Goals ✅

1. **Dynamic Flow Configuration:**
   - JSON-based flow definitions
   - Hot-reload tanpa restart server
   - Easy to create new modes

2. **Plugin-Based Agent System:**
   - Each agent = independent module
   - Standard interface: `run(context) → context`
   - Easy to add/remove/swap agents

3. **Smart Router:**
   - Auto-detect intent & complexity
   - Choose best mode automatically
   - Learn from user feedback

4. **Unified Interfaces:**
   - RetrieverInterface (RAG, Chimepedia, Cache)
   - PersonaInterface (style, tone, context)
   - FormatterInterface (output format)

5. **Cache Layer (Flash+ Mode):**
   - Redis/SQLite cache for common queries
   - Mini-vector store for fast lookup
   - Persona-aware responses

6. **Observability:**
   - Log every step execution
   - Performance metrics
   - Auto-optimization insights

---

## 📊 Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INPUT                                │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              SMART ROUTER (Intent Classifier)                │
│  • Detect query type (simple/complex/reasoning)              │
│  • Analyze context requirements                              │
│  • Choose optimal mode: flash / pro / hybrid / persona       │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                 FLOW EXECUTOR (Dynamic)                      │
│  • Load flow config from: flows/{mode}/config.json           │
│  • Execute steps sequentially                                │
│  • Pass context between agents                               │
└────────────────────────┬────────────────────────────────────┘
                         ↓
                    ┌────┴────┐
                    │ Step 1  │ → Agent Plugin (e.g., Preprocessor)
                    └────┬────┘
                         ↓
                    ┌────┴────┐
                    │ Step 2  │ → Agent Plugin (e.g., Retriever)
                    └────┬────┘
                         ↓
                    ┌────┴────┐
                    │ Step 3  │ → Agent Plugin (e.g., LLM Generator)
                    └────┬────┘
                         ↓
                    ┌────┴────┐
                    │ Step 4  │ → Agent Plugin (e.g., Persona Formatter)
                    └────┬────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   FINAL OUTPUT                               │
│  • Formatted response                                        │
│  • Metadata (timing, agents used, sources)                   │
│  • Observability logs                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Folder Structure (New)

```
backend/
├── ai/
│   ├── flow/                          # NEW: Flow orchestration
│   │   ├── __init__.py
│   │   ├── executor.py                # FlowExecutor class
│   │   ├── loader.py                  # Flow config loader
│   │   └── context.py                 # ExecutionContext class
│   │
│   ├── agents/                        # NEW: Plugin-based agents
│   │   ├── __init__.py
│   │   ├── base.py                    # BaseAgent interface
│   │   ├── preprocessor.py            # Input preprocessing
│   │   ├── router_agent.py            # Intent classification
│   │   ├── retriever_agent.py         # Unified retriever
│   │   ├── llm_agent.py               # LLM generation
│   │   ├── persona_agent.py           # Persona formatting
│   │   ├── cache_agent.py             # Cache lookup/store
│   │   └── formatter_agent.py         # Output formatting
│   │
│   ├── retrievers/                    # NEW: Retriever implementations
│   │   ├── __init__.py
│   │   ├── base.py                    # RetrieverInterface
│   │   ├── rag_retriever.py           # RAG with ChromaDB
│   │   ├── chimepedia_retriever.py    # Chimepedia integration
│   │   └── cache_retriever.py         # Cache-based retrieval
│   │
│   ├── flows/                         # NEW: Flow configurations
│   │   ├── flash/
│   │   │   ├── base.json              # Flash mode base flow
│   │   │   ├── cached.json            # Flash with cache
│   │   │   └── persona.json           # Flash + persona
│   │   ├── pro/
│   │   │   ├── base.json              # Pro mode base flow
│   │   │   ├── rag_full.json          # Pro with full RAG
│   │   │   └── multi_agent.json       # Pro multi-agent
│   │   ├── hybrid/
│   │   │   └── adaptive.json          # Hybrid adaptive flow
│   │   └── persona/
│   │       ├── sarah.json             # Sarah persona flow
│   │       └── nour.json             # Nour persona flow
│   │
│   ├── router/                        # NEW: Smart routing
│   │   ├── __init__.py
│   │   ├── intent_classifier.py       # Intent detection
│   │   ├── complexity_analyzer.py     # Query complexity
│   │   └── mode_selector.py           # Mode selection logic
│   │
│   ├── cache/                         # NEW: Cache layer
│   │   ├── __init__.py
│   │   ├── cache_manager.py           # Cache operations
│   │   ├── vector_cache.py            # Mini-vector for lookup
│   │   └── response_cache.py          # Response caching
│   │
│   └── observability/                 # NEW: Logging & metrics
│       ├── __init__.py
│       ├── logger.py                  # Enhanced logging
│       ├── metrics.py                 # Performance tracking
│       └── analyzer.py                # Flow analysis
│
├── workflow_engine.py                 # LEGACY: Keep for backward compatibility
└── workflow_database.py               # Keep: Store user custom workflows
```

---

## 📋 Phase Breakdown

### ✅ Phase 6.0: Architecture Documentation (COMPLETE)
**Status:** ✅ Complete  
**Date:** October 25, 2025  
**Goal:** Complete documentation before implementation

**Deliverables:**
- [x] phase_6_roadmap.md (this file) - architecture overview
- [x] phase_6.md - clean visual editor docs
- [x] Phase_6_analysis.md - problem analysis
- [x] PROGRESS.md - journey tracker for continuity

---

### ✅ Phase 6.1-6.6: Visual Workflow Editor (COMPLETE - Keep)
**Status:** ✅ Complete  
**Note:** Legacy system tetap dijaga untuk user custom workflows

**What to Keep:**
- React Flow visual editor
- Drag & drop node canvas
- Database schema (workflows, nodes, connections)
- Manual workflow creation & testing
- Frontend components (WorkflowEditor, TestPanel, NodeConfigPanel)

**Future Integration:**
- Visual editor bisa generate JSON flow configs
- Hybrid system: manual workflows + predefined modes

---

### ✅ Phase 6.7: Core Flow Orchestration System (COMPLETE)
**Status:** ✅ Complete  
**Completed:** October 25, 2025  
**Duration:** 4 days (Oct 25, 2025)  
**Goal:** Build foundation - FlowExecutor & plugin system

**Summary:**
Phase 6.7 berhasil membangun fondasi lengkap untuk dynamic flow orchestration system dengan 4 sub-phases:
- ✅ 6.7.1: Base Classes & Interfaces (ExecutionContext, BaseAgent, RetrieverInterface)
- ✅ 6.7.2: Flow Loader & Parser (Enhanced JSON schemas dengan hardware awareness)
- ✅ 6.7.3: Flow Executor (Step-by-step execution dengan error handling)
- ✅ 6.7.4: Basic Agents (8 real agents + integration dengan existing system)

**Total Test Coverage:** 51 tests passing (15 base + 19 loader + 17 executor)  
**Agents Created:** 8 real agents (PreprocessorAgent, RouterAgentWrapper, RAGAgentWrapper, ExecutionAgentWrapper, LLMAgent, PersonaAgentWrapper, CacheLookupAgent, CacheStoreAgent)  
**Flow Modes:** Flash (3 steps) & Pro (6 steps) - Both working!

---

#### ✅ Sub-Phase 6.7.1: Base Classes & Interfaces (COMPLETE)
**Status:** ✅ Complete  
**Date:** October 25, 2025  
**Duration:** 1 day

**Deliverables:**
- [x] `ai/flow/context.py` - ExecutionContext class (200 lines)
- [x] `ai/agents/base.py` - BaseAgent interface (200 lines)
- [x] `ai/retrievers/base.py` - RetrieverInterface (100 lines)
- [x] Unit tests for interfaces (15 tests, all passing)

**Testing:** ✅ User verified interface design, all tests passing

**Key Features:**
- ExecutionContext: Shared context with data storage, flags, logging
- BaseAgent: Abstract interface with execute(), run(), should_run(), validate_input()
- RetrieverInterface: Unified retrieval with RetrievalResult dataclass

**Files Created:**
```
backend/ai/
├── flow/
│   ├── __init__.py
│   └── context.py (200 lines)
├── agents/
│   ├── __init__.py
│   └── base.py (200 lines)
├── retrievers/
│   ├── __init__.py
│   └── base.py (100 lines)

backend/tests/
└── test_base_interfaces.py (350 lines, 15 tests)
```

**Test Results:** 15/15 passed ✅

---

#### ✅ Sub-Phase 6.7.2: Flow Loader & Parser (COMPLETE)
**Status:** ✅ Complete  
**Date:** October 25, 2025  
**Duration:** 1 day

**Deliverables:**
- [x] `ai/flow/loader.py` - FlowLoader with enhanced features (500+ lines)
- [x] `ai/flows/flash/base.json` - Flash mode flow with full feature set
- [x] `ai/flows/pro/rag_full.json` - Pro mode RAG flow
- [x] Enhanced JSON schema with improvements:
  - **Execution Profile** - Hardware awareness (GPU/CPU, memory, precision)
  - **Flow Signature** - Versioning & integrity checking
  - **Enhanced Error Handling** - Retry logic, fallback flows, recovery agents
  - **Model Fallbacks** - Auto-switching for resource constraints
  - **Optimization Config** - Parallel execution, priority settings
- [x] Comprehensive dataclasses:
  - FlowConfig, StepConfig, ExecutionProfile
  - FlowSignature, ErrorHandling, OptimizationConfig
- [x] Advanced features:
  - Condition evaluation for steps
  - on_success actions (skip_to, set_flag)
  - Resource-aware configuration
  - Adaptive timeout support
- [x] Unit tests (19 tests, all passing)

**Testing:** ✅ User verified - All 34 tests passing (15 base + 19 loader)

**Key Features Implemented:**
- ✅ Basic flow loading & validation
- ✅ Hardware profile support (foundation for adaptive execution)
- ✅ Enhanced error handling (retry, fallback, recovery)
- ✅ Metadata & versioning (signature verification)
- ✅ Model fallback config (auto-switching foundation)
- ✅ Optimization hints (parallel, priority, resource-aware)
- ✅ Conditional step execution
- ✅ Flow listing & discovery

**Files Created:**
```
backend/ai/
├── flow/
│   └── loader.py (500+ lines)
├── flows/
│   ├── flash/
│   │   └── base.json (enhanced)
│   └── pro/
│       └── rag_full.json (enhanced)

backend/tests/
└── test_flow_loader.py (400+ lines, 19 tests)
```

**Test Results:** 19/19 passed ✅

#### ✅ Sub-Phase 6.7.3: Flow Executor (COMPLETE)
**Status:** ✅ Complete  
**Date:** October 25, 2025  
**Duration:** 1 day

**Deliverables:**
- [x] `ai/flow/executor.py` - FlowExecutor class (300+ lines)
- [x] `ai/flow/registry.py` - AgentRegistry for agent management (250+ lines)
- [x] Step execution logic with context passing
- [x] Error handling & recovery
  - Retry logic with configurable attempts
  - Critical vs non-critical error handling
  - Error recovery agents (on_fail)
  - Fallback flow foundation
- [x] Conditional execution
  - Skip steps based on flags (flags.cache_hit == false)
  - Skip steps based on config (config.enable_cache == true)
  - on_success actions (set_flag, skip_to)
- [x] Mock agents for testing:
  - MockPreprocessorAgent, MockLLMAgent, MockFormatterAgent
  - MockCacheLookupAgent, MockCacheStoreAgent
  - MockErrorAgent, MockErrorResponderAgent
- [x] Comprehensive unit tests (17 tests)
- [x] Demo script for interactive testing
- [x] Updated module exports in `__init__.py`

**Testing:** ✅ User verified - All 51 tests passing (15 base + 19 loader + 17 executor)

**Key Features Implemented:**
- ✅ Flow orchestration engine
- ✅ Step-by-step execution with timing
- ✅ Conditional execution (flags & config)
- ✅ on_success actions (set_flag, skip_to)
- ✅ Retry logic with configurable attempts
- ✅ Error recovery with recovery agents
- ✅ Context passing between steps
- ✅ Agent registry system

**Files Created:**
```
backend/ai/
├── flow/
│   ├── executor.py (300+ lines)
│   └── registry.py (250+ lines)

backend/tests/
├── mock_agents.py (300+ lines, 7 mock agents)
├── test_flow_executor.py (500+ lines, 17 tests)
└── demo_flow_executor.py (400+ lines, interactive demo)
```

**Test Results:** 17/17 passed ✅

---

#### ✅ Sub-Phase 6.7.4: Basic Agents (COMPLETE)
**Status:** ✅ Complete  
**Date:** October 25, 2025  
**Duration:** 1 day

**Deliverables:**
- [x] `ai/agents/preprocessor.py` - Text preprocessing (NEW)
- [x] `ai/agents/router_agent.py` - Wrap RouterAgent (NEW)
- [x] `ai/agents/rag_agent.py` - Wrap RAGAgent (NEW)
- [x] `ai/agents/execution_agent.py` - Wrap ExecutionAgent (NEW)
- [x] `ai/agents/llm_agent.py` - Wrap ReasoningAgent (NEW)
- [x] `ai/agents/persona_agent.py` - Wrap PersonaAgent (NEW) - **PERSONA STAYS ALIVE!**
- [x] `ai/agents/cache_lookup.py` - Simple cache lookup (NEW)
- [x] `ai/agents/cache_store.py` - Simple cache storage (NEW)
- [x] `ai/agents/register_agents.py` - Helper to register all agents (NEW)
- [x] Updated `ai/agents/__init__.py` - Export all new agents
- [x] Renamed `ai/agents.py` → `ai/legacy_agents.py` (backward compatibility)
- [x] Updated imports in `agent_orchestrator.py` and `multi_model_orchestrator.py`
- [x] Created `tests/demo_basic_agents.py` - Demo script
- [x] Updated flow configs:
  - `flows/flash/base.json` - Simplified to 3 steps
  - `flows/pro/rag_full.json` - Simplified to 6 steps

**Testing:** ✅ User verified - Both Flash & Pro modes working!

**Test Results:**
```
Flash Mode: 3 steps executed successfully
✅ preprocessor (0.000s) - success
✅ llm_agent (0.004s) - success  
✅ persona (0.000s) - success

Pro Mode: 6 steps executed successfully
✅ preprocessor (0.000s) - success
✅ router (0.001s) - success
✅ rag (0.000s) - success
✅ execution (0.000s) - success
✅ llm_agent (0.001s) - success
✅ persona (0.000s) - success
```

**Key Features Implemented:**
- ✅ 8 real agent classes (all working!)
- ✅ Wrapper agents delegate to existing 5-agent system
- ✅ Persona stays alive with LLM formatting (PersonaAgent wrapper)
- ✅ Integration with legacy agents (backward compatible)
- ✅ Agent registration system
- ✅ Flow configs for Flash & Pro modes
- ✅ Error handling & fallback working
- ✅ End-to-end flow execution verified

**Files Created:**
```
backend/ai/agents/
├── preprocessor.py           ← NEW (text preprocessing)
├── router_agent.py          ← NEW (wrap RouterAgent)
├── rag_agent.py             ← NEW (wrap RAGAgent)
├── execution_agent.py       ← NEW (wrap ExecutionAgent)
├── llm_agent.py             ← NEW (wrap ReasoningAgent)
├── persona_agent.py         ← NEW (wrap PersonaAgent)
├── cache_lookup.py          ← NEW (cache lookup)
├── cache_store.py           ← NEW (cache storage)
├── register_agents.py       ← NEW (helper)
└── __init__.py              ← UPDATED (exports)

backend/ai/
├── legacy_agents.py         ← RENAMED (was agents.py)
├── agent_orchestrator.py    ← UPDATED (imports)
└── multi_model_orchestrator.py ← UPDATED (imports)

backend/ai/flows/
├── flash/base.json          ← UPDATED (simplified to 3 steps)
└── pro/rag_full.json        ← UPDATED (simplified to 6 steps)

backend/tests/
└── demo_basic_agents.py     ← NEW (demo script)
```

**Architecture Benefits Achieved:**

| Area | Hasil |
|------|-------|
| 🔧 Struktur | Modular & fleksibel (JSON-based flows) ✅ |
| ⚡ Performa | Ready untuk optimization (flash/pro modes) ✅ |
| 💾 Memory | Efficient (lazy loading agents) ✅ |
| 🧠 Kecerdasan | Persona stays alive dengan LLM! ✅ |
| 💬 Persona | Terintegrasi sempurna ✅ |
| 🛠️ Maintenance | Flow bisa diganti tanpa restart ✅ |

**Note:** Ollama perlu di-start untuk full LLM generation. Fallback mechanism bekerja dengan baik saat Ollama offline.

---

### 🆕 Phase 6.8: Smart Router & Mode Selection
**Status:** 📋 Planned  
**Duration:** ~2-3 days  
**Goal:** Intelligent routing berdasarkan query analysis

#### Sub-Phase 6.8.1: Intent Classifier
**Deliverables:**
- `ai/router/intent_classifier.py`
- Detect: question, command, generation, analysis, chat
- Simple rule-based + keyword matching (no ML initially)

**Testing:** User tests intent classification accuracy

#### Sub-Phase 6.8.2: Complexity Analyzer
**Deliverables:**
- `ai/router/complexity_analyzer.py`
- Analyze: simple (flash) vs complex (pro) vs reasoning (hybrid)
- Scoring system for query complexity

**Testing:** User tests complexity scoring

#### Sub-Phase 6.8.3: Mode Selector
**Deliverables:**
- `ai/router/mode_selector.py`
- Combine intent + complexity → choose optimal mode
- Configurable rules for mode selection

**Testing:** User tests automatic mode selection

---

### 🆕 Phase 6.9: Retriever Unification & Cache Layer
**Status:** 📋 Planned  
**Duration:** ~3-4 days  
**Goal:** Unified retriever interface + smart caching

#### Sub-Phase 6.9.1: Retriever Interface Implementation
**Deliverables:**
- `ai/retrievers/rag_retriever.py` - ChromaDB RAG
- `ai/retrievers/chimepedia_retriever.py` - Chimepedia integration
- Unified API: `retrieve(query, filters) → results`

**Testing:** User tests retrievers with different sources

#### Sub-Phase 6.9.2: Cache Manager
**Deliverables:**
- `ai/cache/cache_manager.py` - Redis/SQLite cache
- Cache key generation (query hash + context)
- TTL & invalidation strategies

**Testing:** User tests cache hit/miss scenarios

#### Sub-Phase 6.9.3: Vector Cache (Mini-Vector Store)
**Deliverables:**
- `ai/cache/vector_cache.py` - Semantic similarity lookup
- Small vector index for common queries
- Fast approximate nearest neighbor search

**Testing:** User tests semantic cache lookup

#### Sub-Phase 6.9.4: Cache Agent Integration
**Deliverables:**
- `ai/agents/cache_agent.py` - Cache lookup in flow
- Flash+ mode with cache-first strategy
- Persona-aware cached responses

**Testing:** User tests Flash+ mode performance

---

### 🆕 Phase 6.10: Persona Modular System
**Status:** 📋 Planned  
**Duration:** ~2-3 days  
**Goal:** Modular persona pipeline dengan flow sendiri

#### Sub-Phase 6.10.1: Persona Loader
**Deliverables:**
- Enhanced persona loading from database
- Persona config injection into flow
- Relationship context integration

**Testing:** User tests persona loading & context

#### Sub-Phase 6.10.2: Persona Brain Agent
**Deliverables:**
- `ai/agents/persona_agent.py` - Persona-aware generation
- Style, tone, personality application
- Memory & relationship-aware responses

**Testing:** User tests different personas (Nour, Sarah, etc.)

#### Sub-Phase 6.10.3: Persona Flow Configs
**Deliverables:**
- `ai/flows/persona/sarah.json` - Sarah flow
- `ai/flows/persona/nour.json` - Nour flow
- Per-persona flow customization

**Testing:** User tests persona-specific flows

---

### 🆕 Phase 6.11: Observability & Analytics
**Status:** 📋 Planned  
**Duration:** ~2 days  
**Goal:** Logging, metrics, dan auto-optimization insights

#### Sub-Phase 6.11.1: Enhanced Logging
**Deliverables:**
- `ai/observability/logger.py` - Structured logging
- Log every agent execution (timing, input/output)
- Searchable logs dengan context

**Testing:** User reviews log output

#### Sub-Phase 6.11.2: Performance Metrics
**Deliverables:**
- `ai/observability/metrics.py` - Metrics collection
- Agent timing, success rate, cache hit rate
- Metrics API for dashboard

**Testing:** User reviews metrics dashboard

#### Sub-Phase 6.11.3: Flow Analyzer
**Deliverables:**
- `ai/observability/analyzer.py` - Flow analysis
- Identify bottlenecks
- Suggest optimizations (e.g., "use cache for this query type")

**Testing:** User reviews analysis recommendations

---

### 🆕 Phase 6.12: Legacy Integration & Migration
**Status:** 📋 Planned  
**Duration:** ~2 days  
**Goal:** Backward compatibility dengan visual editor

---

## 🚀 Phase 6 Enhancements & Improvements

**Implemented in Phase 6.7.2** (Based on user suggestions)

### 1️⃣ Execution Profile (Hardware Awareness)
```json
"profile": {
  "target_device": "local",
  "hardware_mode": "gpu_4060",
  "max_memory_gb": 8,
  "concurrency_limit": 2,
  "precision": "fp16",
  "offload_kv_cache": true
}
```

**Benefits:**
- ✅ Foundation for adaptive execution
- ✅ Resource-aware flow execution
- ✅ Hardware-specific optimization hints
- 🔄 Full implementation in Phase 6.7.3 (Executor)

### 2️⃣ Enhanced Error Handling & Recovery
```json
"error_handling": {
  "retry_on_timeout": true,
  "max_retries": 2,
  "retry_delay": 0.5,
  "fallback_flows": ["flash_base_v1"],
  "on_fail": {
    "agent": "error_responder",
    "config": {
      "message": "Maaf, aku mengalami kendala teknis..."
    }
  }
}
```

**Benefits:**
- ✅ Graceful degradation
- ✅ User-friendly error messages
- ✅ Automatic fallback to simpler modes

### 3️⃣ Model Fallback Support
```json
"config": {
  "auto_model_switch": true,
  "model_fallbacks": {
    "qwen2.5:7b": "gemma2:2b",
    "mixtral:8x7b": "mistral:7b"
  }
}
```

**Benefits:**
- ✅ Automatic downgrade on resource constraints
- ✅ No crashes from VRAM limits
- ✅ Optimized for local GPUs (RTX 4060, 8GB)

### 4️⃣ Flow Signature & Versioning
```json
"signature": {
  "hash": "sha256:...",
  "last_verified": "2025-10-25T10:00:00Z",
  "auto_update": true
}
```

**Benefits:**
- ✅ Flow integrity verification
- ✅ Version tracking
- ✅ Auto-update detection

### 5️⃣ Optimization Configuration
```json
"optimization": {
  "enable_parallel": true,
  "parallel_groups": [
    ["step_2_intent_router", "step_3_rag_retrieve"]
  ],
  "priority": "speed",
  "adaptive_timeout": true,
  "resource_aware": true
}
```

**Benefits:**
- ✅ Foundation for parallel execution
- ✅ Priority-based optimization (speed vs quality)
- ✅ Adaptive timeout based on load
- 🔄 Full implementation in Phase 6.7.3 (Executor)

### 6️⃣ Advanced Step Configuration
```json
{
  "id": "step_2_cache",
  "agent": "cache_lookup",
  "condition": "config.enable_cache == true",
  "on_success": {
    "set_flag": "cache_hit",
    "skip_to": "step_5_format"
  }
}
```

**Benefits:**
- ✅ Conditional execution
- ✅ Dynamic flow control (skip_to)
- ✅ Flag-based decisions

---

## 📋 Future Enhancements (Planned)

### Phase 6.8: Smart Router
- **Decision Nodes** - Dynamic routing based on conditions
- **Intent Classification** - Auto-detect query type
- **Complexity Analysis** - Choose optimal mode

### Phase 6.9: Cache Layer
- **Adaptive TTL** - Context-aware cache expiration
  ```json
  "ttl_strategy": {
    "short_query": 900,
    "info_lookup": 3600,
    "persona_chat": 120
  }
  ```

### Phase 6.10: Persona System
- **Persona Filter** - Lightweight tone application (Flash mode)
- **Persona Brain** - Full persona with memory (Pro mode)
- **Split Architecture** - Balance between speed & depth

### Phase 6.11: Advanced Features
- **Memory Snapshot** - Session checkpoints
- **Parallel Step Groups** - Multi-threaded execution
- **Resource Monitoring** - Real-time VRAM/CPU tracking

---

## 💡 Design Principles

1. **Modular** - Each component is independent
2. **Configurable** - Everything can be tuned via JSON
3. **Extensible** - Easy to add new features
4. **Resource-Aware** - Optimized for local hardware
5. **User-Friendly** - Natural error messages
6. **Fail-Safe** - Graceful degradation on errors

---

**Last Updated:** October 25, 2025 (Phase 6.7.2 Complete)  
**Contributors:** ChimeraAI Team + User Suggestions  
**Status:** ✅ On Track (Enhanced Architecture)

#### Sub-Phase 6.12.1: Dual-Mode Support
**Deliverables:**
- Support both: JSON flows + database workflows
- Router detects workflow type
- Graceful fallback

**Testing:** User tests legacy workflows still work

#### Sub-Phase 6.12.2: Visual Editor → JSON Generator
**Deliverables:**
- Export visual workflow → JSON flow config
- Import JSON flow → visual workflow nodes
- Bidirectional conversion

**Testing:** User tests conversion accuracy

---

## 📐 JSON Flow Config Specification

### Example: Flash Mode Base Flow

**File:** `backend/ai/flows/flash/base.json`

```json
{
  "flow_id": "flash_base_v1",
  "name": "Flash Mode - Base",
  "description": "Quick response with minimal processing",
  "version": "1.0.0",
  "metadata": {
    "author": "ChimeraAI",
    "created_at": "2025-10-25",
    "tags": ["flash", "quick", "cache"]
  },
  "config": {
    "max_execution_time": 5,
    "enable_cache": true,
    "cache_ttl": 3600,
    "fallback_on_error": true
  },
  "steps": [
    {
      "id": "step_1",
      "agent": "preprocessor",
      "config": {
        "max_length": 1000,
        "normalize": true
      },
      "condition": null,
      "timeout": 1
    },
    {
      "id": "step_2",
      "agent": "cache_lookup",
      "config": {
        "cache_type": "response",
        "use_semantic": true
      },
      "condition": "config.enable_cache == true",
      "timeout": 0.5,
      "on_hit": "skip_to:step_5"
    },
    {
      "id": "step_3",
      "agent": "llm_simple",
      "config": {
        "model": "gemma2:2b",
        "temperature": 0.7,
        "max_tokens": 500
      },
      "condition": "cache_miss",
      "timeout": 3
    },
    {
      "id": "step_4",
      "agent": "cache_store",
      "config": {
        "cache_type": "response",
        "ttl": 3600
      },
      "condition": "config.enable_cache == true",
      "timeout": 0.5
    },
    {
      "id": "step_5",
      "agent": "persona_formatter",
      "config": {
        "apply_tone": true,
        "add_greeting": false
      },
      "condition": "persona != null",
      "timeout": 1
    },
    {
      "id": "step_6",
      "agent": "formatter",
      "config": {
        "format": "text",
        "include_metadata": false
      },
      "condition": null,
      "timeout": 0.5
    }
  ],
  "error_handling": {
    "retry_on_timeout": false,
    "fallback_flow": null,
    "log_level": "info"
  }
}
```

### Example: Pro Mode RAG Flow

**File:** `backend/ai/flows/pro/rag_full.json`

```json
{
  "flow_id": "pro_rag_full_v1",
  "name": "Pro Mode - Full RAG",
  "description": "Deep analysis with RAG retrieval and reasoning",
  "version": "1.0.0",
  "config": {
    "max_execution_time": 30,
    "enable_cache": false,
    "enable_reasoning": true
  },
  "steps": [
    {
      "id": "step_1",
      "agent": "preprocessor",
      "config": {
        "max_length": 5000,
        "extract_keywords": true
      }
    },
    {
      "id": "step_2",
      "agent": "router",
      "config": {
        "classify_intent": true,
        "detect_complexity": true
      }
    },
    {
      "id": "step_3",
      "agent": "rag_retriever",
      "config": {
        "sources": ["chimepaedia", "conversations"],
        "top_k": 10,
        "min_relevance": 0.7,
        "rerank": true
      },
      "condition": "router.needs_rag == true"
    },
    {
      "id": "step_4",
      "agent": "llm_reasoning",
      "config": {
        "model": "qwen2.5:7b",
        "temperature": 0.6,
        "max_tokens": 2000,
        "use_context": true,
        "enable_reasoning": true
      }
    },
    {
      "id": "step_5",
      "agent": "persona_brain",
      "config": {
        "apply_full_persona": true,
        "use_relationship": true,
        "use_memory": true
      },
      "condition": "persona != null"
    },
    {
      "id": "step_6",
      "agent": "formatter",
      "config": {
        "format": "detailed",
        "include_sources": true,
        "include_reasoning": true
      }
    }
  ]
}
```

---

## 🧩 Agent Plugin Interface

### BaseAgent Class

**File:** `backend/ai/agents/base.py`

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class BaseAgent(ABC):
    """
    Base interface for all agent plugins
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize agent with configuration
        
        Args:
            config: Agent-specific configuration from flow JSON
        """
        self.config = config or {}
        self.name = self.__class__.__name__
    
    @abstractmethod
    def run(self, context: 'ExecutionContext') -> 'ExecutionContext':
        """
        Execute agent logic and update context
        
        Args:
            context: Current execution context with input data
        
        Returns:
            Updated execution context with agent output
        """
        pass
    
    def should_run(self, context: 'ExecutionContext') -> bool:
        """
        Check if agent should run based on conditions
        
        Args:
            context: Current execution context
        
        Returns:
            True if agent should run, False to skip
        """
        return True
    
    def validate_input(self, context: 'ExecutionContext') -> bool:
        """
        Validate required input fields exist in context
        
        Args:
            context: Current execution context
        
        Returns:
            True if input is valid
        """
        return True
    
    def get_metadata(self) -> Dict[str, Any]:
        """
        Return agent metadata for observability
        
        Returns:
            Metadata dict with agent info
        """
        return {
            "name": self.name,
            "version": "1.0.0",
            "config": self.config
        }
```

### Example Agent Implementation

**File:** `backend/ai/agents/preprocessor.py`

```python
from ai.agents.base import BaseAgent
from ai.flow.context import ExecutionContext

class PreprocessorAgent(BaseAgent):
    """
    Preprocess user input: normalize, truncate, extract metadata
    """
    
    def run(self, context: ExecutionContext) -> ExecutionContext:
        """Preprocess input message"""
        message = context.get("message", "")
        max_length = self.config.get("max_length", 1000)
        normalize = self.config.get("normalize", True)
        
        # Normalize
        if normalize:
            message = message.strip()
        
        # Truncate
        truncated = False
        if len(message) > max_length:
            message = message[:max_length]
            truncated = True
        
        # Extract metadata
        metadata = {
            "original_length": len(context.get("message", "")),
            "processed_length": len(message),
            "truncated": truncated,
            "language": self._detect_language(message)
        }
        
        # Update context
        context.set("message", message)
        context.set("preprocessor_metadata", metadata)
        
        return context
    
    def _detect_language(self, text: str) -> str:
        """Simple language detection"""
        # Implement basic detection or use library
        return "id" if any(c in text for c in ["aku", "kamu", "yang"]) else "en"
```

---

## 🔄 ExecutionContext Class

**File:** `backend/ai/flow/context.py`

```python
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

class ExecutionContext:
    """
    Shared context passed between agents in flow
    """
    
    def __init__(self, initial_data: Optional[Dict[str, Any]] = None):
        """Initialize execution context"""
        self.context_id = f"ctx_{uuid.uuid4().hex[:12]}"
        self.created_at = datetime.now()
        
        # Core data
        self.data: Dict[str, Any] = initial_data or {}
        
        # Execution metadata
        self.metadata = {
            "context_id": self.context_id,
            "created_at": self.created_at.isoformat(),
            "steps_executed": [],
            "errors": [],
            "timing": {}
        }
        
        # Agent outputs
        self.agent_outputs: Dict[str, Any] = {}
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get value from context"""
        return self.data.get(key, default)
    
    def set(self, key: str, value: Any) -> None:
        """Set value in context"""
        self.data[key] = value
    
    def update(self, updates: Dict[str, Any]) -> None:
        """Update multiple values"""
        self.data.update(updates)
    
    def has(self, key: str) -> bool:
        """Check if key exists"""
        return key in self.data
    
    def log_step(self, agent_name: str, timing: float, output: Any = None) -> None:
        """Log agent execution"""
        self.metadata["steps_executed"].append({
            "agent": agent_name,
            "timing": timing,
            "timestamp": datetime.now().isoformat()
        })
        
        if output is not None:
            self.agent_outputs[agent_name] = output
    
    def add_error(self, agent_name: str, error: str) -> None:
        """Log error"""
        self.metadata["errors"].append({
            "agent": agent_name,
            "error": error,
            "timestamp": datetime.now().isoformat()
        })
    
    def to_dict(self) -> Dict[str, Any]:
        """Export context as dictionary"""
        return {
            "context_id": self.context_id,
            "data": self.data,
            "metadata": self.metadata,
            "agent_outputs": self.agent_outputs
        }
```

---

## 📊 Implementation Timeline

| Phase | Duration | Dependencies | Status | Testing By |
|-------|----------|--------------|--------|------------|
| 6.0: Documentation | 1 day | None | ✅ Complete | User review docs |
| 6.7.1: Base Classes | 1 day | 6.0 | ✅ Complete | User review interfaces |
| 6.7.2: Flow Loader | 1 day | 6.7.1 | ✅ Complete | User test loading |
| 6.7.3: Flow Executor | 1 day | 6.7.2 | ✅ Complete | User test execution |
| 6.7.4: Basic Agents | 1 day | 6.7.3 | ✅ Complete | User test end-to-end |
| 6.8.1: Intent Classifier | 1 day | 6.7.4 | 📋 Planned | User test intent |
| 6.8.2: Complexity Analyzer | 1 day | 6.8.1 | 📋 Planned | User test scoring |
| 6.8.3: Mode Selector | 1 day | 6.8.2 | 📋 Planned | User test routing |
| 6.9.1: Retrievers | 1-2 days | 6.7.4 | 📋 Planned | User test retrieval |
| 6.9.2: Cache Manager | 1 day | 6.9.1 | 📋 Planned | User test cache |
| 6.9.3: Vector Cache | 1 day | 6.9.2 | 📋 Planned | User test semantic |
| 6.9.4: Cache Agent | 1 day | 6.9.3 | 📋 Planned | User test Flash+ |
| 6.10.1: Persona Loader | 1 day | 6.7.4 | 📋 Planned | User test personas |
| 6.10.2: Persona Brain | 1 day | 6.10.1 | 📋 Planned | User test styles |
| 6.10.3: Persona Flows | 1 day | 6.10.2 | 📋 Planned | User test flows |
| 6.11.1: Logging | 1 day | All | 📋 Planned | User review logs |
| 6.11.2: Metrics | 1 day | 6.11.1 | 📋 Planned | User review metrics |
| 6.11.3: Analyzer | 1 day | 6.11.2 | 📋 Planned | User review insights |
| 6.12.1: Dual-Mode | 1 day | All | 📋 Planned | User test both |
| 6.12.2: Editor Convert | 1 day | 6.12.1 | 📋 Planned | User test convert |

**Total Estimated:** ~20-25 days (incremental, with user testing each phase)  
**Completed:** 5 days (Phase 6.0 + 6.7.1-6.7.4) ✅  
**Progress:** 25% (5/20 days)

---

## 🎯 Success Criteria

### ✅ Phase 6.7 Complete When:
- [x] FlowExecutor dapat load & execute JSON flow config ✅
- [x] Basic agents (preprocessor, llm, formatter, router, rag, execution, persona, cache) working ✅
- [x] End-to-end test: user input → output dengan Flash & Pro flows ✅
- [x] No hardcoded if-else untuk mode selection ✅
- [x] Persona stays alive dengan LLM formatting ✅
- [x] Integration dengan existing 5-agent system ✅

**Result:** ✅ ALL CRITERIA MET! Phase 6.7 COMPLETE!

### Phase 6.8 Complete When:
- [ ] Router dapat auto-detect intent (question/command/chat)
- [ ] Complexity analyzer score query (simple/complex/reasoning)
- [ ] Mode selector choose optimal flow automatically
- [ ] 85%+ accuracy pada test queries

### Phase 6.9 Complete When:
- [ ] Unified retriever interface working untuk RAG & Chimepedia
- [ ] Cache manager dapat store & retrieve responses
- [ ] Vector cache semantic lookup working
- [ ] Flash+ mode 3x lebih cepat dari Flash biasa

### Phase 6.10 Complete When:
- [ ] Persona dapat diload dari database dengan relationship
- [ ] Persona brain apply style & tone dengan benar
- [ ] Per-persona flows working (Sarah vs Nour berbeda)
- [ ] Mock responses juga persona-aware

### Phase 6.11 Complete When:
- [ ] Structured logging untuk setiap agent execution
- [ ] Metrics dashboard menampilkan timing & success rate
- [ ] Analyzer dapat suggest optimization (e.g., "use cache")

### Phase 6.12 Complete When:
- [ ] Legacy visual workflows masih berfungsi
- [ ] JSON flows & database workflows coexist
- [ ] Visual editor dapat export ke JSON
- [ ] JSON dapat import ke visual editor

---

## 🚀 Next Steps

1. **User Review:** Review dokumentasi ini - apakah sudah lengkap?
2. **Create Detailed Specs:** Buat dokumen detail untuk:
   - Flow JSON schema
   - Agent plugin specs
   - Router logic design
   - Cache strategy
3. **Start Phase 6.7.1:** Implement base classes & interfaces
4. **Incremental Testing:** User test setiap sub-phase sebelum lanjut

---

## 📝 Notes

- **Backward Compatibility:** Legacy workflows (Phase 6.1-6.6) tetap dijaga
- **Testing Responsibility:** User akan test setiap phase karena Ollama di komputer user
- **Documentation-First:** Semua design didokumentasikan sebelum implementasi
- **Incremental Approach:** Small steps, test early, iterate fast

---

**Last Updated:** October 25, 2025  
**Status:** 📋 Waiting for user review & approval  
**Next:** Create detailed JSON schema & agent specs
