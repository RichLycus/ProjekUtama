# 🐛 Fix: Process.env Error di Browser

## ❌ Error yang Terjadi

```
ReferenceError: process is not defined
at loadAgentConfigs (SettingsPage.tsx:166:62)
```

**Symptoms**: 
- Error muncul saat membuka Settings page
- Console menunjukkan `process is not defined`
- Terjadi di browser runtime

---

## 🔍 Root Cause

### **Problem Code**:
```javascript
const backendUrl = import.meta.env.VITE_BACKEND_URL || 
                   process.env.REACT_APP_BACKEND_URL || 
                   'http://localhost:8001'
```

### **Why it Failed**:
1. `process.env` adalah Node.js API yang **tidak tersedia di browser**
2. Di Vite projects, hanya `import.meta.env` yang bisa digunakan di browser code
3. `process.env` hanya tersedia di Node.js runtime (backend/build scripts)

### **Where it Happened**:
- `SettingsPage.tsx` line 166 - `loadAgentConfigs()`
- `SettingsPage.tsx` line 184 - `handleToggleAgent()`
- `SettingsPage.tsx` line 216 - `handleSaveAgent()`

---

## ✅ Solution

### **1. Created Backend Utility Module**

File: `/app/src/lib/backend.ts`

```typescript
// Single source of truth for backend URL
export const BACKEND_URL = 'http://127.0.0.1:8001'

// Organized API endpoints
export const API_ENDPOINTS = {
  agents: {
    configs: `${BACKEND_URL}/api/agents/configs`,
    toggle: (id: string) => `${BACKEND_URL}/api/agents/configs/${id}/toggle`,
    update: (id: string) => `${BACKEND_URL}/api/agents/configs/${id}`,
  },
  tools: { /* ... */ },
  chat: { /* ... */ },
}

// Helper functions
export async function checkBackendHealth(): Promise<boolean>
export async function apiCall<T>(endpoint: string, options?: RequestInit)
```

**Benefits**:
- ✅ No more `process.env` in browser code
- ✅ Single source of truth for backend URL
- ✅ Type-safe API endpoints
- ✅ Reusable across components
- ✅ Easy to maintain

### **2. Updated SettingsPage.tsx**

**Before**:
```typescript
const backendUrl = import.meta.env.VITE_BACKEND_URL || 
                   process.env.REACT_APP_BACKEND_URL || 
                   'http://localhost:8001'
const response = await fetch(`${backendUrl}/api/agents/configs`)
```

**After**:
```typescript
import { API_ENDPOINTS } from '@/lib/backend'

const response = await fetch(API_ENDPOINTS.agents.configs)
```

**Changes Made**:
1. Import backend utility at top
2. Replace all hardcoded URLs with `API_ENDPOINTS`
3. Remove all `process.env` references
4. Cleaner, more maintainable code

---

## 📊 Impact

### **Files Modified**:
- ✅ `src/lib/backend.ts` (NEW) - Backend utility module
- ✅ `src/pages/SettingsPage.tsx` - Removed process.env, using API_ENDPOINTS

### **Error Status**:
- ❌ **Before**: `ReferenceError: process is not defined`
- ✅ **After**: No errors, Settings page loads correctly

---

## 🎯 Best Practices Implemented

### **1. Environment Variables in Vite**

**Browser Code** (React components):
```typescript
// ✅ CORRECT - Use import.meta.env
const apiUrl = import.meta.env.VITE_API_URL

// ❌ WRONG - process.env causes error
const apiUrl = process.env.REACT_APP_API_URL  // ReferenceError!
```

**Node.js Code** (vite.config.ts, scripts):
```typescript
// ✅ CORRECT - process.env works in Node.js
const port = process.env.PORT || 3000
```

### **2. Backend URL Management**

**In Electron Apps**:
```typescript
// Backend always runs at fixed localhost:8001 (auto-started)
export const BACKEND_URL = 'http://127.0.0.1:8001'
```

**In Web Apps** (if needed):
```typescript
// Use import.meta.env for configurable backend URL
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
                           'http://localhost:8001'
```

### **3. API Endpoint Organization**

```typescript
// Centralized, type-safe endpoints
export const API_ENDPOINTS = {
  resource: {
    list: `${BACKEND_URL}/api/resource`,
    get: (id: string) => `${BACKEND_URL}/api/resource/${id}`,
    create: `${BACKEND_URL}/api/resource`,
    update: (id: string) => `${BACKEND_URL}/api/resource/${id}`,
    delete: (id: string) => `${BACKEND_URL}/api/resource/${id}`,
  }
}
```

---

## 🚀 Usage Examples

### **Fetching Data**:
```typescript
import { API_ENDPOINTS } from '@/lib/backend'

// Simple fetch
const response = await fetch(API_ENDPOINTS.agents.configs)
const data = await response.json()

// With parameters
const agentId = 'general'
const response = await fetch(API_ENDPOINTS.agents.toggle(agentId), {
  method: 'POST'
})
```

### **Using Helper Function**:
```typescript
import { apiCall, API_ENDPOINTS } from '@/lib/backend'

// Automatic error handling
const result = await apiCall(API_ENDPOINTS.agents.configs)
if (result.success) {
  console.log('Data:', result.data)
} else {
  console.error('Error:', result.error)
}
```

### **Health Check**:
```typescript
import { checkBackendHealth } from '@/lib/backend'

const isHealthy = await checkBackendHealth()
if (!isHealthy) {
  toast.error('Backend is not running!')
}
```

---

## 🧪 Testing

### **Test 1: Settings Page Loads**
1. Open app
2. Navigate to Settings page
3. ✅ No console errors
4. ✅ Page loads correctly

### **Test 2: Agent Configs Load**
1. Open Settings > Personas tab
2. ✅ Agent configs load successfully
3. ✅ No "process is not defined" error

### **Test 3: Toggle Agent**
1. Click toggle switch on any agent
2. ✅ Agent enables/disables correctly
3. ✅ Toast notification appears

---

## 📚 Related Issues

### **Similar Errors to Watch For**:

```javascript
// ❌ These will ALL cause "process is not defined" in browser:
process.env.NODE_ENV
process.env.REACT_APP_*
process.cwd()
process.argv
```

**Solution**: 
- Use `import.meta.env` for Vite env variables
- Use centralized config like `backend.ts`
- Never access Node.js APIs in browser code

---

## ✅ Verification Checklist

- [x] Removed all `process.env` from `src/` directory
- [x] Created centralized `backend.ts` utility
- [x] Updated SettingsPage to use API_ENDPOINTS
- [x] No console errors in Settings page
- [x] Agent configs load successfully
- [x] Toggle agent works correctly
- [x] Frontend builds without errors
- [x] Documentation updated

---

## 🎊 Conclusion

**Error Fixed**: `ReferenceError: process is not defined`

**Solution**: 
1. ✅ Removed `process.env` from browser code
2. ✅ Created centralized backend utility
3. ✅ Using `API_ENDPOINTS` for type-safe URLs
4. ✅ Settings page now works correctly

**Best Practice**: Never use `process.env` in browser code (React components). Use `import.meta.env` for Vite env variables, or hardcode values for Electron apps.

---

*Fixed: [Date] - Settings page process.env error resolved*
