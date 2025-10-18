# 🧪 Testing Script

## Quick Test
```bash
./test_final_fixes.sh
```

## What It Tests
1. ✅ Preload path uses MAIN_DIST (not __dirname)
2. ✅ Port killer functions exist
3. ✅ Port killer called in main()
4. ✅ No "Backend already running" check
5. ✅ Log files use fixed names (no timestamps)

## Expected Result
```
✅ Passed: 9
✅ Failed: 0

🎉 All fixes verified!
```

## If Tests Fail
- **"dist check failed"** → Run `yarn dev` first to build
- **Other failures** → Check if you pulled latest: `git pull origin main`

## Next Steps After Tests Pass
1. Run application: `./start_chimera.sh`
2. Test window controls (minimize, maximize, close buttons)
3. Check logs directory: `ls -lah logs/`
4. Open DevTools (F12) and verify no errors

## Documentation
- **Latest Fixes:** `docs/FIXES_v3.md`
- **All Fixes:** `docs/FIXES_SUMMARY.md`
- **Bahasa Indonesia:** `docs/FIXES_SUMMARY_ID.md`

---

**Note:** Old test files (`test_electron_ipc.sh`, `verify_fixes.sh`, `test_window_controls.sh`) have been removed. Only `test_final_fixes.sh` is used now.
