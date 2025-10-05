#!/bin/bash
containerName="asms-db-1"
dbUser="admin"
dbName="asms_db"
dumpDir="data"
dumpFile="asms_db.dump"

# Ensure data folder exists
mkdir -p $dumpDir

echo "Creating database dump from container $containerName..."
docker exec -t $containerName pg_dump -U $dbUser -F c -d $dbName -f /tmp/$dumpFile
docker cp $containerName:/tmp/$dumpFile $dumpDir/$dumpFile
echo "Backup complete: $dumpDir/$dumpFile created."

# before running this script Make this backup_db.sh file executable and run with following commands
# chmod +x backup_db.sh
# ./backup_db.sh
