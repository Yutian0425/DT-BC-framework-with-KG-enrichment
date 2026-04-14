#!/bin/sh
set -e

# Start local chain in background
npx hardhat node --hostname 0.0.0.0 --port 8545 &
sleep 2

# Deploy contract to localhost network
npx hardhat run --network localhost scripts/deploy.js

# Keep container alive
wait