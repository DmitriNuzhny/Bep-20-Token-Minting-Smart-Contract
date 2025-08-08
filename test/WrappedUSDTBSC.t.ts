import { expect } from "chai";
import { ethers } from "hardhat";

describe("WrappedUSDTBSC", function () {
  it("deposit and withdraw mirrors supply", async function () {
    const [deployer, user] = await ethers.getSigners();

    // deploy mock underlying (OpenZeppelin ERC20)
    const Token = await ethers.getContractFactory("ERC20Mock");
    const underlying = await Token.deploy("Tether USD", "USDT", deployer.address, ethers.parseUnits("1000000", 18));
    await underlying.waitForDeployment();

    const Wrapper = await ethers.getContractFactory("WrappedUSDTBSC");
    const wrapper = await Wrapper.deploy(await underlying.getAddress());
    await wrapper.waitForDeployment();

    // fund user
    await (await underlying.transfer(user.address, ethers.parseUnits("1000", 18))).wait();

    // approve and deposit
    await (await underlying.connect(user).approve(await wrapper.getAddress(), ethers.parseUnits("100", 18))).wait();
    await (await wrapper.connect(user).deposit(ethers.parseUnits("100", 18))).wait();

    expect(await wrapper.balanceOf(user.address)).to.equal(ethers.parseUnits("100", 18));
    expect(await underlying.balanceOf(await wrapper.getAddress())).to.equal(ethers.parseUnits("100", 18));

    // transfer wrapped
    await (await wrapper.connect(user).transfer(deployer.address, ethers.parseUnits("10", 18))).wait();
    expect(await wrapper.balanceOf(deployer.address)).to.equal(ethers.parseUnits("10", 18));

    // withdraw
    await (await wrapper.connect(user).withdraw(ethers.parseUnits("90", 18))).wait();
    expect(await underlying.balanceOf(user.address)).to.equal(ethers.parseUnits("990", 18));
    expect(await wrapper.balanceOf(user.address)).to.equal(0n);
  });
});


