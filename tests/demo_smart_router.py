"""Interactive Demo for Smart Router (Phase 6.8.3 & 6.8.4).

Demonstrates complete routing pipeline:
- Intent Classification
- Complexity Analysis  
- Context Awareness
- Mode Selection

Usage:
    python tests/demo_smart_router.py
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from ai.router import (
    IntentClassifier,
    ComplexityAnalyzer,
    ContextScorer,
    SessionTracker,
    ModeSelector
)


def print_separator(char="=", length=80):
    """Print a separator line."""
    print(char * length)


def print_header(text):
    """Print a section header."""
    print_separator()
    print(f"  {text}")
    print_separator()


def demo_basic_routing():
    """Demo basic routing without context."""
    print_header("DEMO 1: Basic Routing (No Context)")
    
    # Initialize components
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    context_scorer = ContextScorer()
    selector = ModeSelector()
    
    # Test queries
    test_queries = [
        "Halo!",
        "Apa itu AI?",
        "Jelaskan tentang machine learning",
        "Apa perbedaan antara supervised dan unsupervised learning?",
        "Analisis mendalam tentang transformer architecture dalam deep learning",
        "Buatkan cerita tentang robot yang belajar mencintai"
    ]
    
    print("\n📋 Test Queries & Routing Decisions:\n")
    
    for i, query in enumerate(test_queries, 1):
        print(f"{i}. Query: \"{query}\"")
        print(f"   Length: {len(query)} chars\n")
        
        # Run pipeline
        intent = intent_classifier.classify(query)
        complexity = complexity_analyzer.analyze(query)
        context = context_scorer.score(query)
        decision = selector.select_mode(intent, complexity, context)
        
        # Display results
        print(f"   Intent:      {intent.intent:20s} (conf: {intent.confidence:.2f}, hint: {intent.mode_hint})")
        print(f"   Complexity:  {complexity.complexity_level:20s} (score: {complexity.overall_score:.2f})")
        print(f"   Context:     {'dependent' if context.has_reference else 'independent':20s} (score: {context.score:.2f})")
        print(f"   ")
        print(f"   🎯 DECISION: Mode = {decision.mode.upper()}, Confidence = {decision.confidence:.2f}")
        print(f"   📊 Scores: Intent={decision.scores['intent']:.2f}, "
              f"Complexity={decision.scores['complexity']:.2f}, "
              f"Context={decision.scores['context']:.2f}")
        print()
    
    print_separator("=")


def demo_context_aware_routing():
    """Demo context-aware routing with session tracking."""
    print_header("DEMO 2: Context-Aware Routing (Multi-Turn Conversation)")
    
    # Initialize components
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    context_scorer = ContextScorer()
    selector = ModeSelector()
    tracker = SessionTracker()
    
    # Simulated conversation
    conversation = [
        ("Apa itu neural network?", "user1"),
        ("Bagaimana cara kerjanya?", "user1"),
        ("Jelaskan tentang backpropagation", "user1"),
        ("Apa kelebihan metode tersebut?", "user1"),
        ("Bandingkan dengan gradient descent biasa", "user1"),
    ]
    
    print("\n💬 Multi-Turn Conversation:\n")
    
    for i, (query, session_id) in enumerate(conversation, 1):
        # Add to session
        tracker.add_query(session_id, query)
        
        print(f"Turn {i}: \"{query}\"")
        
        # Run pipeline with context
        intent = intent_classifier.classify(query)
        complexity = complexity_analyzer.analyze(query)
        context = context_scorer.score(query, session_id, tracker)
        decision = selector.select_mode(intent, complexity, context)
        
        # Display context awareness
        print(f"   Session Length: {context.session_length}")
        print(f"   Has Reference:  {context.has_reference}")
        print(f"   Topic Cont.:    {context.topic_continuity:.2f}")
        print(f"   Context Score:  {context.score:.2f}")
        print(f"   ")
        print(f"   🎯 Mode: {decision.mode.upper()} (conf: {decision.confidence:.2f})")
        print()
    
    print_separator("=")


def demo_detailed_analysis():
    """Demo detailed analysis with full explanation."""
    print_header("DEMO 3: Detailed Analysis with Explanations")
    
    # Initialize components
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    context_scorer = ContextScorer()
    selector = ModeSelector()
    tracker = SessionTracker()
    
    # Complex query with context
    query = "Apa perbedaan fundamental antara arsitektur transformer dan RNN dalam konteks NLP?"
    
    print(f"\n📝 Query: \"{query}\"\n")
    
    # Build some context
    tracker.add_query("user1", "Apa itu transformer?")
    tracker.add_query("user1", "Bagaimana dengan RNN?")
    tracker.add_query("user1", query)
    
    # Run analysis
    intent = intent_classifier.classify(query)
    complexity = complexity_analyzer.analyze(query)
    context = context_scorer.score(query, "user1", tracker)
    
    # Intent details
    print("🎯 INTENT CLASSIFICATION:")
    print(intent_classifier.explain_classification(query))
    print()
    
    # Complexity details
    print("📊 COMPLEXITY ANALYSIS:")
    print(complexity_analyzer.explain_analysis(query))
    print()
    
    # Context details
    print("🔗 CONTEXT ANALYSIS:")
    print(f"Score: {context.score:.2f}")
    print(f"Has Reference: {context.has_reference}")
    print(f"Topic Continuity: {context.topic_continuity:.2f}")
    print(f"Session Length: {context.session_length}")
    print(f"Reasoning: {context.reasoning}")
    print()
    
    # Final decision
    print("🚀 MODE SELECTION:")
    explanation = selector.explain_decision(query, intent, complexity, context)
    print(explanation)
    
    print_separator("=")


def demo_edge_cases():
    """Demo edge cases and special scenarios."""
    print_header("DEMO 4: Edge Cases & Special Scenarios")
    
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    context_scorer = ContextScorer()
    selector = ModeSelector()
    
    edge_cases = [
        ("", "Empty query"),
        ("AI", "Ultra-short query"),
        ("Apa itu AI?", "Simple question"),
        ("Buatkan cerita panjang tentang petualangan robot di masa depan yang penuh dengan AI dan teknologi canggih, dengan karakter yang kompleks dan plot twist yang menarik", "Very long creative"),
        ("Jelaskan tentang itu", "Reference without context"),
        ("python javascript html css react vue", "Keyword spam"),
    ]
    
    print("\n⚠️  Edge Cases:\n")
    
    for i, (query, description) in enumerate(edge_cases, 1):
        print(f"{i}. {description}")
        print(f"   Query: \"{query}\"")
        
        if query:
            intent = intent_classifier.classify(query)
            complexity = complexity_analyzer.analyze(query)
            context = context_scorer.score(query)
            decision = selector.select_mode(intent, complexity, context)
            
            print(f"   → Mode: {decision.mode.upper()} (conf: {decision.confidence:.2f})")
        else:
            print(f"   → Skipped (empty query)")
        
        print()
    
    print_separator("=")


def demo_bilingual_support():
    """Demo bilingual (Indonesian + English) support."""
    print_header("DEMO 5: Bilingual Support (Indonesian + English)")
    
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    selector = ModeSelector()
    
    bilingual_queries = [
        ("Halo, apa kabar?", "ID - Greeting"),
        ("Hello, how are you?", "EN - Greeting"),
        ("Apa itu machine learning?", "ID - Simple question"),
        ("What is machine learning?", "EN - Simple question"),
        ("Jelaskan perbedaan AI dan ML", "ID - Complex question"),
        ("Explain the difference between AI and ML", "EN - Complex question"),
        ("Buatkan story tentang robot", "Mixed - Creative"),
    ]
    
    print("\n🌍 Bilingual Queries:\n")
    
    for i, (query, description) in enumerate(bilingual_queries, 1):
        print(f"{i}. {description}")
        print(f"   Query: \"{query}\"")
        
        intent = intent_classifier.classify(query)
        complexity = complexity_analyzer.analyze(query)
        context = context_scorer.score(query)
        decision = selector.select_mode(intent, complexity, context)
        
        print(f"   Intent: {intent.intent}, Mode: {decision.mode.upper()}")
        print()
    
    print_separator("=")


def demo_mode_comparison():
    """Demo mode comparison for same query with different context."""
    print_header("DEMO 6: Mode Comparison (Same Query, Different Context)")
    
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    context_scorer = ContextScorer()
    selector = ModeSelector()
    tracker = SessionTracker()
    
    query = "Jelaskan tentang itu"
    
    print(f"\n📝 Query: \"{query}\"\n")
    
    # Scenario 1: No context
    print("Scenario 1: No context (standalone query)")
    intent1 = intent_classifier.classify(query)
    complexity1 = complexity_analyzer.analyze(query)
    context1 = context_scorer.score(query)
    decision1 = selector.select_mode(intent1, complexity1, context1)
    
    print(f"   Context Score: {context1.score:.2f}")
    print(f"   Mode: {decision1.mode.upper()} (conf: {decision1.confidence:.2f})")
    print()
    
    # Scenario 2: With context
    print("Scenario 2: With context (after discussing AI)")
    tracker.add_query("user1", "Apa itu neural network?")
    tracker.add_query("user1", "Bagaimana cara melatihnya?")
    tracker.add_query("user1", query)
    
    intent2 = intent_classifier.classify(query)
    complexity2 = complexity_analyzer.analyze(query)
    context2 = context_scorer.score(query, "user1", tracker)
    decision2 = selector.select_mode(intent2, complexity2, context2)
    
    print(f"   Context Score: {context2.score:.2f}")
    print(f"   Session Length: {context2.session_length}")
    print(f"   Topic Continuity: {context2.topic_continuity:.2f}")
    print(f"   Mode: {decision2.mode.upper()} (conf: {decision2.confidence:.2f})")
    print()
    
    print("📊 Comparison:")
    print(f"   Context improved score by: {context2.score - context1.score:.2f}")
    print(f"   Mode changed: {decision1.mode} → {decision2.mode}")
    
    print_separator("=")


def interactive_mode():
    """Interactive mode for testing custom queries."""
    print_header("DEMO 7: Interactive Mode")
    
    intent_classifier = IntentClassifier()
    complexity_analyzer = ComplexityAnalyzer()
    context_scorer = ContextScorer()
    selector = ModeSelector()
    tracker = SessionTracker()
    
    session_id = "interactive_user"
    
    print("\n💡 Enter queries to test routing (type 'quit' to exit, 'clear' to reset session)\n")
    
    while True:
        try:
            query = input("Query: ").strip()
            
            if query.lower() == 'quit':
                break
            
            if query.lower() == 'clear':
                tracker.clear_session(session_id)
                print("✅ Session cleared\n")
                continue
            
            if not query:
                continue
            
            # Add to session
            tracker.add_query(session_id, query)
            
            # Run pipeline
            intent = intent_classifier.classify(query)
            complexity = complexity_analyzer.analyze(query)
            context = context_scorer.score(query, session_id, tracker)
            decision = selector.select_mode(intent, complexity, context)
            
            # Display results
            print(f"\n📊 Results:")
            print(f"   Intent:     {intent.intent} (conf: {intent.confidence:.2f})")
            print(f"   Complexity: {complexity.complexity_level} (score: {complexity.overall_score:.2f})")
            print(f"   Context:    score={context.score:.2f}, session_len={context.session_length}")
            print(f"   🎯 Mode:    {decision.mode.upper()} (confidence: {decision.confidence:.2f})")
            print(f"   Reasoning:  {decision.reasoning}\n")
            
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"❌ Error: {e}\n")
    
    print("\n👋 Interactive mode ended")
    print_separator("=")


def main():
    """Run all demos."""
    print("\n")
    print("=" * 80)
    print("  🚀 SMART ROUTER DEMO - Phase 6.8.3 & 6.8.4")
    print("  Context-Aware Routing with Weighted Mode Selection")
    print("=" * 80)
    print("\n")
    
    demos = [
        ("1", "Basic Routing", demo_basic_routing),
        ("2", "Context-Aware Routing", demo_context_aware_routing),
        ("3", "Detailed Analysis", demo_detailed_analysis),
        ("4", "Edge Cases", demo_edge_cases),
        ("5", "Bilingual Support", demo_bilingual_support),
        ("6", "Mode Comparison", demo_mode_comparison),
        ("7", "Interactive Mode", interactive_mode),
    ]
    
    print("Available demos:")
    for num, name, _ in demos:
        print(f"  {num}. {name}")
    print("  0. Run all demos")
    print()
    
    choice = input("Select demo (0-7): ").strip()
    print()
    
    if choice == "0":
        # Run all demos except interactive
        for num, name, demo_func in demos[:-1]:
            demo_func()
            print()
    else:
        # Run selected demo
        for num, name, demo_func in demos:
            if num == choice:
                demo_func()
                break
        else:
            print("Invalid choice")
    
    print("\n✅ Demo complete!\n")


if __name__ == "__main__":
    main()
