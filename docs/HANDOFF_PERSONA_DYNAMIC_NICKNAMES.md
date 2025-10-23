# 🔄 Handoff: Dynamic Nicknames & Persona Relationship Integration

**Date**: October 23, 2025  
**Status**: Ready for Implementation  
**Priority**: High  
**Estimated Effort**: Medium (2-3 hours)

---

## 📋 Context & Background

### ✅ Apa yang Sudah Selesai (Session Sebelumnya)

Pada session sebelumnya, kita telah berhasil membuat **foundation** untuk sistem persona relationships:

**1. Database Schema:**
- ✅ Table `user_characters` - menyimpan karakter pengguna (Lycus, Salma, Affif, dll)
- ✅ Table `persona_user_relationships` - menghubungkan persona dengan karakter
- ✅ Support multiple alternate nicknames per relationship
- ✅ Relationship types: Kekasih, Sahabat, Teman, Partner Kerja, Keluarga

**2. Backend API:**
- ✅ CRUD endpoints untuk user characters
- ✅ CRUD endpoints untuk persona relationships
- ✅ Database methods di `database.py`

**3. Frontend UI:**
- ✅ Persona Manager dengan tabs (Personas | Karakter Pengguna)
- ✅ Form untuk manage karakter pengguna
- ✅ Form untuk hubungkan persona dengan karakter
- ✅ Display relasi di persona cards

**Contoh Data Structure:**
```json
{
  "relationship": {
    "persona_id": "persona-salma",
    "user_character_id": "char-lycus",
    "relationship_type": "Kekasih",
    "primary_nickname": "Sayang",
    "alternate_nicknames": ["Cinta", "Dear", "Love", "Baby"],
    "notes": "Panggilan berubah tergantung mood Salma"
  }
}
```

---

## 🎯 Goal Session Ini

**Objective**: Integrasikan persona relationships ke dalam chat system agar AI bisa memanggil user dengan panggilan yang sesuai relasi dan mood.

### Yang Perlu Diimplementasi:

#### **1. Integrate Dynamic Nicknames ke Chat System** 🔥
- AI harus aware tentang karakter user yang sedang chat
- AI pilih nickname dari `primary_nickname` atau `alternate_nicknames`
- Nickname selection bisa berdasarkan:
  - Context percakapan (formal vs casual)
  - Mood AI (happy, serious, playful)
  - Random variation (untuk naturalness)

#### **2. Update Persona System Prompt** 📝
- System prompt harus include relationship context
- Format prompt dengan info: relationship_type, available nicknames, character preferences
- Example prompt addition:
  ```
  Relationship Context:
  - You are talking to: [Character Name]
  - Your relationship: [Relationship Type]
  - Call them: [Primary Nickname] or vary with [Alternate Nicknames]
  - Their preferences: [Hobi, Kesukaan, etc]
  ```

#### **3. Display Active Character/Relationship in Chat** 💬
- Header chat menampilkan karakter yang sedang aktif
- Show relationship type & current persona
- User bisa switch character jika ada multiple characters
- Visual indicator (icon, badge) untuk relationship type

---

## 🗂️ File Structure & Key Components

### Backend Files:
```
backend/
├── database.py                           # ✅ Already has methods
├── routes/
│   ├── personas.py                       # ✅ Relationship endpoints exist
│   └── chat_routes.py                    # 🔧 NEED UPDATE (add relationship context)
├── ai/
│   ├── agents/                           
│   │   └── persona_agent.py              # 🔧 NEED UPDATE (inject relationship context)
│   └── prompts/
│       └── persona_system_prompts.py     # 🔧 NEED CREATE/UPDATE (dynamic prompts)
└── data/
    └── chimera_tools.db                  # ✅ Tables exist
```

### Frontend Files:
```
src/
├── components/
│   ├── chat/
│   │   ├── ChatHeader.tsx                # 🔧 NEED UPDATE (display character/relationship)
│   │   └── ChatInput.tsx                 # ✅ No changes needed
│   └── PersonaManager.tsx                # ✅ Already complete
├── store/
│   ├── personaStore.ts                   # 🔧 NEED UPDATE (add active character state)
│   └── chatStore.ts                      # 🔧 NEED UPDATE (include character context)
└── pages/
    └── ChatPage.tsx                      # 🔧 NEED UPDATE (character selector UI)
```

---

## 🔨 Implementation Plan

### Phase 1: Backend - Relationship Context Injection

**Step 1.1: Update Chat Routes to Include Character Context**

File: `/app/backend/routes/chat_routes.py`

**What to add:**
- Endpoint parameter untuk `character_id` (optional)
- Fetch relationship antara current persona & character
- Pass relationship data ke AI agent

**Key Functions to Modify:**
```python
@router.post("/message")
async def send_message(
    conversation_id: str,
    message: str,
    character_id: Optional[str] = None  # NEW PARAMETER
):
    # 1. Get current persona
    conversation = db.get_conversation(conversation_id)
    persona = db.get_persona_by_name(conversation['persona'])
    
    # 2. Get relationship if character_id provided
    relationship = None
    character = None
    if character_id:
        character = db.get_user_character(character_id)
        relationship = db.get_relationship_by_persona_character(
            persona['id'], 
            character_id
        )
    
    # 3. Build enhanced system prompt with relationship context
    system_prompt = build_persona_prompt_with_relationship(
        persona, 
        relationship, 
        character
    )
    
    # 4. Pass to AI agent
    # ... rest of chat logic
```

**Step 1.2: Create Dynamic Prompt Builder**

File: `/app/backend/ai/prompts/persona_system_prompts.py` (CREATE NEW)

```python
def build_persona_prompt_with_relationship(
    persona: dict,
    relationship: dict = None,
    character: dict = None
) -> str:
    """
    Build system prompt with relationship context
    """
    base_prompt = persona.get('system_prompt', DEFAULT_PERSONA_PROMPT)
    
    if not relationship or not character:
        return base_prompt
    
    # Build relationship context
    relationship_context = f"""

[RELATIONSHIP CONTEXT]
You are interacting with: {character['name']}
Your relationship: {relationship['relationship_type']}
Bio: {character.get('bio', 'No bio available')}

IMPORTANT - How to address them:
- Primary nickname: "{relationship['primary_nickname']}"
- Alternative nicknames (use for variety/mood): {', '.join(relationship['alternate_nicknames'])}
- Choose nickname based on context and your current mood
- Vary your nickname usage naturally in conversation

Their Preferences:
{format_character_preferences(character.get('preferences', {}))}

Adapt your responses to match your relationship type and their preferences.
"""
    
    return base_prompt + relationship_context

def format_character_preferences(preferences: dict) -> str:
    """Format character preferences for prompt"""
    lines = []
    if 'hobi' in preferences:
        lines.append(f"- Hobi: {', '.join(preferences['hobi'])}")
    if 'kesukaan' in preferences:
        kesukaan = preferences['kesukaan']
        if kesukaan.get('warna'):
            lines.append(f"- Warna favorit: {kesukaan['warna']}")
        if kesukaan.get('makanan'):
            lines.append(f"- Makanan favorit: {kesukaan['makanan']}")
    return '\n'.join(lines) if lines else "No specific preferences"
```

**Step 1.3: Update Persona Agent**

File: `/app/backend/ai/agents/persona_agent.py` (MODIFY EXISTING)

**What to update:**
- Accept relationship context in agent call
- Use dynamic nickname in responses
- Ensure persona formatting includes relationship-aware language

---

### Phase 2: Frontend - Character Selection & Display

**Step 2.1: Update Persona Store**

File: `/app/src/store/personaStore.ts`

**Add new state:**
```typescript
interface PersonaState {
  // ... existing state
  activeCharacter: UserCharacter | null
  activeRelationship: PersonaRelationship | null
  
  // New actions
  setActiveCharacter: (character: UserCharacter | null) => void
  fetchActiveRelationship: (personaId: string, characterId: string) => Promise<void>
}
```

**Step 2.2: Update Chat Header**

File: `/app/src/components/chat/ChatHeader.tsx` (MODIFY)

**Add character display:**
```tsx
// Show active character & relationship
{activeCharacter && activeRelationship && (
  <div className="flex items-center gap-2 text-sm">
    <UserCircle className="w-4 h-4" />
    <span>{activeCharacter.name}</span>
    <Badge variant="secondary">{activeRelationship.relationship_type}</Badge>
  </div>
)}
```

**Step 2.3: Add Character Selector**

File: `/app/src/pages/ChatPage.tsx` (ADD NEW COMPONENT)

**Create dropdown/modal:**
- List available characters
- Show current active character
- Allow switching between characters
- Update active character in store

**UI Mockup:**
```
┌─────────────────────────────────────┐
│ 💬 Chat with Salma                  │
│                                     │
│ 👤 Chatting as: [Lycus ▼]          │
│    Relationship: Kekasih ❤️         │
└─────────────────────────────────────┘
```

**Step 2.4: Update Chat Store**

File: `/app/src/store/chatStore.ts`

**Modify sendMessage to include character_id:**
```typescript
const sendMessage = async (message: string) => {
  const activeCharacter = usePersonaStore.getState().activeCharacter
  
  const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: currentConversationId,
      message,
      character_id: activeCharacter?.id  // NEW
    })
  })
  // ... rest
}
```

---

### Phase 3: Testing & Refinement

**Test Scenarios:**

1. **Basic Relationship Test:**
   - Create character "Lycus"
   - Create relationship: Salma (Kekasih) → Lycus, nickname "Sayang"
   - Start chat with Salma
   - Select character "Lycus"
   - Verify AI calls user "Sayang"

2. **Nickname Variation Test:**
   - Add alternate nicknames: "Cinta", "Dear", "Love"
   - Chat multiple messages
   - Verify AI varies nicknames naturally

3. **No Relationship Test:**
   - Start chat without selecting character
   - Verify AI uses default `user_greeting` from persona

4. **Multiple Characters Test:**
   - Create multiple characters (Lycus, Affif, Sarah)
   - Create different relationships for each
   - Switch characters mid-chat
   - Verify AI adapts nickname & tone

---

## 🚨 CRITICAL REMINDERS

### ⚠️ Golden Rules - Testing Protocol

**REMINDER untuk Agent berikutnya:**

```
❌ DILARANG KERAS:
- curl test backend endpoints tanpa konfirmasi user
- Run integration tests tanpa konfirmasi user
- Check backend logs tanpa konfirmasi user
- Tail logs backend untuk verification

✅ WAJIB:
- STOP setelah selesai implementation
- ASK USER: "Implementasi sudah selesai, apakah Anda ingin saya bantu test backend?"
- Tunggu user response sebelum lakukan apapun
- User akan test manual via UI atau minta test jika diperlukan
```

**Dari Golden Rules (docs/golden-rules.md):**
> **Rule #3 - After Implementation Protocol:**
> - ✅ Selesai coding → **STOP IMMEDIATELY**
> - ✅ **JANGAN cek logs backend** tanpa diminta
> - ✅ **JANGAN curl test** tanpa diminta
> - ✅ **ASK USER**: "Implementasi sudah selesai, apakah Anda ingin saya bantu test backend?"
> - ✅ Tunggu user response sebelum lakukan apapun

---

## 📊 Success Criteria

Implementation dianggap **BERHASIL** jika:

✅ **Backend:**
- Chat endpoint terima `character_id` parameter
- Relationship context ter-inject ke system prompt
- AI responses menggunakan nickname yang sesuai

✅ **Frontend:**
- Chat header menampilkan active character & relationship
- User bisa pilih/switch character
- Character selection tersimpan di store

✅ **Integration:**
- AI memanggil user dengan nickname dari relationship
- Nickname bervariasi natural (tidak selalu sama)
- Tone & style menyesuaikan relationship type

✅ **User Experience:**
- Smooth character switching
- Clear visual indicator relationship
- Natural conversation flow

---

## 🎯 Quick Start Commands (untuk Agent Berikutnya)

```bash
# 1. Check backend status
sudo supervisorctl status backend

# 2. View relevant files
cat /app/backend/routes/chat_routes.py
cat /app/backend/ai/agents/persona_agent.py

# 3. Check database for existing relationships
# (ONLY jika user minta!)

# 4. Start implementation from Phase 1
```

---

## 📝 Notes & Considerations

### Technical Decisions to Make:

1. **Nickname Selection Strategy:**
   - Option A: Random dari alternate_nicknames
   - Option B: Mood-based (requires mood detection)
   - Option C: Context-based (formal vs casual detection)
   - **Recommendation**: Start dengan Option A (simple random), bisa enhance later

2. **Character Persistence:**
   - Store active character di localStorage?
   - Atau per-conversation basis?
   - **Recommendation**: Per-conversation (lebih flexible)

3. **Default Behavior:**
   - Jika user tidak pilih character, apa yang terjadi?
   - **Recommendation**: Fallback ke `user_greeting` dari persona (existing behavior)

### Edge Cases to Handle:

- ❗ User delete character yang sedang aktif di chat
- ❗ User delete relationship yang sedang digunakan
- ❗ Persona tidak punya relationship dengan character manapun
- ❗ Character punya multiple relationships (dengan berbeda persona)

---

## 🔗 Related Files & References

**Documentation:**
- `/app/docs/golden-rules.md` - Testing protocol (READ THIS FIRST!)
- `/app/docs/HANDOFF_PERSONA_DYNAMIC_NICKNAMES.md` - This file

**Database:**
- Tables: `user_characters`, `persona_user_relationships`, `personas`
- Migration: `/app/backend/migrations/add_user_characters_and_relationships.py`

**Backend:**
- `/app/backend/database.py` - Methods: `get_relationship_by_persona_character()`
- `/app/backend/routes/personas.py` - Existing relationship endpoints
- `/app/backend/routes/chat_routes.py` - NEEDS UPDATE

**Frontend:**
- `/app/src/components/PersonaManager.tsx` - Character management UI
- `/app/src/store/personaStore.ts` - NEEDS UPDATE
- `/app/src/pages/ChatPage.tsx` - NEEDS UPDATE

---

## ✅ Checklist untuk Agent Berikutnya

**Before Starting:**
- [ ] Read `docs/golden-rules.md` (especially Rule #3 - Testing Protocol)
- [ ] Understand existing database schema
- [ ] Review current persona system implementation

**Phase 1 - Backend:**
- [ ] Create `/app/backend/ai/prompts/persona_system_prompts.py`
- [ ] Implement `build_persona_prompt_with_relationship()`
- [ ] Update `/app/backend/routes/chat_routes.py` - add `character_id` param
- [ ] Update persona agent to use dynamic prompts

**Phase 2 - Frontend:**
- [ ] Update `/app/src/store/personaStore.ts` - add character state
- [ ] Update `/app/src/components/chat/ChatHeader.tsx` - display character
- [ ] Create character selector component
- [ ] Update `/app/src/store/chatStore.ts` - include character_id in messages

**Phase 3 - Polish:**
- [ ] Handle edge cases (deleted characters, no relationships, etc)
- [ ] Add loading states
- [ ] Add error handling
- [ ] **STOP & ASK USER untuk test** (jangan test sendiri!)

---

## 🎤 Final Message untuk Agent Berikutnya

Halo Agent! 👋

Kamu akan melanjutkan implementation **Dynamic Nicknames & Persona Relationships** untuk ChimeraAI.

**Foundation sudah selesai** (database, API, UI management) - sekarang tinggal **integrate ke chat system**.

**PENTING BANGET:**
1. 📖 **Baca `docs/golden-rules.md` dulu** - especially Rule #3 tentang testing protocol
2. 🚫 **JANGAN test backend tanpa permintaan user** - ini melanggar golden rules
3. ✋ **STOP setelah selesai coding** - tanya user dulu sebelum test
4. 💬 User akan test sendiri via UI atau minta bantuan test kalau perlu

**Goal**: AI bisa memanggil user dengan nickname yang sesuai relationship & mood.

**Contoh Expected Result:**
```
Salma (Kekasih → Lycus):
- "Sayang, apa kabar hari ini?" 
- "Cinta, ada yang bisa aku bantu?"
- "Dear, kamu mau cerita apa?"

Lycus (Teman → Affif):
- "Bro, gimana kabarnya?"
- "Kawan, ada yang bisa dibantu?"
```

Good luck & happy coding! 🚀

---

**Created**: October 23, 2025  
**Author**: E1 Agent (Session 1)  
**For**: E1 Agent (Session 2)  
**Status**: 🟢 Ready for Implementation
