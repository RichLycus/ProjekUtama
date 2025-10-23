"""
Persona System Prompts with Relationship Context
Dynamic prompt builder that injects relationship and character information
"""

import random
from typing import Dict, Optional, List


def build_persona_prompt_with_relationship(
    persona: Dict,
    relationship: Optional[Dict] = None,
    character: Optional[Dict] = None
) -> str:
    """
    Build system prompt with relationship context for personalized AI interactions.
    
    Args:
        persona: Persona object with personality traits and base prompt
        relationship: Relationship object with nickname and relationship type
        character: User character object with preferences and bio
    
    Returns:
        Enhanced system prompt with relationship context
    """
    # Get base prompt from persona
    base_prompt = persona.get('system_prompt', _get_default_persona_prompt(persona))
    
    # If no relationship, return base prompt
    if not relationship or not character:
        return base_prompt
    
    # Build relationship context
    relationship_context = _build_relationship_context(persona, relationship, character)
    
    # Combine base prompt with relationship context
    return base_prompt + "\n\n" + relationship_context


def _get_default_persona_prompt(persona: Dict) -> str:
    """
    Generate default persona prompt based on personality traits.
    """
    name = persona.get('ai_name', 'Assistant')
    user_greeting = persona.get('user_greeting', 'user')
    traits = persona.get('personality_traits', {})
    response_style = persona.get('response_style', 'balanced')
    tone = persona.get('tone', 'friendly')
    
    prompt = f"""You are {name}, an AI assistant with the following personality:

Personality Traits:
- Technical: {traits.get('technical', 70)}%
- Friendly: {traits.get('friendly', 70)}%
- Direct: {traits.get('direct', 70)}%
- Creative: {traits.get('creative', 60)}%
- Professional: {traits.get('professional', 70)}%

Response Style: {response_style}
Tone: {tone}

You address the user as "{user_greeting}". Maintain this personality consistently in all interactions.
"""
    return prompt


def _build_relationship_context(
    persona: Dict,
    relationship: Dict,
    character: Dict
) -> str:
    """
    Build detailed relationship context for the prompt.
    """
    character_name = character.get('name', 'User')
    relationship_type = relationship.get('relationship_type', 'Friend')
    primary_nickname = relationship.get('primary_nickname', character_name)
    alternate_nicknames = relationship.get('alternate_nicknames', [])
    character_bio = character.get('bio', 'No bio available')
    notes = relationship.get('notes', '')
    
    # Format nicknames instruction
    nickname_instruction = _format_nickname_instruction(
        primary_nickname,
        alternate_nicknames,
        relationship_type
    )
    
    # Format character preferences
    preferences_text = _format_character_preferences(character.get('preferences', {}))
    
    # Build complete relationship context
    context = f"""
[RELATIONSHIP CONTEXT]
You are interacting with: {character_name}
Your relationship: {relationship_type}
{f"Bio: {character_bio}" if character_bio != "No bio available" else ""}

{nickname_instruction}

{preferences_text}

{f"Relationship Notes: {notes}" if notes else ""}

IMPORTANT INSTRUCTIONS:
- Adapt your tone and language to match the "{relationship_type}" relationship
- Use nicknames naturally and contextually appropriate
- Show awareness of their preferences in your responses
- Maintain consistency with the relationship dynamic
"""
    
    return context


def _format_nickname_instruction(
    primary_nickname: str,
    alternate_nicknames: List[str],
    relationship_type: str
) -> str:
    """
    Format nickname usage instructions based on relationship type.
    """
    if not alternate_nicknames:
        return f"""HOW TO ADDRESS THEM:
- Always use: "{primary_nickname}"
- This nickname reflects your {relationship_type.lower()} relationship"""
    
    # Create varied nickname list for natural selection
    all_nicknames = [primary_nickname] + alternate_nicknames
    
    instruction = f"""HOW TO ADDRESS THEM:
- Primary nickname: "{primary_nickname}"
- Alternative nicknames: {', '.join(f'"{nick}"' for nick in alternate_nicknames)}

NICKNAME USAGE STRATEGY:
- Use "{primary_nickname}" most often (default choice)
- Vary with alternatives to keep conversation natural
- Choose based on context:
  * Formal/serious topics → Use {primary_nickname}
  * Casual/playful conversation → Vary with alternatives
  * Express affection → Use warmer alternatives (if {relationship_type.lower()} is appropriate)
- Never use their full name "{primary_nickname}" repeatedly - mix it up!
- The relationship type "{relationship_type}" should guide your nickname selection"""
    
    return instruction


def _format_character_preferences(preferences: Dict) -> str:
    """
    Format character preferences for the prompt.
    """
    if not preferences:
        return "Their Preferences: No specific preferences recorded"
    
    lines = ["Their Preferences:"]
    
    # Hobi/Hobbies
    if 'hobi' in preferences and preferences['hobi']:
        hobi_list = preferences['hobi']
        if isinstance(hobi_list, list):
            lines.append(f"- Hobbies: {', '.join(hobi_list)}")
        else:
            lines.append(f"- Hobbies: {hobi_list}")
    
    # Kesukaan/Favorites
    if 'kesukaan' in preferences and preferences['kesukaan']:
        kesukaan = preferences['kesukaan']
        if isinstance(kesukaan, dict):
            if kesukaan.get('warna'):
                lines.append(f"- Favorite color: {kesukaan['warna']}")
            if kesukaan.get('makanan'):
                lines.append(f"- Favorite food: {kesukaan['makanan']}")
            if kesukaan.get('musik'):
                lines.append(f"- Favorite music: {kesukaan['musik']}")
        else:
            lines.append(f"- Favorites: {kesukaan}")
    
    # Other preferences
    for key, value in preferences.items():
        if key not in ['hobi', 'kesukaan'] and value:
            key_formatted = key.replace('_', ' ').title()
            if isinstance(value, list):
                lines.append(f"- {key_formatted}: {', '.join(value)}")
            else:
                lines.append(f"- {key_formatted}: {value}")
    
    if len(lines) == 1:  # Only header, no actual preferences
        return "Their Preferences: No specific preferences recorded"
    
    return '\n'.join(lines)


def select_nickname_for_context(
    primary_nickname: str,
    alternate_nicknames: List[str],
    context: str = "neutral"
) -> str:
    """
    Helper function to select appropriate nickname based on context.
    
    Args:
        primary_nickname: Primary/default nickname
        alternate_nicknames: List of alternative nicknames
        context: Conversation context (formal, casual, playful, affectionate)
    
    Returns:
        Selected nickname
    """
    if not alternate_nicknames:
        return primary_nickname
    
    # Context-based selection weights
    if context == "formal":
        # Use primary nickname most of the time in formal context
        return primary_nickname if random.random() < 0.8 else random.choice(alternate_nicknames)
    
    elif context == "playful":
        # More variation in playful context
        all_options = [primary_nickname] + alternate_nicknames
        return random.choice(all_options)
    
    elif context == "affectionate":
        # Prefer alternate nicknames if available (usually warmer)
        if alternate_nicknames:
            return random.choice(alternate_nicknames) if random.random() < 0.7 else primary_nickname
        return primary_nickname
    
    else:  # neutral or casual
        # Balanced mix with slight preference to primary
        all_options = [primary_nickname] * 2 + alternate_nicknames  # Weight primary more
        return random.choice(all_options)


# Example usage and testing (for development only)
if __name__ == "__main__":
    # Example persona
    test_persona = {
        'id': 'persona-salma',
        'name': 'Salma',
        'ai_name': 'Salma',
        'user_greeting': 'Sayang',
        'personality_traits': {
            'technical': 60,
            'friendly': 95,
            'direct': 50,
            'creative': 80,
            'professional': 70
        },
        'response_style': 'warm',
        'tone': 'affectionate'
    }
    
    # Example character
    test_character = {
        'id': 'char-lycus',
        'name': 'Lycus',
        'bio': 'Software engineer who loves coding and coffee',
        'preferences': {
            'hobi': ['Coding', 'Reading', 'Gaming'],
            'kesukaan': {
                'warna': 'Purple',
                'makanan': 'Sushi',
                'musik': 'Lo-fi'
            }
        }
    }
    
    # Example relationship
    test_relationship = {
        'id': 'rel-1',
        'persona_id': 'persona-salma',
        'user_character_id': 'char-lycus',
        'relationship_type': 'Kekasih',
        'primary_nickname': 'Sayang',
        'alternate_nicknames': ['Cinta', 'Dear', 'Love', 'Baby'],
        'notes': 'Panggilan berubah tergantung mood Salma'
    }
    
    # Generate prompt
    prompt = build_persona_prompt_with_relationship(
        test_persona,
        test_relationship,
        test_character
    )
    
    print("=" * 80)
    print("GENERATED SYSTEM PROMPT WITH RELATIONSHIP CONTEXT")
    print("=" * 80)
    print(prompt)
    print("=" * 80)
