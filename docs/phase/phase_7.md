## 🎯 Phase Overview

Membangun visual novel dialog system dengan fitur:
- Character sprites positioning (left/right)
- Dialog box dengan typing animation
- Dynamic background changes per scene
- Click to continue mechanic
- Story progression tracking
- Database-driven dialog & scenes
- Character emotion states
- Save/Load progress

---

## ✅ Phase 7.1: Database Schema & Backend API (PLANNED)

**Status:** 📋 Planned  
**Goal:** Setup database structure untuk menyimpan stories, characters, dialogs, dan scenes

### Database Tables:

#### 1. **stories** (Main story metadata)
```sql
- id (PRIMARY KEY)
- title (TEXT)
- description (TEXT)
- cover_image_url (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- is_published (BOOLEAN)
- total_scenes (INTEGER)
```

#### 2. **characters** (Character definitions)
```sql
- id (PRIMARY KEY)
- name (TEXT)
- display_name (TEXT)
- description (TEXT)
- default_sprite_url (TEXT)
- text_color (TEXT) - for dialog display
- created_at (TIMESTAMP)
```

#### 3. **character_sprites** (Character expressions/poses)
```sql
- id (PRIMARY KEY)
- character_id (FOREIGN KEY)
- emotion (TEXT) - neutral, happy, sad, angry, surprised, etc.
- sprite_url (TEXT)
- sprite_name (TEXT)
```

#### 4. **scenes** (Story scenes/chapters)
```sql
- id (PRIMARY KEY)
- story_id (FOREIGN KEY)
- scene_number (INTEGER)
- scene_title (TEXT)
- background_url (TEXT)
- background_music_url (TEXT) - optional
- created_at (TIMESTAMP)
```

#### 5. **dialogs** (Individual dialog lines)
```sql
- id (PRIMARY KEY)
- scene_id (FOREIGN KEY)
- character_id (FOREIGN KEY)
- dialog_order (INTEGER)
- dialog_text (TEXT)
- character_position (TEXT) - left, right, center
- character_emotion (TEXT) - links to sprite
- background_url (TEXT) - override scene background if needed
- sound_effect_url (TEXT) - optional
- next_dialog_id (INTEGER) - for branching
```

#### 6. **user_progress** (Save system)
```sql
- id (PRIMARY KEY)
- user_id (TEXT) - optional for guest mode
- story_id (FOREIGN KEY)
- current_scene_id (FOREIGN KEY)
- current_dialog_id (FOREIGN KEY)
- completed (BOOLEAN)
- last_played_at (TIMESTAMP)
```

### Backend API Endpoints (Planned):

**Stories Management:**
- `GET /api/visual-novel/stories` - Get all stories
- `GET /api/visual-novel/stories/{id}` - Get story details
- `POST /api/visual-novel/stories` - Create new story (admin)
- `PUT /api/visual-novel/stories/{id}` - Update story
- `DELETE /api/visual-novel/stories/{id}` - Delete story

**Characters Management:**
- `GET /api/visual-novel/characters` - Get all characters
- `GET /api/visual-novel/characters/{id}` - Get character with sprites
- `POST /api/visual-novel/characters` - Create character
- `POST /api/visual-novel/characters/{id}/sprites` - Add sprite

**Scenes & Dialogs:**
- `GET /api/visual-novel/stories/{id}/scenes` - Get story scenes
- `GET /api/visual-novel/scenes/{id}/dialogs` - Get scene dialogs
- `POST /api/visual-novel/scenes` - Create scene
- `POST /api/visual-novel/dialogs` - Create dialog
- `PUT /api/visual-novel/dialogs/{id}` - Update dialog

**Progress Tracking:**
- `GET /api/visual-novel/progress/{story_id}` - Get user progress
- `POST /api/visual-novel/progress/save` - Save progress
- `POST /api/visual-novel/progress/load` - Load progress

### Files to Create:
- `backend/models/visual_novel.py` - Pydantic models
- `backend/database/visual_novel_db.py` - Database operations
- `backend/routes/visual_novel.py` - API routes
- `backend/migrations/create_visual_novel_tables.py` - DB migration

---

## ✅ Phase 7.2: Frontend Components Structure (PLANNED)

**Status:** 📋 Planned  
**Goal:** Build reusable React components for visual novel UI

### Components to Create:

#### 1. **VisualNovelEngine** (Main container)
- Story loading & state management
- Scene progression logic
- Auto-save progress
- Keyboard shortcuts (Space = continue, Ctrl+S = save, Ctrl+L = load)
- Full-screen mode support

#### 2. **GameCanvas** (Main display area)
- Background image display with transitions
- Character sprite positioning
- Layered rendering (background → characters → dialog box)
- Fade in/out transitions
- Parallax effects (optional)

#### 3. **CharacterSprite** (Character display)
- Position: left, right, center
- Emotion-based sprite switching
- Fade in/out animations
- Scale adjustments
- Mirror/flip for positioning

#### 4. **DialogBox** (Text display)
- Character name display
- Dialog text with typing animation
- Click/tap to continue indicator
- Skip typing animation option
- Auto-advance timer (optional)
- Text history backlog

#### 5. **ControlPanel** (UI controls)
- Auto-play toggle
- Text speed adjustment
- Skip button
- Save/Load menu
- Settings menu
- Return to title

#### 6. **StorySelector** (Title screen)
- Story list with covers
- Story description
- Start/Continue button
- Progress indicator

#### 7. **SaveLoadMenu** (Save system UI)
- Save slots (1-10)
- Screenshot preview
- Timestamp display
- Save/Load/Delete actions

### UI/UX Design Principles:

**Layout:**
```
┌─────────────────────────────────────────┐
│         Background Image (Full)          │
│                                          │
│  [Character]              [Character]   │
│    (Left)                   (Right)     │
│                                          │
│  ┌──────────────────────────────────┐  │
│  │  Character Name                   │  │
│  │  ────────────────────────────────│  │
│  │  Dialog text appears here with   │  │
│  │  typing animation effect...  [▼] │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Color Scheme:**
- Dialog box: Dark semi-transparent (rgba(0, 0, 0, 0.8))
- Character name: Accent color per character
- Text: White with shadow for readability
- Borders: Subtle gradient borders
- Buttons: Minimal, non-intrusive

**Animations:**
- Dialog fade-in: 0.3s ease
- Character appear: 0.5s fade + slide
- Background transition: 1s cross-fade
- Typing speed: 30-50ms per character (adjustable)
- Click indicator: pulse animation

### Files to Create:
- `src/pages/VisualNovelPage.tsx` - Main page
- `src/components/visual-novel/VisualNovelEngine.tsx`
- `src/components/visual-novel/GameCanvas.tsx`
- `src/components/visual-novel/CharacterSprite.tsx`
- `src/components/visual-novel/DialogBox.tsx`
- `src/components/visual-novel/ControlPanel.tsx`
- `src/components/visual-novel/StorySelector.tsx`
- `src/components/visual-novel/SaveLoadMenu.tsx`
- `src/store/visualNovelStore.ts` - Zustand store

---

## ✅ Phase 7.3: Core Gameplay Mechanics (PLANNED)

**Status:** 📋 Planned  
**Goal:** Implement dialog progression, scene transitions, and user interactions

### Features to Implement:

#### 1. **Dialog Progression System**
- Load current scene dialogs from API
- Display dialog with typing animation
- Character sprite changes based on emotion
- Background changes per dialog (if specified)
- Continue button/click anywhere to advance
- Space bar keyboard shortcut

#### 2. **Scene Transition Logic**
- Detect end of scene dialogs
- Load next scene data
- Fade out → load → fade in transition
- Background music crossfade (if applicable)
- Chapter title display (optional)

#### 3. **Character Management**
- Show/hide characters based on dialog
- Position characters (left/right/center)
- Switch character emotions dynamically
- Multiple characters on screen support
- Character entrance/exit animations

#### 4. **Text Display Engine**
- Typewriter effect with adjustable speed
- Click to skip typing animation
- Text wrapping and formatting
- Character name color coding
- Dialog history backlog (scroll back)

#### 5. **Auto-Save System**
- Save progress after each dialog
- LocalStorage for guest users
- Database for logged-in users (future)
- Auto-load last progress on return

#### 6. **Keyboard & Touch Controls**
- Space/Enter: Continue dialog
- Ctrl+S: Quick save
- Ctrl+L: Load menu
- ESC: Settings menu
- Click/Tap anywhere: Continue

### User Flow:

```
Start → Story Selector → Load Story Data → Display First Scene
                                             ↓
                                    Display Character + Dialog
                                             ↓
                                    User Clicks \"Continue\"
                                             ↓
                                    Next Dialog → Update Character/BG
                                             ↓
                                    Repeat until Scene End
                                             ↓
                                    Scene Transition → Next Scene
                                             ↓
                                    Story Complete → End Screen
```

### Files to Modify:
- `src/store/visualNovelStore.ts` - Add progression logic
- `src/components/visual-novel/VisualNovelEngine.tsx` - Implement game loop
- `src/lib/visual-novel-api.ts` - API integration

---

## ✅ Phase 7.4: Sample Story Implementation (PLANNED)

**Status:** 📋 Planned  
**Goal:** Create sample story content with characters and dialogs

### Sample Story: \"The Mysterious Encounter\"

**Story Metadata:**
- Title: \"The Mysterious Encounter\"
- Description: \"A chance meeting that changes everything...\"
- Genre: Fantasy/Romance
- Estimated Length: 15-20 dialogs
- Total Scenes: 3

**Characters:**

1. **Luna** (Female Protagonist)
   - Position: Left
   - Sprites: neutral, happy, surprised, worried
   - Text Color: #A78BFA (purple)
   - Description: Mysterious girl with magical abilities

2. **Lycus** (Male Character)
   - Position: Right
   - Sprites: neutral, confident, serious, smiling
   - Text Color: #60A5FA (blue)
   - Description: Skilled warrior searching for truth

**Scene Breakdown:**

**Scene 1: The Forest Clearing**
- Background: Forest clearing at dusk
- Music: Ambient forest sounds
- Characters: Luna (left)
- Dialog count: 5-7 lines
- Purpose: Introduction, setting mood

Sample dialogs:
1. Luna (neutral): \"I've been waiting for you...\"
2. Luna (happy): \"The stars told me someone special would arrive today.\"
3. Luna (surprised): \"Wait... you can see the magical aura too?\"
4. Luna (worried): \"But that means... you're in danger.\"

**Scene 2: The Revelation**
- Background: Ancient ruins
- Music: Mysterious ambience
- Characters: Luna (left), Lycus (right)
- Dialog count: 8-10 lines
- Purpose: Character interaction, plot development

Sample dialogs:
1. Lycus (neutral): \"Who are you? How do you know about me?\"
2. Luna (neutral): \"My name is Luna. I'm a guardian of this realm.\"
3. Lycus (serious): \"Guardian? I've been searching for answers...\"
4. Luna (happy): \"Then fate has brought us together, Lycus.\"
5. Lycus (surprised): \"How did you know my name?!\"

**Scene 3: The Choice**
- Background: Mystical portal gateway
- Music: Epic/emotional theme
- Characters: Luna (left), Lycus (right)
- Dialog count: 5-7 lines
- Purpose: Climax, resolution

Sample dialogs:
1. Luna (worried): \"The portal is opening. You must decide now.\"
2. Lycus (confident): \"I've made my choice. I'll help you protect this world.\"
3. Luna (happy): \"Then our journey begins together!\"

### Asset Requirements:
- 2 character sprite sets (4 emotions each) = 8 images
- 3 background images
- Background music (optional, can use placeholder)

**Asset Strategy:**
- Use vision_expert_agent to find suitable character sprites (anime style)
- Search terms: \"anime girl sprite\", \"anime male character\", \"fantasy forest background\"
- Or provide placeholder colored rectangles for MVP

### Files to Create:
- `backend/seeders/sample_story_data.py` - Insert sample story to DB
- `docs/stories/sample_story.md` - Story script documentation

---

## ✅ Phase 7.5: Polish & Advanced Features (PLANNED)

**Status:** 📋 Planned  
**Goal:** Add polish, animations, and quality-of-life features

### Features:

#### 1. **Advanced Animations**
- Character entrance effects (fade, slide, zoom)
- Background parallax scrolling
- Dialog box slide-up animation
- Screen shake for dramatic moments
- Flash effects for important scenes

#### 2. **Audio System**
- Background music playback
- Sound effects (click, page turn)
- Voice acting support (future)
- Volume controls
- Audio fade in/out

#### 3. **Settings Menu**
- Text speed slider
- Auto-play speed
- Music/SFX volume
- Skip read dialogs option
- Fullscreen toggle

#### 4. **Dialog History**
- Backlog viewer (scroll previous dialogs)
- Search dialog history
- Jump to previous scene

#### 5. **Choice System** (Branching)
- Multiple choice dialogs
- Branch to different story paths
- Track player choices
- Multiple endings support

#### 6. **Gallery & Achievements**
- CG (Computer Graphics) gallery
- Character profile viewer
- Achievement system
- Play statistics

### Polish Checklist:
- [ ] Smooth transitions everywhere
- [ ] Loading states with spinners
- [ ] Error handling for missing assets
- [ ] Responsive design (mobile support)
- [ ] Accessibility (keyboard navigation)
- [ ] Performance optimization (lazy loading)
- [ ] Dark mode support
- [ ] Share story progress (social)

---

## 📊 Progress Summary

| Phase | Status | Backend | Frontend | Testing |
|-------|--------|---------|----------|---------|
| 7.1: Database & API | 📋 Planned | 0% | - | - |
| 7.2: Components | 📋 Planned | - | 0% | - |
| 7.3: Game Mechanics | 📋 Planned | - | 0% | - |
| 7.4: Sample Story | 📋 Planned | 0% | 0% | - |
| 7.5: Polish | 📋 Planned | - | 0% | - |

**Overall Progress:** 0% (Planning Phase Complete) 📝

---

## 🎨 Design Specifications

### Typography:
- **Character Names:** 18px, Bold, Character-specific color
- **Dialog Text:** 16px, Regular, White (#FFFFFF)
- **UI Text:** 14px, Medium, Light gray (#D1D5DB)
- **Font Family:** \"Inter\", \"Noto Sans JP\" (for Japanese support)

### Color Palette:
- **Luna (Purple):** #A78BFA
- **Lycus (Blue):** #60A5FA
- **Dialog Box:** rgba(15, 15, 16, 0.9)
- **Border:** Linear gradient gold
- **Accent:** #F59E0B (gold/amber)

### Animations:
- **Dialog typing:** 40ms/char (default), adjustable 20-100ms
- **Character fade:** 500ms ease-in-out
- **Background transition:** 1000ms cross-fade
- **Button hover:** 200ms ease
- **Click indicator:** 800ms infinite pulse

### Responsive Breakpoints:
- **Desktop:** 1920x1080 (primary)
- **Laptop:** 1366x768
- **Tablet:** 768x1024 (vertical)
- **Mobile:** 375x667 (simplified UI)

---

## 🔧 Technical Stack

### Frontend:
- **Framework:** React 19 + TypeScript
- **State Management:** Zustand (visualNovelStore)
- **Animations:** Framer Motion
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Audio:** HTML5 Audio API / Howler.js (optional)

### Backend:
- **Framework:** FastAPI
- **Database:** MongoDB (existing)
- **Models:** Pydantic v2
- **File Upload:** For character sprites & backgrounds
- **Storage:** Local file system or S3 (future)

### Assets:
- **Character Sprites:** PNG with transparency (300x600px recommended)
- **Backgrounds:** JPG/PNG (1920x1080 recommended)
- **Audio:** MP3 (music), OGG (effects)

---

## 🚀 Implementation Strategy

### Phase 7.1: Backend First (Day 1-2)
1. Create database schema
2. Write migration script
3. Implement API endpoints
4. Test with curl
5. Seed sample story data

### Phase 7.2: Frontend Structure (Day 2-3)
1. Create component files
2. Setup Zustand store
3. Build static UI first (no logic)
4. Test component rendering
5. Add routing

### Phase 7.3: Connect Frontend + Backend (Day 3-4)
1. API integration
2. Dialog progression logic
3. Character/background display
4. User interaction (click to continue)
5. Basic save/load

### Phase 7.4: Polish & Test (Day 4-5)
1. Add animations
2. Implement sample story
3. End-to-end testing
4. Bug fixes
5. Performance optimization

### Phase 7.5: Advanced Features (Future)
- Branching choices
- Audio system
- Gallery
- Admin panel for story creation

---

## 📝 Notes

### Golden Rules Compliance:
- ✅ Frontend-first with mock data (Phase 7.2)
- ✅ Backend implementation after user approval (Phase 7.3)
- ✅ Testing with `deep_testing_backend_v2` before frontend
- ✅ Screenshot tool to verify UI
- ✅ No hardcoded URLs (use .env)
- ✅ No AI emojis in code (use lucide-react)
- ✅ Supervisor for server management

### Key Technical Decisions:
- **Why MongoDB?** Flexible schema for nested dialog structures
- **Why Zustand?** Lightweight, better than Context API for game state
- **Why Framer Motion?** Best animation library for React
- **Why Local Storage?** Quick MVP save system, DB later

### Asset Management Strategy:
- **Option 1:** Use vision_expert_agent to find free assets
- **Option 2:** Use placeholder colored shapes for MVP
- **Option 3:** User provides custom sprites (recommended for production)

### Future Enhancements (Post-MVP):
- Story editor (WYSIWYG for non-technical users)
- Multi-language support (i18n)
- Voice acting integration
- Mobile app (React Native)
- Multiplayer/co-op reading
- AI-generated stories (LLM integration)
- Steam/Itch.io export

---

## 🎯 Success Criteria

**Phase 7 MVP Complete When:**
- [x] Planning document created (this file)
- [ ] User can view story list
- [ ] User can start story and see first dialog
- [ ] Characters appear with correct positioning
- [ ] Background displays correctly
- [ ] Click to continue works
- [ ] Dialog typing animation works
- [ ] Scene transitions work
- [ ] Progress auto-saves
- [ ] Sample story playable end-to-end
- [ ] Tested on desktop & mobile
- [ ] No console errors
- [ ] Performance acceptable (60fps)

---

## 🐛 Known Limitations (Pre-emptive)

1. **No branching choices yet** - Linear story only in MVP
2. **No audio system** - Silent gameplay initially
3. **Limited character emotions** - 4 emotions per character max
4. **No voice acting** - Text-only dialogs
5. **Single save slot** - Auto-save only, no manual slots in MVP
6. **No skip feature** - Must read all dialogs sequentially
7. **No gallery** - Can't review past CGs/scenes

---

**Document Created:** January 24, 2025  
**Status:** 📋 Planning Complete, Ready for Implementation  
**Next Action:** Get user approval → Start Phase 7.1 (Backend)  
