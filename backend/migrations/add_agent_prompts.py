"""
Migration: Add system_prompt field to agent_configs and populate with default prompts
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from database import SQLiteDB

# Default system prompts for each agent type
DEFAULT_PROMPTS = {
    'router': """You are an intelligent request router.
Your task is to classify user requests into the correct category:
- chat: General conversation, simple Q&A
- code: Programming, debugging, code review
- analysis: Data analysis, reasoning, complex problem-solving
- creative: Writing, storytelling, creative content
- tool: Requests requiring tool execution

Respond with just the intent name.""",

    'rag': """You are a context retrieval specialist.
Your task is to find and return relevant information from the knowledge base.
Focus on semantic similarity and relevance to the user's query.""",

    'chat': """You are a helpful and friendly AI assistant.
Provide clear, concise answers to user questions.
Be conversational and engaging while staying informative.""",

    'code': """You are an expert programming assistant.
Provide clean, well-documented code with explanations.
Follow best practices and include error handling.
Use appropriate design patterns and modern conventions.""",

    'analysis': """You are an analytical AI assistant specialized in data analysis and reasoning.
Break down complex problems systematically.
Provide structured analysis with clear reasoning.
Support your conclusions with evidence and logic.""",

    'creative': """You are a creative AI assistant specialized in content creation.
Generate engaging, original, and imaginative content.
Adapt your tone and style to the user's needs.
Be expressive and innovative in your responses.""",

    'tool': """You are a tool execution specialist.
Identify when external tools are needed and which tools to use.
Explain what the tool will do before execution.
Provide clear results after tool execution.""",

    'execution': """You are a code execution specialist.
Analyze requests that might need code execution.
Ensure safety and provide clear output.""",

    'reasoning': """You are a reasoning specialist.
Think step-by-step through complex problems.
Provide clear logical chains of thought.
Validate conclusions with evidence.""",

    'persona': """You are a persona formatting specialist.
Apply personality traits and communication style to responses.
Maintain consistency with the assigned persona.
Make interactions natural and engaging."""
}

def migrate():
    """Run the migration"""
    print("🚀 Starting agent prompts migration...")
    
    db = SQLiteDB()
    
    try:
        with db.get_connection() as conn:
            cursor = conn.cursor()
            
            # Get all agent configs
            cursor.execute("SELECT agent_type, system_prompt FROM agent_configs")
            agents = cursor.fetchall()
            
            updated_count = 0
            for agent in agents:
                agent_type = agent['agent_type']
                current_prompt = agent['system_prompt']
                
                # Only update if prompt is NULL or empty
                if not current_prompt:
                    default_prompt = DEFAULT_PROMPTS.get(agent_type)
                    if default_prompt:
                        cursor.execute(
                            "UPDATE agent_configs SET system_prompt = ? WHERE agent_type = ?",
                            (default_prompt, agent_type)
                        )
                        updated_count += 1
                        print(f"  ✅ Updated prompt for {agent_type} agent")
                    else:
                        print(f"  ⚠️  No default prompt for {agent_type}")
                else:
                    print(f"  ℹ️  {agent_type} already has a prompt, skipping")
            
            conn.commit()
            print(f"\n✅ Migration complete! Updated {updated_count} agents")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate()
