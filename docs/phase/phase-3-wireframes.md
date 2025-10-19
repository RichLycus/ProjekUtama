# 🎨 Phase 3 Visual Diagrams & Wireframes

## 1. 🌊 5-Core Agent Pipeline (Detailed Flow)

```
                    ┌────────────────────────┐
                    │    👤 USER INPUT       │
                    │  "Buat Python script"  │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   🧭 AGENT 1: ROUTER   │
                    │                        │
                    │  Intent Analysis:      │
                    │  • Type: CODE          │
                    │  • Priority: HIGH      │
                    │  • Needs Tool: YES     │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │   📚 AGENT 2: RAG      │
                    │                        │
                    │  Retrieve Context:     │
                    │  ✓ Tool Schema (3)     │
                    │  ✓ Golden Rules (#2)   │
                    │  ✓ Past Code (1)       │
                    └─────┬─────────────┬────┘
                          │             │
            ┌─────────────▼──┐    ┌────▼──────────────┐
            │ ⚙️ AGENT 3:     │    │ 🧠 AGENT 4:       │
            │    EXECUTION    │    │    REASONING      │
            │                 │    │                   │
            │ Check Tool Need │    │ Process:          │
            │ Execute: ✓      │    │ • User Input      │
            │ Tool: Formatter │───►│ • RAG Context     │
            │ Result: SUCCESS │    │ • Tool Results    │
            └─────────────────┘    │ • Generate Answer │
                                   └────┬──────────────┘
                                        │
                            ┌───────────▼────────────┐
                            │  🎭 AGENT 5: PERSONA   │
                            │                        │
                            │  Apply Tone:           │
                            │  • Persona: LYCUS      │
                            │  • Style: Technical    │
                            │  • Format: Code blocks │
                            └───────────┬────────────┘
                                        │
                            ┌───────────▼────────────┐
                            │   ✨ FINAL OUTPUT      │
                            │  "Here's your script:  │
                            │   ```python ... ```"   │
                            └────────────────────────┘
```

---

## 2. 💬 Chat UI Wireframe (Desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ChimeraAI                              [Home] [Tools] [Chat*] [Settings] │
├────────────────────┬─────────────────────────────────────────────────────┤
│                    │                                                     │
│  Avatar Panel      │  Chat History Area (glass-strong)                  │
│  ┌──────────────┐  │                                                     │
│  │              │  │  ┌───────────────────────────────────────────┐    │
│  │   [Avatar]   │  │  │ 👤 You (Just now)                         │    │
│  │              │  │  │ Bisakah kamu buat Python script untuk     │    │
│  │  (Thinking)  │  │  │ membaca file CSV dan export ke JSON?      │    │
│  │              │  │  └───────────────────────────────────────────┘    │
│  └──────────────┘  │                                                     │
│                    │  ┌───────────────────────────────────────────┐    │
│  Agent Status:     │  │ 🤖 Lycus - Code Agent (2s ago)            │    │
│  ┌──────────────┐  │  │                                           │    │
│  │ 🟢 RAG       │  │  │ ⚡ Execution Log:                         │    │
│  │ 🔵 EXEC      │  │  │ • Router: Detected CODE intent            │    │
│  │ 🟣 PERSONA   │  │  │ • RAG: Retrieved 2 tool schemas           │    │
│  └──────────────┘  │  │ • Exec: Tool not needed                   │    │
│                    │  │ • Reasoning: Generated solution           │    │
│  Context:          │  │                                           │    │
│  • 3 tools         │  │ Here's a Python script that does exactly  │    │
│  • 2 docs          │  │ what you need:                            │    │
│  • 1 rule          │  │                                           │    │
│                    │  │ ```python                                 │    │
│                    │  │ import csv                                │    │
│                    │  │ import json                               │    │
│                    │  │ ...                                       │    │
│                    │  │ ```                                       │    │
│                    │  └───────────────────────────────────────────┘    │
│                    │                                                     │
├────────────────────┴─────────────────────────────────────────────────────┤
│  Input Area (glass-strong)                                               │
│  ┌────────────────────────────────────────────────────────┬────────────┐│
│  │ 💬 Type your message...                                │ 🎙️  🚀     ││
│  └────────────────────────────────────────────────────────┴────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 📱 Chat UI Wireframe (Mobile)

```
┌────────────────────────────────┐
│  ☰  ChimeraAI        [Settings]│
├────────────────────────────────┤
│  🤖 Lycus - Active             │
│  [Thinking...] 🟢 🔵 🟣       │
├────────────────────────────────┤
│                                │
│  Chat History:                 │
│                                │
│  ┌──────────────────────────┐ │
│  │ 👤 You                   │ │
│  │ Buat Python script       │ │
│  └──────────────────────────┘ │
│                                │
│  ┌──────────────────────────┐ │
│  │ 🤖 Lycus                 │ │
│  │                          │ │
│  │ ⚡ Log:                  │ │
│  │ • RAG: 2 tools           │ │
│  │ • Exec: Not needed       │ │
│  │                          │ │
│  │ Here's your script:      │ │
│  │ ```python               │ │
│  │ import csv              │ │
│  │ ...                     │ │
│  │ ```                     │ │
│  └──────────────────────────┘ │
│                                │
│  [Scroll for more...]          │
│                                │
├────────────────────────────────┤
│  💬 [Type message...] 🚀       │
└────────────────────────────────┘
```

---

## 4. ⚙️ Settings - AI Chat Tab

```
┌──────────────────────────────────────────────────────────────┐
│  Settings  [Tools] [Appearance] [AI Chat*]                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. CORE MODEL SETUP                    .glass-strong   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Ollama Backend URL:                                  │ │
│  │  ┌────────────────────────────────┬─────────────────┐ │ │
│  │  │ http://localhost:11434         │ [Test Connect]  │ │ │
│  │  └────────────────────────────────┴─────────────────┘ │ │
│  │                                                        │ │
│  │  Primary LLM Model:                                   │ │
│  │  ┌─────────────────────────────────────────────────┐  │ │
│  │  │ llama3:8b                                   ▼   │  │ │
│  │  └─────────────────────────────────────────────────┘  │ │
│  │                                                        │ │
│  │  Status: 🟢 Connected  |  Latency: 120ms              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 2. RAG & CONTEXT MANAGEMENT            .glass-strong   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  RAG Status: 🟢 Active (3 sources indexed)            │ │
│  │                                                        │ │
│  │  Vector Database:                                     │ │
│  │  📂 backend/data/vector_db (ChromaDB)                 │ │
│  │                                                        │ │
│  │  Context Size (tokens):                               │ │
│  │  ┌───────────────────────────────────────────────┐   │ │
│  │  │ ────────●─────────  4000                      │   │ │
│  │  └───────────────────────────────────────────────┘   │ │
│  │  [2000]                              [8000]           │ │
│  │                                                        │ │
│  │  Auto-Update Context: [Toggle: ON]                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 3. MULTI-AGENT & PERSONA CONTROL       .glass-strong   │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Default Persona:                                     │ │
│  │  ┌────────────────────────────────────────────┐       │ │
│  │  │ 🟣 Lycus (Technical)                   ▼   │       │ │
│  │  └────────────────────────────────────────────┘       │ │
│  │  Options: Lycus | Polar Nexus | Sarah                 │ │
│  │                                                        │ │
│  │  Tool Execution Agent:  [Toggle: ON]                  │ │
│  │                                                        │ │
│  │  Execution Policy:                                    │ │
│  │  ┌────────────────────────────────────────────┐       │ │
│  │  │ Ask Before Run                         ▼   │       │ │
│  │  └────────────────────────────────────────────┘       │ │
│  │  Options: Auto Execute | Ask Before Run               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 4. ADVANCED (OPTIONAL)                                 │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Temperature: ━━━━━●━━━━  0.7                        │ │
│  │  Top P:       ━━━━━●━━━━  0.9                        │ │
│  │  Max Tokens:  [2048]                                  │ │
│  │                                                        │ │
│  │  [Reset to Defaults]  [Save Configuration]            │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. 🎭 Persona Visual Identity

```
┌──────────────────────────────────────────────────────────────┐
│  LYCUS - Technical Companion                                 │
├──────────────────────────────────────────────────────────────┤
│  Color: 🟣 Purple (#8b5cf6)                                  │
│  Icon:  💻 Code/Terminal                                      │
│  Style: Direct, practical, uses code examples                │
│                                                              │
│  Example Response:                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🟣 Lycus                                               │ │
│  │                                                        │ │
│  │ Here's the solution. Use list comprehension:          │ │
│  │                                                        │ │
│  │ ```python                                             │ │
│  │ result = [x**2 for x in numbers if x > 0]            │ │
│  │ ```                                                   │ │
│  │                                                        │ │
│  │ This filters positive numbers and squares them.       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  POLAR NEXUS - Creative Muse                                 │
├──────────────────────────────────────────────────────────────┤
│  Color: 🔵 Blue (#3b82f6)                                    │
│  Icon:  ✨ Sparkles/Art                                       │
│  Style: Inspiring, metaphorical, encourages exploration      │
│                                                              │
│  Example Response:                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🔵 Polar Nexus                                         │ │
│  │                                                        │ │
│  │ Think of your story as a tapestry. Each character    │ │
│  │ is a thread, weaving through the narrative...        │ │
│  │                                                        │ │
│  │ Here's a concept:                                     │ │
│  │ - Protagonist: A wandering artist                     │ │
│  │ - Setting: Neon-lit cyberpunk city                    │ │
│  │ - Twist: Art becomes reality                          │ │
│  │                                                        │ │
│  │ What emotions do you want to evoke?                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  SARAH - Friendly Helper (BONUS)                             │
├──────────────────────────────────────────────────────────────┤
│  Color: 🩷 Pink (#ec4899)                                    │
│  Icon:  😊 Smile/Heart                                        │
│  Style: Warm, patient, breaks things down                    │
│                                                              │
│  Example Response:                                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🩷 Sarah                                               │ │
│  │                                                        │ │
│  │ I'd be happy to help you with that! Let me break     │ │
│  │ it down step by step:                                 │ │
│  │                                                        │ │
│  │ 1. First, we'll set up the basic structure           │ │
│  │ 2. Then, we'll add the functionality you need        │ │
│  │ 3. Finally, we'll test it together                    │ │
│  │                                                        │ │
│  │ Does that sound good? Let's start with step 1! 😊    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. 📊 Agent Status Indicators

```
Real-Time Agent Activity Panel:

┌─────────────────────────────────┐
│  🧭 Router       [●○○○○] IDLE   │
│  📚 RAG          [●●○○○] ACTIVE │
│  ⚙️ Execution    [○○○○○] READY  │
│  🧠 Reasoning    [●●●●○] BUSY   │
│  🎭 Persona      [●●●●●] DONE   │
└─────────────────────────────────┘

Status Colors:
• IDLE:    Gray   (○○○○○)
• READY:   Blue   (🔵 Ready)
• ACTIVE:  Yellow (🟡 Working)
• BUSY:    Orange (🟠 Processing)
• DONE:    Green  (🟢 Complete)
• ERROR:   Red    (🔴 Failed)
```

---

## 7. 🔄 RAG Context Visualization

```
┌────────────────────────────────────────────┐
│  📚 RAG Context Retrieved                  │
├────────────────────────────────────────────┤
│                                            │
│  Query: "Python file operations"           │
│                                            │
│  ✓ Sources Found: 5                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │
│                                            │
│  1. 📄 Golden Rules #4 (Relevance: 95%)   │
│     "File organization patterns..."        │
│                                            │
│  2. 🛠️ Tool: File Organizer (Relevance: 92%)│
│     Schema: {inputs, outputs, example}     │
│                                            │
│  3. 📝 Past Conversation (Relevance: 78%)  │
│     "User asked about CSV parsing..."      │
│                                            │
│  4. 📘 Docs: Python Best Practices (68%)   │
│     "Use pathlib for cross-platform..."    │
│                                            │
│  5. 🔧 Tool: Text Formatter (Relevance: 52%)│
│     Schema: {text processing methods}      │
│                                            │
│  Context assembled in 342ms                │
└────────────────────────────────────────────┘
```

---

**Made with ❤️ for ChimeraAI**  
**Visual Guide Version**: 1.0  
**Last Updated**: Phase 3 Planning (October 2025)
