import { ethers } from "hardhat";

async function main() {
  const underlying = process.env.UNDERLYING_ADDRESS || "0x55d398326f99059fF775485246999027B3197955"; // USDT on BSC
  console.log("Deploying WrappedUSDTBSC with underlying:", underlying);

  const Factory = await ethers.getContractFactory("WrappedUSDTBSC");
  const contract = await Factory.deploy(underlying);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("WrappedUSDTBSC deployed at:", addr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


