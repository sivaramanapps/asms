#!/bin/bash
containerName="asms-db-1"
dbUser="admin"
dbName="asms_db"
dumpDir="data"
dumpFile="asms_db.dump"

if [ ! -f "$dumpDir/$dumpFile" ]; then
  echo "Dump file $dumpDir/$dumpFile not found!"
  exit 1
fi

echo "Copying dump file into container $containerName..."
docker cp $dumpDir/$dumpFile $containerName:/tmp/$dumpFile

echo "Restoring database $dbName..."
docker exec -it $containerName pg_restore -U $dbUser -d $dbName /tmp/$dumpFile

echo "Restore complete."

# before running this script Make this restore_db.sh file executable and run with following commands
# chmod +x restore_db.sh
# ./restore_db.sh