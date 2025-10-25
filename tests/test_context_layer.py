"""Tests for Context-Aware Layer (Phase 6.8.3).

Test coverage:
- SessionTracker: Session management and history
- TopicContinuity: Keyword extraction and similarity
- ContextScorer: Context dependency scoring
"""

import pytest
import time
from backend.ai.router.context_layer import (
    SessionTracker,
    TopicContinuity,
    ContextScorer,
    SessionData,
    ContextResult
)


class TestSessionTracker:
    """Test SessionTracker functionality."""
    
    def test_create_session(self):
        """Test session creation."""
        tracker = SessionTracker()
        session = tracker.create_session("user1")
        
        assert session.session_id == "user1"
        assert len(session.queries) == 0
        assert session.created_at > 0
    
    def test_get_session_exists(self):
        """Test getting existing session."""
        tracker = SessionTracker()
        tracker.create_session("user1")
        
        session = tracker.get_session("user1")
        assert session is not None
        assert session.session_id == "user1"
    
    def test_get_session_not_exists(self):
        """Test getting non-existent session."""
        tracker = SessionTracker()
        session = tracker.get_session("user999")
        
        assert session is None
    
    def test_add_query_new_session(self):
        """Test adding query creates session automatically."""
        tracker = SessionTracker()
        session = tracker.add_query("user1", "Apa itu AI?")
        
        assert session.session_id == "user1"
        assert len(session.queries) == 1
        assert session.queries[0] == "Apa itu AI?"
    
    def test_add_query_existing_session(self):
        """Test adding query to existing session."""
        tracker = SessionTracker()
        tracker.add_query("user1", "Apa itu AI?")
        session = tracker.add_query("user1", "Jelaskan machine learning")
        
        assert len(session.queries) == 2
        assert session.queries[1] == "Jelaskan machine learning"
    
    def test_add_query_with_topics(self):
        """Test adding query with topics."""
        tracker = SessionTracker()
        session = tracker.add_query(
            "user1", 
            "Apa itu AI?", 
            topics=["ai", "artificial", "intelligence"]
        )
        
        assert len(session.topics) == 1
        assert session.topics[0] == ["ai", "artificial", "intelligence"]
    
    def test_max_history_limit(self):
        """Test that history is trimmed to max_history."""
        tracker = SessionTracker(max_history=3)
        
        # Add 5 queries
        for i in range(5):
            tracker.add_query("user1", f"Query {i}")
        
        session = tracker.get_session("user1")
        assert len(session.queries) == 3
        assert session.queries == ["Query 2", "Query 3", "Query 4"]
    
    def test_get_history_all(self):
        """Test getting all history."""
        tracker = SessionTracker()
        tracker.add_query("user1", "Query 1")
        tracker.add_query("user1", "Query 2")
        tracker.add_query("user1", "Query 3")
        
        history = tracker.get_history("user1")
        assert len(history) == 3
        assert history == ["Query 1", "Query 2", "Query 3"]
    
    def test_get_history_last_n(self):
        """Test getting last n queries."""
        tracker = SessionTracker()
        tracker.add_query("user1", "Query 1")
        tracker.add_query("user1", "Query 2")
        tracker.add_query("user1", "Query 3")
        
        history = tracker.get_history("user1", n=2)
        assert len(history) == 2
        assert history == ["Query 2", "Query 3"]
    
    def test_get_history_nonexistent_session(self):
        """Test getting history for non-existent session."""
        tracker = SessionTracker()
        history = tracker.get_history("user999")
        
        assert history == []
    
    def test_get_previous_query(self):
        """Test getting immediately previous query."""
        tracker = SessionTracker()
        tracker.add_query("user1", "Query 1")
        tracker.add_query("user1", "Query 2")
        
        prev = tracker.get_previous_query("user1")
        assert prev == "Query 2"
    
    def test_get_previous_query_empty_session(self):
        """Test getting previous query from empty session."""
        tracker = SessionTracker()
        prev = tracker.get_previous_query("user999")
        
        assert prev is None
    
    def test_clear_session(self):
        """Test clearing session."""
        tracker = SessionTracker()
        tracker.add_query("user1", "Query 1")
        
        tracker.clear_session("user1")
        session = tracker.get_session("user1")
        
        assert session is None
    
    def test_timestamps_recorded(self):
        """Test that timestamps are recorded."""
        tracker = SessionTracker()
        tracker.add_query("user1", "Query 1")
        
        session = tracker.get_session("user1")
        assert len(session.timestamps) == 1
        assert session.timestamps[0] > 0


class TestTopicContinuity:
    """Test TopicContinuity functionality."""
    
    def test_extract_keywords_basic(self):
        """Test basic keyword extraction."""
        continuity = TopicContinuity()
        keywords = continuity.extract_keywords("Apa itu machine learning?")
        
        assert "machine" in keywords
        assert "learning" in keywords
        assert "apa" not in keywords  # Stopword
    
    def test_extract_keywords_min_length(self):
        """Test minimum length filtering."""
        continuity = TopicContinuity()
        keywords = continuity.extract_keywords("AI is fun", min_length=3)
        
        assert "fun" in keywords
        assert "ai" not in keywords  # Too short
        assert "is" not in keywords  # Stopword and short
    
    def test_extract_keywords_stopwords_removed(self):
        """Test stopword removal."""
        continuity = TopicContinuity()
        keywords = continuity.extract_keywords(
            "Jelaskan tentang neural networks dan deep learning"
        )
        
        assert "neural" in keywords
        assert "networks" in keywords
        assert "deep" in keywords
        assert "learning" in keywords
        assert "tentang" not in keywords  # Stopword
        assert "dan" not in keywords  # Stopword
    
    def test_calculate_similarity_identical(self):
        """Test similarity for identical queries."""
        continuity = TopicContinuity()
        query = "Machine learning algorithms"
        
        similarity = continuity.calculate_similarity(query, query)
        assert similarity == 1.0
    
    def test_calculate_similarity_high(self):
        """Test high similarity."""
        continuity = TopicContinuity()
        q1 = "Apa itu machine learning?"
        q2 = "Jelaskan machine learning"
        
        similarity = continuity.calculate_similarity(q1, q2)
        assert similarity > 0.4  # Should have decent overlap
    
    def test_calculate_similarity_low(self):
        """Test low similarity."""
        continuity = TopicContinuity()
        q1 = "Apa itu AI?"
        q2 = "Bagaimana cuaca hari ini?"
        
        similarity = continuity.calculate_similarity(q1, q2)
        assert similarity < 0.3  # Should be low
    
    def test_calculate_similarity_no_overlap(self):
        """Test zero similarity."""
        continuity = TopicContinuity()
        q1 = "Python programming"
        q2 = "Cuaca hari ini"
        
        similarity = continuity.calculate_similarity(q1, q2)
        assert similarity == 0.0
    
    def test_calculate_similarity_empty(self):
        """Test similarity with empty queries."""
        continuity = TopicContinuity()
        
        assert continuity.calculate_similarity("", "test") == 0.0
        assert continuity.calculate_similarity("test", "") == 0.0
        assert continuity.calculate_similarity("", "") == 0.0
    
    def test_calculate_continuity_single_history(self):
        """Test continuity with single history query."""
        continuity = TopicContinuity()
        current = "Jelaskan supervised learning"
        history = ["Apa itu machine learning?"]
        
        score = continuity.calculate_continuity(current, history)
        assert score > 0.3  # Should have some continuity
    
    def test_calculate_continuity_multiple_history(self):
        """Test continuity with multiple history queries."""
        continuity = TopicContinuity()
        current = "Apa contoh algoritma supervised learning?"
        history = [
            "Apa itu machine learning?",
            "Jelaskan supervised learning",
            "Bagaimana cara kerja neural network?"
        ]
        
        score = continuity.calculate_continuity(current, history)
        assert score > 0.3  # Should have continuity
    
    def test_calculate_continuity_decay_factor(self):
        """Test that recent queries have more weight."""
        continuity = TopicContinuity()
        current = "Python programming tips"
        
        # Recent query is more relevant
        history1 = ["Java basics", "Python tutorial"]
        score1 = continuity.calculate_continuity(current, history1)
        
        # Older query is more relevant
        history2 = ["Python tutorial", "Java basics"]
        score2 = continuity.calculate_continuity(current, history2)
        
        assert score1 > score2  # Recent relevance should score higher
    
    def test_calculate_continuity_empty_history(self):
        """Test continuity with empty history."""
        continuity = TopicContinuity()
        score = continuity.calculate_continuity("Test query", [])
        
        assert score == 0.0


class TestContextScorer:
    """Test ContextScorer functionality."""
    
    def test_score_no_context(self):
        """Test scoring query with no context."""
        scorer = ContextScorer()
        result = scorer.score("Apa itu AI?")
        
        assert isinstance(result, ContextResult)
        assert result.score >= 0.0
        assert result.score <= 1.0
        assert result.has_reference == False
    
    def test_score_with_reference_words_id(self):
        """Test detecting Indonesian reference words."""
        scorer = ContextScorer()
        result = scorer.score("Jelaskan lebih detail tentang itu")
        
        assert result.has_reference == True
        assert result.score > 0.3
    
    def test_score_with_reference_words_en(self):
        """Test detecting English reference words."""
        scorer = ContextScorer()
        result = scorer.score("Explain that in more detail")
        
        assert result.has_reference == True
        assert result.score > 0.3
    
    def test_score_multiple_reference_words(self):
        """Test multiple reference words increase score."""
        scorer = ContextScorer()
        result = scorer.score("Jelaskan itu dan ini lebih detail")
        
        assert result.has_reference == True
        assert result.score > 0.5  # Multiple references
    
    def test_score_with_session_single_query(self):
        """Test scoring with session context (single previous query)."""
        scorer = ContextScorer()
        tracker = SessionTracker()
        
        # Add previous query
        tracker.add_query("user1", "Apa itu machine learning?")
        
        # Current query
        tracker.add_query("user1", "Jelaskan supervised learning")
        result = scorer.score(
            "Jelaskan supervised learning",
            session_id="user1",
            session_tracker=tracker
        )
        
        assert result.session_length == 2
        assert result.topic_continuity > 0.0  # Should detect some continuity
    
    def test_score_with_session_multiple_queries(self):
        """Test scoring with longer session."""
        scorer = ContextScorer()
        tracker = SessionTracker()
        
        # Build conversation history
        queries = [
            "Apa itu AI?",
            "Jelaskan machine learning",
            "Apa itu supervised learning?",
            "Berikan contoh algoritma supervised learning"
        ]
        
        for q in queries:
            tracker.add_query("user1", q)
        
        result = scorer.score(
            queries[-1],
            session_id="user1",
            session_tracker=tracker
        )
        
        assert result.session_length == 4
        assert result.topic_continuity > 0.2  # Should have continuity
    
    def test_score_session_bonus(self):
        """Test that longer sessions get bonus."""
        scorer = ContextScorer()
        tracker = SessionTracker()
        
        # Short session
        tracker.add_query("user1", "Query 1")
        tracker.add_query("user1", "Query 2")
        result1 = scorer.score("Query 2", "user1", tracker)
        
        # Long session
        for i in range(10):
            tracker.add_query("user2", f"Query {i}")
        result2 = scorer.score("Query 9", "user2", tracker)
        
        # Longer session should have higher score (due to bonus)
        assert result2.details["session_bonus"] > result1.details["session_bonus"]
    
    def test_score_high_context_dependency(self):
        """Test high context dependency scenario."""
        scorer = ContextScorer()
        tracker = SessionTracker()
        
        # Build context-heavy conversation
        tracker.add_query("user1", "Apa itu neural network?")
        tracker.add_query("user1", "Jelaskan arsitekturnya")
        tracker.add_query("user1", "Bagaimana cara melatih model tersebut?")
        tracker.add_query("user1", "Apa kelebihan pendekatan itu?")
        
        result = scorer.score(
            "Jelaskan lebih detail tentang hal tersebut",
            session_id="user1",
            session_tracker=tracker
        )
        
        assert result.has_reference == True
        assert result.score > 0.5  # Should be high
        assert "High context dependency" in result.reasoning
    
    def test_score_reasoning_generation(self):
        """Test reasoning generation."""
        scorer = ContextScorer()
        result = scorer.score("Apa itu AI?")
        
        assert result.reasoning is not None
        assert len(result.reasoning) > 0
        assert "context dependency" in result.reasoning.lower()
    
    def test_score_empty_query(self):
        """Test scoring empty query."""
        scorer = ContextScorer()
        result = scorer.score("")
        
        assert result.score == 0.0
        assert result.has_reference == False


# Integration Tests

def test_full_context_pipeline():
    """Test complete context tracking pipeline."""
    tracker = SessionTracker()
    scorer = ContextScorer()
    
    # Simulate conversation
    conversation = [
        "Apa itu machine learning?",
        "Jelaskan supervised learning",
        "Berikan contoh algoritma supervised",
        "Bagaimana cara kerja algoritma tersebut?"
    ]
    
    for query in conversation:
        tracker.add_query("user1", query)
        result = scorer.score(query, "user1", tracker)
        
        # Verify result structure
        assert isinstance(result, ContextResult)
        assert 0.0 <= result.score <= 1.0
    
    # Last query should have high context (reference word + continuity)
    final_result = scorer.score(conversation[-1], "user1", tracker)
    assert final_result.has_reference == True
    assert final_result.session_length == 4


def test_topic_shift_detection():
    """Test that topic shifts reduce continuity."""
    tracker = SessionTracker()
    scorer = ContextScorer()
    
    # AI topic
    tracker.add_query("user1", "Apa itu AI?")
    tracker.add_query("user1", "Jelaskan machine learning")
    
    # Shift to weather topic
    tracker.add_query("user1", "Bagaimana cuaca hari ini?")
    
    result = scorer.score("Bagaimana cuaca hari ini?", "user1", tracker)
    
    # Should have low topic continuity (topic shift)
    assert result.topic_continuity < 0.3


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
