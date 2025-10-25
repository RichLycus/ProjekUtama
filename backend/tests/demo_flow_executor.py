#!/usr/bin/env python3
"""
Flow Executor Demo

Interactive demo showing flow execution with mock agents.
Demonstrates various scenarios: simple flow, cache hit/miss, error handling, etc.
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai.flow.context import ExecutionContext
from ai.flow.loader import FlowConfig
from ai.flow.executor import FlowExecutor
from ai.flow.registry import AgentRegistry
from tests.mock_agents import register_mock_agents


def print_header(title: str):
    """Print section header."""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")


def print_result(context: ExecutionContext):
    """Print execution result."""
    print("\n📊 Execution Results:")
    print(f"   Flow: {context.metadata.get('flow_name', 'N/A')}")
    print(f"   Total Time: {context.metadata.get('total_execution_time', 0):.3f}s")
    print(f"   Steps Executed: {len(context.metadata['steps_executed'])}")
    print(f"   Errors: {len(context.metadata['errors'])}")
    
    if context.has_errors():
        print("\n❌ Errors:")
        for error in context.metadata["errors"]:
            print(f"   - {error['agent']}: {error['error']}")
    else:
        print("\n✅ Success!")
    
    print(f"\n📝 Output:")
    output = context.get("output")
    if output:
        if isinstance(output, dict):
            print(f"   {output.get('response', output)}")
        else:
            print(f"   {output}")
    else:
        print(f"   (no output)")
    
    print(f"\n🔍 Steps:")
    for i, step in enumerate(context.metadata["steps_executed"], 1):
        status_emoji = "✅" if step["status"] == "success" else "⏭️" if step["status"] == "skipped" else "❌"
        print(f"   {i}. {status_emoji} {step['agent']} ({step['timing']:.3f}s) - {step['status']}")


def demo_simple_flow():
    """Demo 1: Simple 3-step flow."""
    print_header("Demo 1: Simple 3-Step Flow")
    
    # Create flow
    flow = FlowConfig.from_dict({
        "flow_id": "demo_simple",
        "name": "Simple Demo Flow",
        "steps": [
            {
                "id": "step1",
                "agent": "preprocessor",
                "description": "Preprocess input",
                "critical": True
            },
            {
                "id": "step2",
                "agent": "llm_simple",
                "description": "Generate response",
                "config": {"model": "gemma2:2b", "temperature": 0.7},
                "critical": True
            },
            {
                "id": "step3",
                "agent": "formatter",
                "description": "Format output",
                "config": {"format": "text"},
                "critical": True
            }
        ]
    })
    
    # Create executor
    registry = AgentRegistry()
    register_mock_agents(registry)
    executor = FlowExecutor(registry=registry)
    
    # Execute
    context = ExecutionContext({"message": "hello world"})
    result = executor.execute_flow(flow, context)
    
    print_result(result)


def demo_cache_hit_flow():
    """Demo 2: Flow with cache hit (skips LLM)."""
    print_header("Demo 2: Cache Hit Flow (LLM Skipped)")
    
    # Create flow with cache
    flow = FlowConfig.from_dict({
        "flow_id": "demo_cache_hit",
        "name": "Cache Hit Demo",
        "steps": [
            {
                "id": "step1",
                "agent": "preprocessor",
                "description": "Preprocess input",
                "critical": False
            },
            {
                "id": "step2",
                "agent": "cache_lookup",
                "description": "Check cache",
                "config": {"simulate_hit": True},
                "on_success": {"set_flag": "cache_hit"},
                "critical": False
            },
            {
                "id": "step3",
                "agent": "llm_simple",
                "description": "Generate response (if cache miss)",
                "config": {"model": "gemma2:2b"},
                "condition": "flags.cache_hit == false",
                "critical": False
            },
            {
                "id": "step4",
                "agent": "formatter",
                "description": "Format output",
                "critical": False
            }
        ]
    })
    
    # Create executor
    registry = AgentRegistry()
    register_mock_agents(registry)
    executor = FlowExecutor(registry=registry)
    
    # Execute
    context = ExecutionContext({"message": "cached query"})
    result = executor.execute_flow(flow, context)
    
    print_result(result)


def demo_cache_miss_flow():
    """Demo 3: Flow with cache miss (runs LLM)."""
    print_header("Demo 3: Cache Miss Flow (LLM Executed)")
    
    # Create flow with cache miss
    flow = FlowConfig.from_dict({
        "flow_id": "demo_cache_miss",
        "name": "Cache Miss Demo",
        "steps": [
            {
                "id": "step1",
                "agent": "preprocessor",
                "critical": False
            },
            {
                "id": "step2",
                "agent": "cache_lookup",
                "config": {"simulate_hit": False},
                "critical": False
            },
            {
                "id": "step3",
                "agent": "llm_simple",
                "config": {"model": "gemma2:2b"},
                "condition": "flags.cache_hit == false",
                "critical": False
            },
            {
                "id": "step4",
                "agent": "cache_store",
                "config": {"ttl": 3600},
                "critical": False
            },
            {
                "id": "step5",
                "agent": "formatter",
                "critical": False
            }
        ]
    })
    
    # Create executor
    registry = AgentRegistry()
    register_mock_agents(registry)
    executor = FlowExecutor(registry=registry)
    
    # Execute
    context = ExecutionContext({"message": "new query"})
    result = executor.execute_flow(flow, context)
    
    print_result(result)


def demo_error_handling():
    """Demo 4: Error handling with non-critical step."""
    print_header("Demo 4: Error Handling (Non-Critical)")
    
    # Create flow with error
    flow = FlowConfig.from_dict({
        "flow_id": "demo_error",
        "name": "Error Handling Demo",
        "steps": [
            {
                "id": "step1",
                "agent": "preprocessor",
                "critical": False
            },
            {
                "id": "step2",
                "agent": "error_agent",
                "config": {"error_message": "Simulated error"},
                "critical": False
            },
            {
                "id": "step3",
                "agent": "formatter",
                "critical": False
            }
        ]
    })
    
    # Create executor
    registry = AgentRegistry()
    register_mock_agents(registry)
    executor = FlowExecutor(registry=registry)
    
    # Execute
    context = ExecutionContext({"message": "test error"})
    result = executor.execute_flow(flow, context)
    
    print_result(result)


def demo_critical_error():
    """Demo 5: Critical error stops flow."""
    print_header("Demo 5: Critical Error (Flow Stopped)")
    
    # Create flow with critical error
    flow = FlowConfig.from_dict({
        "flow_id": "demo_critical",
        "name": "Critical Error Demo",
        "error_handling": {
            "on_fail": {
                "agent": "error_responder",
                "config": {
                    "message": "Maaf, terjadi kesalahan. Coba lagi ya 💕"
                }
            }
        },
        "steps": [
            {
                "id": "step1",
                "agent": "preprocessor",
                "critical": False
            },
            {
                "id": "step2",
                "agent": "error_agent",
                "config": {"error_message": "Critical failure"},
                "critical": True
            },
            {
                "id": "step3",
                "agent": "formatter",
                "description": "This should not execute",
                "critical": False
            }
        ]
    })
    
    # Create executor
    registry = AgentRegistry()
    register_mock_agents(registry)
    executor = FlowExecutor(registry=registry)
    
    # Execute
    context = ExecutionContext({"message": "test critical"})
    result = executor.execute_flow(flow, context)
    
    print_result(result)


def demo_retry_logic():
    """Demo 6: Retry logic on failure."""
    print_header("Demo 6: Retry Logic (Max 2 Retries)")
    
    # Create flow with retry
    flow = FlowConfig.from_dict({
        "flow_id": "demo_retry",
        "name": "Retry Demo",
        "error_handling": {
            "max_retries": 2,
            "retry_delay": 0.1
        },
        "steps": [
            {
                "id": "step1",
                "agent": "error_agent",
                "config": {"error_message": "Retry test error"},
                "critical": True
            }
        ]
    })
    
    # Create executor
    registry = AgentRegistry()
    register_mock_agents(registry)
    executor = FlowExecutor(registry=registry)
    
    # Execute
    context = ExecutionContext({})
    result = executor.execute_flow(flow, context)
    
    print_result(result)


def main():
    """Run all demos."""
    print("\n")
    print("╔══════════════════════════════════════════════════════════╗")
    print("║          Flow Executor Demo - Mock Agents               ║")
    print("║                                                          ║")
    print("║  Demonstrating flow execution with various scenarios    ║")
    print("╚══════════════════════════════════════════════════════════╝")
    
    demos = [
        ("1", "Simple 3-step flow", demo_simple_flow),
        ("2", "Cache hit (LLM skipped)", demo_cache_hit_flow),
        ("3", "Cache miss (LLM executed)", demo_cache_miss_flow),
        ("4", "Non-critical error handling", demo_error_handling),
        ("5", "Critical error with recovery", demo_critical_error),
        ("6", "Retry logic", demo_retry_logic),
    ]
    
    print("\n📋 Available Demos:")
    for num, desc, _ in demos:
        print(f"   {num}. {desc}")
    print("   7. Run all demos")
    print("   0. Exit")
    
    while True:
        try:
            choice = input("\n👉 Select demo (0-7): ").strip()
            
            if choice == "0":
                print("\n👋 Goodbye!")
                break
            elif choice == "7":
                # Run all demos
                for _, _, demo_func in demos:
                    demo_func()
                    input("\n⏸️  Press Enter to continue...")
            elif choice in [d[0] for d in demos]:
                # Run selected demo
                demo_func = next(d[2] for d in demos if d[0] == choice)
                demo_func()
            else:
                print("❌ Invalid choice. Please select 0-7.")
        
        except KeyboardInterrupt:
            print("\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    main()
