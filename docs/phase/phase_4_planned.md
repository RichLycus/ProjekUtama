# 📋 Phase 4: Advanced Chat Features - PLANNED

## 🎯 Status: PLANNED 📝

**Start Date**: TBD  
**Estimated Duration**: 2-3 weeks  
**Focus**: File upload, Image OCR, STT/TTS, Enhanced chat capabilities

---

## 🎯 Phase 4 Goals

- 📁 **File Upload** - Support berbagai file types
- 🖼️ **Image Upload + OCR** - Extract text dari images
- 🎙️ **Speech-to-Text (STT)** - Voice input
- 🔊 **Text-to-Speech (TTS)** - Voice output
- 💬 **Enhanced Messaging** - Code blocks, markdown, copy/paste
- 🎨 **Rich Content** - Syntax highlighting, tables, diagrams

---

## 📋 Detailed Feature Planning

### 1. File Upload System 📁

**Goals**:
- Support multiple file types (PDF, DOCX, TXT, CSV, JSON, etc.)
- Drag & drop interface
- File preview before upload
- Progress indicator
- File size validation
- Type validation

**Technical Approach**:
```typescript
// Frontend: File upload component
<FileUploader
  accept=".pdf,.docx,.txt,.csv,.json"
  maxSize={10 * 1024 * 1024}  // 10MB
  onUpload={handleFileUpload}
  multiple={true}
/>

// Backend: File processing endpoint
POST /api/chat/upload-file
- Parse file content
- Extract text/data
- Store in database
- Return processed content
```

**Implementation Steps**:
1. Frontend upload component with drag & drop
2. Backend file parser (pdf, docx, txt, csv)
3. File storage system
4. Integration with chat messages
5. File history & management

**Dependencies**:
```python
# Backend
pypdf2          # PDF parsing
python-docx     # DOCX parsing
pandas          # CSV/Excel
```

---

### 2. Image Upload with OCR 🖼️

**Goals**:
- Upload images (PNG, JPG, WEBP)
- Extract text via OCR
- Display image in chat
- Use extracted text as context

**Technical Approach**:
```typescript
// Frontend: Image upload
<ImageUploader
  accept="image/*"
  onUpload={handleImageUpload}
  withOCR={true}
/>

// Backend: OCR processing
POST /api/chat/upload-image
- Receive image
- Run OCR (Tesseract/EasyOCR)
- Extract text
- Return image URL + extracted text
```

**OCR Options**:
1. **Tesseract OCR** (Open-source)
   - Pros: Free, good accuracy
   - Cons: Requires installation
   
2. **EasyOCR** (Deep learning)
   - Pros: Better accuracy, multi-language
   - Cons: Larger model size

3. **Cloud API** (Google Vision, AWS Textract)
   - Pros: Best accuracy
   - Cons: API costs

**Recommended**: Start with **EasyOCR**

**Dependencies**:
```python
easyocr==1.7.0  # OCR library
pillow==10.0.0  # Image processing
```

**Implementation Steps**:
1. Image upload component
2. Image storage (local/S3)
3. OCR integration
4. Display image in chat
5. Use OCR text in RAG context

---

### 3. Speech-to-Text (STT) 🎙️

**Goals**:
- Record audio from microphone
- Convert speech to text
- Real-time transcription
- Multiple language support

**Technical Approach**:
```typescript
// Frontend: Voice recorder
<VoiceRecorder
  onRecordComplete={handleAudioUpload}
  maxDuration={60}  // 60 seconds
  language="id-ID"  // Indonesian
/>

// Backend: STT processing
POST /api/chat/stt
- Receive audio file
- Convert to text (Whisper/Google Speech)
- Return transcription
```

**STT Options**:
1. **OpenAI Whisper** (Recommended)
   - Pros: Excellent accuracy, free, local
   - Cons: GPU recommended
   
2. **Google Speech-to-Text**
   - Pros: Cloud-based, very accurate
   - Cons: API costs

3. **Browser Web Speech API**
   - Pros: No backend needed
   - Cons: Browser-dependent, online only

**Recommended**: **Whisper** (can run locally)

**Dependencies**:
```python
openai-whisper==20231117  # Whisper STT
ffmpeg-python==0.2.0      # Audio processing
```

**Implementation Steps**:
1. Browser audio recording
2. Audio file upload
3. Whisper integration
4. Transcription display
5. Insert text to chat input

---

### 4. Text-to-Speech (TTS) 🔊

**Goals**:
- Convert AI responses to speech
- Natural-sounding voice
- Playback controls (play/pause/stop)
- Voice selection (male/female, language)

**Technical Approach**:
```typescript
// Frontend: Audio player
<TTSPlayer
  text={aiResponse}
  voice="female"
  language="id-ID"
  onPlay={handlePlayback}
/>

// Backend: TTS generation
POST /api/chat/tts
- Receive text
- Generate audio (gTTS/Coqui TTS)
- Return audio file URL
```

**TTS Options**:
1. **gTTS** (Google Text-to-Speech)
   - Pros: Free, simple
   - Cons: Internet required
   
2. **Coqui TTS** (Local, Deep Learning)
   - Pros: Natural voice, local, customizable
   - Cons: Model size (~500MB)

3. **Eleven Labs** (Cloud API)
   - Pros: Best quality
   - Cons: API costs

**Recommended**: Start with **gTTS**, upgrade to **Coqui TTS**

**Dependencies**:
```python
gtts==2.5.0          # Google TTS (simple)
TTS==0.22.0          # Coqui TTS (advanced)
pydub==0.25.1        # Audio manipulation
```

**Implementation Steps**:
1. TTS generation endpoint
2. Audio file storage
3. Frontend audio player
4. Playback controls
5. Voice selection UI

---

### 5. Enhanced Messaging 💬

**Goals**:
- Markdown rendering
- Code syntax highlighting
- Copy button for code blocks
- Tables rendering
- LaTeX math support (optional)

**Technical Approach**:
```typescript
// Use react-markdown + plugins
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

<ReactMarkdown
  components={{
    code: CodeBlock,  // Custom code component
    table: TableComponent,
    // ... other custom renderers
  }}
>
  {aiResponse}
</ReactMarkdown>
```

**Code Highlighting**:
```typescript
const CodeBlock = ({ language, children }) => {
  return (
    <div className="relative">
      <SyntaxHighlighter 
        language={language}
        style={oneDark}
      >
        {children}
      </SyntaxHighlighter>
      <CopyButton code={children} />
    </div>
  )
}
```

**Dependencies**:
```json
{
  "react-markdown": "^9.0.0",
  "react-syntax-highlighter": "^15.5.0",
  "remark-gfm": "^4.0.0",
  "rehype-katex": "^7.0.0"  // For math
}
```

**Implementation Steps**:
1. Install markdown dependencies
2. Custom code block component
3. Copy button functionality
4. Table rendering
5. LaTeX math (optional)

---

### 6. Voice Conversation Mode 🗣️

**Goals**:
- Continuous voice conversation
- STT → AI → TTS pipeline
- Hands-free mode
- Voice activity detection

**Flow**:
```
User speaks → STT → Text → AI Processing → Response → TTS → Audio output
     ↑                                                              ↓
     └──────────────── Loop continues ─────────────────────────────┘
```

**Implementation**:
```typescript
const VoiceConversationMode = () => {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  
  const handleVoiceInput = async (audioBlob) => {
    // 1. STT
    const text = await speechToText(audioBlob)
    
    // 2. Send to AI
    const response = await sendMessage(text)
    
    // 3. TTS
    setSpeaking(true)
    await textToSpeech(response)
    setSpeaking(false)
    
    // 4. Continue listening
    if (listening) startListening()
  }
}
```

---

## 📦 Estimated Dependencies

### Backend:
```txt
# File Processing
pypdf2==3.0.0
python-docx==1.1.0
pandas==2.1.0

# Image & OCR
easyocr==1.7.0
pillow==10.0.0

# Audio Processing
openai-whisper==20231117
ffmpeg-python==0.2.0
gtts==2.5.0
TTS==0.22.0  # Coqui TTS
pydub==0.25.1
```

### Frontend:
```json
{
  "react-markdown": "^9.0.0",
  "react-syntax-highlighter": "^15.5.0",
  "remark-gfm": "^4.0.0",
  "react-dropzone": "^14.2.3",
  "@radix-ui/react-dialog": "^1.0.5"
}
```

---

## 🗓️ Implementation Timeline

### Week 1: File Upload & Image OCR
- Day 1-2: File upload component + backend
- Day 3-4: Image upload + OCR integration
- Day 5: Testing & refinement

### Week 2: STT & TTS
- Day 1-2: Speech-to-Text (Whisper)
- Day 3-4: Text-to-Speech (gTTS + Coqui)
- Day 5: Voice controls & UI

### Week 3: Enhanced Messaging & Polish
- Day 1-2: Markdown + code highlighting
- Day 3-4: Voice conversation mode
- Day 5: Testing & documentation

---

## 🎯 Success Criteria

### File Upload:
- [ ] Support 5+ file types
- [ ] Drag & drop works
- [ ] File preview functional
- [ ] Progress indicator accurate
- [ ] Error handling robust

### Image OCR:
- [ ] Upload images successfully
- [ ] OCR accuracy >85%
- [ ] Display image in chat
- [ ] Extracted text editable
- [ ] Multi-language support

### STT:
- [ ] Record audio clearly
- [ ] Transcription accurate
- [ ] Real-time feedback
- [ ] Works in noisy environment
- [ ] Multiple language support

### TTS:
- [ ] Natural-sounding voice
- [ ] Playback controls work
- [ ] Voice selection available
- [ ] Audio quality good
- [ ] Response time <3s

### Enhanced Messaging:
- [ ] Markdown renders correctly
- [ ] Code highlighting works
- [ ] Copy button functional
- [ ] Tables display properly
- [ ] Math formulas render (optional)

---

## 🔧 Technical Challenges

### 1. File Size Management
**Challenge**: Large files (images, audio) can slow down app
**Solution**: 
- Compression before upload
- Chunked upload for large files
- CDN for file storage

### 2. STT/TTS Performance
**Challenge**: Processing time for audio
**Solution**:
- GPU acceleration for Whisper
- Streaming audio for TTS
- Cache common phrases

### 3. Browser Compatibility
**Challenge**: Web Speech API not universal
**Solution**:
- Fallback to server-side processing
- Feature detection
- Graceful degradation

### 4. Security
**Challenge**: File upload security risks
**Solution**:
- File type validation
- Size limits
- Virus scanning
- Sandboxed file processing

---

## 💡 Future Enhancements (Phase 5+)

- [ ] Video upload & processing
- [ ] Multi-modal AI (GPT-4 Vision)
- [ ] Screen sharing for debugging
- [ ] Collaborative chat (multi-user)
- [ ] Chat export (PDF, TXT)
- [ ] Voice cloning (personal TTS)
- [ ] Real-time translation
- [ ] Gesture controls

---

## 📚 References & Resources

### Documentation:
- [Whisper GitHub](https://github.com/openai/whisper)
- [EasyOCR Docs](https://github.com/JaidedAI/EasyOCR)
- [Coqui TTS](https://github.com/coqui-ai/TTS)
- [React Markdown](https://github.com/remarkjs/react-markdown)

### Tutorials:
- Building file upload with React
- OCR integration tutorial
- Whisper STT implementation
- TTS in web applications

---

## 🏁 Phase 4 Roadmap

```
Phase 4.1: File Upload & Image OCR (Week 1)
  ├── File upload component
  ├── Backend file parser
  ├── Image OCR integration
  └── Testing

Phase 4.2: STT & TTS (Week 2)
  ├── Whisper STT setup
  ├── Audio recording UI
  ├── TTS generation
  └── Playback controls

Phase 4.3: Enhanced Messaging (Week 3)
  ├── Markdown rendering
  ├── Code highlighting
  ├── Voice conversation mode
  └── Final polish
```

---

**Made with ❤️ for ChimeraAI**

**Last Updated**: Phase 4 Planning  
**Author**: ChimeraAI Development Team  
**Status**: 📝 Planned - Ready for Implementation
