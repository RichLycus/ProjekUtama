# 🗨️ Chat Flow Wireframe Logger

**Status:** ✅ IMPLEMENTED  
**Created:** October 21, 2025  
**Version:** 1.0.0

---

## 📋 Overview

Chat Flow Wireframe Logger adalah sistem logging visual yang modern dan professional untuk memantau perjalanan setiap chat message melalui pipeline AI ChimeraAI. Logger ini memberikan visualisasi ASCII art wireframe yang indah dan informatif untuk debugging dan monitoring.

---

## ✨ Features

### 🎨 **Visual Excellence**
- Modern ASCII wireframe dengan box drawing characters
- ANSI color coding (green/yellow/red untuk status)
- Progress bars untuk setiap agent step
- Emoji icons untuk visual appeal
- Tree structure untuk nested information

### 📊 **Comprehensive Metrics**
- **Timing tracking**: Duration untuk setiap agent
- **Token usage**: Input, output, dan total tokens
- **Performance dashboard**: Time breakdown dengan visualisasi bar chart
- **Quality metrics**: Confidence scores, quality scores
- **System health**: Status semua agents

### 🔍 **Detailed Step Logging**

#### 1. **Router Agent**
- Intent classification
- Confidence percentage
- Keywords extraction
- Model configuration
- Validation results

#### 2. **RAG Agent**
- Documents found vs relevant
- Context length
- Vector database info
- Search strategy

#### 3. **Specialized Agents** (Code, Chat, Analysis, Creative, Tool)
- Model name dan parameters
- Tokens generated
- Response length
- Quality scores
- Processing metrics

#### 4. **Persona Agent**
- Persona name dan traits
- Personality bars (visual representation)
- Formatting metrics
- Style accuracy

#### 5. **Performance Dashboard**
- Total duration
- Time breakdown per agent (with visualization)
- Slowest step highlighting (⚠️)
- Token usage statistics
- System health status

---

## 📁 File Structure

```
backend/
├── utils/
│   └── chat_flow_logger.py          # Main logger implementation
├── ai/
│   └── multi_model_orchestrator.py  # Integration point
└── test_chat_flow_logger.py         # Test script

logs/
└── chat_flow.log                    # Output log file
```

---

## 🚀 Usage

### **Automatic Integration**

Logger sudah terintegrasi secara otomatis di `MultiModelOrchestrator`. Tidak perlu konfigurasi tambahan!

```python
# Logger automatically initialized in multi_model_orchestrator.py
# Every chat message will be logged with beautiful wireframe
```

### **Manual Usage** (for testing or custom implementations)

```python
from utils.chat_flow_logger import get_chat_flow_logger

# Initialize logger
logger = get_chat_flow_logger(colored=True)

# Start message logging
logger.start_message(
    message_id="msg-12345",
    user_input="Your question here",
    persona={'ai_name': 'Lycus', 'name': 'Lycus'}
)

# Log router step
logger.log_router(
    intent="code_generation",
    confidence=96.5,
    keywords=["python", "code"],
    model_info={
        'model_name': 'phi3:mini',
        'temperature': 0.3,
        'max_tokens': 500
    },
    duration=0.3
)

# Log RAG step
logger.log_rag(
    docs_found=5,
    relevant_docs=3,
    context_length=1234,
    duration=0.2
)

# Log specialized agent
logger.log_specialized_agent(
    agent_name="Code Agent",
    agent_type="code",
    model_info={...},
    metrics={...},
    duration=1.2,
    step_num=3
)

# Log persona
logger.log_persona(
    persona_name="Lycus",
    traits={...},
    model_info={...},
    duration=0.4
)

# Finish and show dashboard
logger.finish_message(
    response_length=2456,
    success=True
)
```

---

## 🧪 Testing

Run the test script to see the wireframe in action:

```bash
cd /app/backend
python3 test_chat_flow_logger.py
```

Output akan ditampilkan di terminal (dengan warna) dan disimpan ke `/app/logs/chat_flow.log` (tanpa warna).

---

## 📊 Log Output Location

Logs disimpan di:
```
/app/logs/chat_flow.log
```

File log di-reset setiap kali `start_chimera.sh` dijalankan untuk output yang clean.

---

## 🎯 Visual Example

```
╔═══════════════════════════════════════════════════════════════════════════════════╗
║                                                                                   ║
║  🚀 CHIMERA AI - CHAT PROCESSING PIPELINE                                         ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ║
║  📋 Message ID: msg-a1b2c3d4                                                      ║
║  ⏰ Timestamp: 2025-01-15 10:30:45.123                                           ║
║  👤 Persona: Lycus (Technical Assistant)                                         ║
║                                                                                   ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  📥 USER INPUT                                                                    ║
║  ┌─────────────────────────────────────────────────────────────────────────────┐ ║
║  │ "Your question here..."                                                      │ ║
║  └─────────────────────────────────────────────────────────────────────────────┘ ║
║                                                                                   ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  [1/5] 🧭 ROUTER AGENT                                            ✅ 0.3s       ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 100%                  ║
║  ├─ Intent: CODE_GENERATION                                                      ║
║  ├─ Confidence: 96.5%                                                            ║
║  └─ Model: phi3:mini                                                             ║
║                                                                                   ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                                                                                   ║
║  📈 PERFORMANCE DASHBOARD                                                         ║
║  ⏱️  Total Duration: 2.9 seconds                                                 ║
║                                                                                   ║
║  Time Breakdown:                                                                  ║
║    Router       ████░░░░░░░░░░░░░░░  10.3%  (0.3s)                              ║
║    RAG          ███░░░░░░░░░░░░░░░░   6.9%  (0.2s)                              ║
║    Execution    ████████████████░░░  41.4%  (1.2s) ⚠️ SLOWEST                   ║
║    Reasoning    ███████████░░░░░░░░  27.6%  (0.8s)                              ║
║    Persona      █████░░░░░░░░░░░░░░  13.8%  (0.4s)                              ║
║                                                                                   ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
```

---

## 🎨 Color Coding

- 🟢 **Green**: Success, active, high confidence
- 🟡 **Yellow**: Warning, medium values, in progress
- 🔴 **Red**: Error, low values, failed
- 🔵 **Blue**: Headers, agent names
- 🟣 **Magenta**: Persona-related info
- 🔵 **Cyan**: System info, borders
- ⚪ **White**: Data values, metrics
- ⚫ **Gray**: Labels, secondary info

---

## 🔧 Configuration

### **Enable/Disable Colors**

```python
# With colors (default)
logger = get_chat_flow_logger(colored=True)

# Without colors (for plain text logs)
logger = get_chat_flow_logger(colored=False)
```

### **Custom Log Directory**

```python
logger = get_chat_flow_logger(log_dir="custom/path/logs")
```

---

## 📝 Log Files

### **4 Log Files Available**

1. **launcher.log** - Startup dan initialization logs
2. **backend.log** - FastAPI server logs
3. **frontend.log** - React + Vite logs
4. **chat_flow.log** - Chat pipeline wireframe logs ⭐ **NEW!**

Semua log files dapat diakses di:
```
/app/logs/
```

View logs di terminal:
```bash
# View chat flow logs
tail -f /app/logs/chat_flow.log

# View last 50 lines
tail -50 /app/logs/chat_flow.log

# View all logs
cat /app/logs/chat_flow.log
```

---

## 🐛 Debugging Tips

### **Identify Bottlenecks**

Logger menampilkan ⚠️ **SLOWEST** marker pada agent yang paling lambat. Gunakan ini untuk:
- Identifikasi performance issues
- Optimize specific agents
- Understand processing flow

### **Check Agent Health**

Dashboard menampilkan:
- ✅ **OPERATIONAL** - All systems working
- ⚠️ **WARNING** - Some issues detected
- ❌ **ERROR** - System failure

### **Token Usage Monitoring**

Track token consumption untuk:
- Cost estimation
- Performance optimization
- Model comparison

---

## 🌟 Benefits

### **For Developers**
- Easy debugging dengan visual feedback
- Quick identification of issues
- Performance monitoring
- Understanding message flow

### **For Operations**
- Production monitoring
- Performance analysis
- System health checks
- Audit trails

### **For Users**
- Transparency in AI processing
- Understanding response time
- Quality metrics visibility

---

## 🔮 Future Enhancements

Planned improvements:
- [ ] JSON export format
- [ ] Web dashboard integration
- [ ] Real-time streaming to frontend
- [ ] Historical analytics
- [ ] Custom themes
- [ ] Compressed summary mode
- [ ] Error pattern detection
- [ ] Auto-alerts for issues

---

## 📚 Related Documentation

- **Golden Rules**: `/app/docs/golden-rules.md`
- **Multi-Model Orchestrator**: `/app/backend/ai/multi_model_orchestrator.py`
- **Phase 4 Complete**: `/app/docs/PHASE_4_0_COMPLETE.md`

---

## 🤝 Contributing

Untuk menambahkan logging ke agent baru:

1. Import logger:
   ```python
   from utils.chat_flow_logger import get_chat_flow_logger
   ```

2. Initialize di orchestrator:
   ```python
   flow_logger = get_chat_flow_logger()
   ```

3. Start message logging:
   ```python
   flow_logger.start_message(message_id, user_input, persona)
   ```

4. Log setiap step dengan method yang sesuai

5. Finish dengan dashboard:
   ```python
   flow_logger.finish_message(response_length, success=True)
   ```

---

## 💡 Tips & Tricks

### **Quick Commands**

```bash
# Monitor chat flow in real-time
tail -f /app/logs/chat_flow.log

# Search for errors
grep "ERROR" /app/logs/chat_flow.log

# Find slow responses (>3s)
grep "Total Duration: [3-9]" /app/logs/chat_flow.log

# Count total messages processed
grep "PIPELINE STATUS: SUCCESS" /app/logs/chat_flow.log | wc -l
```

### **Performance Analysis**

Look for patterns:
- Consistently slow agents → Need optimization
- High token usage → Consider smaller models
- Low confidence → Improve prompt engineering
- RAG misses → Enhance vector database

---

## 📞 Support

For issues or questions:
- Check logs first: `/app/logs/chat_flow.log`
- Review test script: `/app/backend/test_chat_flow_logger.py`
- See implementation: `/app/backend/utils/chat_flow_logger.py`

---

**Version:** 1.0.0  
**Last Updated:** October 21, 2025  
**Status:** ✅ Production Ready

---

_Made with ❤️ by ChimeraAI Team_
