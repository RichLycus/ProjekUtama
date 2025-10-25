# Phase 6.8: Smart Router & Context-Aware Mode Selection

**Status:** 📋 Planned (Documentation Complete)  
**Duration:** ~3-4 days  
**Goal:** Intelligent routing dengan context awareness untuk mode selection

---

## 🎯 Vision & Strategic Enhancements

Phase 6.8 membangun **Smart Router** yang tidak hanya menentukan mode (flash/pro/hybrid), tapi juga:
- ✅ Memahami konteks conversation (session continuity)
- ✅ Mendeteksi roleplay mode dan mempertahankan persona
- ✅ Adaptive scoring dengan configurable weights
- ✅ Explainable decisions (why this mode?)
- ✅ Hybrid mode yang truly adaptive
- ✅ Foundation untuk Roleplay Flow khusus

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      USER INPUT                              │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│         LANGUAGE & ROLE DETECTOR (Phase 1)                   │
│  • Detect language: Indonesian / English                     │
│  • Detect if roleplay intent                                 │
│  • Extract session context                                   │
└────────────────────────┬────────────────────────────────────┘
                         ↓
                    ┌────┴────┐
                    │ Roleplay? │
                    └────┬────┘
                 Yes ←──┘  └──→ No
                  ↓              ↓
    ┌──────────────────────┐   ┌──────────────────────────────┐
    │  ROLEPLAY FLOW       │   │  STANDARD ROUTING            │
    │  • Persona active    │   │  • Intent Classifier         │
    │  • Memory session    │   │  • Complexity Analyzer       │
    │  • Emotion state     │   │  • Context Checker           │
    │  • TTS specific      │   │  • Mode Selector             │
    └──────────────────────┘   └──────────┬───────────────────┘
                                          ↓
                         ┌────────────────────────────────────┐
                         │    CONTEXT-AWARE LAYER             │
                         │  • Check active session            │
                         │  • Preserve conversation flow      │
                         │  • Memory continuity               │
                         └────────────┬───────────────────────┘
                                      ↓
                         ┌────────────────────────────────────┐
                         │    WEIGHTED SCORING ENGINE         │
                         │  score = (intent × 0.4)            │
                         │        + (complexity × 0.4)        │
                         │        + (context × 0.2)           │
                         │  weights: router_config.json       │
                         └────────────┬───────────────────────┘
                                      ↓
                         ┌────────────────────────────────────┐
                         │       MODE SELECTOR                │
                         │  • Flash (quick, < 0.3)            │
                         │  • Pro (complex, > 0.6)            │
                         │  • Hybrid (adaptive, 0.3-0.6)      │
                         │  + Explainable reasoning           │
                         └────────────┬───────────────────────┘
                                      ↓
                         ┌────────────────────────────────────┐
                         │    FLOW EXECUTOR                   │
                         │  Execute selected flow             │
                         └────────────────────────────────────┘
```

---

## 📋 Phase Breakdown

### ✅ Phase 6.8.0: Enhanced Documentation (This File)
**Status:** ✅ Complete  
**Duration:** 1 day  
**Deliverables:**
- [x] Complete architecture design
- [x] Strategic enhancements documented
- [x] Config schema defined
- [x] Examples & use cases

---

### Phase 6.8.1: Intent Classifier (Enhanced)

**Goal:** Detect user intent dengan support untuk roleplay detection

**Features:**
1. **Standard Intents:**
   - `question` - User asking questions
   - `command` - User giving commands
   - `generation` - User requesting content creation
   - `analysis` - User requesting analysis
   - `chat` - Casual conversation
   - `greeting` - Opening conversation
   - `farewell` - Closing conversation
   - `help` - Requesting assistance

2. **Special Intents:**
   - `roleplay` - User engaging in roleplay
   - `persona_switch` - User switching persona/character
   - `memory_recall` - User asking about past conversations

3. **Sub-Intent Classification:**
   ```python
   {
       "intent": "question",
       "sub_intent": "explanation",  # explanation, factual, how-to, comparison
       "confidence": 0.85
   }
   ```

4. **Bilingual Support:**
   - Indonesian keyword dictionaries
   - English keyword dictionaries
   - Language-aware pattern matching
   - Mixed language detection

**Implementation:**
```python
class IntentClassifier:
    def __init__(self, config_path: str):
        self.config = load_config(config_path)
        self.keywords = self.config["keywords"]
        self.patterns = self.config["patterns"]
    
    def classify(self, message: str, context: Dict) -> IntentResult:
        """
        Classify intent with confidence scoring.
        
        Returns:
            IntentResult with intent, sub_intent, confidence, indicators
        """
        # Detect language
        language = self._detect_language(message)
        
        # Check for roleplay indicators
        if self._is_roleplay(message, context):
            return IntentResult(
                intent="roleplay",
                sub_intent=self._classify_roleplay_type(message),
                confidence=0.9,
                language=language
            )
        
        # Standard intent classification
        scores = {}
        for intent, rules in self.keywords.items():
            scores[intent] = self._score_intent(message, rules, language)
        
        # Get top intent
        top_intent = max(scores, key=scores.get)
        confidence = scores[top_intent]
        
        return IntentResult(
            intent=top_intent,
            sub_intent=self._classify_sub_intent(message, top_intent),
            confidence=confidence,
            language=language,
            indicators=self._get_indicators(message, top_intent)
        )
```

**Config Example (`router_config.json`):**
```json
{
  "intents": {
    "question": {
      "keywords_id": ["apa", "mengapa", "bagaimana", "kenapa", "gimana"],
      "keywords_en": ["what", "why", "how", "when", "where"],
      "patterns": ["\\?$", "^(apa|what|why|how)", "tolong jelaskan"],
      "weight": 1.0
    },
    "roleplay": {
      "keywords_id": ["roleplay", "peran", "karakter", "akting"],
      "keywords_en": ["roleplay", "character", "act as", "pretend"],
      "patterns": ["\\*.*\\*", "\\[.*\\]", "act as", "you are"],
      "context_indicators": ["active_persona", "emotion_state"],
      "weight": 1.2
    },
    "command": {
      "keywords_id": ["buat", "lakukan", "buatkan", "coba"],
      "keywords_en": ["create", "make", "do", "generate"],
      "patterns": ["^(buat|create|make)", "tolong buat"],
      "weight": 1.0
    }
  }
}
```

**Testing:**
- 30+ test queries untuk setiap intent
- Bilingual test cases
- Edge cases (ambiguous intents)
- Confidence threshold validation

---

### Phase 6.8.2: Complexity Analyzer

**Goal:** Score query complexity dengan multiple factors

**Complexity Factors:**
1. **Query Length**
   - Short (< 10 words): 0.1
   - Medium (10-30 words): 0.5
   - Long (> 30 words): 0.8

2. **Technical Keywords**
   - Count technical/domain terms
   - Weight by specificity
   - Examples: "algorithm", "quantum", "neural network"

3. **Question Structure**
   - Simple yes/no: 0.2
   - Explanation needed: 0.6
   - Multi-part question: 0.8
   - Comparison/analysis: 0.9

4. **Context Requirements**
   - Standalone query: 0.3
   - Requires RAG: 0.7
   - Requires multi-source: 0.9

5. **Reasoning Depth**
   - Factual lookup: 0.2
   - Explanation: 0.5
   - Analysis: 0.7
   - Multi-step reasoning: 0.9

**Implementation:**
```python
class ComplexityAnalyzer:
    def __init__(self, config_path: str):
        self.config = load_config(config_path)
        self.technical_keywords = self.config["technical_keywords"]
        self.thresholds = self.config["complexity"]["thresholds"]
    
    def analyze(self, message: str, intent: str) -> ComplexityResult:
        """
        Analyze query complexity with multiple factors.
        
        Returns:
            ComplexityResult with score, factors, recommendation
        """
        factors = {}
        
        # Factor 1: Length
        factors["length"] = self._score_length(message)
        
        # Factor 2: Technical keywords
        factors["technical"] = self._score_technical(message)
        
        # Factor 3: Question structure
        factors["structure"] = self._score_structure(message, intent)
        
        # Factor 4: Context requirements
        factors["context"] = self._score_context_needs(message)
        
        # Factor 5: Reasoning depth
        factors["reasoning"] = self._score_reasoning(message, intent)
        
        # Weighted sum
        weights = self.config["complexity"]["factor_weights"]
        final_score = sum(
            factors[k] * weights.get(k, 1.0) 
            for k in factors
        ) / len(factors)
        
        # Get recommendation
        recommendation = self._get_mode_recommendation(final_score)
        
        return ComplexityResult(
            score=final_score,
            factors=factors,
            recommendation=recommendation,
            indicators=self._get_indicators(factors)
        )
```

**Config Example:**
```json
{
  "complexity": {
    "factor_weights": {
      "length": 0.15,
      "technical": 0.25,
      "structure": 0.20,
      "context": 0.25,
      "reasoning": 0.15
    },
    "thresholds": {
      "simple": 0.3,
      "medium": 0.6,
      "complex": 0.8
    },
    "mode_mapping": {
      "0.0-0.3": "flash",
      "0.3-0.6": "hybrid",
      "0.6-1.0": "pro"
    },
    "technical_keywords": {
      "programming": ["algorithm", "function", "class", "async"],
      "ml_ai": ["neural", "transformer", "training", "model"],
      "science": ["quantum", "molecular", "hypothesis"]
    }
  }
}
```

---

### Phase 6.8.3: Context-Aware Layer

**Goal:** Preserve session continuity and conversation flow

**Features:**
1. **Session Tracking:**
   - Active conversation tracking
   - Session ID management
   - Conversation history reference

2. **Roleplay Detection:**
   - Check if persona is active
   - Verify emotion state
   - Memory session validation

3. **Context Continuity:**
   - Previous messages context
   - Topic continuity detection
   - Mode consistency check

4. **Context Scoring:**
   ```python
   context_score = 0.0
   
   # Has active session?
   if has_session: context_score += 0.3
   
   # Roleplay active?
   if roleplay_active: context_score += 0.4
   
   # Topic continuity?
   if topic_continues: context_score += 0.3
   ```

**Implementation:**
```python
class ContextChecker:
    def __init__(self, session_manager):
        self.session_manager = session_manager
    
    def check_context(self, message: str, session_id: str) -> ContextResult:
        """
        Check conversation context and session state.
        
        Returns:
            ContextResult with score, session info, recommendations
        """
        session = self.session_manager.get_session(session_id)
        
        if not session:
            return ContextResult(
                has_context=False,
                context_score=0.0,
                recommendation="new_session"
            )
        
        # Check session state
        is_roleplay = session.get("roleplay_active", False)
        has_persona = session.get("persona_id") is not None
        emotion_state = session.get("emotion_state")
        
        # Check topic continuity
        previous_messages = session.get("messages", [])[-3:]
        topic_continues = self._check_topic_continuity(
            message, 
            previous_messages
        )
        
        # Calculate context score
        context_score = 0.0
        if session: context_score += 0.3
        if is_roleplay: context_score += 0.4
        if topic_continues: context_score += 0.3
        
        return ContextResult(
            has_context=True,
            context_score=context_score,
            is_roleplay=is_roleplay,
            has_persona=has_persona,
            emotion_state=emotion_state,
            topic_continues=topic_continues,
            recommendation=self._get_recommendation(is_roleplay, context_score)
        )
```

---

### Phase 6.8.4: Mode Selector (Enhanced)

**Goal:** Combine all signals untuk intelligent mode selection

**Weighted Scoring System:**
```python
final_score = (
    intent_score * weight_intent +
    complexity_score * weight_complexity +
    context_score * weight_context
)

# Default weights (configurable)
weights = {
    "intent": 0.4,
    "complexity": 0.4,
    "context": 0.2
}
```

**Decision Matrix:**

| Intent | Complexity | Context | Mode | Reasoning |
|--------|-----------|---------|------|-----------|
| question | > 0.6 | any | pro | Complex question needs RAG |
| chat | < 0.3 | no | flash | Simple chat, quick response |
| chat | < 0.3 | roleplay | roleplay_flow | Maintain persona |
| command | > 0.5 | any | pro | Complex command needs reasoning |
| question | 0.3-0.6 | any | hybrid | Medium complexity, adaptive |
| * | any | roleplay | roleplay_flow | Preserve roleplay session |

**Hybrid Mode Logic:**
```python
def execute_hybrid_mode(query, context):
    """
    Adaptive hybrid: Start with flash, upgrade to pro if needed.
    """
    # 1. Try flash first (quick response)
    flash_result = execute_flash_flow(query, context)
    confidence = flash_result.get("confidence", 0.0)
    
    # 2. If confidence low, trigger pro
    if confidence < 0.7:
        logger.info("Hybrid: Low confidence, triggering Pro mode")
        pro_result = execute_pro_flow(query, context)
        
        # 3. Merge results
        return merge_results(flash_result, pro_result)
    
    # 4. Flash sufficient
    return flash_result
```

**Implementation:**
```python
class ModeSelector:
    def __init__(self, config_path: str):
        self.config = load_config(config_path)
        self.weights = self.config["routing"]["weights"]
        self.rules = self.config["routing"]["rules"]
    
    def select_mode(
        self, 
        intent_result: IntentResult,
        complexity_result: ComplexityResult,
        context_result: ContextResult
    ) -> ModeSelection:
        """
        Select optimal mode with explainable reasoning.
        
        Returns:
            ModeSelection with mode, flow_id, confidence, explanation
        """
        # Check roleplay override
        if context_result.is_roleplay:
            return ModeSelection(
                mode="roleplay",
                flow_id="roleplay_flow_v1",
                confidence=0.95,
                explanation="Active roleplay session detected, maintaining persona flow"
            )
        
        # Calculate weighted score
        final_score = (
            intent_result.confidence * self.weights["intent"] +
            complexity_result.score * self.weights["complexity"] +
            context_result.context_score * self.weights["context"]
        )
        
        # Apply rules
        for rule in self.rules:
            if self._evaluate_rule(rule, intent_result, complexity_result, context_result):
                mode = rule["then"]["mode"]
                flow_id = rule["then"]["flow_id"]
                
                return ModeSelection(
                    mode=mode,
                    flow_id=flow_id,
                    confidence=final_score,
                    explanation=self._build_explanation(
                        rule, 
                        intent_result, 
                        complexity_result, 
                        context_result
                    )
                )
        
        # Fallback: score-based selection
        return self._select_by_score(final_score, intent_result, complexity_result)
    
    def _build_explanation(self, rule, intent, complexity, context) -> str:
        """Build human-readable explanation for mode selection."""
        parts = []
        
        parts.append(f"Intent: {intent.intent} (conf: {intent.confidence:.2f})")
        parts.append(f"Complexity: {complexity.score:.2f} ({complexity.recommendation})")
        
        if context.has_context:
            parts.append(f"Context: Active session (score: {context.context_score:.2f})")
        
        parts.append(f"Selected: {rule['then']['mode']}")
        parts.append(f"Reason: {rule['explanation']}")
        
        return " | ".join(parts)
```

**Config Example:**
```json
{
  "routing": {
    "weights": {
      "intent": 0.4,
      "complexity": 0.4,
      "context": 0.2
    },
    "rules": [
      {
        "name": "roleplay_override",
        "if": {
          "context.is_roleplay": true
        },
        "then": {
          "mode": "roleplay",
          "flow_id": "roleplay_flow_v1"
        },
        "explanation": "Active roleplay session must be preserved"
      },
      {
        "name": "complex_question",
        "if": {
          "intent.intent": "question",
          "complexity.score": "> 0.6"
        },
        "then": {
          "mode": "pro",
          "flow_id": "pro_rag_full_v1"
        },
        "explanation": "Complex question requires RAG retrieval and reasoning"
      },
      {
        "name": "simple_chat",
        "if": {
          "intent.intent": "chat",
          "complexity.score": "< 0.3",
          "context.is_roleplay": false
        },
        "then": {
          "mode": "flash",
          "flow_id": "flash_base_v1"
        },
        "explanation": "Simple chat can be handled with quick response"
      },
      {
        "name": "medium_adaptive",
        "if": {
          "complexity.score": ">= 0.3 AND <= 0.6"
        },
        "then": {
          "mode": "hybrid",
          "flow_id": "hybrid_adaptive_v1"
        },
        "explanation": "Medium complexity benefits from adaptive hybrid approach"
      }
    ],
    "fallback": {
      "low_confidence": {
        "threshold": 0.5,
        "with_context": "hybrid",
        "without_context": "flash"
      },
      "error": "flash"
    }
  }
}
```

---

## 🎭 Roleplay Flow (Future Phase)

**Status:** 📋 Planned for Phase 6.13  
**Foundation:** Phase 6.8 prepares routing for roleplay

**Characteristics:**
1. **Memory Session:**
   - Persistent conversation history
   - Emotion state tracking
   - Relationship memory

2. **Persona Brain:**
   - Character-specific personality
   - Tone and style enforcement
   - Contextual awareness

3. **TTS Integration:**
   - Character-specific voice models
   - Emotion-aware prosody
   - Voice consistency

4. **Isolation:**
   - Separate flow from standard Q&A
   - No RAG contamination
   - Character-focused retrieval only

**Flow Example:**
```json
{
  "flow_id": "roleplay_sarah_v1",
  "name": "Roleplay - Sarah Character",
  "steps": [
    {"agent": "preprocessor"},
    {"agent": "emotion_detector"},
    {"agent": "memory_retriever", "config": {"character": "sarah"}},
    {"agent": "persona_brain", "config": {"persona": "sarah"}},
    {"agent": "tts_generator", "config": {"voice": "sarah_female_warm"}}
  ]
}
```

---

## 📊 Testing Strategy

### Test Cases by Category:

**1. Simple Queries (Flash):**
```
- "Halo!"
- "Apa kabar?"
- "Thanks"
- "Good morning"
```

**2. Complex Questions (Pro):**
```
- "Jelaskan cara kerja transformer architecture dalam NLP"
- "Bandingkan Python dan JavaScript untuk backend development"
- "Apa implikasi quantum computing terhadap cryptography?"
```

**3. Medium Queries (Hybrid):**
```
- "Bagaimana cara deploy aplikasi ke production?"
- "Apa perbedaan REST dan GraphQL?"
- "Explain asyncio in Python"
```

**4. Commands:**
```
- "Buatkan kode untuk sort array"
- "Generate unit tests"
- "Write a SQL query to get top users"
```

**5. Roleplay:**
```
- "*waves excitedly* Hi Sarah!"
- "How are you feeling today?" (with active persona)
- "[As detective] What's your theory?"
```

**6. Bilingual:**
```
- "What is machine learning?" (English)
- "Apa itu machine learning?" (Indonesian)
- "Explain AI in Indonesian"
```

### Success Metrics:

- **Accuracy:** > 85% correct mode selection
- **Consistency:** Same query → same mode (unless context changes)
- **Explainability:** Every decision has clear reasoning
- **Performance:** Routing < 50ms overhead
- **Adaptability:** Hybrid correctly upgrades when needed

---

## 📁 File Structure

```
backend/ai/router/
├── __init__.py
├── intent_classifier.py      # Intent detection & classification
├── complexity_analyzer.py    # Query complexity scoring
├── context_checker.py        # Session & context management
├── mode_selector.py          # Mode selection with weighted scoring
└── router_config.json        # Configurable rules & weights

backend/ai/agents/
└── smart_router.py           # Agent wrapper for router system

backend/tests/
├── test_intent_classifier.py
├── test_complexity_analyzer.py
├── test_context_checker.py
├── test_mode_selector.py
└── demo_smart_router.py      # Interactive demo

backend/config/
└── router_config.json        # Production config
```

---

## 🎯 Success Criteria

Phase 6.8 complete when:
- [x] Intent classifier detects 8+ intents (including roleplay)
- [x] Complexity analyzer scores with 5+ factors
- [x] Context-aware layer preserves session continuity
- [x] Mode selector uses configurable weighted scoring
- [x] Hybrid mode truly adaptive (flash → pro upgrade)
- [x] Explainable logging for every decision
- [x] 85%+ accuracy on test queries
- [x] < 50ms routing overhead
- [x] Roleplay detection working
- [x] Bilingual support (ID/EN)
- [x] Config-driven rules (no hardcoded logic)

---

## 🔮 Next Steps After 6.8

1. **Phase 6.9:** Retriever Unification & Cache Layer
2. **Phase 6.10:** Persona Modular System
3. **Phase 6.13:** Roleplay Flow Implementation (NEW)

---

## 💡 Key Design Principles

1. **Configurable First** - All rules in JSON, no hardcoded logic
2. **Explainable AI** - Every decision has clear reasoning
3. **Context-Aware** - Preserve session and conversation flow
4. **Adaptive** - Hybrid mode intelligently upgrades
5. **Extensible** - Easy to add new intents, factors, modes
6. **Performant** - Minimal overhead (< 50ms)
7. **Bilingual** - Indonesian and English support
8. **Roleplay-Ready** - Foundation for immersive character interactions

---

**Created:** January 25, 2025  
**Status:** 📋 Ready for Implementation  
**Next:** Begin Phase 6.8.1 - Intent Classifier
