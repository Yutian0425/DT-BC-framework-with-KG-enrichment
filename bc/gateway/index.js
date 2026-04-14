const express = require("express");
const { ethers } = require("ethers");

// ---- env ----
const RPC_URL = process.env.RPC_URL || "http://hardhat:8545";
const PRIVATE_KEY = process.env.PRIVATE_KEY;

const MAINTENANCE_ADDR = process.env.MAINTENANCE_ADDR;
const DEVICE_REGISTRY_ADDR = process.env.DEVICE_REGISTRY_ADDR;
const ACCESS_CONTROL_ADDR = process.env.ACCESS_CONTROL_ADDR;

if (!PRIVATE_KEY) {
  console.error("Missing PRIVATE_KEY env");
  process.exit(1);
}

// ---- helpers ----
const k = (s) => ethers.keccak256(ethers.toUtf8Bytes(String(s)));

// ---- ABIs ----
const abiLedger = [
  "function createWorkOrder(bytes32,bytes32,bytes32,bytes32) returns (uint256)",
  "event WorkOrderCreated(uint256 indexed id, bytes32 indexed roomIdHash, bytes32 indexed deviceIdHash, bytes32 eventTypeHash, bytes32 evidenceHash, uint256 timestamp)"
];

const abiRegistry = [
  "function registerDevice(bytes32) external",
  "function revokeDevice(bytes32) external",
  "function isAuthorized(bytes32) view returns (bool)"
];

const abiAccess = [
  "function grantRead(address,bytes32,bytes32) external",
  "function revokeRead(address,bytes32,bytes32) external",
  "function checkRead(address,bytes32,bytes32) view returns (bool)"
];

// ---- provider + signer ----
const provider = new ethers.JsonRpcProvider(RPC_URL);
const baseWallet = new ethers.Wallet(PRIVATE_KEY, provider);
const signerAddressPromise = baseWallet.getAddress();

// ---- nonce state (auto-reset on chain restart) ----
let nextNonce = null;

// ---- serialize tx submissions ----
let txLock = Promise.resolve();
function withLock(fn) {
  const next = txLock.then(fn, fn);
  txLock = next.catch(() => {});
  return next;
}

async function sendTx(fn) {
  return withLock(async () => {
    const addr = await signerAddressPromise;
    const chainNonce = await provider.getTransactionCount(addr, "pending");
    if (nextNonce === null || chainNonce !== nextNonce) {
      nextNonce = chainNonce;
    }
    const result = await fn(nextNonce);
    nextNonce += 1;
    return result;
  });
}

// ---- express app ----
const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", async (_req, res) => {
  res.json({
    ok: true,
    rpc: RPC_URL,
    contracts: {
      MaintenanceLedger: MAINTENANCE_ADDR || null,
      DeviceRegistry: DEVICE_REGISTRY_ADDR || null,
      AccessControlDT: ACCESS_CONTROL_ADDR || null
    }
  });
});

// ---- Maintenance: create work order ----
app.post("/workorder/create", async (req, res) => {
  try {
    const { roomId, deviceId, eventType, evidence } = req.body;
    if (!roomId || !deviceId || !eventType) {
      return res.status(400).json({ error: "roomId/deviceId/eventType required" });
    }
    if (!MAINTENANCE_ADDR) throw new Error("Missing MAINTENANCE_ADDR");

    const contract = new ethers.Contract(MAINTENANCE_ADDR, abiLedger, baseWallet);
    const evidenceStr = evidence ? JSON.stringify(evidence) : "";
    const evidenceHash = k(evidenceStr);

    const receipt = await sendTx(async (nonce) => {
      const tx = await contract.createWorkOrder(
        k(roomId),
        k(deviceId),
        k(eventType),
        evidenceHash,
        { nonce }
      );
      return await tx.wait();
    });

    // decode event
    const iface = new ethers.Interface(abiLedger);
    let decoded = null;
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "WorkOrderCreated") {
          decoded = {
            id: parsed.args.id.toString(),
            roomIdHash: parsed.args.roomIdHash,
            deviceIdHash: parsed.args.deviceIdHash,
            eventTypeHash: parsed.args.eventTypeHash,
            evidenceHash: parsed.args.evidenceHash,
            timestamp: parsed.args.timestamp.toString()
          };
          break;
        }
      } catch (_) {}
    }

    res.json({ txHash: receipt.hash, event: decoded });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Device Registry ----
app.post("/device/register", async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: "deviceId required" });
    if (!DEVICE_REGISTRY_ADDR) throw new Error("Missing DEVICE_REGISTRY_ADDR");

    const contract = new ethers.Contract(DEVICE_REGISTRY_ADDR, abiRegistry, baseWallet);

    const receipt = await sendTx(async (nonce) => {
      const tx = await contract.registerDevice(k(deviceId), { nonce });
      return await tx.wait();
    });

    res.json({ txHash: receipt.hash, deviceId, deviceIdHash: k(deviceId) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/device/verify", async (req, res) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: "deviceId required" });
    if (!DEVICE_REGISTRY_ADDR) throw new Error("Missing DEVICE_REGISTRY_ADDR");

    const contract = new ethers.Contract(DEVICE_REGISTRY_ADDR, abiRegistry, provider);
    const ok = await contract.isAuthorized(k(deviceId));
    res.json({ deviceId, deviceIdHash: k(deviceId), authorized: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---- Access Control ----
app.post("/access/grant", async (req, res) => {
  try {
    const { user, roomId, dataType } = req.body;
    if (!user || !roomId || !dataType) {
      return res.status(400).json({ error: "user/roomId/dataType required" });
    }
    if (!ACCESS_CONTROL_ADDR) throw new Error("Missing ACCESS_CONTROL_ADDR");

    const contract = new ethers.Contract(ACCESS_CONTROL_ADDR, abiAccess, baseWallet);

    const receipt = await sendTx(async (nonce) => {
      const tx = await contract.grantRead(user, k(roomId), k(dataType), { nonce });
      return await tx.wait();
    });

    res.json({ txHash: receipt.hash, user, roomId, dataType });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/access/check", async (req, res) => {
  try {
    const { user, roomId, dataType } = req.body;
    if (!user || !roomId || !dataType) {
      return res.status(400).json({ error: "user/roomId/dataType required" });
    }
    if (!ACCESS_CONTROL_ADDR) throw new Error("Missing ACCESS_CONTROL_ADDR");

    const contract = new ethers.Contract(ACCESS_CONTROL_ADDR, abiAccess, provider);
    const ok = await contract.checkRead(user, k(roomId), k(dataType));
    res.json({ user, roomId, dataType, allowed: ok });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, () => console.log("BC Gateway on :3000"));