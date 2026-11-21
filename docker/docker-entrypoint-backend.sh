#!/bin/sh
# Entrypoint script for backend container
# Runs as root to fix volume permissions, then drops to appuser

# Ensure data directory exists and set proper ownership
mkdir -p /app/data
chown -R appuser:appgroup /app/data

# Fix Docker socket permissions for docker-in-docker access
DOCKER_SOCK="${DOCKER_SOCKET:-/var/run/docker.sock}"

echo "[entrypoint] Checking Docker socket at: $DOCKER_SOCK"
ls -la "$DOCKER_SOCK" 2>/dev/null || echo "[entrypoint] Socket not found at $DOCKER_SOCK"

if [ -S "$DOCKER_SOCK" ]; then
  # Get the group ID of the socket
  DOCKER_GID=$(stat -c '%g' "$DOCKER_SOCK" 2>/dev/null || echo "0")
  echo "[entrypoint] Docker socket GID: $DOCKER_GID"
  
  if [ "$DOCKER_GID" != "0" ]; then
    # Create group with matching GID and add appuser
    # Use 'addgroup' for Alpine compatibility
    addgroup -g "$DOCKER_GID" docker_host 2>/dev/null || true
    # adduser to group
    adduser appuser docker_host 2>/dev/null || true
    # Also try usermod for non-Alpine
    usermod -a -G "$DOCKER_GID" appuser 2>/dev/null || true
    echo "[entrypoint] Added appuser to group docker_host (GID: $DOCKER_GID)"
  else
    # Socket owned by root:root (Docker Desktop), allow all users
    chmod 666 "$DOCKER_SOCK" 2>/dev/null || true
    echo "[entrypoint] Set socket permissions to 666 (root:root)"
  fi
  
  # Verify appuser can access socket
  if gosu appuser test -S "$DOCKER_SOCK" 2>/dev/null; then
    echo "[entrypoint] appuser CAN access Docker socket"
  else
    echo "[entrypoint] WARNING: appuser CANNOT access Docker socket"
  fi
else
  echo "[entrypoint] WARNING: Docker socket not found at $DOCKER_SOCK"
fi

# Drop privileges and run the application
exec gosu appuser "$@"