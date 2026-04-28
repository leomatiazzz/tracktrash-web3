import { BrowserProvider, Contract, parseEther } from "ethers";
import contractsData from "../src/services/contracts.json";

function getContractConfig(contractName) {
  const contract = contractsData?.contracts?.[contractName];
  if (!contract) {
    throw new Error(`Contrato ${contractName} nao encontrado em contracts.json`);
  }
  if (!contract.address || contract.address === "0x0000000000000000000000000000000000000000") {
    throw new Error(
      `Endereco de ${contractName} invalido em contracts.json. Execute o deploy para gerar os dados reais.`
    );
  }
  if (!Array.isArray(contract.abi) || contract.abi.length === 0) {
    throw new Error(
      `ABI de ${contractName} ausente em contracts.json. Execute o deploy para gerar os dados reais.`
    );
  }
  return contract;
}

export class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
  }

  async connectWallet() {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask nao encontrado no navegador.");
    }

    this.provider = new BrowserProvider(window.ethereum);
    await this.provider.send("eth_requestAccounts", []);
    this.signer = await this.provider.getSigner();

    return this.signer.address;
  }

  ensureSigner() {
    if (!this.signer) {
      throw new Error("Carteira nao conectada. Clique em 'Conectar MetaMask'.");
    }
  }

  async registerReturnAndMintBadge({
    itemId,
    quantity,
    metadataURI,
    feeInEth,
    achievementType,
    impactScore
  }) {
    this.ensureSigner();
    const reverseLogisticsConfig = getContractConfig("ReverseLogistics");
    const ecoBadgeConfig = getContractConfig("EcoBadge");

    const reverseLogistics = new Contract(
      reverseLogisticsConfig.address,
      reverseLogisticsConfig.abi,
      this.signer
    );
    const ecoBadge = new Contract(ecoBadgeConfig.address, ecoBadgeConfig.abi, this.signer);

    const returnTx = await reverseLogistics.registerReturn(itemId, quantity, metadataURI, {
      value: parseEther(feeInEth)
    });
    const returnReceipt = await returnTx.wait();

    const userAddress = await this.signer.getAddress();
    const mintTx = await ecoBadge.mintBadge(
      userAddress,
      achievementType,
      BigInt(impactScore),
      metadataURI
    );
    const mintReceipt = await mintTx.wait();

    return {
      returnTxHash: returnReceipt.hash,
      mintTxHash: mintReceipt.hash
    };
  }

  async stakeEcoTokens(amountWei) {
    this.ensureSigner();
    const stakingConfig = getContractConfig("EcoStaking");
    const staking = new Contract(stakingConfig.address, stakingConfig.abi, this.signer);

    const tx = await staking.stake(BigInt(amountWei));
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async voteInDao(proposalId, support) {
    this.ensureSigner();
    const daoConfig = getContractConfig("EcoDAO");
    const dao = new Contract(daoConfig.address, daoConfig.abi, this.signer);

    const tx = await dao.vote(BigInt(proposalId), support);
    const receipt = await tx.wait();
    return receipt.hash;
  }
}
