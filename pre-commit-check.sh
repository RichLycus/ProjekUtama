#!/bin/bash
#
# ChimeraAI Pre-Commit Helper
# ===========================
# Run this before committing to ensure everything is in order
#

echo ""
echo "🔍 ChimeraAI Pre-Commit Verification"
echo "====================================="
echo ""

# Run Python verification script
python3 verify_setup.py

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All checks passed! Safe to commit."
    echo ""
    echo "Next steps:"
    echo "  git add ."
    echo "  git commit -m 'Your commit message'"
    echo "  git push origin main"
    echo ""
else
    echo "❌ Some checks failed. Please fix issues before committing."
    echo ""
fi

exit $EXIT_CODE
