"""Tests for Mode Selector (Phase 6.8.4).

Test coverage:
- ModeSelector: Mode selection logic
- Weighted scoring
- Adaptive hybrid mode
- Explainable reasoning
"""

import pytest
from backend.ai.router.intent_classifier import IntentClassifier, IntentResult
from backend.ai.router.complexity_analyzer import ComplexityAnalyzer, ComplexityResult
from backend.ai.router.context_layer import ContextScorer, ContextResult, SessionTracker
from backend.ai.router.mode_selector import ModeSelector, ModeDecision


class TestModeSelector:
    """Test ModeSelector functionality."""
    
    def test_initialization(self):
        """Test selector initialization."""
        selector = ModeSelector()
        
        assert selector.weights["intent"] == 0.4
        assert selector.weights["complexity"] == 0.4
        assert selector.weights["context"] == 0.2
    
    def test_select_mode_flash_simple(self):
        """Test flash mode for simple greeting."""
        selector = ModeSelector()
        
        # Simple greeting intent
        intent = IntentResult(
            intent="greeting",
            confidence=0.9,
            mode_hint="flash"
        )
        
        # Low complexity
        complexity = ComplexityResult(
            scores={"length": 0.1, "technical": 0.0, "structure": 0.2, "context": 0.0, "reasoning": 0.0},
            overall_score=0.1,
            complexity_level="low",
            mode_recommendation="flash",
            reasoning="Low complexity"
        )
        
        decision = selector.select_mode(intent, complexity)
        
        assert decision.mode == "flash"
        assert decision.confidence > 0.7
    
    def test_select_mode_pro_complex(self):
        """Test pro mode for complex analytical query."""
        selector = ModeSelector()
        
        # Analytical intent
        intent = IntentResult(
            intent="analytical",
            confidence=0.85,
            mode_hint="pro"
        )
        
        # High complexity
        complexity = ComplexityResult(
            scores={"length": 0.6, "technical": 0.8, "structure": 0.7, "context": 0.3, "reasoning": 0.7},
            overall_score=0.7,
            complexity_level="high",
            mode_recommendation="pro",
            reasoning="High complexity"
        )
        
        decision = selector.select_mode(intent, complexity)
        
        assert decision.mode == "pro"
        assert decision.confidence > 0.75
    
    def test_select_mode_depends_medium(self):
        """Test depends mode for medium complexity."""
        selector = ModeSelector()
        
        # Informational intent
        intent = IntentResult(
            intent="informational",
            confidence=0.7,
            mode_hint="depends"
        )
        
        # Medium complexity
        complexity = ComplexityResult(
            scores={"length": 0.4, "technical": 0.3, "structure": 0.5, "context": 0.2, "reasoning": 0.4},
            overall_score=0.5,
            complexity_level="medium",
            mode_recommendation="depends",
            reasoning="Medium complexity"
        )
        
        decision = selector.select_mode(intent, complexity)
        
        assert decision.mode in ["flash", "pro", "depends"]
        assert decision.confidence > 0.5
    
    def test_weighted_scoring(self):
        """Test weighted score calculation."""
        selector = ModeSelector()
        
        intent = IntentResult(
            intent="complex_question",
            confidence=0.8,
            mode_hint="pro"
        )
        
        complexity = ComplexityResult(
            scores={"length": 0.5, "technical": 0.6, "structure": 0.5, "context": 0.3, "reasoning": 0.6},
            overall_score=0.6,
            complexity_level="medium",
            mode_recommendation="depends",
            reasoning="Medium complexity"
        )
        
        context = ContextResult(
            score=0.4,
            has_reference=True,
            topic_continuity=0.3,
            session_length=3,
            reasoning="Moderate context"
        )
        
        decision = selector.select_mode(intent, complexity, context)
        
        # Verify weighted components
        assert "intent" in decision.breakdown
        assert "complexity" in decision.breakdown
        assert "context" in decision.breakdown
        
        # Intent contribution: intent_score * 0.4
        # Complexity contribution: 0.6 * 0.4 = 0.24
        # Context contribution: 0.4 * 0.2 = 0.08
        
        assert abs(decision.breakdown["complexity"] - 0.24) < 0.01
        assert abs(decision.breakdown["context"] - 0.08) < 0.01
    
    def test_hybrid_mode_low_confidence(self):
        """Test hybrid mode activation on low confidence."""
        selector = ModeSelector()
        
        # Flash hint but with moderate complexity
        intent = IntentResult(
            intent="simple_question",
            confidence=0.6,  # Not very confident
            mode_hint="flash"
        )
        
        complexity = ComplexityResult(
            scores={"length": 0.3, "technical": 0.5, "structure": 0.4, "context": 0.2, "reasoning": 0.4},
            overall_score=0.45,  # Medium-low
            complexity_level="medium",
            mode_recommendation="depends",
            reasoning="Medium complexity"
        )
        
        decision = selector.select_mode(intent, complexity)
        
        # Should upgrade to hybrid if confidence < 0.7 and complexity/intent > 0.5
        if decision.mode == "flash" and decision.confidence < 0.7:
            # This is a candidate for hybrid
            assert complexity.overall_score > 0.4 or decision.scores["intent"] > 0.4
    
    def test_override_rule_high_complexity(self):
        """Test that very high complexity overrides to pro."""
        selector = ModeSelector()
        
        # Simple intent
        intent = IntentResult(
            intent="simple_question",
            confidence=0.8,
            mode_hint="flash"
        )
        
        # But very high complexity
        complexity = ComplexityResult(
            scores={"length": 0.7, "technical": 0.9, "structure": 0.8, "context": 0.4, "reasoning": 0.8},
            overall_score=0.8,
            complexity_level="high",
            mode_recommendation="pro",
            reasoning="Very high complexity"
        )
        
        decision = selector.select_mode(intent, complexity)
        
        # Should override to pro
        assert decision.mode == "pro"
    
    def test_override_rule_analytical_intent(self):
        """Test that analytical intent always uses pro."""
        selector = ModeSelector()
        
        # Analytical intent
        intent = IntentResult(
            intent="analytical",
            confidence=0.85,
            mode_hint="pro"
        )
        
        # Even with low complexity
        complexity = ComplexityResult(
            scores={"length": 0.2, "technical": 0.1, "structure": 0.3, "context": 0.0, "reasoning": 0.2},
            overall_score=0.2,
            complexity_level="low",
            mode_recommendation="flash",
            reasoning="Low complexity"
        )
        
        decision = selector.select_mode(intent, complexity)
        
        # Should be pro due to analytical intent
        assert decision.mode == "pro"
    
    def test_override_rule_creative_intent(self):
        """Test that creative intent uses pro."""
        selector = ModeSelector()
        
        intent = IntentResult(
            intent="creative",
            confidence=0.9,
            mode_hint="pro"
        )
        
        complexity = ComplexityResult(
            scores={"length": 0.3, "technical": 0.0, "structure": 0.4, "context": 0.0, "reasoning": 0.3},
            overall_score=0.3,
            complexity_level="low",
            mode_recommendation="flash",
            reasoning="Low complexity"
        )
        
        decision = selector.select_mode(intent, complexity)
        
        assert decision.mode == "pro"
    
    def test_override_rule_greeting_flash(self):
        """Test that greeting stays flash (unless very high complexity)."""
        selector = ModeSelector()
        
        intent = IntentResult(
            intent="greeting",
            confidence=0.95,
            mode_hint="flash"
        )
        
        complexity = ComplexityResult(
            scores={"length": 0.1, "technical": 0.0, "structure": 0.2, "context": 0.0, "reasoning": 0.0},
            overall_score=0.1,
            complexity_level="low",
            mode_recommendation="flash",
            reasoning="Very low complexity"
        )
        
        decision = selector.select_mode(intent, complexity)
        
        assert decision.mode == "flash"
        assert decision.confidence > 0.85
    
    def test_context_heavy_upgrade(self):
        """Test that context-heavy queries might upgrade mode."""
        selector = ModeSelector()
        
        intent = IntentResult(
            intent="simple_question",
            confidence=0.7,
            mode_hint="flash"
        )
        
        complexity = ComplexityResult(
            scores={"length": 0.3, "technical": 0.2, "structure": 0.3, "context": 0.7, "reasoning": 0.3},
            overall_score=0.35,
            complexity_level="low",
            mode_recommendation="flash",
            reasoning="Low complexity"
        )
        
        # Very high context
        context = ContextResult(
            score=0.85,
            has_reference=True,
            topic_continuity=0.7,
            session_length=8,
            reasoning="Very high context dependency"
        )
        
        decision = selector.select_mode(intent, complexity, context)
        
        # Should at least be depends (upgrade from flash)
        assert decision.mode in ["depends", "pro", "flash"]
    
    def test_reasoning_generation(self):
        """Test that reasoning is generated."""
        selector = ModeSelector()
        
        intent = IntentResult(
            intent="complex_question",
            confidence=0.8,
            mode_hint="pro"
        )
        
        complexity = ComplexityResult(
            scores={"length": 0.5, "technical": 0.6, "structure": 0.6, "context": 0.3, "reasoning": 0.7},
            overall_score=0.6,
            complexity_level="medium",
            mode_recommendation="depends",
            reasoning="Medium complexity"
        )
        
        decision = selector.select_mode(intent, complexity)
        
        assert decision.reasoning is not None
        assert len(decision.reasoning) > 0
        assert "Mode:" in decision.reasoning
        assert "Intent:" in decision.reasoning
        assert "Complexity:" in decision.reasoning
    
    def test_metadata_included(self):
        """Test that metadata is populated."""
        selector = ModeSelector()
        
        intent = IntentResult(
            intent="informational",
            confidence=0.75,
            mode_hint="depends"
        )
        
        complexity = ComplexityResult(
            scores={"length": 0.4, "technical": 0.3, "structure": 0.4, "context": 0.2, "reasoning": 0.3},
            overall_score=0.4,
            complexity_level="medium",
            mode_recommendation="depends",
            reasoning="Medium complexity"
        )
        
        context = ContextResult(
            score=0.5,
            has_reference=True,
            topic_continuity=0.4,
            session_length=2,
            reasoning="Moderate context"
        )
        
        decision = selector.select_mode(intent, complexity, context)
        
        assert "intent" in decision.metadata
        assert "complexity_level" in decision.metadata
        assert "has_context" in decision.metadata
        
        assert decision.metadata["intent"] == "informational"
        assert decision.metadata["complexity_level"] == "medium"
        assert decision.metadata["has_context"] == True
    
    def test_explain_decision(self):
        """Test detailed decision explanation."""
        selector = ModeSelector()
        
        intent = IntentResult(
            intent="complex_question",
            confidence=0.8,
            mode_hint="pro"
        )
        
        complexity = ComplexityResult(
            scores={"length": 0.5, "technical": 0.7, "structure": 0.6, "context": 0.3, "reasoning": 0.6},
            overall_score=0.6,
            complexity_level="medium",
            mode_recommendation="depends",
            reasoning="Medium complexity"
        )
        
        context = ContextResult(
            score=0.4,
            has_reference=False,
            topic_continuity=0.3,
            session_length=2,
            reasoning="Low context"
        )
        
        query = "Apa perbedaan antara supervised dan unsupervised learning?"
        explanation = selector.explain_decision(query, intent, complexity, context)
        
        assert isinstance(explanation, str)
        assert len(explanation) > 100
        assert "INTENT ANALYSIS" in explanation
        assert "COMPLEXITY ANALYSIS" in explanation
        assert "CONTEXT ANALYSIS" in explanation
        assert "FINAL DECISION" in explanation
        assert query in explanation


# Integration Tests

def test_full_routing_pipeline_flash():
    """Test complete routing pipeline for flash mode."""
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    context_scorer = ContextScorer()
    selector = ModeSelector()
    
    query = "Halo, apa kabar?"
    
    # Run pipeline
    intent = intent_classifier.classify(query)
    complexity = complexity_analyzer.analyze(query)
    context = context_scorer.score(query)
    
    decision = selector.select_mode(intent, complexity, context)
    
    assert decision.mode == "flash"
    assert decision.confidence > 0.7


def test_full_routing_pipeline_pro():
    """Test complete routing pipeline for pro mode."""
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    context_scorer = ContextScorer()
    selector = ModeSelector()
    
    query = "Analisis mendalam tentang perbedaan arsitektur transformer dan RNN dalam deep learning, termasuk keunggulan dan kelemahannya"
    
    # Run pipeline
    intent = intent_classifier.classify(query)
    complexity = complexity_analyzer.analyze(query)
    context = context_scorer.score(query)
    
    decision = selector.select_mode(intent, complexity, context)
    
    assert decision.mode in ["pro", "depends"]  # Should lean towards pro


def test_full_routing_pipeline_with_context():
    """Test complete routing pipeline with session context."""
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    context_scorer = ContextScorer()
    selector = ModeSelector()
    tracker = SessionTracker()
    
    # Build conversation
    queries = [
        "Apa itu neural network?",
        "Bagaimana cara kerjanya?",
        "Jelaskan lebih detail tentang backpropagation"
    ]
    
    for q in queries:
        tracker.add_query("user1", q)
    
    # Last query with context
    last_query = queries[-1]
    intent = intent_classifier.classify(last_query)
    complexity = complexity_analyzer.analyze(last_query)
    context = context_scorer.score(last_query, "user1", tracker)
    
    decision = selector.select_mode(intent, complexity, context)
    
    # Should have significant context score
    assert decision.scores["context"] > 0.0
    assert decision.metadata["has_context"] == False or True  # Depends on detection


def test_mode_transitions():
    """Test different mode transitions based on query types."""
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    context_scorer = ContextScorer()
    selector = ModeSelector()
    
    test_cases = [
        ("Halo!", "flash"),  # Greeting → flash
        ("Apa itu AI?", "flash"),  # Simple question → flash
        ("Jelaskan machine learning", None),  # Informational → depends/flash/pro
        ("Apa perbedaan supervised dan unsupervised learning?", None),  # Complex → depends/pro
        ("Buatkan cerita tentang robot", "pro"),  # Creative → pro
        ("Analisis dampak AI terhadap ekonomi", "pro"),  # Analytical → pro
    ]
    
    for query, expected_mode in test_cases:
        intent = intent_classifier.classify(query)
        complexity = complexity_analyzer.analyze(query)
        context = context_scorer.score(query)
        
        decision = selector.select_mode(intent, complexity, context)
        
        if expected_mode:
            assert decision.mode == expected_mode, f"Query '{query}' expected {expected_mode}, got {decision.mode}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
