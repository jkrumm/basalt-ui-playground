#!/usr/bin/env bash
# Kill any processes listening on the dev ports (7712=web, 7713=api)

for port in 7712 7713; do
  pids=$(lsof -ti tcp:"$port" 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "Killing port $port (PIDs: $(echo $pids | tr '\n' ' '))"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done
