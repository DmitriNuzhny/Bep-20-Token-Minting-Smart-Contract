import { ethers, network } from "hardhat";

// Demo on a locally forked BSC: impersonates a USDT-rich account to fund deposits
async function main() {
  const underlying = "0x55d398326f99059fF775485246999027B3197955";

  // 1) Deploy wrapper
  const Wrapper = await ethers.getContractFactory("WrappedUSDTBSC");
  const wrapper = await Wrapper.deploy(underlying);
  await wrapper.waitForDeployment();
  const wrapperAddr = await wrapper.getAddress();
  console.log("Wrapper:", wrapperAddr);

  // 2) Impersonate a whale
  const whale = "0x28C6c06298d514Db089934071355E5743bf21d60"; // example CEX hot wallet
  await network.provider.request({ method: "hardhat_impersonateAccount", params: [whale] });
  await network.provider.send("hardhat_setBalance", [whale, "0x1000000000000000000"]);

  const whaleSigner = await ethers.getSigner(whale);
  const usdt = await ethers.getContractAt("IBEP20", underlying, whaleSigner);

  // 3) Approve and deposit
  const amount = ethers.parseUnits("10", await usdt.decimals());
  await (await usdt.approve(wrapperAddr, amount)).wait();
  await (await (await ethers.getContractAt("WrappedUSDTBSC", wrapperAddr, whaleSigner)).deposit(amount)).wait();

  // 4) Transfer wrapped token to a random account
  const [acc0] = await ethers.getSigners();
  const wrapped = await ethers.getContractAt("WrappedUSDTBSC", wrapperAddr, whaleSigner);
  await (await wrapped.transfer(acc0.address, amount / 2n)).wait();

  console.log("Demo complete");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


