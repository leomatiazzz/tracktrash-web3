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

  /**
   * Troca a rede para Sepolia (chainId 11155111) se necessário.
   * Dispara o popup de troca de rede no MetaMask.
   */
  async ensureCorrectNetwork() {
    const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 em hex

    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

    if (currentChainId !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
      } catch (switchError) {
        // Código 4902: rede não adicionada na carteira — adiciona automaticamente
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId:         SEPOLIA_CHAIN_ID,
              chainName:       "Sepolia Testnet",
              nativeCurrency:  { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
              rpcUrls:         ["https://rpc.sepolia.org"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            }],
          });
        } else {
          throw new Error("Por favor, troque para a rede Sepolia no MetaMask.");
        }
      }
      // Recria o provider após a troca de rede
      this.provider = new BrowserProvider(window.ethereum);
      this.signer   = await this.provider.getSigner();
    }
  }

  /**
   * Dispara o popup de conexão da carteira (MetaMask, Rabby, Coinbase Wallet, etc.)
   * usando a API EIP-1193 nativa — compatível com qualquer extensão de carteira.
   * Retorna o endereço da conta selecionada.
   */
  async connectWallet() {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error(
        "Nenhuma carteira Web3 encontrada. Instale MetaMask ou outra extensão compatível."
      );
    }

    // eth_requestAccounts dispara o popup de login/seleção de conta
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });

    if (!accounts || accounts.length === 0) {
      throw new Error("Nenhuma conta autorizada pelo usuário.");
    }

    this.provider = new BrowserProvider(window.ethereum);
    this.signer   = await this.provider.getSigner();

    // Garante que está na Sepolia logo após conectar
    await this.ensureCorrectNetwork();

    return accounts[0];
  }

  ensureSigner() {
    if (!this.signer) {
      throw new Error("Carteira nao conectada. Clique em 'Conectar MetaMask'.");
    }
  }

  /**
   * Consulta o gas atual da rede e aplica uma margem de +30% no priority fee
   * para evitar rejeições por "gas tip cap below minimum" em redes como Sepolia.
   */
  async _gasFees() {
    const feeData = await this.provider.getFeeData();
    const MARGIN = 130n; // +30%

    const maxPriorityFeePerGas =
      (feeData.maxPriorityFeePerGas ?? 1_500_000_000n) * MARGIN / 100n;
    const maxFeePerGas =
      (feeData.maxFeePerGas ?? 30_000_000_000n) * MARGIN / 100n;

    return { maxPriorityFeePerGas, maxFeePerGas };
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
    await this.ensureCorrectNetwork();
    const reverseLogisticsConfig = getContractConfig("ReverseLogistics");
    const reverseLogistics = new Contract(
      reverseLogisticsConfig.address,
      reverseLogisticsConfig.abi,
      this.signer
    );

    const fees = await this._gasFees();

    // Uma única transação: registerReturn minta ECO + EcoBadge internamente.
    // gasLimit explícito: contorna eth_estimateGas instável em nós públicos da Sepolia.
    const tx = await reverseLogistics.registerReturn(
      itemId,
      quantity,
      metadataURI,
      achievementType,
      BigInt(impactScore),
      { value: parseEther(feeInEth), ...fees, gasLimit: 500_000n }
    );
    const receipt = await tx.wait();

    return { returnTxHash: receipt.hash };
  }

  async stakeEcoTokens(amountWei) {
    this.ensureSigner();
    await this.ensureCorrectNetwork();
    const stakingConfig = getContractConfig("EcoStaking");
    const staking = new Contract(stakingConfig.address, stakingConfig.abi, this.signer);

    const fees = await this._gasFees();
    const tx = await staking.stake(BigInt(amountWei), fees);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async voteInDao(proposalId, support) {
    this.ensureSigner();
    await this.ensureCorrectNetwork();
    const daoConfig = getContractConfig("EcoDAO");
    const dao = new Contract(daoConfig.address, daoConfig.abi, this.signer);

    const fees = await this._gasFees();
    const tx = await dao.vote(BigInt(proposalId), support, fees);
    const receipt = await tx.wait();
    return receipt.hash;
  }
}
