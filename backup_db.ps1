# backup_db.ps1
$containerName = "asms-db-1"
$dbUser = "admin"
$dbName = "asms_db"
$dumpDir = "data"
$dumpFile = "asms_db.dump"

# Ensure data folder exists
if (-Not (Test-Path -Path $dumpDir)) {
    New-Item -ItemType Directory -Path $dumpDir | Out-Null
}

Write-Output "Creating database dump from container $containerName..."
docker exec -t $containerName pg_dump -U $dbUser -F c -d $dbName -f /tmp/$dumpFile

# ✅ Use ${} to avoid the ':' parsing issue
docker cp "${containerName}:/tmp/$dumpFile" ".\$dumpDir\$dumpFile"

Write-Output "Backup complete: $dumpDir\$dumpFile created."


# run this backup_db.ps1 using following command in powershell
# .\backup_db.ps1 or
# powershell -ExecutionPolicy Bypass -File .\backup_db.ps1

