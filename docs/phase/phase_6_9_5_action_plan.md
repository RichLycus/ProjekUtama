# Phase 6.9.5: RAG Studio Integration - Action Plan

**Created:** January 26, 2025  
**Priority:** 🔥 HIGH - Testing Ground for New System  
**Goal:** Fix RAG Studio execution dengan new flow system sebelum integrate ke chat

---

## 🎯 Why RAG Studio First?

### Current Situation:
```
✅ Visual Workflow Editor: WORKING (Phase 6.1-6.6 complete)
✅ Backend Foundation: WORKING (Phase 6.7-6.9.2 complete)
   - FlowExecutor ✅
   - Agents (8 real agents) ✅
   - Retrievers (RAG + Chimepedia) ✅
   - Cache Manager ✅
   - 35/35 tests passing ✅

❌ RAG Studio Execution: BROKEN (uses old workflow_engine.py)
❌ Test Panel: NOT CONNECTED to new system
```

### Strategy:
```
Step 1: Fix RAG Studio (Isolated Testing Ground)
    ↓
    Test thoroughly di RAG Studio test panel
    ↓
    Debug & stabilize all issues
    ↓
Step 2: Once Stable → Integrate to Chat Tabs
    ↓
    Production Ready!
```

### Why This Approach:
1. ✅ **Isolated Testing** - Fix bugs tanpa affect main chat
2. ✅ **Visual Editor Ready** - Drag & drop already working
3. ✅ **Test Panel Built-in** - Perfect testing environment
4. ✅ **Safe Deployment** - Once RAG Studio stable → chat safe
5. ✅ **User Experience** - User (kamu) bisa test thoroughly di RAG Studio

---

## 📋 Phase 6.9.5.1: Connect RAG Studio to New System

### Goal:
Replace old `workflow_engine.py` execution dengan new `FlowExecutor`

### Current RAG Studio Architecture:

**Frontend:**
```
RAG Studio UI
├── Visual Workflow Editor ✅ (working)
├── Test Panel ✅ (UI exists)
└── Execution Flow ❌ (broken - uses old engine)
```

**Backend:**
```
/api/rag-studio/test
    ↓
workflow_engine.py ❌ (OLD - hardcoded, broken)
    ↓
5-agent system (legacy)
```

### Target Architecture:

**Backend:**
```
/api/rag-studio/test
    ↓
NEW: flow_executor.py ✅ (modular, tested)
    ↓
Load JSON flow config (flash/pro)
    ↓
Execute steps via AgentRegistry
    ↓
Return results to Test Panel
```

---

## 🛠️ Implementation Plan

### Step 1: Update Backend Endpoint (30 min)

**File:** `/app/backend/routes/rag_studio.py`

**Current Test Endpoint:**
```python
@router.post("/test")
async def test_workflow(request: TestRequest):
    # ❌ OLD: Uses workflow_engine.py
    result = workflow_engine.execute_workflow(...)
    return result
```

**New Test Endpoint:**
```python
from ai.flow.executor import FlowExecutor
from ai.flow.loader import FlowLoader
from ai.flow.registry import AgentRegistry
from ai.agents.register_agents import register_all_agents

@router.post("/test")
async def test_workflow(request: TestRequest):
    """
    Test workflow execution with new FlowExecutor
    
    Request:
    {
        "workflow_id": "uuid",
        "test_input": "user query",
        "mode": "flash" or "pro"  # manual selection
    }
    """
    try:
        # 1. Load workflow from database
        workflow = db.get_workflow(request.workflow_id)
        if not workflow:
            raise HTTPException(404, "Workflow not found")
        
        # 2. Determine flow config based on mode
        flow_path = f"ai/flows/{request.mode}/base.json"
        
        # 3. Load flow config
        loader = FlowLoader()
        flow_config = loader.load_flow(flow_path)
        
        # 4. Setup agent registry
        registry = AgentRegistry()
        register_all_agents(registry)
        
        # 5. Create execution context
        from ai.flow.context import ExecutionContext
        context = ExecutionContext({
            "message": request.test_input,
            "workflow_id": request.workflow_id,
            "mode": request.mode
        })
        
        # 6. Execute flow
        executor = FlowExecutor(flow_config, registry)
        result = executor.execute(context)
        
        # 7. Format response for Test Panel
        return {
            "success": True,
            "workflow_id": request.workflow_id,
            "mode": request.mode,
            "execution_path": result.metadata["steps_executed"],
            "node_outputs": result.agent_outputs,
            "final_output": result.get("response", ""),
            "processing_time": sum([step["timing"] for step in result.metadata["steps_executed"]]),
            "status": "success" if not result.metadata["errors"] else "error",
            "error_message": result.metadata["errors"][0] if result.metadata["errors"] else None
        }
        
    except Exception as e:
        logger.error(f"Test execution failed: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "status": "error"
        }
```

---

### Step 2: Update Frontend Test Panel (30 min)

**File:** `/app/frontend/src/components/rag-studio/TestPanel.tsx`

**Add Mode Selection:**
```typescript
const [selectedMode, setSelectedMode] = useState<'flash' | 'pro'>('flash');

// In UI:
<div className="mb-4">
  <label className="block text-sm font-medium mb-2">Mode</label>
  <div className="flex gap-2">
    <button
      onClick={() => setSelectedMode('flash')}
      className={`px-4 py-2 rounded ${
        selectedMode === 'flash' 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200'
      }`}
    >
      ⚡ Flash
    </button>
    <button
      onClick={() => setSelectedMode('pro')}
      className={`px-4 py-2 rounded ${
        selectedMode === 'pro' 
          ? 'bg-purple-500 text-white' 
          : 'bg-gray-200'
      }`}
    >
      🚀 Pro
    </button>
  </div>
</div>
```

**Update Test Request:**
```typescript
const handleTest = async () => {
  setLoading(true);
  setError(null);
  
  try {
    const response = await fetch('/api/rag-studio/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workflow_id: currentWorkflow.id,
        test_input: testInput,
        mode: selectedMode  // ← Send mode selection
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setTestResults(result);
      toast.success(`Test completed (${result.mode} mode)`);
    } else {
      setError(result.error);
      toast.error('Test failed');
    }
  } catch (e) {
    setError(e.message);
    toast.error('Test execution error');
  } finally {
    setLoading(false);
  }
};
```

---

### Step 3: Update ExecutionFlow Display (15 min)

**File:** `/app/frontend/src/components/rag-studio/ExecutionFlow.tsx`

**Display Mode Badge:**
```typescript
<div className="mb-4 flex items-center gap-2">
  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
    result.mode === 'flash' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800'
  }`}>
    {result.mode === 'flash' ? '⚡ Flash Mode' : '🚀 Pro Mode'}
  </span>
  <span className="text-sm text-gray-600">
    {result.processing_time.toFixed(2)}s
  </span>
</div>
```

**Show Step-by-Step Execution:**
```typescript
{result.execution_path.map((step, idx) => (
  <div key={idx} className="flex items-center gap-2 p-2 border-l-2 border-blue-500">
    <span className="text-sm font-mono">{idx + 1}.</span>
    <span className="font-medium">{step.agent}</span>
    <span className="text-gray-600 text-sm">{step.timing.toFixed(3)}s</span>
  </div>
))}
```

---

## 📊 Testing Checklist

### Flash Mode Tests:
```
Test Input: "Halo, apa kabar?"
Expected Flow:
1. preprocessor (normalize input)
2. llm_agent (generate response)
3. persona (format dengan tone)

Expected Time: <2s
Expected Result: Friendly greeting response
```

### Pro Mode Tests:
```
Test Input: "Jelaskan tentang RAG system"
Expected Flow:
1. preprocessor (extract keywords)
2. router (classify intent)
3. rag (retrieve context)
4. execution (optional tool use)
5. llm_agent (generate with context)
6. persona (format output)

Expected Time: 3-5s
Expected Result: Detailed explanation dengan sources
```

### Error Handling Tests:
```
1. Empty input → Graceful error
2. Invalid workflow_id → 404 error
3. Ollama offline → Fallback to mock
4. Agent timeout → Retry logic
```

---

## 🐛 Expected Issues & Solutions

### Issue 1: Agent Registry Not Found
**Symptom:** "Agent 'preprocessor' not registered"

**Solution:**
```python
# In test endpoint, before execute:
from ai.agents.register_agents import register_all_agents

registry = AgentRegistry()
register_all_agents(registry)  # ← Register all agents first
```

### Issue 2: Flow Config Not Found
**Symptom:** "Flow file not found: ai/flows/flash/base.json"

**Solution:**
```python
# Use absolute path
from pathlib import Path
BASE_DIR = Path(__file__).parent.parent

flow_path = BASE_DIR / "ai" / "flows" / request.mode / "base.json"
```

### Issue 3: Context Missing Required Fields
**Symptom:** "KeyError: 'message'"

**Solution:**
```python
# Ensure context has all required fields
context = ExecutionContext({
    "message": request.test_input or "",
    "workflow_id": request.workflow_id,
    "mode": request.mode,
    "persona": None  # Optional
})
```

### Issue 4: Ollama Not Available
**Symptom:** LLM agent fails

**Solution:**
```python
# In LLMAgent, fallback to mock:
if not self.ollama.test_connection():
    logger.warning("Ollama not available, using mock")
    return self._mock_response(context)
```

---

## 🎯 Success Criteria

### Phase 6.9.5.1 Complete When:
- [ ] ✅ Backend `/api/rag-studio/test` using new FlowExecutor
- [ ] ✅ Frontend Test Panel has mode selection (Flash/Pro)
- [ ] ✅ Flash mode executes successfully (3 steps)
- [ ] ✅ Pro mode executes successfully (6 steps)
- [ ] ✅ Results display in ExecutionFlow component
- [ ] ✅ Error handling working correctly
- [ ] ✅ Manual testing passed (user validates)

---

## 📝 Phase 6.9.5.2: Debug & Stabilize

Once basic integration working, we'll:

1. **Performance Testing**
   - Measure execution times
   - Compare Flash vs Pro performance
   - Optimize slow agents

2. **Bug Fixing**
   - Fix any crashes or errors
   - Improve error messages
   - Handle edge cases

3. **UI Polish**
   - Better loading states
   - Clearer execution visualization
   - Real-time progress updates

4. **Validation**
   - User tests multiple scenarios
   - Confirm stability
   - Ready for chat integration

---

## 🚀 Next Steps After RAG Studio

Once RAG Studio stable:

### Phase 6.10: Chat Tabs Integration
```
Connect chat_routes.py to FlowExecutor
    ↓
Manual mode selection (Flash/Pro toggle in chat UI)
    ↓
Display execution results in chat
    ↓
Production deployment!
```

---

## 📄 Files to Modify

### Backend:
- `/app/backend/routes/rag_studio.py` - Test endpoint
- `/app/backend/ai/agents/register_agents.py` - Agent registration helper

### Frontend:
- `/app/frontend/src/components/rag-studio/TestPanel.tsx` - Mode selection
- `/app/frontend/src/components/rag-studio/ExecutionFlow.tsx` - Results display

### No New Files Needed:
- ✅ FlowExecutor already exists
- ✅ AgentRegistry already exists
- ✅ Flow configs (flash/pro) already exist
- ✅ All agents already implemented

**Just connect the pieces!** 🧩

---

**Status:** 📋 Ready to Implement  
**Estimated Time:** 1-2 hours for basic integration  
**Priority:** 🔥 HIGH - Critical testing ground before chat integration

