# Phase 7 v2: RPG House + Visual Novel System

**Last Updated:** January 25, 2025  
**Status:** 📋 Planning  
**Type:** Interactive 3D Pixel RPG Home with Visual Novel Dialog

---

## 🎯 Phase Overview

Membangun **interactive 3D pixel RPG house** dimana user bisa:
- Kontrol karakter Lycus (Main Character/User) di dalam rumah
- Eksplor rumah 3D isometric/top-down pixel art
- Interaksi dengan Salma (pasangan/AI companion) 
- Tekan **E** untuk mulai visual novel dialog
- Smooth transition dari exploration → visual novel mode
- Gradual animations (tidak terlalu heavy)

**Core Concept:**
```
Home Exploration (RPG) ←→ Dialog Mode (Visual Novel)
     (WASD/Arrow)              (Click/Space)
```

---

## 🏠 Game Design Document

### Character Design:

#### 1. **Lycus** (Main Character - User)
- **Role:** Player character, user's avatar
- **Position:** Controllable dalam house exploration
- **Sprites:** 4-direction walking (up, down, left, right)
- **Pixel Size:** 32x32 or 48x48
- **Color Scheme:** Blue theme (#60A5FA)
- **Personality:** Curious, caring, tech-savvy
- **Visual Novel Position:** Right side

#### 2. **Salma** (AI Companion - Pasangan)
- **Role:** Interactive NPC, AI chat companion
- **Position:** Fixed locations in house (living room, kitchen, etc)
- **Sprites:** Idle animation, talking animation
- **Pixel Size:** 32x32 or 48x48  
- **Color Scheme:** Warm purple/pink (#E879F9)
- **Personality:** Helpful, cheerful, supportive
- **Visual Novel Position:** Left side
- **Emotions:** neutral, happy, surprised, thinking, blushing

---

## 🎮 Phase 7.1: 3D Pixel House - Foundation (NEW)

**Status:** 📋 Planned  
**Goal:** Build interactive 3D pixel RPG house exploration system

### House Layout:

```
┌──────────────────────────────────────┐
│         🏠 Lycus & Salma's Home      │
│                                      │
│  ┌─────────┐      ┌──────────┐     │
│  │ Bedroom │      │  Kitchen │     │
│  │    🛏️   │      │    🍳    │     │
│  └────┬────┘      └─────┬────┘     │
│       │                 │           │
│  ┌────┴──────────────┬──┴────┐     │
│  │    Living Room    │  Bath │     │
│  │       🛋️          │  🚿   │     │
│  │                   │       │     │
│  │   Salma is here   └───────┘     │
│  │      👧💕                        │
│  └──────────┬────────────────┘     │
│             │                       │
│        ┌────┴────┐                 │
│        │ Entrance│                 │
│        │   🚪    │                 │
│        └─────────┘                 │
└──────────────────────────────────────┘
```

### Rooms & Objects:

**1. Living Room** (Main area)
- Sofa, TV, coffee table
- Bookshelf (future: knowledge base access)
- Salma's default position
- Window with day/night cycle view

**2. Kitchen**
- Dining table, fridge, stove
- Salma sometimes here (cooking animation)
- Future: mini-game cooking

**3. Bedroom**
- Bed, wardrobe, desk
- Computer desk (future: settings/tools access)
- Cozy lighting

**4. Bathroom**
- Shower, sink, mirror
- Decorative only for MVP

**5. Entrance**
- Door (future: go outside, new areas)
- Shoe rack, coat hanger

### Interaction System:

**Proximity Detection:**
```javascript
// When Lycus is near Salma
if (distance(lycus, salma) < 50px) {
  showPrompt("[E] Chat with Salma");
  
  if (keyPressed === 'E') {
    transitionToVisualNovel();
  }
}
```

**Interactable Objects:**
- 💬 Salma → Visual Novel Dialog
- 📺 TV → Watch news/updates (future)
- 📚 Bookshelf → Browse knowledge (future)
- 💻 Computer → Settings/Tools (future)
- 🚪 Door → Go outside (future phases)

### Controls:

**Exploration Mode:**
- **WASD** or **Arrow Keys** → Move Lycus
- **E** → Interact with nearby object/person
- **ESC** → Pause menu / Settings
- **Tab** → Toggle UI elements
- **Shift** → Sprint/Run (optional)

**Visual Novel Mode:**
- **Click** or **Space** → Continue dialog
- **ESC** → Return to house exploration
- **Ctrl+S** → Quick save conversation
- **Arrow Up** → Dialog history

### Camera View:

**Option A: Top-Down (Zelda-style)** ⭐ Recommended
- Classic RPG view
- Easy to implement
- Clear visibility
- 2D sprites with depth sorting

**Option B: Isometric (Stardew Valley-style)**
- More 3D feel
- Prettier but complex
- Requires isometric sprites
- Depth sorting trickier

**Decision:** Start with **Top-Down** untuk MVP, bisa upgrade ke Isometric nanti.

---

## 🎨 Phase 7.2: Visual Assets & Sprite System

**Status:** 📋 Planned  
**Goal:** Create/gather pixel art assets untuk house dan characters

### Asset Requirements:

#### Character Sprites:

**Lycus (Player):**
- `lycus_idle_down.png` (32x32, 4 frames)
- `lycus_walk_down.png` (32x32, 4 frames)
- `lycus_walk_up.png` (32x32, 4 frames)
- `lycus_walk_left.png` (32x32, 4 frames)
- `lycus_walk_right.png` (32x32, 4 frames)
- **Total:** 5 sprite sheets × 4 frames = 20 frames

**Salma (NPC):**
- `salma_idle.png` (32x32, 4 frames - breathing animation)
- `salma_talking.png` (32x32, 4 frames - talking animation)
- **Total:** 2 sprite sheets × 4 frames = 8 frames

**Visual Novel Portraits:**
- `salma_neutral.png` (400x600)
- `salma_happy.png` (400x600)
- `salma_surprised.png` (400x600)
- `salma_thinking.png` (400x600)
- `salma_blushing.png` (400x600)
- **Total:** 5 emotion portraits

#### House Tileset:

- Floor tiles (wood, carpet, tile)
- Wall tiles (various colors)
- Furniture sprites (sofa, bed, table, etc)
- Door sprites (open/closed)
- Window sprites (day/night)
- Decorative items (plants, paintings, etc)

**Tileset Size:** 16x16 or 32x32 tiles

#### Background Images (Visual Novel Mode):

- `living_room_bg.png` (1920x1080) - blur house view
- `kitchen_bg.png` (1920x1080)
- `bedroom_bg.png` (1920x1080)

### Asset Strategy:

**Option 1: Generate with AI** (Fastest)
- Use Stable Diffusion / MidJourney
- Prompt: "pixel art character sprite, 32x32, RPG, top-down view"
- Quick iteration
- May need cleanup

**Option 2: Use Free Asset Packs** (Recommended for MVP)
- itch.io pixel art assets
- OpenGameArt.org
- Kenney.nl (free game assets)
- LPC (Liberated Pixel Cup) sprites
- Modify colors to match theme

**Option 3: Commission Artist** (Production quality)
- Hire pixel artist on Fiverr/ArtStation
- Custom designs
- Perfect match to vision
- Takes time + budget

**MVP Decision:** Option 2 (Free assets) + color modifications

---

## 💻 Phase 7.3: Technical Implementation

**Status:** 📋 Planned  
**Goal:** Build the actual game mechanics

### Tech Stack:

**Game Engine Options:**

**Option A: Phaser 3** ⭐ Recommended
- Full-featured 2D game framework
- Tilemap support
- Physics engine built-in
- Large community
- Easy sprite animations
- Good performance

**Option B: PixiJS**
- Lower-level, more control
- Better for custom rendering
- Steeper learning curve
- More manual work

**Option C: Canvas + Manual**
- Full control
- Heavy lifting required
- Not recommended for timeline

**Decision:** **Phaser 3** untuk faster development

### Core Systems to Build:

#### 1. **Player Movement System**
```typescript
// PlayerController.ts
class PlayerController {
  sprite: Phaser.Sprite;
  speed: number = 150;
  
  update(cursors: CursorKeys) {
    // Handle WASD/Arrow movement
    // Update sprite animation
    // Check collision with walls
  }
  
  isNearby(target: Phaser.Sprite): boolean {
    // Calculate distance
    // Return true if within interaction range
  }
}
```

#### 2. **Interaction System**
```typescript
// InteractionManager.ts
class InteractionManager {
  detectInteractables(player: Player) {
    // Find nearby interactable objects
    // Show UI prompt
  }
  
  triggerInteraction(object: GameObject) {
    if (object.type === 'NPC') {
      // Transition to Visual Novel
      startVisualNovelDialog(object);
    } else if (object.type === 'furniture') {
      // Show message or mini-game
    }
  }
}
```

#### 3. **Visual Novel Transition**
```typescript
// TransitionManager.ts
function transitionToVisualNovel(character: NPC) {
  // 1. Fade out game canvas
  fadeOut(gameCanvas, 500);
  
  // 2. Take screenshot of current house (blur)
  const bg = captureGameScreen();
  
  // 3. Load visual novel scene
  loadVisualNovelScene({
    background: bg.blur(),
    leftCharacter: character,
    rightCharacter: 'lycus',
    dialog: character.getDialog()
  });
  
  // 4. Fade in visual novel UI
  fadeIn(visualNovelUI, 500);
}

function returnToHouse() {
  // Reverse process
  fadeOut(visualNovelUI, 500);
  fadeIn(gameCanvas, 500);
}
```

#### 4. **State Management**
```typescript
// GameStateStore.ts (Zustand)
interface GameState {
  // House exploration state
  playerPosition: { x: number, y: number };
  playerDirection: 'up' | 'down' | 'left' | 'right';
  currentRoom: string;
  
  // NPC states
  salmaPosition: { x: number, y: number };
  salmaActivity: 'idle' | 'cooking' | 'reading' | 'sleeping';
  
  // Visual novel state
  isInDialog: boolean;
  currentDialogId: string;
  dialogHistory: Dialog[];
  
  // Time system (future)
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayCount: number;
}
```

### File Structure:

```
src/
├── components/
│   ├── rpg-house/
│   │   ├── GameCanvas.tsx          ← Phaser game container
│   │   ├── PlayerSprite.tsx        ← Player character logic
│   │   ├── NPCManager.tsx          ← NPC behavior
│   │   ├── InteractionPrompt.tsx   ← "[E] Chat with Salma"
│   │   └── HouseUI.tsx             ← Health, time, mini-map
│   │
│   └── visual-novel/
│       ├── VisualNovelEngine.tsx   ← Dialog system (from phase_7.md)
│       ├── DialogBox.tsx           ← Text display
│       ├── CharacterSprite.tsx     ← Salma/Lycus portraits
│       └── ControlPanel.tsx        ← Skip, save, history
│
├── game/
│   ├── scenes/
│   │   ├── HouseScene.ts           ← Main house scene
│   │   ├── PreloadScene.ts         ← Asset loading
│   │   └── UIScene.ts              ← HUD overlay
│   │
│   ├── entities/
│   │   ├── Player.ts               ← Player controller
│   │   ├── NPC.ts                  ← NPC base class
│   │   └── Salma.ts                ← Salma-specific behavior
│   │
│   └── systems/
│       ├── MovementSystem.ts       ← Movement logic
│       ├── CollisionSystem.ts      ← Collision detection
│       ├── InteractionSystem.ts    ← Interaction handler
│       └── CameraSystem.ts         ← Camera follow player
│
├── store/
│   ├── gameStore.ts                ← Game state (Zustand)
│   └── visualNovelStore.ts         ← Dialog state
│
└── pages/
    └── HomePage.tsx                 ← Entry point with game canvas
```

---

## 🗣️ Phase 7.4: Visual Novel Dialog System

**Status:** 📋 Planned  
**Goal:** Implement dialog system dengan Salma

### Dialog Categories:

#### 1. **Greeting Dialogs** (Time-based)
```json
{
  "greeting_morning": {
    "condition": "timeOfDay === 'morning'",
    "dialogs": [
      {
        "character": "salma",
        "emotion": "happy",
        "text": "Selamat pagi, Lycus! Sudah sarapan belum? 🌅"
      },
      {
        "character": "lycus",
        "emotion": "neutral",
        "text": "Pagi juga, Salma! Belum nih, masih ngantuk."
      },
      {
        "character": "salma",
        "emotion": "happy",
        "text": "Aku buatin kopi ya! Tunggu sebentar~ ☕"
      }
    ]
  }
}
```

#### 2. **Casual Chat** (Random topics)
- Weather discussion
- Plans for the day
- Hobbies & interests
- Memories together
- Funny stories

#### 3. **AI Assistant Mode** (When asked for help)
```json
{
  "help_request": {
    "trigger": "user_needs_help",
    "dialogs": [
      {
        "character": "salma",
        "emotion": "thinking",
        "text": "Ada yang bisa aku bantu, Lycus?"
      },
      {
        "character": "lycus",
        "emotion": "neutral",
        "text": "[Ask about: Python Tools / AI Chat / Settings]"
      },
      {
        "character": "salma",
        "emotion": "happy",
        "text": "Tenang saja! Aku jelaskan ya..."
      }
    ]
  }
}
```

#### 4. **Emotional Support** (When user seems down)
- Motivational quotes
- Encouraging words
- Listening mode
- Mood lifter mini-games

#### 5. **Story Mode** (Optional story progression)
- Unlock as user uses app more
- Character backstory reveals
- Relationship development
- Special events (birthday, anniversary)

### Dialog Features:

**Dynamic Variables:**
```javascript
// Replace variables in dialog text
dialog.text = "Hari ini hari {dayOfWeek}, tanggal {date}!"
// Result: "Hari ini hari Jumat, tanggal 25 Januari!"

// Use player name
dialog.text = "Semangat ya, {playerName}!"
// Result: "Semangat ya, Lycus!"
```

**Condition-based Dialogs:**
```javascript
// Show different dialog based on conditions
if (dayCount === 1) {
  showDialog('first_day_introduction');
} else if (completedQuests > 5) {
  showDialog('congratulations_active_user');
} else if (timeOfDay === 'night') {
  showDialog('good_night_message');
}
```

**Memory System (Future):**
- Remember previous conversations
- Reference past events
- Build relationship stats
- Unlock special dialogs

---

## 🎯 Phase 7.5: Integration with Existing Features

**Status:** 📋 Planned  
**Goal:** Connect house system dengan existing ChimeraAI features

### Integration Points:

#### 1. **Python Tools Access**
```
House → Computer Desk → Click → Tools Page
         ↓
    "Salma: Mau pakai Python Tools? Mari aku antar!"
         ↓
    Transition to Tools Page
```

#### 2. **AI Chat Access**
```
House → Salma NPC → Press E → Visual Novel Dialog
                               ↓
                      "Mau ngobrol santai atau butuh bantuan AI?"
                               ↓
                      [Casual Chat] or [AI Assistant Mode]
```

#### 3. **Settings Access**
```
House → Bedroom Desk → Click → Settings Page
```

#### 4. **Mini-Games (Future)**
```
House → TV → Click → Games Page
```

### Navigation Flow:

```
┌──────────────────────────────────────────┐
│         ChimeraAI Navigation             │
├──────────────────────────────────────────┤
│                                          │
│  🏠 Home (House RPG)                    │
│    ├─ Chat with Salma → Visual Novel    │
│    ├─ Computer → Tools Page             │
│    ├─ TV → Games Page                   │
│    └─ Door → Outside (Future)           │
│                                          │
│  💬 Chat Page (Dedicated AI Chat)       │
│  🛠️ Tools Page (Python Tools)           │
│  🎮 Games Page (Web Games)              │
│  ⚙️ Settings Page                        │
│                                          │
└──────────────────────────────────────────┘
```

---

## 🎨 Phase 7.6: Visual Design & Polish

**Status:** 📋 Planned  
**Goal:** Make it beautiful and smooth

### Visual Theme:

**Color Palette:**
- **Background:** Dark purple gradient (#1E1B4B → #312E81)
- **UI Accent:** Gold/Amber (#F59E0B)
- **Lycus Theme:** Cool Blue (#60A5FA)
- **Salma Theme:** Warm Pink/Purple (#E879F9)
- **Text:** White (#FFFFFF) with subtle shadow

**House Aesthetic:**
- Cozy modern apartment
- Warm lighting (yellow tint)
- Plants and decorations
- Personal touches (photos, books)
- Clean but lived-in

**Visual Novel Aesthetic:**
- Match Phase 7.md design
- Blurred house background
- Semi-transparent dialog box
- Character portraits with glow
- Smooth typing animation

### Animation List:

**House Exploration:**
- ✨ Player walk cycle (4 directions)
- ✨ Salma idle breathing animation
- ✨ Salma talking animation (mouth moving)
- ✨ Door open/close animation
- ✨ Object interaction sparkle
- ✨ Day/night transition (window glow)
- ✨ Water ripple effect (if has decorative pond)

**Visual Novel Mode:**
- ✨ Fade in/out transitions (500ms)
- ✨ Character portrait slide in (300ms)
- ✨ Dialog box slide up (200ms)
- ✨ Typing animation (40ms/char)
- ✨ Emotion change fade (200ms)
- ✨ Continue indicator pulse

**UI Effects:**
- ✨ Button hover glow
- ✨ Interaction prompt bounce
- ✨ Health/energy bar smooth fill
- ✨ Mini-map radar sweep (optional)

### Performance Targets:

- **FPS:** Maintain 60fps on laptop (1920x1080)
- **Load Time:** < 3 seconds initial load
- **Memory:** < 200MB RAM usage
- **Sprite Count:** < 100 active sprites
- **Audio:** Lazy load music/SFX

---

## 📊 Implementation Roadmap

### Phase 7.1: Foundation (3-4 days)
- [ ] Setup Phaser 3 in React
- [ ] Create basic house tilemap
- [ ] Implement player movement (WASD)
- [ ] Collision system
- [ ] Camera follow player
- [ ] Basic UI (health, time)

### Phase 7.2: Salma NPC (2-3 days)
- [ ] Salma sprite animations
- [ ] Salma positioning in house
- [ ] Proximity detection
- [ ] Interaction prompt UI
- [ ] Press E to interact

### Phase 7.3: Visual Novel Integration (3-4 days)
- [ ] Transition system (house ↔ VN)
- [ ] Visual novel dialog engine
- [ ] Salma emotion portraits
- [ ] Dialog box with typing
- [ ] Return to house button

### Phase 7.4: Dialog Content (2-3 days)
- [ ] Write greeting dialogs
- [ ] Write casual chat topics
- [ ] Write AI assistant dialogs
- [ ] Implement time-based greetings
- [ ] Add variable replacements

### Phase 7.5: Polish & Testing (2 days)
- [ ] Add all animations
- [ ] Sound effects (footsteps, UI clicks)
- [ ] Background music
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Mobile responsive (if needed)

### Phase 7.6: Integration (1-2 days)
- [ ] Connect to existing pages
- [ ] Computer desk → Tools
- [ ] TV → Games
- [ ] Salma chat → AI assistant

**Total Estimated Time:** 13-18 days

---

## 🎮 MVP Success Criteria

**Phase 7 MVP Complete When:**

**House Exploration:**
- [x] Planning complete (this document)
- [ ] Lycus dapat bergerak dengan WASD/Arrow
- [ ] Collision dengan walls/furniture works
- [ ] Camera smoothly follows Lycus
- [ ] Salma visible dan animated di living room
- [ ] Interaction prompt muncul saat dekat Salma
- [ ] Press E memulai visual novel dialog

**Visual Novel System:**
- [ ] Smooth transition dari house ke VN mode
- [ ] Salma portrait muncul dengan emotion
- [ ] Dialog box dengan typing animation
- [ ] Click/Space untuk continue dialog
- [ ] ESC untuk kembali ke house
- [ ] Minimal 5 dialog topics available

**Polish:**
- [ ] Animations smooth (no jank)
- [ ] Maintain 60fps
- [ ] No console errors
- [ ] Responsive UI
- [ ] Save player position on exit

**Integration:**
- [ ] Salma chat links to AI features
- [ ] Computer desk links to Tools page
- [ ] Navigation feels natural

---

## 🎨 Asset Checklist

### Must Have (MVP):
- [ ] Lycus walk sprites (4 directions)
- [ ] Salma idle sprite
- [ ] Salma talking sprite
- [ ] House floor tileset
- [ ] House walls tileset
- [ ] Basic furniture (sofa, table, bed)
- [ ] Door sprite
- [ ] Salma emotion portraits (5 emotions)
- [ ] Blurred house backgrounds (3 rooms)
- [ ] UI interaction prompt
- [ ] Dialog box frame

### Nice to Have:
- [ ] Window with day/night glow
- [ ] Decorative items (plants, paintings)
- [ ] Particle effects (sparkles)
- [ ] Ambient animations (TV glow, clock)
- [ ] Background music (lofi/cozy)
- [ ] Sound effects (footsteps, door, UI)

### Can Add Later:
- [ ] Seasonal decorations
- [ ] Weather effects (rain on window)
- [ ] More rooms (garden, balcony)
- [ ] Pet cat/dog NPC
- [ ] Mini-games inside house

---

## 🔧 Technical Notes

### Phaser 3 Setup in React:

```typescript
// game/config.ts
export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [PreloadScene, HouseScene, UIScene],
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#1a1625'
};

// components/GameCanvas.tsx
export function GameCanvas() {
  const gameRef = useRef<Phaser.Game | null>(null);
  
  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);
    }
    
    return () => {
      gameRef.current?.destroy(true);
    };
  }, []);
  
  return <div id="game-container" className="rounded-lg overflow-hidden" />;
}
```

### State Sync (Phaser ↔ React):

```typescript
// Use Zustand for shared state
import { useGameStore } from '@/store/gameStore';

// In Phaser Scene
class HouseScene extends Phaser.Scene {
  update() {
    // Update Zustand store from Phaser
    useGameStore.getState().setPlayerPosition(
      this.player.x, 
      this.player.y
    );
  }
}

// In React Component
function HouseUI() {
  const playerPosition = useGameStore(state => state.playerPosition);
  return <div>Player at ({playerPosition.x}, {playerPosition.y})</div>;
}
```

---

## 🐛 Known Challenges & Solutions

### Challenge 1: Phaser in React Lifecycle
**Problem:** Phaser game not cleaning up properly  
**Solution:** Use useRef + proper destroy in useEffect cleanup

### Challenge 2: Asset Loading Time
**Problem:** House loads slowly with many sprites  
**Solution:** Show loading screen, use sprite atlases, lazy load

### Challenge 3: Visual Novel Transition
**Problem:** Jarring switch between game and VN  
**Solution:** Crossfade + blur background + smooth animations

### Challenge 4: Mobile Performance
**Problem:** Game laggy on mobile  
**Solution:** Lower resolution, reduce particles, simplify shaders

### Challenge 5: Dialog State Management
**Problem:** Losing dialog progress on page reload  
**Solution:** Auto-save to localStorage every dialog change

---

## 📝 Dialog Writing Guidelines

### Salma's Personality:
- **Helpful:** Always eager to assist Lycus
- **Cheerful:** Optimistic and upbeat tone
- **Smart:** Knowledgeable about AI/tech
- **Caring:** Shows genuine concern for Lycus
- **Playful:** Occasional jokes and teasing
- **Indonesian:** Uses casual Indonesian (kamu/aku, bukan Anda/saya)

### Example Dialogs:

**Morning Greeting:**
```
Salma (happy): "Pagi, Lycus! Sudah siap untuk hari yang produktif? ☀️"
Lycus: "Pagi juga! Masih ngantuk sih..."
Salma (happy): "Aku buatin kopi ya! Espresso atau cappuccino?"
Lycus: "Cappuccino aja, makasih Salma 💕"
Salma (blushing): "Sama-sama! Semangat hari ini ya~"
```

**Help Request:**
```
Lycus: "Salma, aku bingung gimana cara pakai Python Tools..."
Salma (thinking): "Oh, Python Tools ya! Itu gampang kok."
Salma (happy): "Coba klik komputer di kamar, nanti aku tunjukin!"
Lycus: "Thanks! Kamu memang paling helpful~"
Salma (blushing): "Hehe, tugasku kan bantuin kamu 😊"
```

**Evening Chat:**
```
Salma (neutral): "Hari ini capek ya? Mau cerita?"
Lycus: "Iya nih, banyak kerjaan..."
Salma (happy): "Yuk istirahat dulu, aku siapkan teh hangat 🍵"
Lycus: "Makasih Salma, kamu baik banget~"
Salma (blushing): "Aku kan pacarmu, wajar dong sayang sama kamu 💕"
```

---

## 🎯 Next Steps

1. **Get User Approval** ✅ (User confirmed concept)
2. **Finalize Asset Strategy** (free assets vs commission)
3. **Setup Phaser 3** (dependencies, basic config)
4. **Create House Tilemap** (layout, collisions)
5. **Implement Player Movement** (WASD, animations)
6. **Add Salma NPC** (position, animations)
7. **Build Interaction System** (proximity, press E)
8. **Integrate Visual Novel** (transition, dialogs)
9. **Write Dialog Content** (greetings, chats, help)
10. **Polish & Test** (animations, performance)

---

**Document Created:** January 25, 2025  
**Status:** 📋 Planning Complete, Ready for User Approval  
**Next Action:** Confirm asset strategy → Start Phase 7.1 (Foundation)  

**Estimated Completion:** 2-3 weeks (gradual implementation)

---

## 💬 User Feedback Notes

**User Request:**
- Option C: Interactive Story Map → RPG House exploration
- Characters: Lycus (user) & Salma (AI companion/pasangan)
- Setting: Their house (3D pixel RPG style)
- Mechanic: Press E to chat with Salma
- Flow: House exploration → Visual Novel dialog
- Style: Top-down/Isometric pixel art
- Animation: Gradual, not too heavy

**Approved Concept:** ✅
- Combines RPG exploration with Visual Novel dialog
- Personal/cozy home setting
- Natural AI assistant integration
- Engaging interaction model
- Suitable for gradual feature expansion

---

**Siap mulai build, Kawan?** 🏠✨🎮
