"""Mode Selector for Smart Router.

Phase 6.8.4: Final mode decision engine with weighted scoring.

Combines intent classification, complexity analysis, and context awareness
to make intelligent routing decisions. Supports adaptive hybrid mode.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field

from .intent_classifier import IntentResult
from .complexity_analyzer import ComplexityResult
from .context_layer import ContextResult


@dataclass
class ModeDecision:
    """Final mode routing decision.
    
    Attributes:
        mode: Selected mode (flash/pro/hybrid)
        confidence: Decision confidence (0.0-1.0)
        reasoning: Human-readable explanation
        scores: Individual component scores
        breakdown: Score contribution breakdown
        metadata: Additional decision metadata
    """
    mode: str
    confidence: float
    reasoning: str
    scores: Dict[str, float]
    breakdown: Dict[str, float]
    metadata: Dict[str, any] = field(default_factory=dict)
    
    def __repr__(self) -> str:
        return (
            f"ModeDecision(mode='{self.mode}', "
            f"confidence={self.confidence:.2f})"
        )


class ModeSelector:
    """Final mode selection engine with weighted scoring.
    
    Combines multiple signals to make intelligent routing decisions:
    - Intent classification (40% weight)
    - Complexity analysis (40% weight)
    - Context awareness (20% weight)
    
    Features:
    - Weighted scoring with configurable weights
    - Adaptive hybrid mode (flash → pro upgrade)
    - Explainable reasoning for every decision
    - Config-driven rules
    
    Example:
        >>> from .intent_classifier import IntentClassifier
        >>> from .complexity_analyzer import ComplexityAnalyzer
        >>> from .context_layer import ContextScorer, SessionTracker
        >>> 
        >>> selector = ModeSelector()
        >>> intent_classifier = IntentClassifier()
        >>> complexity_analyzer = ComplexityAnalyzer()
        >>> context_scorer = ContextScorer()
        >>> tracker = SessionTracker()
        >>> 
        >>> query = "Apa perbedaan antara AI dan ML secara teknis?"
        >>> intent = intent_classifier.classify(query)
        >>> complexity = complexity_analyzer.analyze(query)
        >>> context = context_scorer.score(query)
        >>> 
        >>> decision = selector.select_mode(intent, complexity, context)
        >>> print(decision.mode)  # 'pro'
        >>> print(decision.reasoning)
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize mode selector.
        
        Args:
            config_path: Optional path to router_config.json
        """
        if config_path is None:
            config_path = Path(__file__).parent / "router_config.json"
        else:
            config_path = Path(config_path)
        
        # Load configuration
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        self.config = config
        
        # Mode selection weights (default if not in config)
        self.weights = config.get("mode_selection", {}).get("weights", {
            "intent": 0.4,
            "complexity": 0.4,
            "context": 0.2
        })
        
        # Thresholds
        self.thresholds = config.get("mode_selection", {}).get("thresholds", {
            "pro_threshold": 0.6,
            "flash_threshold": 0.4,
            "hybrid_confidence_threshold": 0.7
        })
        
        # Mode preferences
        self.mode_preferences = config.get("mode_routing", {
            "flash": ["greeting", "chitchat", "simple_question"],
            "pro": ["complex_question", "analytical", "creative"],
            "depends": ["informational"]
        })
    
    def select_mode(
        self,
        intent_result: IntentResult,
        complexity_result: ComplexityResult,
        context_result: Optional[ContextResult] = None
    ) -> ModeDecision:
        """Select routing mode based on all signals.
        
        Args:
            intent_result: Result from IntentClassifier
            complexity_result: Result from ComplexityAnalyzer
            context_result: Optional result from ContextScorer
        
        Returns:
            ModeDecision with final routing decision
        """
        # Convert results to scores
        intent_score = self._intent_to_score(intent_result)
        complexity_score = complexity_result.overall_score
        context_score = context_result.score if context_result else 0.0
        
        # Calculate weighted overall score
        overall_score = (
            intent_score * self.weights["intent"] +
            complexity_score * self.weights["complexity"] +
            context_score * self.weights["context"]
        )
        
        # Store individual scores
        scores = {
            "intent": intent_score,
            "complexity": complexity_score,
            "context": context_score,
            "overall": overall_score
        }
        
        # Calculate score contributions (weighted)
        breakdown = {
            "intent": intent_score * self.weights["intent"],
            "complexity": complexity_score * self.weights["complexity"],
            "context": context_score * self.weights["context"]
        }
        
        # Determine mode based on weighted score
        mode, confidence = self._determine_mode(
            overall_score, intent_result, complexity_result, context_result
        )
        
        # Check if hybrid mode should be used
        if mode == "flash" and confidence < self.thresholds["hybrid_confidence_threshold"]:
            # Upgrade to hybrid if not confident enough
            if complexity_score > 0.5 or intent_score > 0.5:
                mode = "hybrid"
        
        # Generate detailed reasoning
        reasoning = self._generate_reasoning(
            mode, confidence, intent_result, complexity_result, 
            context_result, scores, breakdown
        )
        
        # Metadata
        metadata = {
            "intent": intent_result.intent,
            "complexity_level": complexity_result.complexity_level,
            "has_context": context_result is not None and context_result.has_reference
        }
        
        return ModeDecision(
            mode=mode,
            confidence=confidence,
            reasoning=reasoning,
            scores=scores,
            breakdown=breakdown,
            metadata=metadata
        )
    
    def _intent_to_score(self, intent_result: IntentResult) -> float:
        """Convert intent result to complexity score.
        
        Maps intent categories to complexity scores:
        - greeting, chitchat, simple_question → 0.2-0.3 (flash)
        - informational → 0.4-0.5 (depends)
        - complex_question, analytical, creative → 0.7-0.9 (pro)
        
        Args:
            intent_result: IntentResult object
        
        Returns:
            Normalized score (0.0 to 1.0)
        """
        intent = intent_result.intent
        confidence = intent_result.confidence
        
        # Base scores by intent type
        base_scores = {
            "greeting": 0.1,
            "chitchat": 0.15,
            "simple_question": 0.25,
            "informational": 0.45,
            "complex_question": 0.75,
            "analytical": 0.85,
            "creative": 0.8
        }
        
        base_score = base_scores.get(intent, 0.5)
        
        # Adjust by confidence
        # High confidence → use base score
        # Low confidence → regress to mean (0.5)
        adjusted_score = base_score * confidence + 0.5 * (1 - confidence)
        
        return adjusted_score
    
    def _determine_mode(
        self,
        overall_score: float,
        intent_result: IntentResult,
        complexity_result: ComplexityResult,
        context_result: Optional[ContextResult]
    ) -> Tuple[str, float]:
        """Determine mode and confidence based on overall score.
        
        Args:
            overall_score: Weighted overall complexity score
            intent_result: Intent classification result
            complexity_result: Complexity analysis result
            context_result: Optional context analysis result
        
        Returns:
            Tuple of (mode, confidence)
        """
        # Start with score-based decision
        if overall_score >= self.thresholds["pro_threshold"]:
            base_mode = "pro"
            confidence = min(overall_score, 0.95)
        elif overall_score <= self.thresholds["flash_threshold"]:
            base_mode = "flash"
            confidence = min(1.0 - overall_score, 0.95)
        else:
            # Middle range - check intent hint
            if intent_result.mode_hint == "pro":
                base_mode = "pro"
            elif intent_result.mode_hint == "flash":
                base_mode = "flash"
            else:
                base_mode = "depends"
            
            # Confidence is lower in middle range
            confidence = 0.6 + abs(overall_score - 0.5) * 0.4
        
        # Override logic: Strong signals override middle ground
        
        # Rule 1: Very high complexity → always pro
        if complexity_result.complexity_level == "high" and complexity_result.overall_score > 0.7:
            base_mode = "pro"
            confidence = max(confidence, 0.85)
        
        # Rule 2: Analytical or creative intent → always pro
        if intent_result.intent in ["analytical", "creative"]:
            base_mode = "pro"
            confidence = max(confidence, 0.8)
        
        # Rule 3: Greeting or chitchat → always flash (unless very high complexity)
        if intent_result.intent in ["greeting", "chitchat"] and complexity_result.overall_score < 0.5:
            base_mode = "flash"
            confidence = max(confidence, 0.9)
        
        # Rule 4: Context-heavy queries might need pro for coherence
        if context_result and context_result.score > 0.7 and context_result.session_length > 5:
            if base_mode == "flash":
                base_mode = "depends"  # Upgrade to depends at minimum
        
        return base_mode, confidence
    
    def _generate_reasoning(
        self,
        mode: str,
        confidence: float,
        intent_result: IntentResult,
        complexity_result: ComplexityResult,
        context_result: Optional[ContextResult],
        scores: Dict[str, float],
        breakdown: Dict[str, float]
    ) -> str:
        """Generate detailed reasoning for decision.
        
        Args:
            mode: Selected mode
            confidence: Decision confidence
            intent_result: Intent result
            complexity_result: Complexity result
            context_result: Context result
            scores: Individual scores
            breakdown: Weighted breakdown
        
        Returns:
            Detailed reasoning string
        """
        parts = []
        
        # Mode and confidence
        parts.append(f"Mode: {mode.upper()} (confidence: {confidence:.2f})")
        
        # Overall score
        parts.append(f"Overall score: {scores['overall']:.2f}")
        
        # Top contributing factors
        sorted_breakdown = sorted(breakdown.items(), key=lambda x: x[1], reverse=True)
        top_factors = []
        for factor, contribution in sorted_breakdown:
            if contribution > 0.15:  # Only mention significant contributors
                top_factors.append(f"{factor} ({contribution:.2f})")
        
        if top_factors:
            parts.append(f"Key factors: {', '.join(top_factors)}")
        
        # Intent reasoning
        parts.append(
            f"Intent: {intent_result.intent} "
            f"(conf: {intent_result.confidence:.2f}, hint: {intent_result.mode_hint})"
        )
        
        # Complexity reasoning
        parts.append(
            f"Complexity: {complexity_result.complexity_level} "
            f"(score: {complexity_result.overall_score:.2f})"
        )
        
        # Context reasoning (if available)
        if context_result:
            parts.append(
                f"Context: {'dependent' if context_result.has_reference else 'independent'} "
                f"(score: {context_result.score:.2f})"
            )
        
        # Mode-specific reasoning
        if mode == "pro":
            if complexity_result.complexity_level == "high":
                parts.append("→ High complexity requires advanced processing")
            elif intent_result.intent in ["analytical", "creative"]:
                parts.append(f"→ {intent_result.intent.capitalize()} intent needs deep reasoning")
            else:
                parts.append("→ Query characteristics suggest pro mode")
        
        elif mode == "flash":
            if intent_result.intent in ["greeting", "chitchat"]:
                parts.append("→ Simple interaction, fast response sufficient")
            else:
                parts.append("→ Straightforward query, quick processing appropriate")
        
        elif mode == "hybrid":
            parts.append("→ Hybrid mode: Start with flash, upgrade to pro if needed")
        
        elif mode == "depends":
            parts.append("→ Moderate complexity, mode depends on available resources")
        
        return ". ".join(parts) + "."
    
    def explain_decision(
        self,
        query: str,
        intent_result: IntentResult,
        complexity_result: ComplexityResult,
        context_result: Optional[ContextResult] = None
    ) -> str:
        """Get detailed explanation of mode selection.
        
        Useful for debugging and understanding decision logic.
        
        Args:
            query: Original user query
            intent_result: Intent classification result
            complexity_result: Complexity analysis result
            context_result: Optional context analysis result
        
        Returns:
            Multi-line explanation string
        """
        decision = self.select_mode(intent_result, complexity_result, context_result)
        
        explanation = []
        explanation.append("=" * 60)
        explanation.append(f"Query: '{query}'")
        explanation.append(f"Length: {len(query)} characters")
        explanation.append("=" * 60)
        explanation.append("")
        
        # Intent section
        explanation.append("INTENT ANALYSIS:")
        explanation.append(f"  Intent: {intent_result.intent}")
        explanation.append(f"  Confidence: {intent_result.confidence:.2f}")
        explanation.append(f"  Mode Hint: {intent_result.mode_hint}")
        explanation.append(f"  Score: {decision.scores['intent']:.2f}")
        explanation.append(f"  Weighted Contribution: {decision.breakdown['intent']:.3f}")
        explanation.append("")
        
        # Complexity section
        explanation.append("COMPLEXITY ANALYSIS:")
        explanation.append(f"  Level: {complexity_result.complexity_level}")
        explanation.append(f"  Overall Score: {complexity_result.overall_score:.2f}")
        explanation.append(f"  Mode Recommendation: {complexity_result.mode_recommendation}")
        explanation.append(f"  Factor Scores:")
        for factor, score in complexity_result.scores.items():
            explanation.append(f"    - {factor.capitalize()}: {score:.2f}")
        explanation.append(f"  Weighted Contribution: {decision.breakdown['complexity']:.3f}")
        explanation.append("")
        
        # Context section
        if context_result:
            explanation.append("CONTEXT ANALYSIS:")
            explanation.append(f"  Score: {context_result.score:.2f}")
            explanation.append(f"  Has Reference: {context_result.has_reference}")
            explanation.append(f"  Topic Continuity: {context_result.topic_continuity:.2f}")
            explanation.append(f"  Session Length: {context_result.session_length}")
            explanation.append(f"  Weighted Contribution: {decision.breakdown['context']:.3f}")
            explanation.append("")
        
        # Final decision
        explanation.append("FINAL DECISION:")
        explanation.append(f"  Mode: {decision.mode.upper()}")
        explanation.append(f"  Confidence: {decision.confidence:.2f}")
        explanation.append(f"  Overall Score: {decision.scores['overall']:.2f}")
        explanation.append("")
        explanation.append("REASONING:")
        explanation.append(f"  {decision.reasoning}")
        explanation.append("")
        explanation.append("=" * 60)
        
        return "\n".join(explanation)
