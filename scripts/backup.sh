#!/bin/bash

# ==============================================================================
# RECRUITMENT SYSTEM - AUTOMATED DOCKER BACKUP SCRIPT
# ==============================================================================
# This script backs up:
# 1. The PostgreSQL database inside the Docker container using pg_dump.
# 2. The user-uploaded files located in the backend/uploads directory.
#
# Usage: ./scripts/backup.sh
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# Get the directory of this script and move to project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

# Load environment variables from root .env file if it exists
if [ -f .env ]; then
  # Load env variables ignoring comments
  export $(grep -v '^#' .env | xargs)
else
  echo "⚠️ Warning: .env file not found in project root. Using default values."
fi

# Configuration details
DB_CONTAINER_NAME=${DB_CONTAINER_NAME:-"recruitment_db"}
POSTGRES_USER=${POSTGRES_USER:-"postgres"}
POSTGRES_DB=${POSTGRES_DB:-"recruitment_db"}
# Read backup directory from environment, fallback to ./backups
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create backups directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "========================================="
echo "🚀 Starting Automated Backup at $(date)"
echo "========================================="

# ------------------------------------------------------------------------------
# 1. Database Backup (pg_dump)
# ------------------------------------------------------------------------------
DB_BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql"
echo "💾 Backing up database '${POSTGRES_DB}' from container '${DB_CONTAINER_NAME}'..."

# Verify if the container is running
if [ "$(docker ps -q -f name=${DB_CONTAINER_NAME})" ]; then
  # Run pg_dump without interactive terminal (-t instead of -it)
  docker exec -t "$DB_CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$DB_BACKUP_FILE"
  
  # Compress database backup to save space
  gzip "$DB_BACKUP_FILE"
  echo "✅ Database backup complete: ${DB_BACKUP_FILE}.gz"
else
  echo "❌ Error: Docker container '${DB_CONTAINER_NAME}' is not running."
  echo "Skipping database backup."
fi

# ------------------------------------------------------------------------------
# 2. Uploads Directory Backup
# ------------------------------------------------------------------------------
UPLOADS_BACKUP_FILE="${BACKUP_DIR}/uploads_backup_${TIMESTAMP}.tar.gz"
UPLOADS_DIR="./backend/uploads"

echo "📂 Backing up user uploaded files from '${UPLOADS_DIR}'..."
if [ -d "$UPLOADS_DIR" ]; then
  # Archive uploads folder
  tar -czf "$UPLOADS_BACKUP_FILE" "$UPLOADS_DIR"
  echo "✅ Uploads backup complete: ${UPLOADS_BACKUP_FILE}"
else
  echo "⚠️ Warning: Uploads directory '${UPLOADS_DIR}' not found. Skipping uploads backup."
fi

# ------------------------------------------------------------------------------
# 3. Clean up (Rotation)
# ------------------------------------------------------------------------------
echo "🧹 Cleaning up backups older than ${RETENTION_DAYS} days..."
# Find and delete compressed db backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -exec rm {} \; -verbose || true
# Find and delete compressed uploads backups older than RETENTION_DAYS
find "$BACKUP_DIR" -name "uploads_backup_*.tar.gz" -mtime +"$RETENTION_DAYS" -exec rm {} \; -verbose || true

echo "========================================="
echo "🎉 Backup Process Finished Successfully!"
echo "========================================="
