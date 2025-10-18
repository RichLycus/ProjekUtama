# Web Games Directory

This directory will contain embedded web games for entertainment.

## Structure (Phase 5)

Each game will have its own directory with HTML/JS/CSS:

```
games/
├── game1/
│   ├── index.html       # Game entry point
│   ├── game.js          # Game logic
│   ├── style.css        # Game styles
│   └── assets/          # Images, sounds, etc.
├── game2/
│   └── ...
```

## Game Ideas

1. **Tetris** - Classic puzzle game
2. **Snake** - Retro arcade game
3. **Memory Cards** - Brain training
4. **Tic-Tac-Toe** - Simple strategy game
5. **2048** - Number puzzle

## Integration

Games will be loaded via iframe or webview in the Games page:

```tsx
<iframe
  src={`file://${gamesDir}/game1/index.html`}
  className="w-full h-full"
/>
```

## Status

**Phase 0**: Directory structure ready ✅  
**Phase 5**: Implementation planned 🔜
