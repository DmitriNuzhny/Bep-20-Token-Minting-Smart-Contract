import { ethers } from "hardhat";

function getArg(flag: string, fallback?: string) {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

async function main() {
  const underlying = "0x55d398326f99059fF775485246999027B3197955"; // USDT on BSC mainnet
  const recipient = getArg("--recipient", process.env.RECIPIENT_ADDRESS);
  const amountStr = getArg("--amount", process.env.MINT_AMOUNT || "0");

  if (!recipient) throw new Error("Missing recipient. Pass --recipient 0x... or set RECIPIENT_ADDRESS.");
  if (!amountStr || amountStr === "0") throw new Error("Missing amount. Pass --amount 1000000 (units) or set MINT_AMOUNT.");

  const [signer] = await ethers.getSigners();
  console.log("Deployer:", signer.address);
  console.log("Recipient:", recipient);
  console.log("Requested mint amount (units):", amountStr);

  const usdt = await ethers.getContractAt("IBEP20", underlying, signer);
  const decimals = await usdt.decimals();
  const amount = ethers.parseUnits(amountStr, decimals);

  // Check deployer's USDT balance
  const deployerBal = await usdt.balanceOf(signer.address);
  console.log("Deployer USDT balance:", deployerBal.toString());
  if (deployerBal < amount) {
    throw new Error(
      `Insufficient USDT. Needed ${amountStr} (in units), have ${ethers.formatUnits(
        deployerBal,
        decimals
      )}. Top up USDT or reduce --amount`
    );
  }

  // 1) Deploy wrapper
  const Wrapper = await ethers.getContractFactory("WrappedUSDTBSC");
  const wrapper = await Wrapper.deploy(underlying);
  await wrapper.waitForDeployment();
  const wrapperAddr = await wrapper.getAddress();
  console.log("Wrapper deployed:", wrapperAddr);

  // 2) Approve and depositFor recipient
  console.log("Approving USDT...");
  await (await usdt.approve(wrapperAddr, amount)).wait();

  console.log("Depositing to mint wrapped tokens for recipient...");
  const wrapperWithSigner = await ethers.getContractAt("WrappedUSDTBSC", wrapperAddr, signer);
  await (await wrapperWithSigner.depositFor(recipient, amount)).wait();

  console.log("Done. Addresses:\nUnderlying (USDT):", underlying, "\nWrapper:", wrapperAddr);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


