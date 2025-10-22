#!/usr/bin/env python3
"""
Test script for Chat Flow Logger
Demonstrates the beautiful wireframe visualization
"""

import time
from utils.chat_flow_logger import get_chat_flow_logger

def test_chat_flow_logger():
    """Test the chat flow logger with a mock conversation"""
    
    # Initialize logger
    logger = get_chat_flow_logger(colored=True)
    
    # Mock message data
    message_id = "msg-test-12345"
    user_input = "Buatkan kode Python untuk fibonacci dengan memoization dan juga tambahkan unit tests"
    persona = {
        'id': 'lycus-001',
        'name': 'Lycus',
        'ai_name': 'Lycus',
        'personality_traits': {
            'technical': 90,
            'friendly': 70,
            'direct': 85,
            'creative': 60,
            'professional': 75
        }
    }
    
    # Start message
    print("\n" + "="*90)
    print("Testing Chat Flow Wireframe Logger")
    print("="*90 + "\n")
    
    logger.start_message(message_id, user_input, persona)
    
    # Simulate router agent
    time.sleep(0.3)
    logger.log_router(
        intent="code_generation",
        confidence=96.5,
        keywords=["python", "fibonacci", "memoization", "unit tests", "optimization"],
        model_info={
            'model_name': 'coder-agent-latest',
            'temperature': 0.3,
            'max_tokens': 500
        },
        duration=0.287,
        agent_display_name="Router Agent (Custom)"
    )
    
    # Simulate RAG agent
    time.sleep(0.2)
    logger.log_rag(
        docs_found=5,
        relevant_docs=3,
        context_length=1234,
        duration=0.156,
        agent_display_name="RAG Agent (Custom)"
    )
    
    # Simulate code execution agent
    time.sleep(1.2)
    logger.log_specialized_agent(
        agent_name="Code Agent",
        agent_type="code",
        model_info={
            'model_name': 'coder-agent-latest',
            'temperature': 0.5,
            'max_tokens': 2500
        },
        metrics={
            'tokens_generated': 1845,
            'response_length': 2340,
            'quality_score': 94
        },
        duration=1.167,
        step_num=3,
        agent_display_name="Code Agent (Custom Model)"
    )
    
    # Note: In multi-model, step 4 is persona, not reasoning
    # This is just for demo purposes to show different agent types
    
    # Simulate persona agent
    time.sleep(0.4)
    logger.log_persona(
        persona_name="Lycus",
        traits={
            'technical': 90,
            'friendly': 70,
            'direct': 85,
            'creative': 60,
            'professional': 75
        },
        model_info={
            'model_name': 'coder-agent-latest',
            'temperature': 0.6,
            'max_tokens': 1000
        },
        duration=0.389,
        agent_display_name="Persona Agent (Custom)",
        step_num=4
    )
    
    # Update metrics
    logger.metrics['total_tokens'] = 5448
    logger.metrics['input_tokens'] = 1324
    logger.metrics['output_tokens'] = 4124
    
    # Record step times for dashboard (multi-model has 4 steps: router, rag, specialist, persona)
    logger.step_times = {
        'router': 0.287,
        'rag': 0.156,
        'code': 1.167,
        'persona': 0.389
    }
    
    # Finish message
    logger.finish_message(
        response_length=2456,
        success=True
    )
    
    print("\n" + "="*90)
    print("✅ Test completed! Check logs/chat_flow.log for the wireframe output")
    print("="*90 + "\n")

if __name__ == "__main__":
    test_chat_flow_logger()
