# ChimeraAI Phase 3 - Planning Document

**Status**: 🔵 PLANNED (Not Started)  
**Date**: October 18, 2025  
**Dependencies**: Phase 2 Complete ✅

---

## 🎯 **PHASE 3 OVERVIEW**

Phase 3 fokus pada **Tools Display & Upload Improvements** - membuat tools library lebih professional, compact, dan support untuk frontend tools.

### **Primary Goals**:
1. 🎨 Improve tools grid layout (4 per row, more compact)
2. 📤 Dual upload system (Backend + Frontend tools)
3. ▶️ Frontend tools execution system
4. 🎭 Better tool type visualization

### **Optional Goals** (Future):
- 🤖 Ollama AI integration button
- 📦 Tool marketplace
- 🔄 Auto-update tools
- 📊 Enhanced analytics

---

## 📋 **DETAILED REQUIREMENTS**

### **1. Tools Grid Layout Improvements**

#### **Current State**:
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│             │  │             │  │             │
│  Tool Card  │  │  Tool Card  │  │  Tool Card  │
│             │  │             │  │             │
│   (Large)   │  │   (Large)   │  │   (Large)   │
│             │  │             │  │             │
└─────────────┘  └─────────────┘  └─────────────┘
```
- 3 columns on desktop (xl breakpoint)
- Cards are large (~300px width)
- Good spacing but inefficient use of screen space
- Only ~6 tools visible on 1080p screen

#### **Target State**:
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│          │  │          │  │          │  │          │
│ Tool     │  │ Tool     │  │ Tool     │  │ Tool     │
│ (Compact)│  │ (Compact)│  │ (Compact)│  │ (Compact)│
│          │  │          │  │          │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```
- 4 columns on desktop (xl breakpoint)
- Smaller, more compact cards (~240px width)
- Professional & clean design
- ~8-12 tools visible on 1080p screen

#### **Implementation Details**:

**File**: `src/components/ToolCard.tsx`

**Changes Needed**:
1. Reduce overall card height
2. Smaller icon/emoji (48px → 40px)
3. Compact spacing (p-6 → p-4)
4. Truncate description to 1 line
5. Smaller badges & buttons
6. Adjust hover effects (keep smooth, reduce scale)

**Grid Columns** in `src/pages/ToolsPage.tsx`:
```tsx
// Current
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

// Target
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

**Responsive Breakpoints**:
- Mobile (< 768px): 1 column
- Tablet (768px - 1024px): 2 columns
- Desktop (1024px - 1280px): 3 columns
- Large Desktop (> 1280px): 4 columns

**Card Specifications**:
- Width: Auto (fills grid column)
- Height: ~240px (fixed for consistency)
- Padding: 16px (p-4)
- Border radius: 16px (rounded-2xl)
- Hover scale: 1.02 (subtle)
- Shadow: medium → large on hover

---

### **2. Dual Upload System**

#### **Architecture**:

```
┌─────────────────────────────────────────────────┐
│           Settings → Tools Management            │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌──────────────────┐    ┌──────────────────┐  │
│  │ Upload Backend   │    │ Upload Frontend  │  │
│  │      Tool        │    │      Tool        │  │
│  │   (Python 🐍)    │    │    (React ⚛️)    │  │
│  └──────────────────┘    └──────────────────┘  │
│                                                  │
└─────────────────────────────────────────────────┘
```

#### **Backend Tools** (Existing - Python)

**Current Implementation**: ✅ Already working

**Upload Modal**: `UploadToolModal.tsx` (rename to `UploadBackendToolModal.tsx`)
**Validation**: Python syntax check, dependencies detection
**Storage**: `backend/tools/{tool_id}/script.py`
**Execution**: Subprocess via FastAPI endpoint
**Database**: SQLite `tools` table with `type='backend'`

**Flow**:
1. User clicks "Upload Backend Tool"
2. Select `.py` file
3. Auto-extract metadata
4. Validate Python syntax
5. Store in backend/tools/
6. Add to SQLite with type='backend'
7. Ready to execute

#### **Frontend Tools** (NEW - React/JS/TS)

**New Implementation**: 🆕 To be built

**Upload Modal**: `UploadFrontendToolModal.tsx` (NEW)
**Validation**: JSX/TSX syntax check, dependencies detection
**Storage**: `frontend/src/tools/{tool_id}/Tool.tsx`
**Execution**: Dynamic import + render in modal/window
**Database**: SQLite `tools` table with `type='frontend'`

**Flow**:
1. User clicks "Upload Frontend Tool"
2. Select `.tsx` or `.jsx` file
3. Auto-extract metadata (JSDoc comments)
4. Validate React component syntax
5. Check for required exports (default export component)
6. Store in frontend/src/tools/
7. Add to SQLite with type='frontend'
8. Ready to render

**Frontend Tool Template**:
```tsx
/**
 * NAME: Calculator
 * CATEGORY: Utilities
 * DESCRIPTION: Simple calculator for basic math
 * AUTHOR: Username
 * VERSION: 1.0.0
 */

import { useState } from 'react'

export default function Calculator() {
  const [result, setResult] = useState(0)
  
  return (
    <div className=\"p-6\">
      <h2 className=\"text-2xl font-bold mb-4\">Calculator</h2>
      {/* Tool UI here */}
    </div>
  )
}
```

**Metadata Extraction**:
- Parse JSDoc comments at top of file
- Same fields as backend tools
- Fallback to filename if no metadata

**Validation**:
- Check for default export
- Validate JSX syntax (babel parse)
- Check React imports
- Detect dependencies (import statements)

**Storage Structure**:
```
frontend/src/tools/
├── {tool-id-1}/
│   ├── Tool.tsx          # Main component
│   ├── metadata.json     # Extracted metadata
│   └── assets/          # Optional images/files
└── {tool-id-2}/
    └── Tool.tsx
```

---

### **3. Frontend Tools Execution**

#### **Execution Environment Options**:

**Option A: Modal Overlay** (Recommended for Phase 3)
```
┌─────────────────────────────────────────────────┐
│  ChimeraAI                              [X]      │
├─────────────────────────────────────────────────┤
│                                                  │
│   ┌───────────────────────────────────────┐    │
│   │  Tool Modal                        [X]│    │
│   ├───────────────────────────────────────┤    │
│   │                                       │    │
│   │   <Frontend Tool Component Renders>  │    │
│   │                                       │    │
│   │                                       │    │
│   └───────────────────────────────────────┘    │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Pros**:
- ✅ Simpler implementation
- ✅ Stay in main window
- ✅ Easy state management
- ✅ Quick to build

**Cons**:
- ❌ Limited screen space
- ❌ Can't use alongside other tools

**Option B: New Electron Window** (Future Enhancement)
```
┌────────────────────┐    ┌────────────────────┐
│  ChimeraAI         │    │  Tool Window       │
│                    │    │                    │
│  [Tools Library]   │    │  <Tool Component>  │
│                    │    │                    │
└────────────────────┘    └────────────────────┘
```

**Pros**:
- ✅ Full screen space for tool
- ✅ Multiple tools simultaneously
- ✅ Better for complex tools

**Cons**:
- ❌ More complex (Electron BrowserWindow)
- ❌ IPC communication needed
- ❌ State synchronization

#### **Phase 3 Implementation: Modal Overlay**

**New Component**: `FrontendToolModal.tsx`

**Features**:
- Full-screen modal (backdrop blur)
- Dynamic import of tool component
- Error boundary
- Loading state
- Close button (top right)
- Tool name in header
- Isolated React context

**Component Structure**:
```tsx
interface FrontendToolModalProps {
  toolId: string
  toolName: string
  isOpen: boolean
  onClose: () => void
}

export default function FrontendToolModal({ 
  toolId, 
  toolName, 
  isOpen, 
  onClose 
}: FrontendToolModalProps) {
  const [ToolComponent, setToolComponent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  useEffect(() => {
    if (isOpen) {
      // Dynamic import
      import(`@/tools/${toolId}/Tool.tsx`)
        .then(module => {
          setToolComponent(() => module.default)
          setLoading(false)
        })
        .catch(err => {
          setError(err.message)
          setLoading(false)
        })
    }
  }, [isOpen, toolId])
  
  if (!isOpen) return null
  
  return (
    <div className=\"fixed inset-0 z-50 bg-black/60 backdrop-blur-sm\">
      <div className=\"w-full h-full flex flex-col\">
        {/* Header */}
        <div className=\"flex items-center justify-between p-4 bg-white dark:bg-dark-surface border-b\">
          <h2 className=\"text-xl font-bold\">{toolName}</h2>
          <button onClick={onClose}>
            <X className=\"w-6 h-6\" />
          </button>
        </div>
        
        {/* Tool Content */}
        <div className=\"flex-1 overflow-auto bg-white dark:bg-dark-background\">
          {loading && <LoadingSpinner />}
          {error && <ErrorMessage error={error} />}
          {ToolComponent && (
            <ErrorBoundary>
              <ToolComponent />
            </ErrorBoundary>
          )}
        </div>
      </div>
    </div>
  )
}
```

**Error Boundary**:
```tsx
class ToolErrorBoundary extends React.Component {
  state = { hasError: false, error: null }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className=\"p-8 text-center\">
          <AlertCircle className=\"w-16 h-16 text-red-500 mx-auto mb-4\" />
          <h3 className=\"text-xl font-bold mb-2\">Tool Error</h3>
          <p className=\"text-secondary\">{this.state.error.message}</p>
        </div>
      )
    }
    return this.props.children
  }
}
```

**Execution Flow**:
1. User clicks "Run Tool" on frontend tool card
2. Open `FrontendToolModal` with tool ID
3. Modal dynamically imports tool component
4. Tool renders inside modal
5. Tool has access to:
   - React hooks
   - Zustand stores
   - Electron IPC (if needed)
6. User interacts with tool
7. Click X or ESC to close
8. Component unmounts & cleanup

---

### **4. Tool Type Visualization**

#### **Tool Cards Update**:

Add **type badge** to each tool card to distinguish Backend vs Frontend:

```tsx
<div className=\"tool-card\">
  {/* Status + Type badges */}
  <div className=\"flex items-center justify-between\">
    <span className=\"status-badge\">● Active</span>
    
    {/* NEW: Type badge */}
    <span className={cn(
      \"text-xs px-2 py-1 rounded-full font-medium\",
      tool.type === 'backend' 
        ? \"bg-blue-500/20 text-blue-600 dark:text-blue-400\"
        : \"bg-purple-500/20 text-purple-600 dark:text-purple-400\"
    )}>
      {tool.type === 'backend' ? '🐍 Backend' : '⚛️ Frontend'}
    </span>
  </div>
  
  {/* Rest of card... */}
</div>
```

**Color Coding**:
- Backend (Python): Blue 🐍
- Frontend (React): Purple ⚛️

**Filters Update**:
Add \"Type\" filter to `ToolsSidePanel.tsx`:
- All Types
- Backend Only
- Frontend Only

---

## 🗂️ **DATABASE SCHEMA UPDATES**

### **Add `type` Column to `tools` Table**:

```sql
-- Migration: Add type column
ALTER TABLE tools ADD COLUMN type TEXT DEFAULT 'backend';

-- Update existing tools
UPDATE tools SET type = 'backend' WHERE type IS NULL;

-- Add index for filtering
CREATE INDEX idx_tools_type ON tools(type);
```

**Enum Values**:
- `'backend'` - Python tools (subprocess execution)
- `'frontend'` - React tools (component rendering)

**Query Examples**:
```python
# Get all backend tools
db.execute(\"SELECT * FROM tools WHERE type = 'backend'\")

# Get all frontend tools
db.execute(\"SELECT * FROM tools WHERE type = 'frontend'\")

# Count by type
db.execute(\"SELECT type, COUNT(*) FROM tools GROUP BY type\")
```

---

## 🛠️ **IMPLEMENTATION PLAN**

### **Step 1: Tools Grid Improvements** (2-3 hours)

1. Update `ToolCard.tsx`:
   - Reduce dimensions
   - Adjust padding & spacing
   - Optimize text truncation
   - Test responsiveness

2. Update `ToolsPage.tsx`:
   - Change grid columns to 4
   - Adjust gap spacing
   - Test on multiple screen sizes

3. Update `ToolListItem.tsx` (if needed):
   - Keep compact for list view

**Testing**:
- Test on 1080p, 1440p, 4K resolutions
- Test mobile & tablet
- Verify readability
- Check hover effects

---

### **Step 2: Database Schema Update** (30 min)

1. Create migration script
2. Add `type` column to `tools` table
3. Set default value `'backend'`
4. Update existing tools
5. Add index
6. Test queries

**File**: `backend/migrations/add_tool_type.py` (NEW)

---

### **Step 3: Backend Upload Refactor** (1 hour)

1. Rename `UploadToolModal.tsx` → `UploadBackendToolModal.tsx`
2. Update imports in `SettingsPage.tsx`
3. Add type='backend' to upload payload
4. Test upload flow
5. Verify database entry

---

### **Step 4: Frontend Upload Modal** (3-4 hours)

1. Create `UploadFrontendToolModal.tsx`:
   - File picker for `.tsx`, `.jsx`, `.js` files
   - JSDoc metadata extraction
   - React component validation
   - Preview (optional)

2. Add validation logic:
   - Check default export
   - Validate JSX syntax
   - Parse dependencies

3. Backend endpoint:
   - POST `/api/tools/upload-frontend`
   - Save to `frontend/src/tools/{id}/Tool.tsx`
   - Add to database with type='frontend'

4. Test upload flow

**Files**:
- `src/components/UploadFrontendToolModal.tsx` (NEW)
- `backend/server.py` (UPDATE - add endpoint)

---

### **Step 5: Frontend Tool Execution** (4-5 hours)

1. Create `FrontendToolModal.tsx`:
   - Full-screen modal
   - Dynamic import
   - Loading & error states
   - Error boundary

2. Update `ToolCard.tsx`:
   - Detect tool type
   - Execute based on type:
     - Backend: IPC call (existing)
     - Frontend: Open modal (new)

3. Add tool type badge to cards

4. Test execution:
   - Create sample frontend tool
   - Upload via new modal
   - Execute from library
   - Verify rendering

**Files**:
- `src/components/FrontendToolModal.tsx` (NEW)
- `src/components/ToolCard.tsx` (UPDATE)

---

### **Step 6: Filters & Type Display** (1-2 hours)

1. Update `ToolsSidePanel.tsx`:
   - Add \"Type\" filter section
   - All / Backend / Frontend buttons

2. Update `toolsStore.ts`:
   - Add `selectedType` state
   - Update `getFilteredTools()` to include type filter

3. Update tool cards:
   - Show type badge
   - Color coding (blue/purple)

4. Test filtering

---

### **Step 7: Polish & Testing** (2-3 hours)

1. UI polish:
   - Consistent spacing
   - Smooth animations
   - Proper error messages
   - Loading states

2. Manual testing:
   - Upload backend tool ✓
   - Upload frontend tool ✓
   - Execute backend tool ✓
   - Execute frontend tool ✓
   - Filter by type ✓
   - Theme switching ✓

3. Documentation:
   - Update HANDOFF.md
   - Create Phase 3 completion doc
   - Update golden rules if needed

---

## 📊 **ESTIMATED TIMELINE**

**Total Time**: ~15-20 hours

| Task | Time | Priority |
|------|------|----------|
| Tools Grid Improvements | 2-3h | P1 |
| Database Schema Update | 0.5h | P1 |
| Backend Upload Refactor | 1h | P1 |
| Frontend Upload Modal | 3-4h | P1 |
| Frontend Tool Execution | 4-5h | P1 |
| Filters & Type Display | 1-2h | P2 |
| Polish & Testing | 2-3h | P2 |

**Milestones**:
- Day 1: Grid improvements + DB update ✅
- Day 2: Frontend upload modal ✅
- Day 3: Frontend execution + filters ✅
- Day 4: Polish & testing ✅

---

## 🎨 **UI MOCKUPS**

### **Settings Page - Dual Upload**:
```
┌─────────────────────────────────────────────────┐
│  Settings > Tools Management                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  Statistics: [Total: 12] [Active: 8] [Disabled: 4]
│                                                  │
│  ┌──────────────────┐    ┌──────────────────┐  │
│  │  Upload Backend  │    │  Upload Frontend │  │
│  │      Tool        │    │      Tool        │  │
│  │                  │    │                  │  │
│  │    [+ Upload]    │    │    [+ Upload]    │  │
│  └──────────────────┘    └──────────────────┘  │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │  Tools Table                             │   │
│  │  Name     Type      Status    Actions    │   │
│  │  Tool1    Backend   Active    [Edit][Del]│   │
│  │  Tool2    Frontend  Active    [Edit][Del]│   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### **Tools Library - 4 Columns**:
```
┌──────────────────────────────────────────────────┐
│  Python Tools                  [Grid] [List] [...│
├──────────────────────────────────────────────────┤
│                                                   │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │🐍   │  │⚛️   │  │🐍   │  │⚛️   │            │
│  │Tool1│  │Tool2│  │Tool3│  │Tool4│            │
│  │v1.0 │  │v1.0 │  │v1.0 │  │v1.0 │            │
│  └─────┘  └─────┘  └─────┘  └─────┘            │
│                                                   │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │⚛️   │  │🐍   │  │🐍   │  │⚛️   │            │
│  │Tool5│  │Tool6│  │Tool7│  │Tool8│            │
│  └─────┘  └─────┘  └─────┘  └─────┘            │
│                                                   │
└──────────────────────────────────────────────────┘
```

### **Frontend Tool Modal**:
```
┌──────────────────────────────────────────────────┐
│  Calculator                               [X]     │
├──────────────────────────────────────────────────┤
│                                                   │
│   ┌────────────────────────────────────────┐    │
│   │                                         │    │
│   │    <Frontend Tool Component Renders>   │    │
│   │                                         │    │
│   │    [Calculator Interface Here]         │    │
│   │                                         │    │
│   │                                         │    │
│   └────────────────────────────────────────┘    │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 🚧 **POTENTIAL CHALLENGES**

### **1. Frontend Tool Validation**:
**Challenge**: Validating React/JSX syntax without running it  
**Solution**: Use babel parser or esbuild for syntax check  
**Alternative**: Basic validation (check for export, imports)

### **2. Dynamic Imports**:
**Challenge**: Tools need to be importable at runtime  
**Solution**: Store in `src/tools/` (inside src for Vite bundling)  
**Alternative**: Use Vite's glob import feature

### **3. Tool Isolation**:
**Challenge**: Tools might conflict (state, globals, CSS)  
**Solution**: Render in separate React root with shadow DOM  
**Phase 3**: Keep simple - single modal, cleanup on unmount

### **4. Dependencies**:
**Challenge**: Frontend tools might need external packages  
**Solution**: Phase 3 - only allow built-in React hooks  
**Future**: Support npm install for tools

---

## ✅ **SUCCESS CRITERIA**

Phase 3 is complete when:

- [ ] Tools grid shows 4 columns on desktop
- [ ] Cards are compact & professional
- [ ] Separate upload buttons for Backend & Frontend
- [ ] Backend upload still works (no regression)
- [ ] Frontend upload modal functional
- [ ] Frontend tools validate correctly
- [ ] Frontend tools execute in modal
- [ ] Tool type badges visible on cards
- [ ] Type filter works in sidebar
- [ ] Database has `type` column
- [ ] Both tool types work simultaneously
- [ ] Theme switching works (light/dark)
- [ ] No performance issues
- [ ] Documentation updated

---

## 🔮 **FUTURE ENHANCEMENTS** (Phase 4+)

### **Phase 4: AI Integration** 🤖
- Ollama integration button
- AI-powered tool generation
- Code analysis & suggestions
- Natural language tool search

### **Phase 5: Tool Marketplace** 📦
- Browse community tools
- One-click install
- Rate & review system
- Auto-updates
- Version management

### **Phase 6: Advanced Features** 🚀
- Tool dependencies auto-install
- Virtual environments per tool
- Tool scheduling (cron-like)
- Tool chaining (output → input)
- Collaborative tools (real-time)

---

## 📚 **REFERENCES**

### **Dynamic Imports**:
- [Vite Dynamic Import](https://vitejs.dev/guide/features.html#dynamic-import)
- [React Lazy Loading](https://react.dev/reference/react/lazy)

### **Error Boundaries**:
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

### **JSX Parsing**:
- [Babel Parser](https://babeljs.io/docs/en/babel-parser)
- [esbuild](https://esbuild.github.io/)

### **Electron Windows**:
- [BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window)
- [IPC Main/Renderer](https://www.electronjs.org/docs/latest/tutorial/ipc)

---

**Phase 3**: PLANNED 🔵  
**Ready to Start**: After Phase 2 Review  
**Estimated Duration**: 3-4 days (15-20 hours)  
**Date**: October 18, 2025
