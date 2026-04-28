import { expect } from "chai";
import { network } from "hardhat";
import { EcoStaking__factory, EcoToken__factory } from "../types/index.js";
import type { EcoStaking, EcoToken } from "../types/index.js";

describe("EcoStaking", function () {
  it("permite stake e claim de recompensas", async function () {
    const { ethers } = await network.create();
    const [admin, staker] = await ethers.getSigners();

    const ecoTokenFactory = new EcoToken__factory(admin);
    const ecoToken: EcoToken = await ecoTokenFactory.deploy(admin.address);
    await ecoToken.waitForDeployment();

    const rewardRatePerSecond = 10n ** 18n; // 1 token por segundo

    const ecoStakingFactory = new EcoStaking__factory(admin);
    const ecoStaking: EcoStaking = await ecoStakingFactory.deploy(
      admin.address,
      await ecoToken.getAddress(),
      await ecoToken.getAddress(),
      rewardRatePerSecond,
    );
    await ecoStaking.waitForDeployment();

    await ecoToken.mint(staker.address, 1_000n * 10n ** 18n);
    await ecoToken.mint(await ecoStaking.getAddress(), 10_000n * 10n ** 18n);

    await ecoToken.connect(staker).approve(await ecoStaking.getAddress(), 100n * 10n ** 18n);
    await ecoStaking.connect(staker).stake(100n * 10n ** 18n);

    await ethers.provider.send("evm_increaseTime", [60]);
    await ethers.provider.send("evm_mine", []);

    const pending = await ecoStaking.pendingReward(staker.address);
    expect(pending).to.be.greaterThan(0n);

    const before = await ecoToken.balanceOf(staker.address);
    await ecoStaking.connect(staker).claimRewards();
    const after = await ecoToken.balanceOf(staker.address);

    expect(after).to.be.greaterThan(before);
  });
});
