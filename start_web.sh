#!/bin/bash
# Start ChimeraAI in web mode (for container/preview environment)

echo "🚀 Starting ChimeraAI Web Mode..."

# Kill any existing vite processes
pkill -f "vite.*config.web" 2>/dev/null

# Start Vite with web config on port 3000
cd /app
npx vite --config vite.config.web.ts --host 0.0.0.0 --port 3000 > /tmp/vite-web.log 2>&1 &

echo "✅ Frontend starting on port 3000..."
echo "📝 Logs: /tmp/vite-web.log"

sleep 3

if curl -s http://localhost:3000 > /dev/null; then
  echo "✅ Frontend is running!"
else
  echo "❌ Frontend failed to start. Check logs at /tmp/vite-web.log"
fi

# Check backend status
if sudo supervisorctl status backend | grep -q "RUNNING"; then
  echo "✅ Backend is running!"
else
  echo "⚠️  Backend is not running. Starting..."
  sudo supervisorctl start backend
fi

echo ""
echo "🎉 ChimeraAI is ready!"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8001"
