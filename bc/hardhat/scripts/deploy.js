const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();

  const MaintenanceLedger = await ethers.getContractFactory("MaintenanceLedger");
  const ledger = await MaintenanceLedger.deploy();
  await ledger.waitForDeployment();

  const DeviceRegistry = await ethers.getContractFactory("DeviceRegistry");
  const registry = await DeviceRegistry.deploy();
  await registry.waitForDeployment();

  const AccessControlDT = await ethers.getContractFactory("AccessControlDT");
  const ac = await AccessControlDT.deploy();
  await ac.waitForDeployment();

  const out = {
    network: "hardhat-local",
    deployer: deployer.address,
    MaintenanceLedger: await ledger.getAddress(),
    DeviceRegistry: await registry.getAddress(),
    AccessControlDT: await ac.getAddress()
  };

  fs.writeFileSync("/app/contract-addresses.json", JSON.stringify(out, null, 2));

  console.log("Deployed MaintenanceLedger:", out.MaintenanceLedger);
  console.log("Deployed DeviceRegistry:", out.DeviceRegistry);
  console.log("Deployed AccessControlDT:", out.AccessControlDT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});