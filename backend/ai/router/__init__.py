"""Smart Router Module - Intelligent routing for Flash vs Pro flows.

Phase 6.8: Smart Router Implementation
- 6.8.1: Intent Classifier (current)
- 6.8.2: Complexity Analyzer (upcoming)
- 6.8.3: Context-Aware Layer (upcoming)
- 6.8.4: Mode Selector (upcoming)
"""

from .intent_classifier import IntentClassifier, IntentResult

__all__ = [
    "IntentClassifier",
    "IntentResult",
]
