import { expect } from "chai";
import { network } from "hardhat";
import {
  EcoToken__factory,
  MockV3Aggregator__factory,
  ReverseLogistics__factory,
} from "../types/index.js";
import type { EcoToken, MockV3Aggregator, ReverseLogistics } from "../types/index.js";

describe("ReverseLogistics", function () {
  it("registra devolucao e distribui recompensa", async function () {
    const { ethers } = await network.create();
    const [admin, user] = await ethers.getSigners();

    const ecoTokenFactory = new EcoToken__factory(admin);
    const ecoToken: EcoToken = await ecoTokenFactory.deploy(admin.address);
    await ecoToken.waitForDeployment();

    const feedFactory = new MockV3Aggregator__factory(admin);
    const feed: MockV3Aggregator = await feedFactory.deploy(
      8,
      3000n * 10n ** 8n,
    );
    await feed.waitForDeployment();

    const flatFeeUsd18 = 5n * 10n ** 18n;
    const rewardUsd18 = 3n * 10n ** 18n;
    const ecoTokenUsdPrice18 = 1n * 10n ** 18n;

    const reverseLogisticsFactory = new ReverseLogistics__factory(admin);
    const reverseLogistics: ReverseLogistics = await reverseLogisticsFactory.deploy(
      admin.address,
      await ecoToken.getAddress(),
      await feed.getAddress(),
      flatFeeUsd18,
      rewardUsd18,
      ecoTokenUsdPrice18,
    );
    await reverseLogistics.waitForDeployment();

    // abastece o pool de recompensas
    await ecoToken.mint(await reverseLogistics.getAddress(), 1_000n * 10n ** 18n);

    // fee de 5 USD com ETH a 3000 USD => 0.001666... ETH
    const requiredFeeWei = await reverseLogistics.usd18ToWei(flatFeeUsd18, 3000n * 10n ** 8n);

    const registerTx = await reverseLogistics
      .connect(user)
      .registerReturn("ITEM-001", 1n, "ipfs://record/1", {
        value: requiredFeeWei,
      });
    await registerTx.wait();

    const userBalance = await ecoToken.balanceOf(user.address);
    expect(userBalance).to.equal(3n * 10n ** 18n);

    const userReturns = await reverseLogistics.getReturnsByUser(user.address);
    expect(userReturns.length).to.equal(1);
  });
});
