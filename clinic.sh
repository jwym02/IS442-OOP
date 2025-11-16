#!/bin/bash
set -e   # Exit immediately if any command fails

# Trap the EXIT signal to kill all background jobs when the script exits
trap 'kill $(jobs -p)' EXIT

# Start the backend server in the background
java -jar backend/target/clinic-system-1.0.0.jar &

# Start the queue display in the background
(cd queue_display && npm run preview) &

# Wait for all background processes to finish
wait