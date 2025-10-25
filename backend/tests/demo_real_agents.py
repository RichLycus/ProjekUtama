"""
Demo Script for Phase 6.7.4 - Real Agents with Fallback

Demonstrates:
1. LLMAgent fallback mechanism (real → mock)
2. Complete flow execution in both modes
3. Cache hit/miss scenarios
4. Formatter output options
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai.agents.preprocessor import PreprocessorAgent
from ai.agents.llm_agent import LLMAgent
from ai.agents.formatter import FormatterAgent
from ai.agents.cache_lookup import CacheLookupAgent
from ai.agents.cache_store import CacheStoreAgent
from ai.flow.context import ExecutionContext
from ai.flow.registry import AgentRegistry
from ai.flow.executor import FlowExecutor
from ai.flow.loader import FlowConfig, StepConfig, ExecutionProfile, ErrorHandling, OptimizationConfig


def print_section(title: str):
    """Print section header."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def demo_preprocessor():
    """Demo preprocessor agent."""
    print_section("1. PreprocessorAgent Demo")
    
    agent = PreprocessorAgent(config={
        "normalize_whitespace": True,
        "lowercase": True,
        "max_length": 100
    })
    
    test_messages = [
        "  Hello   World!  ",
        "UPPERCASE TEXT",
        "Multiple    spaces     and\n\n\nnewlines"
    ]
    
    for msg in test_messages:
        context = ExecutionContext({"message": msg})
        result = agent.run(context)
        
        print(f"Original: {repr(msg)}")
        print(f"Processed: {repr(result.get('processed_message'))}")
        print()


def demo_llm_agent():
    """Demo LLM agent with fallback."""
    print_section("2. LLMAgent Fallback Demo")
    
    # Test with force mock
    agent = LLMAgent(config={"force_mock": True})
    
    print(f"Agent Mode: {agent.mode}")
    print(f"Ollama Available: {agent.mode == 'real'}")
    print(f"Fallback Enabled: Yes\n")
    
    test_cases = [
        {"message": "What is Python?", "intent": "general"},
        {"message": "Write a function to sort a list", "intent": "code"},
        {"message": "Use the calculator", "intent": "tool"}
    ]
    
    for test in test_cases:
        print(f"Test: {test['message']} (intent: {test['intent']})")
        
        context = ExecutionContext(test)
        result = agent.run(context)
        
        response = result.get("llm_response")
        print(f"Response: {response[:150]}...")
        print(f"Mode: {result.get('llm_mode')}")
        print()


def demo_formatter():
    """Demo formatter agent."""
    print_section("3. FormatterAgent Demo")
    
    test_response = "This is a test response from the LLM."
    
    # Test different formats
    formats = [
        ("text", False),
        ("text", True),
        ("markdown", True),
        ("json", True)
    ]
    
    for format_type, include_meta in formats:
        print(f"Format: {format_type}, Include Metadata: {include_meta}")
        
        agent = FormatterAgent(config={
            "format": format_type,
            "include_metadata": include_meta
        })
        
        context = ExecutionContext({"llm_response": test_response})
        context.metadata["flow_id"] = "demo_flow"
        context.metadata["flow_version"] = "1.0.0"
        
        result = agent.run(context)
        output = result.get("output")
        
        print(f"Output:\n{output[:200]}{'...' if len(str(output)) > 200 else ''}\n")


def demo_cache():
    """Demo cache agents."""
    print_section("4. Cache Agents Demo")
    
    # Clear cache first
    CacheLookupAgent.clear_cache()
    
    # First request - cache miss
    print("First request (cache miss expected):")
    
    lookup = CacheLookupAgent(config={})
    context = ExecutionContext({"message": "What is machine learning?"})
    result = lookup.run(context)
    
    print(f"Cache Hit: {result.get_flag('cache_hit')}")
    print()
    
    # Store in cache
    print("Storing response in cache...")
    
    store = CacheStoreAgent(config={
        "cache_key_field": "message",
        "response_field": "llm_response",
        "ttl": 3600
    })
    
    context.set("llm_response", "Machine learning is a subset of AI...")
    store.run(context)
    
    print("Stored successfully")
    print()
    
    # Second request - cache hit
    print("Second request (cache hit expected):")
    
    context2 = ExecutionContext({"message": "What is machine learning?"})
    result2 = lookup.run(context2)
    
    print(f"Cache Hit: {result2.get_flag('cache_hit')}")
    print(f"Cached Response: {result2.get('cached_response')}")
    print()
    
    # Cache stats
    stats = CacheLookupAgent.get_cache_stats()
    print(f"Cache Statistics: {stats}")


def demo_complete_flow():
    """Demo complete flow execution."""
    print_section("5. Complete Flow Execution Demo")
    
    # Create registry and register agents
    registry = AgentRegistry()
    registry.register_agent("preprocessor", PreprocessorAgent)
    registry.register_agent("llm_agent", LLMAgent)
    registry.register_agent("formatter", FormatterAgent)
    
    # Create flow
    flow = FlowConfig(
        flow_id="demo_flow",
        name="Demo Flow",
        description="Complete flow demo",
        version="1.0.0",
        profile=ExecutionProfile(
            hardware_mode="cpu",
            max_memory_gb=4
        ),
        config={},
        steps=[
            StepConfig(
                id="step_1_preprocess",
                agent="preprocessor",
                description="Clean input",
                config={"normalize_whitespace": True, "lowercase": True},
                timeout=1
            ),
            StepConfig(
                id="step_2_llm",
                agent="llm_agent",
                description="Generate response",
                config={"force_mock": True},  # Force mock for demo
                timeout=10
            ),
            StepConfig(
                id="step_3_format",
                agent="formatter",
                description="Format output",
                config={"format": "text", "include_metadata": True},
                timeout=1
            )
        ],
        error_handling=ErrorHandling(
            max_retries=2,
            retry_delay=0.5
        ),
        optimization=OptimizationConfig()
    )
    
    # Execute flow
    print("Executing flow...")
    print(f"Flow: {flow.name} (v{flow.version})")
    print(f"Steps: {len(flow.steps)}\n")
    
    executor = FlowExecutor(registry=registry)
    context = ExecutionContext({"message": "  EXPLAIN   Python   Decorators  "})
    
    result = executor.execute_flow(flow, context)
    
    # Print results
    print("\n" + "="*60)
    print("📊 Execution Results:")
    print("="*60)
    print(f"Flow: {result.metadata.get('flow_name')}")
    print(f"Total Time: {result.get_total_time():.3f}s")
    print(f"Steps Executed: {len(result.metadata['steps_executed'])}")
    print(f"Errors: {len(result.metadata.get('errors', []))}")
    
    if not result.has_errors():
        print(f"\n✅ Success!")
        print(f"\n📝 Output:")
        print(f"{result.get('output')[:300]}...")
        
        print(f"\n🔍 Steps:")
        for i, step in enumerate(result.metadata["steps_executed"], 1):
            status_emoji = "✅" if step["status"] == "success" else "❌"
            print(f"   {i}. {status_emoji} {step['agent']} ({step['timing']:.3f}s) - {step['status']}")
    else:
        print(f"\n❌ Flow completed with errors:")
        for error in result.metadata.get("errors", []):
            print(f"   - {error}")


def demo_cache_flow():
    """Demo flow with cache hit/miss scenarios."""
    print_section("6. Cache Flow Demo")
    
    # Clear cache
    CacheLookupAgent.clear_cache()
    
    # Create registry
    registry = AgentRegistry()
    registry.register_agent("cache_lookup", CacheLookupAgent)
    registry.register_agent("llm_agent", LLMAgent)
    registry.register_agent("cache_store", CacheStoreAgent)
    registry.register_agent("formatter", FormatterAgent)
    
    # Create flow with conditional execution
    flow = FlowConfig(
        flow_id="cache_flow",
        name="Cache Demo Flow",
        description="Flow with cache",
        version="1.0.0",
        profile=ExecutionProfile(),
        config={"enable_cache": True},
        steps=[
            StepConfig(
                id="cache_lookup",
                agent="cache_lookup",
                description="Check cache",
                config={},
                timeout=1
            ),
            StepConfig(
                id="llm_generate",
                agent="llm_agent",
                description="Generate if cache miss",
                config={"force_mock": True},
                condition="flags.cache_hit == false",  # Only run if cache miss
                timeout=10
            ),
            StepConfig(
                id="cache_store",
                agent="cache_store",
                description="Store in cache",
                config={"ttl": 3600},
                condition="flags.cache_hit == false",  # Only store if generated
                timeout=1
            ),
            StepConfig(
                id="format",
                agent="formatter",
                description="Format output",
                config={"format": "text"},
                timeout=1
            )
        ],
        error_handling=ErrorHandling(),
        optimization=OptimizationConfig()
    )
    
    executor = FlowExecutor(registry=registry)
    
    # First execution - cache miss
    print("🔷 First Execution (cache miss expected):")
    context1 = ExecutionContext({"message": "What is AI?"})
    result1 = executor.execute_flow(flow, context1)
    
    print(f"   Cache Hit: {result1.get_flag('cache_hit')}")
    print(f"   LLM Called: {'llm_agent' in [s['agent'] for s in result1.metadata['steps_executed']]}")
    print(f"   Steps: {len([s for s in result1.metadata['steps_executed'] if s['status'] == 'success'])}")
    
    # Second execution - cache hit
    print("\n🔷 Second Execution (cache hit expected):")
    context2 = ExecutionContext({"message": "What is AI?"})
    result2 = executor.execute_flow(flow, context2)
    
    print(f"   Cache Hit: {result2.get_flag('cache_hit')}")
    print(f"   LLM Called: {'llm_agent' in [s['agent'] for s in result2.metadata['steps_executed']]}")
    print(f"   Steps: {len([s for s in result2.metadata['steps_executed'] if s['status'] == 'success'])}")


def main():
    """Run all demos."""
    print("\n" + "🚀" * 30)
    print("  Phase 6.7.4: Real Agents Demo")
    print("  With Ollama Fallback Strategy")
    print("🚀" * 30)
    
    try:
        demo_preprocessor()
        demo_llm_agent()
        demo_formatter()
        demo_cache()
        demo_complete_flow()
        demo_cache_flow()
        
        print_section("✨ Demo Complete!")
        print("All agents working successfully!")
        print("System gracefully handles Ollama availability.")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
