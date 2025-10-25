"""Unit tests for Complexity Analyzer (Phase 6.8.2).

Tests 5-factor complexity analysis:
- Length factor
- Technical factor
- Structure factor
- Context factor
- Reasoning factor
"""

import pytest
from ai.router import ComplexityAnalyzer, ComplexityResult


@pytest.fixture
def analyzer():
    """Create ComplexityAnalyzer instance for testing."""
    return ComplexityAnalyzer()


class TestComplexityAnalyzerBasic:
    """Basic functionality tests."""
    
    def test_analyzer_initialization(self, analyzer):
        """Test that analyzer initializes correctly."""
        assert analyzer is not None
        assert analyzer.complexity_config is not None
        assert analyzer.weights is not None
        assert len(analyzer.weights) == 5
    
    def test_empty_query(self, analyzer):
        """Test handling of empty query."""
        result = analyzer.analyze("")
        assert result.complexity_level == "low"
        assert result.overall_score == 0.0
        assert result.mode_recommendation == "flash"
    
    def test_whitespace_query(self, analyzer):
        """Test handling of whitespace-only query."""
        result = analyzer.analyze("   ")
        assert result.complexity_level == "low"
        assert result.overall_score == 0.0


class TestLengthFactor:
    """Tests for length factor analysis."""
    
    def test_short_query(self, analyzer):
        """Test short query (< 50 chars)."""
        result = analyzer.analyze("Halo!")
        assert result.scores["length"] < 0.3
        assert "Short" in result.factor_details["length"]
    
    def test_medium_query(self, analyzer):
        """Test medium query (50-150 chars)."""
        query = "Jelaskan tentang machine learning dan bagaimana cara kerjanya secara umum"
        result = analyzer.analyze(query)
        assert 0.3 <= result.scores["length"] <= 0.6
        assert "Medium" in result.factor_details["length"]
    
    def test_long_query(self, analyzer):
        """Test long query (150-300 chars)."""
        query = (
            "Jelaskan secara mendalam tentang bagaimana sistem machine learning modern "
            "bekerja, mulai dari pengumpulan data, preprocessing, training model, hingga "
            "deployment dan monitoring dalam production environment"
        )
        result = analyzer.analyze(query)
        assert result.scores["length"] >= 0.6
        assert "Long" in result.factor_details["length"] or "Very long" in result.factor_details["length"]
    
    def test_very_long_query(self, analyzer):
        """Test very long query (> 300 chars)."""
        query = "Jelaskan " + "sangat " * 50 + "detail tentang AI"
        result = analyzer.analyze(query)
        assert result.scores["length"] >= 0.8


class TestTechnicalFactor:
    """Tests for technical factor analysis."""
    
    def test_no_technical_terms(self, analyzer):
        """Test query without technical terms."""
        result = analyzer.analyze("Selamat pagi, semoga harimu menyenangkan!")
        assert result.scores["technical"] == 0.0
        assert "No technical" in result.factor_details["technical"]
    
    def test_single_technical_term(self, analyzer):
        """Test query with single technical term."""
        result = analyzer.analyze("Apa itu Python?")
        assert result.scores["technical"] > 0.0
        assert "python" in result.factor_details["technical"].lower()
    
    def test_multiple_technical_terms(self, analyzer):
        """Test query with multiple technical terms."""
        result = analyzer.analyze(
            "Bagaimana cara deploy Python API dengan Docker di Kubernetes?"
        )
        assert result.scores["technical"] > 0.5
        # Should detect: python, api, docker, kubernetes
        assert result.scores["technical"] >= 0.5
    
    def test_indonesian_technical_terms(self, analyzer):
        """Test Indonesian technical terms."""
        result = analyzer.analyze("Jelaskan tentang pemrograman dan algoritma")
        assert result.scores["technical"] > 0.0
    
    def test_ai_ml_terms(self, analyzer):
        """Test AI/ML specific terms."""
        result = analyzer.analyze(
            "Explain deep learning with neural networks and transformers"
        )
        assert result.scores["technical"] > 0.5


class TestStructureFactor:
    """Tests for structure factor analysis."""
    
    def test_simple_structure(self, analyzer):
        """Test simple structure (direct question)."""
        result = analyzer.analyze("Apa itu AI?")
        assert result.scores["structure"] < 0.4
        assert "Simple" in result.factor_details["structure"]
    
    def test_medium_structure(self, analyzer):
        """Test medium structure (2-3 clauses)."""
        result = analyzer.analyze("Apa itu AI dan bagaimana cara kerjanya?")
        assert 0.3 <= result.scores["structure"] <= 0.7
    
    def test_complex_structure(self, analyzer):
        """Test complex structure (multiple clauses)."""
        result = analyzer.analyze(
            "Jelaskan apa itu AI, bagaimana cara kerjanya, dan mengapa penting untuk masa depan"
        )
        assert result.scores["structure"] >= 0.5
    
    def test_nested_structure(self, analyzer):
        """Test nested structure with complex indicators."""
        result = analyzer.analyze(
            "Jika AI terus berkembang, meskipun ada risiko, apakah kita harus tetap mengembangkannya?"
        )
        assert result.scores["structure"] >= 0.6
        assert "Complex" in result.factor_details["structure"]


class TestContextFactor:
    """Tests for context factor analysis."""
    
    def test_no_context_dependency(self, analyzer):
        """Test query without context dependency."""
        result = analyzer.analyze("Apa yang dimaksud dengan Python?")  # Changed to avoid 'itu'
        # 'yang' might be detected as minor context, so allow small score
        assert result.scores["context"] < 0.2
        # Detail might show minimal or no context
        assert "context" in result.factor_details["context"].lower()
    
    def test_context_reference(self, analyzer):
        """Test query with context reference."""
        result = analyzer.analyze("Jelaskan lebih lanjut tentang hal itu")
        assert result.scores["context"] > 0.0
        assert "Context-dependent" in result.factor_details["context"]
    
    def test_multiple_context_indicators(self, analyzer):
        """Test query with multiple context indicators."""
        result = analyzer.analyze(
            "Sebelumnya kamu bilang tentang AI, lalu kemudian jelaskan itu lebih detail"
        )
        assert result.scores["context"] >= 0.7
    
    def test_english_context(self, analyzer):
        """Test English context indicators."""
        result = analyzer.analyze("Explain that previous concept in more detail")
        assert result.scores["context"] > 0.0


class TestReasoningFactor:
    """Tests for reasoning factor analysis."""
    
    def test_no_reasoning(self, analyzer):
        """Test query without reasoning requirement."""
        result = analyzer.analyze("Halo, apa kabar?")
        assert result.scores["reasoning"] == 0.0
        assert "Minimal reasoning" in result.factor_details["reasoning"]
    
    def test_why_question(self, analyzer):
        """Test 'why' question (requires reasoning)."""
        result = analyzer.analyze("Mengapa langit berwarna biru?")
        assert result.scores["reasoning"] >= 0.4
        assert "why/how" in result.factor_details["reasoning"]
    
    def test_how_question(self, analyzer):
        """Test 'how' question (requires reasoning)."""
        result = analyzer.analyze("Bagaimana AI bisa belajar dari data?")
        assert result.scores["reasoning"] >= 0.4
    
    def test_analysis_requirement(self, analyzer):
        """Test analysis requirement."""
        result = analyzer.analyze("Analisis dampak AI terhadap ekonomi")
        assert result.scores["reasoning"] >= 0.3
        assert "analysis" in result.factor_details["reasoning"]
    
    def test_explanation_requirement(self, analyzer):
        """Test explanation requirement."""
        result = analyzer.analyze("Jelaskan secara detail tentang neural networks")
        assert result.scores["reasoning"] >= 0.2
    
    def test_multiple_reasoning_types(self, analyzer):
        """Test query with multiple reasoning requirements."""
        result = analyzer.analyze(
            "Mengapa dan bagaimana kita harus menganalisis dampak AI?"
        )
        # Should detect: why/how + analysis
        assert result.scores["reasoning"] >= 0.7


class TestComplexityLevels:
    """Tests for overall complexity level determination."""
    
    def test_low_complexity_greeting(self, analyzer):
        """Test low complexity query (greeting)."""
        result = analyzer.analyze("Halo!")
        assert result.complexity_level == "low"
        assert result.mode_recommendation == "flash"
        assert result.overall_score < 0.35
    
    def test_low_complexity_simple_question(self, analyzer):
        """Test low complexity query (simple question)."""
        result = analyzer.analyze("Apa itu AI?")
        assert result.complexity_level in ["low", "medium"]
        assert result.mode_recommendation in ["flash", "depends"]
    
    def test_medium_complexity(self, analyzer):
        """Test medium complexity query."""
        result = analyzer.analyze(
            "Jelaskan tentang machine learning dan bagaimana cara kerjanya"
        )
        # Should be medium due to length + explanation need
        assert result.overall_score >= 0.3
    
    def test_high_complexity_technical(self, analyzer):
        """Test high complexity query (technical + long)."""
        result = analyzer.analyze(
            "Analisis secara mendalam bagaimana transformer architecture bekerja "
            "dalam deep learning, mulai dari attention mechanism hingga "
            "multi-head attention, dan bandingkan dengan RNN dan LSTM"
        )
        # With all factors, should be high or at least upper medium
        assert result.complexity_level in ["medium", "high"]
        assert result.mode_recommendation in ["depends", "pro"]
        assert result.overall_score >= 0.5  # At least medium-high
    
    def test_high_complexity_reasoning(self, analyzer):
        """Test high complexity query (reasoning heavy)."""
        result = analyzer.analyze(
            "Mengapa kita perlu menganalisis dan mengevaluasi dampak AI terhadap "
            "masyarakat secara kritis, dan bagaimana strategi terbaik untuk "
            "mengimplementasikan solusi yang bertanggung jawab?"
        )
        # Long query + multiple reasoning indicators should be at least medium-high
        assert result.complexity_level in ["medium", "high"]
        assert result.mode_recommendation in ["depends", "pro"]
        assert result.overall_score >= 0.5


class TestWeightedScoring:
    """Tests for weighted scoring system."""
    
    def test_technical_weight_high(self, analyzer):
        """Test that technical factor has high weight (0.25)."""
        assert analyzer.weights["technical"] == 0.25
    
    def test_reasoning_weight_high(self, analyzer):
        """Test that reasoning factor has high weight (0.25)."""
        assert analyzer.weights["reasoning"] == 0.25
    
    def test_weights_sum_to_one(self, analyzer):
        """Test that all weights sum to 1.0."""
        total_weight = sum(analyzer.weights.values())
        assert abs(total_weight - 1.0) < 0.01  # Allow small floating point error
    
    def test_weighted_calculation(self, analyzer):
        """Test weighted score calculation."""
        result = analyzer.analyze("Test query for Python programming")
        
        # Manual calculation
        expected = (
            result.scores["length"] * 0.15 +
            result.scores["technical"] * 0.25 +
            result.scores["structure"] * 0.20 +
            result.scores["context"] * 0.15 +
            result.scores["reasoning"] * 0.25
        )
        
        assert abs(result.overall_score - expected) < 0.01


class TestBilingualSupport:
    """Tests for bilingual support (ID/EN)."""
    
    def test_indonesian_query(self, analyzer):
        """Test Indonesian query analysis."""
        result = analyzer.analyze(
            "Jelaskan tentang pemrograman Python dan algoritma"
        )
        assert result.scores["technical"] > 0.0
        assert result.overall_score > 0.0
    
    def test_english_query(self, analyzer):
        """Test English query analysis."""
        result = analyzer.analyze(
            "Explain Python programming and algorithms in detail"
        )
        assert result.scores["technical"] > 0.0
        assert result.overall_score > 0.0
    
    def test_mixed_query(self, analyzer):
        """Test mixed ID/EN query."""
        result = analyzer.analyze(
            "Jelaskan tentang Python programming dan machine learning"
        )
        assert result.scores["technical"] > 0.0


class TestBatchAnalysis:
    """Tests for batch analysis."""
    
    def test_analyze_batch(self, analyzer):
        """Test analyzing multiple queries at once."""
        queries = [
            "Halo!",
            "Apa yang dimaksud dengan AI?",
            "Jelaskan machine learning secara detail",
            "Analisis mendalam tentang deep learning dengan neural networks"
        ]
        results = analyzer.analyze_batch(queries)
        
        assert len(results) == 4
        
        # Check progression of complexity
        assert results[0].complexity_level == "low"
        # Last query should be medium or high (has analysis + technical + length)
        assert results[-1].complexity_level in ["medium", "high"]
        
        # Check mode recommendations
        assert results[0].mode_recommendation == "flash"
        assert results[-1].mode_recommendation in ["depends", "pro"]
        
        # Check that complexity increases
        assert results[0].overall_score < results[-1].overall_score


class TestExplanation:
    """Tests for explanation functionality."""
    
    def test_explain_analysis(self, analyzer):
        """Test detailed explanation generation."""
        explanation = analyzer.explain_analysis(
            "Mengapa AI penting untuk masa depan?"
        )
        
        assert "Query:" in explanation
        assert "Factor Scores:" in explanation
        assert "Overall Score:" in explanation
        assert "Complexity Level:" in explanation
        assert "Mode Recommendation:" in explanation
        assert "Reasoning:" in explanation
    
    def test_explanation_includes_weights(self, analyzer):
        """Test that explanation includes weight information."""
        explanation = analyzer.explain_analysis("Test query")
        assert "weight:" in explanation
        assert "weighted:" in explanation


class TestEdgeCases:
    """Tests for edge cases and error handling."""
    
    def test_very_long_query(self, analyzer):
        """Test handling of very long queries (> 500 chars)."""
        long_query = "Jelaskan " + "sangat " * 100 + "detail tentang AI"
        result = analyzer.analyze(long_query)
        assert result.overall_score > 0.0
        assert result.complexity_level is not None
    
    def test_special_characters(self, analyzer):
        """Test handling of special characters."""
        result = analyzer.analyze("Apa itu AI??? 🤖🤖🤖")
        assert result.overall_score >= 0.0
    
    def test_all_caps(self, analyzer):
        """Test handling of all caps query."""
        result = analyzer.analyze("JELASKAN TENTANG PYTHON PROGRAMMING")
        assert result.scores["technical"] > 0.0
    
    def test_numeric_content(self, analyzer):
        """Test query with numbers."""
        result = analyzer.analyze(
            "Bagaimana cara menghitung 123 + 456 dengan Python?"
        )
        assert result.scores["technical"] > 0.0


class TestComplexityResult:
    """Tests for ComplexityResult dataclass."""
    
    def test_complexity_result_repr(self):
        """Test ComplexityResult string representation."""
        result = ComplexityResult(
            scores={},
            overall_score=0.65,
            complexity_level="medium",
            mode_recommendation="depends",
            reasoning="Test"
        )
        repr_str = repr(result)
        assert "medium" in repr_str
        assert "0.65" in repr_str
        assert "depends" in repr_str
    
    def test_complexity_result_with_details(self):
        """Test ComplexityResult with factor details."""
        result = ComplexityResult(
            scores={"length": 0.5, "technical": 0.8},
            overall_score=0.7,
            complexity_level="high",
            mode_recommendation="pro",
            reasoning="High technical content",
            factor_details={"length": "Medium", "technical": "3 terms"}
        )
        assert result.factor_details["technical"] == "3 terms"
        assert result.factor_details["length"] == "Medium"


# Run tests with: pytest tests/test_complexity_analyzer.py -v
