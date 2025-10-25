"""Interactive demo for Intent Classifier (Phase 6.8.1).

Demonstrates intent classification for various query types with
bilingual support (ID/EN) and flash vs pro mode routing.

Usage:
    python tests/demo_intent_classifier.py
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai.router import IntentClassifier


def print_header(title: str):
    """Print formatted section header."""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_result(query: str, result):
    """Print classification result in formatted way."""
    print(f"\n📝 Query: \"{query}\"")
    print(f"   Length: {len(query)} characters")
    print(f"\n🎯 Classification:")
    print(f"   Intent:     {result.intent}")
    print(f"   Confidence: {result.confidence:.2f}")
    print(f"   Mode:       {result.mode_hint.upper()}")
    print(f"\n💡 Reasoning:")
    print(f"   {result.reasoning}")
    
    # Show top 3 scores
    if result.scores:
        sorted_scores = sorted(result.scores.items(), key=lambda x: x[1], reverse=True)[:3]
        print(f"\n📊 Top 3 Intent Scores:")
        for intent, score in sorted_scores:
            print(f"   {intent:20s}: {score:.3f}")


def demo_greetings(classifier):
    """Demo greeting intent classification."""
    print_header("GREETING INTENT (Flash Mode)")
    
    test_queries = [
        "Halo!",
        "Hai, apa kabar?",
        "Selamat pagi!",
        "Hello, how are you?",
        "Good morning!",
    ]
    
    for query in test_queries:
        result = classifier.classify(query)
        print_result(query, result)


def demo_simple_questions(classifier):
    """Demo simple question intent classification."""
    print_header("SIMPLE QUESTION INTENT (Flash Mode)")
    
    test_queries = [
        "Apa itu AI?",
        "Siapa presiden Indonesia?",
        "Kapan Indonesia merdeka?",
        "Dimana letak Jakarta?",
        "Berapa hasil 10 + 20?",
        "What is Python?",
        "Who invented the internet?",
    ]
    
    for query in test_queries:
        result = classifier.classify(query)
        print_result(query, result)


def demo_complex_questions(classifier):
    """Demo complex question intent classification."""
    print_header("COMPLEX QUESTION INTENT (Pro Mode)")
    
    test_queries = [
        "Mengapa langit berwarna biru?",
        "Apa perbedaan antara AI dan Machine Learning?",
        "Bandingkan Python dengan JavaScript untuk web development",
        "Jelaskan mengapa dan bagaimana AI bisa belajar dari data?",
        "Why is climate change happening?",
        "What's the difference between AI and ML?",
    ]
    
    for query in test_queries:
        result = classifier.classify(query)
        print_result(query, result)


def demo_analytical(classifier):
    """Demo analytical intent classification."""
    print_header("ANALYTICAL INTENT (Pro Mode)")
    
    test_queries = [
        "Analisis dampak AI terhadap pasar kerja di Indonesia",
        "Jelaskan penelitian terbaru tentang quantum computing secara mendalam",
        "Evaluasi kelebihan dan kekurangan sistem pendidikan Indonesia",
        "Provide a critical analysis of renewable energy solutions",
        "Research on the impact of social media on mental health",
    ]
    
    for query in test_queries:
        result = classifier.classify(query)
        print_result(query, result)


def demo_creative(classifier):
    """Demo creative intent classification."""
    print_header("CREATIVE INTENT (Pro Mode)")
    
    test_queries = [
        "Buatkan cerita pendek tentang robot yang jatuh cinta",
        "Tuliskan puisi tentang malam berbintang",
        "Buat ide kreatif untuk startup teknologi pendidikan",
        "Ciptakan karakter untuk game RPG fantasy",
        "Write a short story about time travel",
        "Create a poem about the ocean",
    ]
    
    for query in test_queries:
        result = classifier.classify(query)
        print_result(query, result)


def demo_informational(classifier):
    """Demo informational intent classification."""
    print_header("INFORMATIONAL INTENT (Depends Mode)")
    
    test_queries = [
        "Jelaskan tentang fotosintesis",
        "Bagaimana cara membuat website?",
        "Ceritakan tentang sejarah Indonesia",
        "Informasi tentang planet Mars",
        "Explain how blockchain works",
        "Tell me about the solar system",
    ]
    
    for query in test_queries:
        result = classifier.classify(query)
        print_result(query, result)


def demo_heuristics(classifier):
    """Demo heuristic adjustments."""
    print_header("HEURISTIC ADJUSTMENTS")
    
    test_queries = [
        # Very short query
        ("AI?", "Very short query → should favor flash mode"),
        
        # Long complex query
        (
            "Jelaskan secara mendalam mengapa sistem kecerdasan buatan modern "
            "memerlukan dataset yang sangat besar untuk training, apa dampaknya "
            "terhadap privasi data, dan bagaimana kita bisa menyeimbangkan antara "
            "performa model dengan perlindungan data pribadi pengguna?",
            "Long complex query → should favor pro mode"
        ),
        
        # Multiple question words
        ("Mengapa dan bagaimana AI bisa belajar dari data?", "Multiple question words → complex"),
        
        # Comparison detection
        ("Apa bedanya Python vs JavaScript?", "Comparison detection → pro mode"),
    ]
    
    for query, description in test_queries:
        print(f"\n{'─' * 70}")
        print(f"Test: {description}")
        result = classifier.classify(query)
        print_result(query, result)


def demo_bilingual(classifier):
    """Demo bilingual support."""
    print_header("BILINGUAL SUPPORT (ID Priority, EN Fallback)")
    
    test_pairs = [
        ("Apa itu machine learning?", "What is machine learning?"),
        ("Mengapa langit biru?", "Why is the sky blue?"),
        ("Jelaskan tentang AI", "Explain about AI"),
        ("Buatkan cerita", "Write a story"),
    ]
    
    for query_id, query_en in test_pairs:
        print(f"\n{'─' * 70}")
        print("🇮🇩 Indonesian Query:")
        result_id = classifier.classify(query_id)
        print_result(query_id, result_id)
        
        print(f"\n{'─' * 70}")
        print("🇬🇧 English Query:")
        result_en = classifier.classify(query_en)
        print_result(query_en, result_en)
        
        # Compare
        print(f"\n📊 Comparison:")
        print(f"   Same intent: {result_id.intent == result_en.intent}")
        print(f"   ID confidence: {result_id.confidence:.3f}")
        print(f"   EN confidence: {result_en.confidence:.3f}")


def demo_batch_classification(classifier):
    """Demo batch classification."""
    print_header("BATCH CLASSIFICATION")
    
    queries = [
        "Halo!",
        "Apa itu AI?",
        "Mengapa langit biru?",
        "Buatkan cerita tentang robot",
        "Analisis dampak teknologi",
        "Terima kasih!"
    ]
    
    print("\n📋 Classifying batch of queries...\n")
    results = classifier.classify_batch(queries)
    
    print(f"{'No':<4} {'Query':<40} {'Intent':<20} {'Mode':<8} {'Conf':<6}")
    print("─" * 80)
    
    for i, (query, result) in enumerate(zip(queries, results), 1):
        query_short = query[:37] + "..." if len(query) > 40 else query
        print(f"{i:<4} {query_short:<40} {result.intent:<20} {result.mode_hint.upper():<8} {result.confidence:.2f}")


def demo_explain_classification(classifier):
    """Demo detailed classification explanation."""
    print_header("DETAILED CLASSIFICATION EXPLANATION")
    
    test_queries = [
        "Apa perbedaan AI dan ML?",
        "Halo, apa kabar?",
        "Buatkan cerita pendek tentang ruang angkasa"
    ]
    
    for query in test_queries:
        print(f"\n{'─' * 70}")
        explanation = classifier.explain_classification(query)
        print(explanation)


def demo_interactive(classifier):
    """Interactive demo - user can input queries."""
    print_header("INTERACTIVE MODE")
    
    print("\n💬 Enter your queries to see classification results.")
    print("   Type 'quit' or 'exit' to stop.\n")
    
    while True:
        try:
            query = input("Query: ").strip()
            
            if query.lower() in ['quit', 'exit', 'q']:
                print("\n👋 Goodbye!")
                break
            
            if not query:
                continue
            
            result = classifier.classify(query)
            print_result(query, result)
            print()
            
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}\n")


def main():
    """Run all demos."""
    print("\n" + "🎯" * 35)
    print("  INTENT CLASSIFIER DEMO - Phase 6.8.1")
    print("  Flash vs Pro Routing with Bilingual Support")
    print("🎯" * 35)
    
    # Initialize classifier
    print("\n⚙️  Initializing Intent Classifier...")
    classifier = IntentClassifier()
    print("✅ Classifier ready!")
    
    # Run demos
    demos = [
        ("Greetings", demo_greetings),
        ("Simple Questions", demo_simple_questions),
        ("Complex Questions", demo_complex_questions),
        ("Analytical", demo_analytical),
        ("Creative", demo_creative),
        ("Informational", demo_informational),
        ("Heuristics", demo_heuristics),
        ("Bilingual Support", demo_bilingual),
        ("Batch Classification", demo_batch_classification),
        ("Explain Classification", demo_explain_classification),
    ]
    
    print("\n" + "=" * 70)
    print("  DEMO MENU")
    print("=" * 70)
    print("\nAvailable demos:")
    for i, (name, _) in enumerate(demos, 1):
        print(f"  {i}. {name}")
    print(f"  {len(demos) + 1}. Interactive Mode")
    print(f"  {len(demos) + 2}. Run All Demos")
    print("  0. Exit")
    
    while True:
        try:
            choice = input("\nSelect demo (0-{}): ".format(len(demos) + 2)).strip()
            
            if choice == '0':
                print("\n👋 Goodbye!")
                break
            
            if choice == str(len(demos) + 1):
                demo_interactive(classifier)
                break
            
            if choice == str(len(demos) + 2):
                # Run all demos
                for name, demo_func in demos:
                    demo_func(classifier)
                    input("\n⏸️  Press Enter to continue to next demo...")
                break
            
            try:
                demo_index = int(choice) - 1
                if 0 <= demo_index < len(demos):
                    name, demo_func = demos[demo_index]
                    demo_func(classifier)
                    input("\n⏸️  Press Enter to return to menu...")
                else:
                    print("❌ Invalid choice. Try again.")
            except ValueError:
                print("❌ Invalid input. Enter a number.")
        
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
    
    print("\n" + "🎯" * 35)
    print("  Thank you for using Intent Classifier Demo!")
    print("🎯" * 35 + "\n")


if __name__ == "__main__":
    main()
