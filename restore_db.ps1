# restore_db.ps1
$containerName = "asms-db-1"
$dbUser = "admin"
$dbName = "asms_db"
$dumpDir = "data"
$dumpFile = "asms_db.dump"
$fullPath = ".\$dumpDir\$dumpFile"

if (-Not (Test-Path $fullPath)) {
    Write-Error "Dump file $fullPath not found!"
    exit 1
}

Write-Output "Copying dump file into container $containerName..."
docker cp $fullPath "${containerName}:/tmp/$dumpFile"

Write-Output "Restoring database $dbName..."
docker exec -it $containerName pg_restore -U $dbUser -d $dbName /tmp/$dumpFile

Write-Output "Restore complete."


# run this restore_db.ps1 using following command in powershell
# .\restore_db.ps1
