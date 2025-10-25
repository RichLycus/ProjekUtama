"""Intent Classifier for Smart Router.

Phase 6.8.1: Intent Classification for Flash vs Pro routing.

Classifies user queries into intent categories to determine appropriate
processing mode (flash/pro). Uses pattern matching, keyword scoring,
and heuristic analysis with bilingual support (ID priority, EN fallback).
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class IntentResult:
    """Result of intent classification.
    
    Attributes:
        intent: Primary intent category (e.g., 'simple_question', 'complex_question')
        confidence: Confidence score (0.0 to 1.0)
        sub_intent: Optional sub-category for finer classification
        reasoning: Human-readable explanation of classification
        mode_hint: Suggested mode (flash/pro/depends)
        scores: Raw scores for all intent categories
    """
    intent: str
    confidence: float
    sub_intent: Optional[str] = None
    reasoning: str = ""
    mode_hint: str = "flash"
    scores: Dict[str, float] = field(default_factory=dict)
    
    def __repr__(self) -> str:
        return (
            f"IntentResult(intent='{self.intent}', "
            f"confidence={self.confidence:.2f}, "
            f"mode_hint='{self.mode_hint}')"
        )


class IntentClassifier:
    """Classifies user queries into intent categories.
    
    Uses multi-strategy approach:
    1. Pattern matching (regex) for greetings and simple patterns
    2. Keyword scoring with bilingual dictionary (ID priority)
    3. Heuristic analysis (length, structure, complexity)
    
    Optimized for Indonesian language with English fallback support.
    
    Example:
        >>> classifier = IntentClassifier()
        >>> result = classifier.classify("Apa perbedaan antara AI dan ML?")
        >>> print(result.intent)  # 'complex_question'
        >>> print(result.mode_hint)  # 'pro'
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize intent classifier.
        
        Args:
            config_path: Optional path to router_config.json.
                        Defaults to same directory as this file.
        """
        if config_path is None:
            config_path = Path(__file__).parent / "router_config.json"
        else:
            config_path = Path(config_path)
        
        # Load configuration
        with open(config_path, 'r', encoding='utf-8') as f:
            self.config = json.load(f)
        
        self.intent_patterns = self.config["intent_patterns"]
        self.heuristics = self.config["heuristics"]
        self.confidence_thresholds = self.config["confidence_thresholds"]
        self.mode_routing = self.config["mode_routing"]
        
        # Compile regex patterns for performance
        self._compiled_patterns: Dict[str, List[re.Pattern]] = {}
        for intent, data in self.intent_patterns.items():
            patterns = data.get("patterns", [])
            self._compiled_patterns[intent] = [
                re.compile(pattern, re.IGNORECASE) for pattern in patterns
            ]
    
    def classify(self, query: str) -> IntentResult:
        """Classify a user query into intent category.
        
        Args:
            query: User input text (ID or EN)
        
        Returns:
            IntentResult with classification details
        
        Example:
            >>> result = classifier.classify("Halo, apa kabar?")
            >>> print(result.intent)  # 'greeting'
            >>> print(result.confidence)  # 0.95
        """
        if not query or not query.strip():
            return IntentResult(
                intent="unknown",
                confidence=0.0,
                reasoning="Empty or invalid query",
                mode_hint="flash"
            )
        
        query_lower = query.lower().strip()
        
        # Calculate scores for all intents
        scores = {}
        for intent in self.intent_patterns.keys():
            score = self._calculate_intent_score(query_lower, intent)
            scores[intent] = score
        
        # Find best matching intent
        if not scores or max(scores.values()) == 0:
            return IntentResult(
                intent="informational",
                confidence=0.5,
                reasoning="No strong pattern match, defaulting to informational",
                mode_hint="depends",
                scores=scores
            )
        
        best_intent = max(scores, key=scores.get)
        best_score = scores[best_intent]
        
        # Apply heuristics to adjust confidence and intent
        adjusted_intent, adjusted_score, reasoning = self._apply_heuristics(
            query, query_lower, best_intent, best_score, scores
        )
        
        # Get mode hint
        mode_hint = self.intent_patterns[adjusted_intent].get("mode_hint", "flash")
        
        # Generate detailed reasoning
        detailed_reasoning = self._generate_reasoning(
            query, adjusted_intent, adjusted_score, reasoning
        )
        
        return IntentResult(
            intent=adjusted_intent,
            confidence=adjusted_score,
            reasoning=detailed_reasoning,
            mode_hint=mode_hint,
            scores=scores
        )
    
    def _calculate_intent_score(self, query_lower: str, intent: str) -> float:
        """Calculate score for a specific intent.
        
        Combines pattern matching and keyword scoring.
        
        Args:
            query_lower: Lowercased query
            intent: Intent category to score
        
        Returns:
            Score between 0.0 and 1.0
        """
        intent_data = self.intent_patterns[intent]
        score = 0.0
        
        # Pattern matching (higher weight - boosted for better detection)
        patterns = self._compiled_patterns.get(intent, [])
        for pattern in patterns:
            if pattern.search(query_lower):
                score += 0.6  # Increased from 0.5
                break  # Only count first pattern match
        
        # Keyword matching (ID priority)
        keywords_id = intent_data.get("keywords_id", [])
        keywords_en = intent_data.get("keywords_en", [])
        
        # Count ID keywords (higher weight)
        id_matches = sum(1 for kw in keywords_id if kw in query_lower)
        if id_matches > 0:
            # Improved scoring with better multiplier
            id_score = min(id_matches * 0.2, 0.5)  # Increased from 0.15 & 0.4
            score += id_score
        
        # Count EN keywords (lower weight as fallback)
        en_matches = sum(1 for kw in keywords_en if kw in query_lower)
        if en_matches > 0 and id_matches == 0:  # Only use EN if no ID match
            en_score = min(en_matches * 0.15, 0.4)  # Increased from 0.1 & 0.3
            score += en_score
        
        # Apply intent weight from config
        weight = intent_data.get("weight", 1.0)
        score *= weight
        
        # Normalize to 0-1 range
        return min(score, 1.0)
    
    def _apply_heuristics(
        self,
        query: str,
        query_lower: str,
        intent: str,
        score: float,
        all_scores: Dict[str, float]
    ) -> Tuple[str, float, str]:
        """Apply heuristic rules to adjust intent and confidence.
        
        Heuristics include:
        - Query length analysis
        - Structure complexity
        - Question word analysis
        - Multi-part question detection
        
        Args:
            query: Original query
            query_lower: Lowercased query
            intent: Current best intent
            score: Current score
            all_scores: Scores for all intents
        
        Returns:
            Tuple of (adjusted_intent, adjusted_score, reasoning)
        """
        reasoning_parts = []
        adjusted_intent = intent
        adjusted_score = score
        
        query_len = len(query)
        
        # Heuristic 0: Ultra-short queries (< 10 chars) → definitely simple/greeting/chitchat
        if query_len < 10:
            if intent not in ["greeting", "chitchat", "simple_question", "informational"]:
                # Force to simple category
                # Check if it's greeting/chitchat first
                if all_scores.get("greeting", 0) > 0.2:
                    adjusted_intent = "greeting"
                    adjusted_score = max(0.7, all_scores["greeting"])
                elif all_scores.get("chitchat", 0) > 0.2:
                    adjusted_intent = "chitchat"
                    adjusted_score = max(0.7, all_scores["chitchat"])
                else:
                    adjusted_intent = "simple_question"
                    adjusted_score = 0.7
                reasoning_parts.append("ultra-short query → simple intent")
        
        # Heuristic 1: Very short queries are likely simple
        elif query_len < self.heuristics["short_query_threshold"]:
            if intent not in ["greeting", "chitchat", "simple_question"]:
                # Downgrade to simple if not already simple intent
                if "simple_question" in all_scores and all_scores["simple_question"] > 0.3:
                    adjusted_intent = "simple_question"
                    adjusted_score = max(score * 0.8, all_scores["simple_question"])
                    reasoning_parts.append("short query suggests simple intent")
        
        # Heuristic 2: Long queries with complex indicators → complex/analytical
        if query_len > self.heuristics["long_query_threshold"]:
            complex_indicators = self.heuristics["complex_structure_indicators"]
            has_complex_words = any(word in query_lower for word in complex_indicators)
            
            if has_complex_words:
                if intent in ["simple_question", "informational"]:
                    # Upgrade to complex
                    if all_scores.get("complex_question", 0) > 0.2:
                        adjusted_intent = "complex_question"
                        adjusted_score = min(score * 1.2, 0.95)
                        reasoning_parts.append("long query with complex indicators")
        
        # Heuristic 3: Multiple question words → complex
        question_words = ["mengapa", "kenapa", "bagaimana", "jelaskan", "why", "how", "explain"]
        question_count = sum(1 for word in question_words if word in query_lower)
        
        if question_count >= 2:
            if intent in ["simple_question", "informational"]:
                adjusted_intent = "complex_question"
                adjusted_score = min(score * 1.1, 0.9)
                reasoning_parts.append("multiple question words indicate complexity")
        
        
        # Heuristic 4: Comparison words → complex (boosted)
        comparison_words = ["perbedaan", "bandingkan", "vs", "versus", "difference", "compare", "antara"]
        has_comparison = any(word in query_lower for word in comparison_words)
        
        if has_comparison:
            # Strong signal for complex question
            adjusted_intent = "complex_question"
            adjusted_score = min(max(score, 0.75), 0.95)  # Boost score significantly
            reasoning_parts.append("comparison detected")
        
        # Heuristic 5: Creative keywords boost
        if intent == "creative":
            creative_boost_words = ["buatkan", "tuliskan", "ciptakan", "write", "create"]
            if any(word in query_lower for word in creative_boost_words):
                adjusted_score = min(adjusted_score * 1.1, 0.95)
                reasoning_parts.append("creative action verb detected")
        
        # Combine reasoning
        if reasoning_parts:
            reasoning = "; ".join(reasoning_parts)
        else:
            reasoning = "standard classification"
        
        return adjusted_intent, adjusted_score, reasoning
    
    def _generate_reasoning(self, query: str, intent: str, confidence: float, heuristic_reasoning: str) -> str:
        """Generate human-readable reasoning for classification.
        
        Args:
            query: Original query
            intent: Classified intent
            confidence: Confidence score
            heuristic_reasoning: Additional reasoning from heuristics
        
        Returns:
            Detailed reasoning string
        """
        mode_hint = self.intent_patterns[intent].get("mode_hint", "flash")
        query_len = len(query)
        
        # Base reasoning
        reasoning = f"Intent '{intent}' detected (confidence: {confidence:.2f}). "
        
        # Add length info
        if query_len < 50:
            reasoning += "Short query. "
        elif query_len > 200:
            reasoning += "Long query. "
        
        # Add mode recommendation
        reasoning += f"Recommended mode: {mode_hint}. "
        
        # Add heuristic insights
        if heuristic_reasoning != "standard classification":
            reasoning += f"Heuristics: {heuristic_reasoning}."
        
        return reasoning.strip()
    
    def classify_batch(self, queries: List[str]) -> List[IntentResult]:
        """Classify multiple queries at once.
        
        Args:
            queries: List of user queries
        
        Returns:
            List of IntentResult objects
        
        Example:
            >>> queries = ["Halo!", "Apa itu AI?", "Mengapa langit biru?"]
            >>> results = classifier.classify_batch(queries)
            >>> for r in results:
            ...     print(r.intent, r.mode_hint)
        """
        return [self.classify(query) for query in queries]
    
    def get_mode_suggestion(self, intent_result: IntentResult) -> str:
        """Get explicit mode suggestion based on intent result.
        
        Args:
            intent_result: Result from classify()
        
        Returns:
            Mode string: 'flash', 'pro', or 'depends'
        """
        return intent_result.mode_hint
    
    def explain_classification(self, query: str) -> str:
        """Get detailed explanation of how a query was classified.
        
        Useful for debugging and understanding classifier behavior.
        
        Args:
            query: User query to explain
        
        Returns:
            Multi-line explanation string
        """
        result = self.classify(query)
        
        explanation = []
        explanation.append(f"Query: '{query}'")
        explanation.append(f"Length: {len(query)} characters")
        explanation.append("")
        explanation.append("Intent Scores:")
        
        # Sort scores for readability
        sorted_scores = sorted(result.scores.items(), key=lambda x: x[1], reverse=True)
        for intent, score in sorted_scores:
            mode = self.intent_patterns[intent].get("mode_hint", "?")
            explanation.append(f"  {intent:20s}: {score:.3f} (mode: {mode})")
        
        explanation.append("")
        explanation.append(f"Final Classification:")
        explanation.append(f"  Intent: {result.intent}")
        explanation.append(f"  Confidence: {result.confidence:.2f}")
        explanation.append(f"  Mode: {result.mode_hint}")
        explanation.append(f"  Reasoning: {result.reasoning}")
        
        return "\n".join(explanation)
