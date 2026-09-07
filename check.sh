#!/bin/bash
wget -q -O /tmp/page.html http://localhost:8000/ 2>/dev/null
echo "=== script/link tags ==="
grep -oP '(src|href)="[^"]*"' /tmp/page.html | grep -E '5173|vite|build' | head -20
echo "=== hot file ==="
cat /mnt/d/app/lws-pos/public/hot 2>/dev/null
echo ""
echo "=== vite inside container ==="
docker exec laravel_vite ls /app/public/hot 2>/dev/null
echo "=== vite test connection ==="
wget -q -O /dev/null http://localhost:5173/resources/js/app.tsx 2>&1 && echo "vite OK" || echo "vite FAIL"
