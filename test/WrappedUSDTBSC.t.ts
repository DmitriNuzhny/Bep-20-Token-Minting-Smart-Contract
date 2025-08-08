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

  it("blocks deposits/transfers after expiry but allows withdraws", async function () {
    const [deployer, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("ERC20Mock");
    const underlying = await Token.deploy("Tether USD", "USDT", deployer.address, ethers.parseUnits("1000000", 18));
    await underlying.waitForDeployment();

    const Wrapper = await ethers.getContractFactory("WrappedUSDTBSC");
    const wrapper = await Wrapper.deploy(await underlying.getAddress());
    await wrapper.waitForDeployment();

    // fund user and deposit before expiry
    await (await underlying.transfer(user.address, ethers.parseUnits("100", 18))).wait();
    await (await underlying.connect(user).approve(await wrapper.getAddress(), ethers.parseUnits("100", 18))).wait();
    await (await wrapper.connect(user).deposit(ethers.parseUnits("100", 18))).wait();

    // fast-forward > 180 days
    await ethers.provider.send("evm_increaseTime", [181 * 24 * 60 * 60]);
    await ethers.provider.send("evm_mine", []);

    // deposits blocked
    await (await underlying.connect(user).approve(await wrapper.getAddress(), ethers.parseUnits("1", 18))).wait();
    await expect(wrapper.connect(user).deposit(ethers.parseUnits("1", 18))).to.be.revertedWith("expired: deposit disabled");

    // transfers blocked
    await expect(wrapper.connect(user).transfer(deployer.address, 1n)).to.be.revertedWith("expired: transfers/mints disabled");

    // withdraw allowed
    await expect(wrapper.connect(user).withdraw(ethers.parseUnits("100", 18))).to.not.be.reverted;
  });
});


