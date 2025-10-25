"""Complexity Analyzer for Smart Router.

Phase 6.8.2: Complexity Analysis for Flash vs Pro routing.

Analyzes query complexity using 5 factors:
1. Length - Query length (short/medium/long)
2. Technical - Technical terminology density
3. Structure - Sentence structure complexity
4. Context - Context dependency
5. Reasoning - Reasoning depth required

Each factor scored 0.0-1.0, combined with configurable weights.
"""

import re
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field


@dataclass
class ComplexityResult:
    """Result of complexity analysis.
    
    Attributes:
        scores: Individual scores for each factor (0.0-1.0)
        overall_score: Weighted overall complexity (0.0-1.0)
        complexity_level: Level category (low/medium/high)
        mode_recommendation: Suggested mode (flash/pro/depends)
        reasoning: Human-readable explanation
        factor_details: Detailed breakdown per factor
    """
    scores: Dict[str, float]
    overall_score: float
    complexity_level: str
    mode_recommendation: str
    reasoning: str
    factor_details: Dict[str, str] = field(default_factory=dict)
    
    def __repr__(self) -> str:
        return (
            f"ComplexityResult(level='{self.complexity_level}', "
            f"score={self.overall_score:.2f}, "
            f"mode='{self.mode_recommendation}')"
        )


class ComplexityAnalyzer:
    """Analyzes query complexity using multiple factors.
    
    Uses 5-factor scoring system with configurable weights:
    - Length (15%): Query length analysis
    - Technical (25%): Technical terminology density
    - Structure (20%): Sentence structure complexity
    - Context (15%): Context dependency level
    - Reasoning (25%): Reasoning depth required
    
    Example:
        >>> analyzer = ComplexityAnalyzer()
        >>> result = analyzer.analyze("Jelaskan perbedaan AI dan ML secara mendalam")
        >>> print(result.complexity_level)  # 'high'
        >>> print(result.mode_recommendation)  # 'pro'
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize complexity analyzer.
        
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
            config = json.load(f)
        
        self.complexity_config = config["complexity_analysis"]
        self.weights = self.complexity_config["weights"]
        self.length_thresholds = self.complexity_config["length_thresholds"]
        self.technical_keywords = self.complexity_config["technical_keywords"]
        self.structure_indicators = self.complexity_config["structure_indicators"]
        self.context_indicators = self.complexity_config["context_indicators"]
        self.reasoning_indicators = self.complexity_config["reasoning_indicators"]
        self.complexity_levels = self.complexity_config["complexity_levels"]
        
        # Flatten technical keywords for easier matching
        self._all_technical_keywords = []
        for category, keywords in self.technical_keywords.items():
            self._all_technical_keywords.extend(keywords)
    
    def analyze(self, query: str) -> ComplexityResult:
        """Analyze query complexity.
        
        Args:
            query: User input text
        
        Returns:
            ComplexityResult with detailed analysis
        
        Example:
            >>> result = analyzer.analyze("Mengapa langit biru?")
            >>> print(result.overall_score)  # 0.45 (medium)
        """
        if not query or not query.strip():
            return ComplexityResult(
                scores={},
                overall_score=0.0,
                complexity_level="low",
                mode_recommendation="flash",
                reasoning="Empty or invalid query",
                factor_details={}
            )
        
        query_lower = query.lower().strip()
        
        # Calculate individual factor scores
        length_score, length_detail = self._analyze_length(query)
        technical_score, technical_detail = self._analyze_technical(query_lower)
        structure_score, structure_detail = self._analyze_structure(query_lower)
        context_score, context_detail = self._analyze_context(query_lower)
        reasoning_score, reasoning_detail = self._analyze_reasoning(query_lower)
        
        # Store scores
        scores = {
            "length": length_score,
            "technical": technical_score,
            "structure": structure_score,
            "context": context_score,
            "reasoning": reasoning_score
        }
        
        factor_details = {
            "length": length_detail,
            "technical": technical_detail,
            "structure": structure_detail,
            "context": context_detail,
            "reasoning": reasoning_detail
        }
        
        # Calculate weighted overall score
        overall_score = (
            length_score * self.weights["length"] +
            technical_score * self.weights["technical"] +
            structure_score * self.weights["structure"] +
            context_score * self.weights["context"] +
            reasoning_score * self.weights["reasoning"]
        )
        
        # Determine complexity level and mode
        complexity_level, mode = self._determine_level_and_mode(overall_score)
        
        # Generate reasoning
        reasoning = self._generate_reasoning(
            overall_score, complexity_level, scores, factor_details
        )
        
        return ComplexityResult(
            scores=scores,
            overall_score=overall_score,
            complexity_level=complexity_level,
            mode_recommendation=mode,
            reasoning=reasoning,
            factor_details=factor_details
        )
    
    def _analyze_length(self, query: str) -> Tuple[float, str]:
        """Analyze query length factor.
        
        Args:
            query: User query
        
        Returns:
            Tuple of (score, detail_text)
        """
        length = len(query)
        
        if length < self.length_thresholds["short"]:
            score = length / self.length_thresholds["short"] * 0.3
            detail = f"Short query ({length} chars)"
        elif length < self.length_thresholds["medium"]:
            # Map 50-150 to 0.3-0.6
            normalized = (length - self.length_thresholds["short"]) / (
                self.length_thresholds["medium"] - self.length_thresholds["short"]
            )
            score = 0.3 + (normalized * 0.3)
            detail = f"Medium query ({length} chars)"
        elif length < self.length_thresholds["long"]:
            # Map 150-300 to 0.6-0.8
            normalized = (length - self.length_thresholds["medium"]) / (
                self.length_thresholds["long"] - self.length_thresholds["medium"]
            )
            score = 0.6 + (normalized * 0.2)
            detail = f"Long query ({length} chars)"
        else:
            # Very long queries
            score = min(0.8 + (length - self.length_thresholds["long"]) / 500 * 0.2, 1.0)
            detail = f"Very long query ({length} chars)"
        
        return score, detail
    
    def _analyze_technical(self, query_lower: str) -> Tuple[float, str]:
        """Analyze technical terminology density.
        
        Args:
            query_lower: Lowercased query
        
        Returns:
            Tuple of (score, detail_text)
        """
        # Count technical keywords
        matches = []
        for keyword in self._all_technical_keywords:
            if keyword in query_lower:
                matches.append(keyword)
        
        if not matches:
            return 0.0, "No technical terms"
        
        # Score based on density (keywords per 50 chars)
        query_len = len(query_lower)
        density = len(matches) / max(query_len / 50, 1)
        
        # Map density to score
        # 1 keyword per 50 chars = 0.5
        # 2+ keywords per 50 chars = 1.0
        score = min(density * 0.5, 1.0)
        
        detail = f"{len(matches)} technical term(s): {', '.join(matches[:3])}"
        if len(matches) > 3:
            detail += f" (+{len(matches) - 3} more)"
        
        return score, detail
    
    def _analyze_structure(self, query_lower: str) -> Tuple[float, str]:
        """Analyze sentence structure complexity.
        
        Args:
            query_lower: Lowercased query
        
        Returns:
            Tuple of (score, detail_text)
        """
        # Count clauses (approximation using punctuation and conjunctions)
        # Split by common clause separators
        clauses = re.split(r'[,;]|\sdan\s|\sau\s|\stetapi\s|\sand\s|\sor\s|\sbut\s', query_lower)
        clause_count = len(clauses)
        
        # Check for complex indicators
        complex_words = self.structure_indicators["complex"]["indicators"]
        has_complex = any(word in query_lower for word in complex_words)
        
        # Check for simple patterns
        simple_patterns = self.structure_indicators["simple"]["patterns"]
        is_simple = any(re.match(pattern, query_lower) for pattern in simple_patterns)
        
        # Determine score
        if is_simple and clause_count == 1:
            score = 0.2
            detail = "Simple structure (1 clause, direct question)"
        elif clause_count <= 2 and not has_complex:
            score = 0.4
            detail = f"Medium structure ({clause_count} clauses)"
        elif clause_count <= 3 and not has_complex:
            score = 0.6
            detail = f"Medium-complex structure ({clause_count} clauses)"
        else:
            score = min(0.6 + (clause_count - 3) * 0.1, 1.0)
            if has_complex:
                score = min(score + 0.2, 1.0)
            detail = f"Complex structure ({clause_count} clauses, nested)"
        
        return score, detail
    
    def _analyze_context(self, query_lower: str) -> Tuple[float, str]:
        """Analyze context dependency.
        
        Args:
            query_lower: Lowercased query
        
        Returns:
            Tuple of (score, detail_text)
        """
        # Count context indicators
        context_matches = [
            word for word in self.context_indicators
            if word in query_lower
        ]
        
        if not context_matches:
            return 0.0, "No context dependency"
        
        # More context words = higher dependency
        # 1 word = 0.4, 2 words = 0.7, 3+ = 1.0
        score = min(len(context_matches) * 0.35, 1.0)
        
        detail = f"Context-dependent ({len(context_matches)} indicators: {', '.join(context_matches[:2])})"
        
        return score, detail
    
    def _analyze_reasoning(self, query_lower: str) -> Tuple[float, str]:
        """Analyze reasoning depth required.
        
        Args:
            query_lower: Lowercased query
        
        Returns:
            Tuple of (score, detail_text)
        """
        score = 0.0
        reasoning_types = []
        
        # Check why/how questions (0.4)
        if any(word in query_lower for word in self.reasoning_indicators["why_how"]):
            score += 0.4
            reasoning_types.append("why/how")
        
        # Check analysis requirements (0.3)
        if any(word in query_lower for word in self.reasoning_indicators["analysis"]):
            score += 0.3
            reasoning_types.append("analysis")
        
        # Check explanation requirements (0.2)
        if any(word in query_lower for word in self.reasoning_indicators["explanation"]):
            score += 0.2
            reasoning_types.append("explanation")
        
        # Check problem-solving (0.3)
        if any(word in query_lower for word in self.reasoning_indicators["problem_solving"]):
            score += 0.3
            reasoning_types.append("problem-solving")
        
        score = min(score, 1.0)
        
        if score == 0.0:
            detail = "Minimal reasoning required"
        else:
            detail = f"Reasoning: {', '.join(reasoning_types)}"
        
        return score, detail
    
    def _determine_level_and_mode(self, overall_score: float) -> Tuple[str, str]:
        """Determine complexity level and mode recommendation.
        
        Args:
            overall_score: Weighted overall complexity score
        
        Returns:
            Tuple of (complexity_level, mode_recommendation)
        """
        if overall_score < self.complexity_levels["low"]["threshold"]:
            level = "low"
            mode = self.complexity_levels["low"]["mode"]
        elif overall_score < self.complexity_levels["medium"]["threshold"]:
            level = "medium"
            mode = self.complexity_levels["medium"]["mode"]
        else:
            level = "high"
            mode = self.complexity_levels["high"]["mode"]
        
        return level, mode
    
    def _generate_reasoning(
        self,
        overall_score: float,
        complexity_level: str,
        scores: Dict[str, float],
        details: Dict[str, str]
    ) -> str:
        """Generate human-readable reasoning.
        
        Args:
            overall_score: Overall complexity score
            complexity_level: Determined level
            scores: Individual factor scores
            details: Factor detail strings
        
        Returns:
            Reasoning explanation string
        """
        # Find top contributing factors
        sorted_factors = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        top_factors = sorted_factors[:2]  # Top 2 factors
        
        reasoning_parts = [
            f"Complexity: {complexity_level} (score: {overall_score:.2f})."
        ]
        
        # Add top factors
        for factor, score in top_factors:
            if score > 0.3:  # Only mention significant factors
                reasoning_parts.append(f"{factor.capitalize()}: {details[factor]}")
        
        # Add mode description
        mode_desc = self.complexity_levels[complexity_level]["description"]
        reasoning_parts.append(f"→ {mode_desc}")
        
        return " ".join(reasoning_parts)
    
    def analyze_batch(self, queries: List[str]) -> List[ComplexityResult]:
        """Analyze multiple queries at once.
        
        Args:
            queries: List of user queries
        
        Returns:
            List of ComplexityResult objects
        
        Example:
            >>> queries = ["Halo!", "Apa itu AI?", "Analisis AI secara mendalam"]
            >>> results = analyzer.analyze_batch(queries)
            >>> for r in results:
            ...     print(r.complexity_level, r.mode_recommendation)
        """
        return [self.analyze(query) for query in queries]
    
    def explain_analysis(self, query: str) -> str:
        """Get detailed explanation of complexity analysis.
        
        Useful for debugging and understanding analyzer behavior.
        
        Args:
            query: User query to explain
        
        Returns:
            Multi-line explanation string
        """
        result = self.analyze(query)
        
        explanation = []
        explanation.append(f"Query: '{query}'")
        explanation.append(f"Length: {len(query)} characters")
        explanation.append("")
        explanation.append("Factor Scores:")
        
        for factor, score in result.scores.items():
            weight = self.weights[factor]
            detail = result.factor_details.get(factor, "")
            weighted = score * weight
            explanation.append(
                f"  {factor.capitalize():12s}: {score:.2f} "
                f"(weight: {weight:.2f}, weighted: {weighted:.3f}) - {detail}"
            )
        
        explanation.append("")
        explanation.append(f"Overall Score: {result.overall_score:.2f}")
        explanation.append(f"Complexity Level: {result.complexity_level}")
        explanation.append(f"Mode Recommendation: {result.mode_recommendation}")
        explanation.append("")
        explanation.append(f"Reasoning: {result.reasoning}")
        
        return "\n".join(explanation)
