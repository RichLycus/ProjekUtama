"""Context-Aware Layer for Smart Router.

Phase 6.8.3: Context tracking and continuity detection.

Tracks conversation sessions and detects topic continuity to improve
routing decisions. Provides context scoring for multi-turn conversations.
"""

import re
import json
import time
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, field
from collections import defaultdict


@dataclass
class ContextResult:
    """Result of context analysis.
    
    Attributes:
        score: Overall context dependency score (0.0-1.0)
        has_reference: Whether query references previous context
        topic_continuity: Topic similarity with previous queries (0.0-1.0)
        session_length: Number of queries in current session
        reasoning: Human-readable explanation
        details: Additional context details
    """
    score: float
    has_reference: bool
    topic_continuity: float
    session_length: int
    reasoning: str
    details: Dict[str, any] = field(default_factory=dict)
    
    def __repr__(self) -> str:
        return (
            f"ContextResult(score={self.score:.2f}, "
            f"has_reference={self.has_reference}, "
            f"topic_continuity={self.topic_continuity:.2f})"
        )


@dataclass
class SessionData:
    """Conversation session data.
    
    Attributes:
        session_id: Unique session identifier
        queries: List of queries in this session
        timestamps: Timestamps for each query
        topics: Extracted topics/keywords per query
        created_at: Session creation timestamp
        last_updated: Last activity timestamp
    """
    session_id: str
    queries: List[str] = field(default_factory=list)
    timestamps: List[float] = field(default_factory=list)
    topics: List[List[str]] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    last_updated: float = field(default_factory=time.time)


class SessionTracker:
    """Tracks conversation sessions across queries.
    
    Maintains session history and provides access to previous queries
    for context analysis.
    
    Example:
        >>> tracker = SessionTracker()
        >>> tracker.create_session("user123")
        >>> tracker.add_query("user123", "Apa itu AI?")
        >>> tracker.add_query("user123", "Jelaskan lebih detail")
        >>> history = tracker.get_history("user123")
    """
    
    def __init__(self, max_history: int = 10):
        """Initialize session tracker.
        
        Args:
            max_history: Maximum queries to keep per session
        """
        self.sessions: Dict[str, SessionData] = {}
        self.max_history = max_history
    
    def create_session(self, session_id: str) -> SessionData:
        """Create a new session.
        
        Args:
            session_id: Unique session identifier
        
        Returns:
            Created SessionData object
        """
        session = SessionData(session_id=session_id)
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[SessionData]:
        """Get existing session.
        
        Args:
            session_id: Session identifier
        
        Returns:
            SessionData if exists, None otherwise
        """
        return self.sessions.get(session_id)
    
    def add_query(
        self, 
        session_id: str, 
        query: str, 
        topics: Optional[List[str]] = None
    ) -> SessionData:
        """Add query to session.
        
        Creates session if it doesn't exist. Maintains max_history limit.
        
        Args:
            session_id: Session identifier
            query: User query text
            topics: Optional extracted topics/keywords
        
        Returns:
            Updated SessionData
        """
        # Get or create session
        if session_id not in self.sessions:
            self.create_session(session_id)
        
        session = self.sessions[session_id]
        
        # Add query
        session.queries.append(query)
        session.timestamps.append(time.time())
        session.topics.append(topics or [])
        session.last_updated = time.time()
        
        # Trim history if needed
        if len(session.queries) > self.max_history:
            session.queries = session.queries[-self.max_history:]
            session.timestamps = session.timestamps[-self.max_history:]
            session.topics = session.topics[-self.max_history:]
        
        return session
    
    def get_history(
        self, 
        session_id: str, 
        n: Optional[int] = None
    ) -> List[str]:
        """Get query history for session.
        
        Args:
            session_id: Session identifier
            n: Number of recent queries to return (default: all)
        
        Returns:
            List of recent queries
        """
        session = self.get_session(session_id)
        if not session:
            return []
        
        if n is None:
            return session.queries
        return session.queries[-n:]
    
    def get_previous_query(self, session_id: str) -> Optional[str]:
        """Get immediately previous query.
        
        Args:
            session_id: Session identifier
        
        Returns:
            Previous query if exists, None otherwise
        """
        history = self.get_history(session_id, n=1)
        return history[-1] if history else None
    
    def clear_session(self, session_id: str):
        """Clear session data.
        
        Args:
            session_id: Session identifier
        """
        if session_id in self.sessions:
            del self.sessions[session_id]


class TopicContinuity:
    """Detects topic continuity between queries.
    
    Analyzes keyword overlap and topic similarity to determine
    if current query continues previous topic or starts new one.
    
    Example:
        >>> continuity = TopicContinuity()
        >>> score = continuity.calculate_similarity(
        ...     "Apa itu machine learning?",
        ...     "Jelaskan supervised learning"
        ... )
        >>> print(score)  # 0.5 (medium similarity)
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize topic continuity detector.
        
        Args:
            config_path: Optional path to router_config.json
        """
        if config_path is None:
            config_path = Path(__file__).parent / "router_config.json"
        else:
            config_path = Path(config_path)
        
        # Load config
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # Load stopwords (common words to ignore)
        self.stopwords = set([
            "apa", "adalah", "yang", "di", "ke", "dari", "untuk", "dan", "atau",
            "the", "is", "are", "in", "on", "to", "of", "for", "and", "or",
            "a", "an", "dengan", "tentang", "about", "tersebut", "itu", "ini"
        ])
    
    def extract_keywords(self, query: str, min_length: int = 3) -> List[str]:
        """Extract keywords from query.
        
        Removes stopwords and short words.
        
        Args:
            query: User query
            min_length: Minimum word length to keep
        
        Returns:
            List of keywords
        """
        # Lowercase and split
        words = re.findall(r'\b\w+\b', query.lower())
        
        # Filter stopwords and short words
        keywords = [
            word for word in words 
            if word not in self.stopwords and len(word) >= min_length
        ]
        
        return keywords
    
    def calculate_similarity(
        self, 
        current_query: str, 
        previous_query: str
    ) -> float:
        """Calculate topic similarity between two queries.
        
        Uses Jaccard similarity on keyword sets.
        
        Args:
            current_query: Current user query
            previous_query: Previous query to compare with
        
        Returns:
            Similarity score (0.0 to 1.0)
        """
        # Extract keywords
        current_keywords = set(self.extract_keywords(current_query))
        previous_keywords = set(self.extract_keywords(previous_query))
        
        # Handle empty sets
        if not current_keywords or not previous_keywords:
            return 0.0
        
        # Jaccard similarity
        intersection = len(current_keywords & previous_keywords)
        union = len(current_keywords | previous_keywords)
        
        similarity = intersection / union if union > 0 else 0.0
        
        return similarity
    
    def calculate_continuity(
        self, 
        current_query: str, 
        query_history: List[str],
        decay_factor: float = 0.8
    ) -> float:
        """Calculate topic continuity with query history.
        
        More recent queries have higher weight.
        
        Args:
            current_query: Current query
            query_history: List of previous queries (most recent last)
            decay_factor: Weight decay for older queries
        
        Returns:
            Continuity score (0.0 to 1.0)
        """
        if not query_history:
            return 0.0
        
        # Calculate weighted similarity with history
        total_score = 0.0
        total_weight = 0.0
        
        for i, prev_query in enumerate(reversed(query_history)):
            # More recent queries have higher weight
            weight = decay_factor ** i
            similarity = self.calculate_similarity(current_query, prev_query)
            
            total_score += similarity * weight
            total_weight += weight
        
        continuity = total_score / total_weight if total_weight > 0 else 0.0
        
        return continuity


class ContextScorer:
    """Scores context dependency for routing decisions.
    
    Combines multiple signals:
    1. Reference word detection (itu, ini, that, this)
    2. Topic continuity with previous queries
    3. Session length (multi-turn indicator)
    
    Example:
        >>> scorer = ContextScorer()
        >>> tracker = SessionTracker()
        >>> tracker.add_query("user1", "Apa itu AI?")
        >>> result = scorer.score(
        ...     "Jelaskan lebih detail tentang itu",
        ...     session_id="user1",
        ...     session_tracker=tracker
        ... )
        >>> print(result.score)  # 0.75 (high context dependency)
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """Initialize context scorer.
        
        Args:
            config_path: Optional path to router_config.json
        """
        if config_path is None:
            config_path = Path(__file__).parent / "router_config.json"
        else:
            config_path = Path(config_path)
        
        # Load config
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        self.context_indicators = config["complexity_analysis"]["context_indicators"]
        self.topic_continuity = TopicContinuity(config_path)
    
    def score(
        self,
        query: str,
        session_id: Optional[str] = None,
        session_tracker: Optional[SessionTracker] = None
    ) -> ContextResult:
        """Score context dependency for query.
        
        Args:
            query: Current user query
            session_id: Optional session identifier
            session_tracker: Optional SessionTracker instance
        
        Returns:
            ContextResult with context analysis
        """
        query_lower = query.lower().strip()
        
        # Factor 1: Reference word detection
        has_reference, reference_score = self._detect_references(query_lower)
        
        # Factor 2: Topic continuity (if session available)
        topic_score = 0.0
        session_length = 0
        
        if session_id and session_tracker:
            session = session_tracker.get_session(session_id)
            if session:
                session_length = len(session.queries)
                
                # Get previous queries (exclude current)
                history = session.queries[:-1] if session.queries else []
                
                if history:
                    topic_score = self.topic_continuity.calculate_continuity(
                        query, history
                    )
        
        # Factor 3: Session length bonus
        # Longer sessions indicate context-dependent conversation
        session_bonus = min(session_length * 0.05, 0.2)
        
        # Combine scores
        # Reference: 50%, Topic: 40%, Session: 10%
        overall_score = (
            reference_score * 0.5 +
            topic_score * 0.4 +
            session_bonus * 1.0  # Already capped at 0.2, so max contribution is 0.2
        )
        
        overall_score = min(overall_score, 1.0)
        
        # Generate reasoning
        reasoning = self._generate_reasoning(
            has_reference, reference_score, topic_score, 
            session_length, overall_score
        )
        
        return ContextResult(
            score=overall_score,
            has_reference=has_reference,
            topic_continuity=topic_score,
            session_length=session_length,
            reasoning=reasoning,
            details={
                "reference_score": reference_score,
                "topic_score": topic_score,
                "session_bonus": session_bonus
            }
        )
    
    def _detect_references(self, query_lower: str) -> Tuple[bool, float]:
        """Detect context reference words.
        
        Args:
            query_lower: Lowercased query
        
        Returns:
            Tuple of (has_reference, score)
        """
        matches = [
            word for word in self.context_indicators
            if word in query_lower
        ]
        
        has_reference = len(matches) > 0
        
        # Score based on number of reference words
        # 1 word = 0.4, 2 words = 0.7, 3+ = 1.0
        score = min(len(matches) * 0.35, 1.0)
        
        return has_reference, score
    
    def _generate_reasoning(
        self,
        has_reference: bool,
        reference_score: float,
        topic_score: float,
        session_length: int,
        overall_score: float
    ) -> str:
        """Generate human-readable reasoning.
        
        Args:
            has_reference: Whether references detected
            reference_score: Reference word score
            topic_score: Topic continuity score
            session_length: Session query count
            overall_score: Overall context score
        
        Returns:
            Reasoning explanation string
        """
        parts = []
        
        if overall_score < 0.3:
            parts.append("Low context dependency")
        elif overall_score < 0.6:
            parts.append("Moderate context dependency")
        else:
            parts.append("High context dependency")
        
        if has_reference:
            parts.append(f"reference words detected (score: {reference_score:.2f})")
        
        if topic_score > 0.3:
            parts.append(f"topic continuity (score: {topic_score:.2f})")
        
        if session_length > 3:
            parts.append(f"multi-turn conversation ({session_length} queries)")
        
        return ". ".join(parts) + "."
