import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1) Deploy mock USDT on testnet
  const initialSupply = ethers.parseUnits("1000000", 18); // 1,000,000 mock USDT
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const mock = await ERC20Mock.deploy("Tether USD", "USDT", deployer.address, initialSupply);
  await mock.waitForDeployment();
  const mockAddr = await mock.getAddress();
  console.log("Mock USDT deployed:", mockAddr);

  // 2) Deploy wrapper pointing to mock
  const Wrapper = await ethers.getContractFactory("WrappedUSDTBSC");
  const wrapper = await Wrapper.deploy(mockAddr);
  await wrapper.waitForDeployment();
  const wrapperAddr = await wrapper.getAddress();
  console.log("Wrapper deployed:", wrapperAddr);

  // 3) Approve and deposit a small amount to validate
  const amount = ethers.parseUnits("1000", 18);
  await (await mock.approve(wrapperAddr, amount)).wait();
  await (await (await ethers.getContractAt("WrappedUSDTBSC", wrapperAddr, deployer)).deposit(amount)).wait();
  console.log("Deposited", amount.toString(), "to wrapper");

  console.log("Done. Addresses:\nUnderlying (mock):", mockAddr, "\nWrapper:", wrapperAddr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


