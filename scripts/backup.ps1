# ==============================================================================
# RECRUITMENT SYSTEM - AUTOMATED DOCKER BACKUP SCRIPT FOR WINDOWS (POWERSHELL)
# ==============================================================================
# This script backs up:
# 1. The PostgreSQL database inside the Docker container using pg_dump.
# 2. The user-uploaded files located in the backend/uploads directory.
#
# Usage: .\scripts\backup.ps1
# ==============================================================================

# Stop script execution on error
$ErrorActionPreference = "Stop"

# Get project root directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Item $ScriptDir).Parent.FullName
Set-Location $ProjectRoot

# Load environment variables from .env if it exists
$EnvFile = Join-Path $ProjectRoot ".env"
$EnvVars = @{}

if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $parts = $line.Split("=", 2)
            $key = $parts[0].Trim()
            $value = $parts[1].Trim().Trim('"').Trim("'")
            $EnvVars[$key] = $value
        }
    }
} else {
    Write-Warning ".env file not found in project root. Using default configurations."
}

# Configuration settings (fallback to default values if not defined in .env)
$DbContainerName = if ($EnvVars.ContainsKey("DB_CONTAINER_NAME")) { $EnvVars["DB_CONTAINER_NAME"] } else { "recruitment_db" }
$PostgresUser = if ($EnvVars.ContainsKey("POSTGRES_USER")) { $EnvVars["POSTGRES_USER"] } else { "postgres" }
$PostgresDb = if ($EnvVars.ContainsKey("POSTGRES_DB")) { $EnvVars["POSTGRES_DB"] } else { "recruitment_db" }
$BackupDir = if ($EnvVars.ContainsKey("BACKUP_DIR")) { $EnvVars["BACKUP_DIR"] } else { ".\backups" }
$RetentionDays = 7
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

# Resolve absolute backup path
$AbsoluteBackupDir = [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $BackupDir))

# Create backups directory if it doesn't exist
if (-not (Test-Path $AbsoluteBackupDir)) {
    New-Item -ItemType Directory -Force -Path $AbsoluteBackupDir | Out-Null
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Automated Backup at $(Get-Date)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# 1. Database Backup (pg_dump)
# ------------------------------------------------------------------------------
$DbBackupSql = Join-Path $AbsoluteBackupDir "db_backup_${Timestamp}.sql"
$DbBackupZip = Join-Path $AbsoluteBackupDir "db_backup_${Timestamp}.zip"

Write-Host "💾 Backing up database '$PostgresDb' from container '$DbContainerName'..." -ForegroundColor Yellow

# Verify if the container is running
$ContainerRunning = docker ps -q -f "name=$DbContainerName"
if ($ContainerRunning) {
    # Run pg_dump via docker exec
    docker exec -t $DbContainerName pg_dump -U $PostgresUser $PostgresDb > $DbBackupSql

    if (Test-Path $DbBackupSql) {
        # Compress the SQL dump into a ZIP file
        Compress-Archive -Path $DbBackupSql -DestinationPath $DbBackupZip -Force
        Remove-Item $DbBackupSql -Force
        Write-Host "✅ Database backup complete: $DbBackupZip" -ForegroundColor Green
    } else {
        Write-Error "Database backup failed: SQL file was not generated."
    }
} else {
    Write-Warning "Docker container '$DbContainerName' is not running. Skipping database backup."
}

# ------------------------------------------------------------------------------
# 2. Uploads Directory Backup
# ------------------------------------------------------------------------------
$UploadsDir = Join-Path $ProjectRoot "backend\uploads"
$UploadsBackupZip = Join-Path $AbsoluteBackupDir "uploads_backup_${Timestamp}.zip"

Write-Host "📂 Backing up user uploaded files from '$UploadsDir'..." -ForegroundColor Yellow

if (Test-Path $UploadsDir) {
    # Verify if directory is not empty
    $Files = Get-ChildItem -Path $UploadsDir -Recurse -File
    if ($Files.Count -gt 0) {
        Compress-Archive -Path $UploadsDir -DestinationPath $UploadsBackupZip -Force
        Write-Host "✅ Uploads backup complete: $UploadsBackupZip" -ForegroundColor Green
    } else {
        Write-Warning "Uploads directory is empty. Skipping uploads archive compression."
    }
} else {
    Write-Warning "Uploads directory '$UploadsDir' not found. Skipping uploads backup."
}

# ------------------------------------------------------------------------------
# 3. Clean up (Rotation)
# ------------------------------------------------------------------------------
Write-Host "🧹 Cleaning up backups older than $RetentionDays days..." -ForegroundColor Yellow

$LimitDate = (Get-Date).AddDays(-$RetentionDays)

# Clean up old database zip backups
Get-ChildItem -Path $AbsoluteBackupDir -Filter "db_backup_*.zip" | Where-Object {
    $_.LastWriteTime -lt $LimitDate
} | ForEach-Object {
    Write-Host "Removing old backup: $($_.Name)" -ForegroundColor Gray
    Remove-Item $_.FullName -Force
}

# Clean up old uploads zip backups
Get-ChildItem -Path $AbsoluteBackupDir -Filter "uploads_backup_*.zip" | Where-Object {
    $_.LastWriteTime -lt $LimitDate
} | ForEach-Object {
    Write-Host "Removing old backup: $($_.Name)" -ForegroundColor Gray
    Remove-Item $_.FullName -Force
}

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "🎉 Backup Process Finished Successfully!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
