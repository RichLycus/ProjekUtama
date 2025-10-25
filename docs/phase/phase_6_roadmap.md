# Phase 6 Roadmap: Dynamic Modular Pipeline Orchestration

**Created:** October 25, 2025  
**Status:** 📋 Planning & Documentation  
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
│   │       └── lycus.json             # Lycus persona flow
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

### ✅ Phase 6.7: Core Flow Orchestration System (IN PROGRESS)
**Status:** 🔄 In Progress  
**Duration:** ~3-5 days  
**Goal:** Build foundation - FlowExecutor & plugin system

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

#### 📋 Sub-Phase 6.7.2: Flow Loader & Parser (NEXT)
**Deliverables:**
- `ai/flow/context.py` - ExecutionContext class
- `ai/agents/base.py` - BaseAgent interface
- `ai/retrievers/base.py` - RetrieverInterface
- Unit tests for interfaces

**Testing:** User verifies interface design

#### Sub-Phase 6.7.2: Flow Loader & Parser
**Deliverables:**
- `ai/flow/loader.py` - Load & validate JSON configs
- `ai/flows/flash/base.json` - First working flow config
- JSON schema validation
- Unit tests for loader

**Testing:** User tests loading flow configs

#### Sub-Phase 6.7.3: Flow Executor
**Deliverables:**
- `ai/flow/executor.py` - FlowExecutor class
- Step execution logic
- Context passing between agents
- Error handling & rollback

**Testing:** User tests simple flow execution

#### Sub-Phase 6.7.4: Basic Agents Implementation
**Deliverables:**
- `ai/agents/preprocessor.py` - Input preprocessing
- `ai/agents/llm_agent.py` - Basic LLM generation
- `ai/agents/formatter_agent.py` - Output formatting

**Testing:** User tests end-to-end flow (preprocessor → llm → formatter)

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

**Testing:** User tests different personas (Lycus, Sarah, etc.)

#### Sub-Phase 6.10.3: Persona Flow Configs
**Deliverables:**
- `ai/flows/persona/sarah.json` - Sarah flow
- `ai/flows/persona/lycus.json` - Lycus flow
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

| Phase | Duration | Dependencies | Testing By |
|-------|----------|--------------|------------|
| 6.0: Documentation | 1 day | None | User review docs |
| 6.7.1: Base Classes | 1 day | 6.0 | User review interfaces |
| 6.7.2: Flow Loader | 1 day | 6.7.1 | User test loading |
| 6.7.3: Flow Executor | 1-2 days | 6.7.2 | User test execution |
| 6.7.4: Basic Agents | 1-2 days | 6.7.3 | User test end-to-end |
| 6.8.1: Intent Classifier | 1 day | 6.7.4 | User test intent |
| 6.8.2: Complexity Analyzer | 1 day | 6.8.1 | User test scoring |
| 6.8.3: Mode Selector | 1 day | 6.8.2 | User test routing |
| 6.9.1: Retrievers | 1-2 days | 6.7.4 | User test retrieval |
| 6.9.2: Cache Manager | 1 day | 6.9.1 | User test cache |
| 6.9.3: Vector Cache | 1 day | 6.9.2 | User test semantic |
| 6.9.4: Cache Agent | 1 day | 6.9.3 | User test Flash+ |
| 6.10.1: Persona Loader | 1 day | 6.7.4 | User test personas |
| 6.10.2: Persona Brain | 1 day | 6.10.1 | User test styles |
| 6.10.3: Persona Flows | 1 day | 6.10.2 | User test flows |
| 6.11.1: Logging | 1 day | All | User review logs |
| 6.11.2: Metrics | 1 day | 6.11.1 | User review metrics |
| 6.11.3: Analyzer | 1 day | 6.11.2 | User review insights |
| 6.12.1: Dual-Mode | 1 day | All | User test both |
| 6.12.2: Editor Convert | 1 day | 6.12.1 | User test convert |

**Total Estimated:** ~20-25 days (incremental, with user testing each phase)

---

## 🎯 Success Criteria

### Phase 6.7 Complete When:
- [ ] FlowExecutor dapat load & execute JSON flow config
- [ ] Basic agents (preprocessor, llm, formatter) working
- [ ] End-to-end test: user input → output dengan Flash base flow
- [ ] No hardcoded if-else untuk mode selection

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
- [ ] Per-persona flows working (Sarah vs Lycus berbeda)
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
