"""
Demo Script for Phase 6.7.4 - Basic Agents

Demonstrates the new flow system with real agents:
- Flash Mode: Preprocessor → LLM → Persona (fast!)
- Pro Mode: Router → RAG → Execution → LLM → Persona (comprehensive!)

Usage:
    python demo_basic_agents.py
"""

import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from ai.flow.context import ExecutionContext
from ai.flow.loader import FlowLoader
from ai.flow.executor import FlowExecutor
from ai.agents.register_agents import register_all_agents


def main():
    """Run demo of basic agents."""
    print("=" * 80)
    print("🚀 Phase 6.7.4 Demo - Basic Agents with Real Integration")
    print("=" * 80)
    
    # Register all agents
    print("\n📋 Step 1: Registering agents...")
    registry = register_all_agents()
    print(f"   ✅ Registered agents: {registry.list_agents()}")
    
    # Initialize loader and executor
    print("\n📋 Step 2: Initializing system...")
    loader = FlowLoader()
    executor = FlowExecutor(registry=registry)
    print("   ✅ System ready")
    
    # Demo 1: Flash Mode
    print("\n" + "=" * 80)
    print("⚡ DEMO 1: FLASH MODE (Fast Response)")
    print("=" * 80)
    
    print("\n📨 User Input: 'Jelaskan apa itu Python dalam 2 kalimat'")
    
    # Load flash flow
    flash_flow = loader.load_flow_by_id("flash", "base")
    print(f"\n📄 Flow: {flash_flow.name} (v{flash_flow.version})")
    print(f"   Steps: {len(flash_flow.steps)}")
    for step in flash_flow.steps:
        print(f"   - {step.agent}: {step.description}")
    
    # Create context
    context = ExecutionContext({
        "message": "Jelaskan apa itu Python dalam 2 kalimat"
    })
    
    # Execute flow
    print("\n🚀 Executing flash flow...")
    result = executor.execute_flow(flash_flow, context)
    
    # Show results
    print("\n" + "=" * 80)
    print("📊 FLASH MODE RESULTS:")
    print("=" * 80)
    print(f"\n🕐 Total Time: {result.get_total_time():.2f}s")
    print(f"📝 Steps Executed: {len(result.metadata['steps_executed'])}")
    print(f"❌ Errors: {len(result.metadata['errors'])}")
    
    if not result.has_errors():
        print(f"\n✅ Success!")
        print(f"\n💬 Output:\n{result.get('output', 'No output')}")
        
        # Show step details
        print(f"\n🔍 Step Details:")
        for step in result.metadata['steps_executed']:
            status_icon = "✅" if step['status'] == 'success' else "⏭️" if step['status'] == 'skipped' else "❌"
            print(f"   {status_icon} {step['agent']}: {step['timing']:.3f}s - {step['status']}")
    else:
        print(f"\n❌ Failed with errors:")
        for error in result.metadata['errors']:
            print(f"   - {error}")
    
    # Demo 2: Pro Mode
    print("\n" + "=" * 80)
    print("🚀 DEMO 2: PRO MODE (Comprehensive Pipeline)")
    print("=" * 80)
    
    print("\n📨 User Input: 'Bagaimana cara membuat Python tool untuk formatter?'")
    
    # Load pro flow
    pro_flow = loader.load_flow_by_id("pro", "rag_full")
    print(f"\n📄 Flow: {pro_flow.name} (v{pro_flow.version})")
    print(f"   Steps: {len(pro_flow.steps)}")
    for step in pro_flow.steps:
        print(f"   - {step.agent}: {step.description}")
    
    # Create context
    context = ExecutionContext({
        "message": "Bagaimana cara membuat Python tool untuk formatter?"
    })
    
    # Execute flow
    print("\n🚀 Executing pro flow...")
    result = executor.execute_flow(pro_flow, context)
    
    # Show results
    print("\n" + "=" * 80)
    print("📊 PRO MODE RESULTS:")
    print("=" * 80)
    print(f"\n🕐 Total Time: {result.get_total_time():.2f}s")
    print(f"📝 Steps Executed: {len(result.metadata['steps_executed'])}")
    print(f"❌ Errors: {len(result.metadata['errors'])}")
    
    if not result.has_errors():
        print(f"\n✅ Success!")
        print(f"\n💬 Output:\n{result.get('output', 'No output')}")
        
        # Show step details
        print(f"\n🔍 Step Details:")
        for step in result.metadata['steps_executed']:
            status_icon = "✅" if step['status'] == 'success' else "⏭️" if step['status'] == 'skipped' else "❌"
            print(f"   {status_icon} {step['agent']}: {step['timing']:.3f}s - {step['status']}")
        
        # Show intent and RAG results
        intent = result.get('intent')
        rag_sources = result.get('rag_sources', [])
        print(f"\n📊 Pipeline Details:")
        print(f"   Intent: {intent}")
        print(f"   RAG Sources: {len(rag_sources)}")
    else:
        print(f"\n❌ Failed with errors:")
        for error in result.metadata['errors']:
            print(f"   - {error}")
    
    print("\n" + "=" * 80)
    print("✅ Demo Complete!")
    print("=" * 80)


if __name__ == "__main__":
    main()
