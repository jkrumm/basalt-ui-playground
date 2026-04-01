#!/usr/bin/env bash
# Kill any processes listening on the dev ports (7712=web, 7713=api)

for port in 7712 7713; do
  pid=$(lsof -ti tcp:"$port" 2>/dev/null)
  if [ -n "$pid" ]; then
    echo "Killing process $pid on port $port"
    kill -9 "$pid" 2>/dev/null || true
  fi
done
