# ChimeraAI Character System

## 📁 Folder Structure

```
backend/characters/
├── schema.yaml              ← Character schema definition
├── agents/                  ← AI Agent characters (Personas)
│   ├── lycus.yaml          ← Default tech companion
│   ├── salma.yaml          ← Creative storyteller
│   └── catherine.yaml      ← Romantic AI companion
├── users/                   ← User character profiles
│   ├── default_user.yaml   ← Default user template
│   └── custom_profiles/    ← User custom profiles
└── README.md               ← This file
```

## 🎯 Purpose

Character system memindahkan persona definitions dari database ke YAML files untuk:
- ✅ Better version control (git-friendly)
- ✅ Easier editing (VS Code, syntax highlighting)
- ✅ Community sharing (copy YAML file)
- ✅ More immersive roleplay (detailed personality, backgrounds)
- ✅ Hot reload (edit → reload → active immediately)

## 📝 YAML Format

### Agent Character Template

```yaml
name: CharacterName
role: Role/Profession
description: |
  Multi-line description of character.
  
personality: |
  Personality traits, speaking style, habits.
  
background: |
  Character backstory and origins.
  
abilities: |
  - Special skills
  - Capabilities
  
interaction_rules: |
  - How to interact
  - Speaking guidelines
  
example_dialogue: |
  {{char}}: Example dialogue here
  {{user}}: User response
  {{char}}: Character response
  
memory_tags: [tag1, tag2, tag3]

scene: |
  Optional scene context for immersion.
  
task_mode: |
  Optional behavior in work/task mode.
  
metadata:
  version: "1.0.0"
  created_at: "YYYY-MM-DD"
  author: "Author Name"
  avatar_color: "#HEX"
  tags: [tag1, tag2]
```

### Placeholders

- `{{user}}` - Will be replaced with user's name
- `{{char}}` - Will be replaced with AI character's name

## 🎭 Available Characters

### Agents (AI Companions)

1. **Lycus** (`agents/lycus.yaml`)
   - Role: AI Wolf Companion & Tech Assistant
   - Personality: Santai, loyal, supportive
   - Best for: Coding, technical discussions, casual companion

2. **Catherine** (`agents/catherine.yaml`)
   - Role: Kekasih & Partner Intelektual
   - Personality: Hangat, lembut, romantic
   - Best for: Emotional support, romantic interactions, creative work

3. **Salma** (`agents/salma.yaml`)
   - Role: Creative Companion & Storyteller
   - Personality: Playful, imaginative, ekspresif
   - Best for: Storytelling, brainstorming, creative writing

### Users

1. **Default User** (`users/default_user.yaml`)
   - Default template for user profiles
   - Can be customized per user

## 🔧 How to Use

### Loading Characters (Backend)

```python
from ai.character_loader import CharacterLoader

# Initialize loader
loader = CharacterLoader()

# Load agent character
lycus = loader.load_agent("lycus")
print(lycus.name)  # "Lycus"
print(lycus.personality)  # Full personality text

# Load all agents
all_agents = loader.list_agents()
```

### API Endpoints

```bash
# List all agent characters
GET /api/characters/agents

# Get specific agent
GET /api/characters/agents/lycus

# Reload character (hot reload)
POST /api/characters/agents/lycus/reload

# Get schema
GET /api/characters/schema
```

## ✏️ Creating Custom Characters

### Step 1: Create YAML file

```bash
# For agent character
backend/characters/agents/your_character.yaml

# For user profile
backend/characters/users/custom_profiles/your_name.yaml
```

### Step 2: Follow the schema

See `schema.yaml` for required and optional fields.

### Step 3: Test your character

```bash
# Reload character via API
curl -X POST http://localhost:8001/api/characters/agents/your_character/reload

# Test in chat
# Select your character from dropdown
```

## 🎨 Character Design Tips

### 1. Be Specific

❌ Bad: "Friendly AI"
✅ Good: "Warm, occasionally playful, uses casual Indonesian with technical knowledge"

### 2. Show, Don't Tell

❌ Bad: "Character is smart"
✅ Good: "Analyzes problems systematically, provides well-reasoned solutions, references technical concepts naturally"

### 3. Use Example Dialogue

Include 3-5 example conversations showing character's personality in action.

### 4. Define Interaction Rules

Clear guidelines prevent character from breaking immersion:
- Speaking style (formal/casual)
- Prohibited behaviors
- How to handle emotions
- When to be serious vs playful

### 5. Add Memory Tags

Help AI understand character's emotional context:
```yaml
memory_tags: [loyal, tech-savvy, supportive, romantic, creative]
```

### 6. Scene Context (Optional)

For immersive roleplay, add scene description:
```yaml
scene: |
  Lokasi: Cozy café with warm lighting
  Suasana: Rainy evening, jazz music playing softly
  Visual: Character sitting by window with coffee
```

## 🔄 Hot Reload

Edit YAML file → Save → Call reload endpoint → Changes active immediately!

No need to restart server or database migration.

## 📦 Sharing Characters

1. Create your character YAML
2. Test it thoroughly
3. Share the YAML file
4. Others can drop it in their `agents/` folder
5. Reload and use!

## 🚀 Future Enhancements

- [ ] Web UI for character editor
- [ ] Character gallery/marketplace
- [ ] Community character sharing
- [ ] Multi-language support
- [ ] Voice profile integration
- [ ] Character relationship system
- [ ] Emotion state management

## 📄 License

Character definitions are user-created content. 
System follows project license. See main LICENSE file.

## 💬 Need Help?

- Check `schema.yaml` for field definitions
- See example characters for reference
- Test character via API before deployment
- Join community for character sharing

---

**Happy Character Creating! 🎭✨**
