# TrackTrash — Smart Reverse Logistics

> **Protocolo Web3 de Logística Reversa com incentivos financeiros on-chain, rastreabilidade em NFTs e governança descentralizada.**

---

## O problema que resolvemos

A cadeia de devolução de embalagens e produtos pós-consumo sofre de três falhas estruturais:

| Problema | Impacto |
|---|---|
| **Falta de incentivo financeiro** | Consumidores não têm motivo concreto para devolver embalagens ou itens recicláveis |
| **Opacidade logística** | Empresas e auditores não conseguem rastrear devoluções de forma imutável |
| **Ausência de governança** | Regras do programa de reciclagem são definidas de forma centralizada, sem participação dos stakeholders |

O **TrackTrash** resolve isso criando um loop econômico on-chain:

1. O consumidor registra a devolução → paga uma taxa em ETH → recebe **EcoTokens** como recompensa.
2. Cada devolução gera um **EcoBadge NFT** com metadados imutáveis (tipo de conquista, score de impacto, URI IPFS).
3. Detentores de EcoTokens participam da **EcoDAO** para votar em propostas de governança.
4. Tokens podem ser **stakados** para gerar recompensas passivas contínuas.

---

## Arquitetura técnica

```
┌─────────────────────────────────────────────────────────┐
│                      TrackTrash Protocol                │
│                                                         │
│  ┌────────────┐   mintBadge()   ┌────────────────────┐  │
│  │ EcoBadge   │◄────────────────│ ReverseLogistics   │  │
│  │ (ERC-721)  │                 │                    │  │
│  └────────────┘                 │  • registerReturn()│  │
│                                 │  • Chainlink feed  │  │
│  ┌────────────┐   mint()        │  • nonReentrant    │  │
│  │ EcoToken   │◄────────────────│  • taxa em ETH     │  │
│  │  (ERC-20)  │                 └────────────────────┘  │
│  └─────┬──────┘                                         │
│        │ stake/reward          ┌────────────────────┐   │
│        ├──────────────────────►│   EcoStaking       │   │
│        │                       │  • stake()         │   │
│        │ governança            │  • claimRewards()  │   │
│        └──────────────────────►│   EcoDAO           │   │
│                                │  • vote()          │   │
│                                │  • executeProposal │   │
│                                └────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Contratos

| Contrato | Padrão | Responsabilidade |
|---|---|---|
| `EcoToken.sol` | ERC-20 + AccessControl | Token de utilidade e governança do ecossistema |
| `EcoBadge.sol` | ERC-721 + AccessControl | NFT de comprovação de devolução com metadados on-chain |
| `ReverseLogistics.sol` | AccessControl + ReentrancyGuard | Registro de devoluções, cobrança de taxa em ETH, disparo de recompensas |
| `EcoStaking.sol` | AccessControl + ReentrancyGuard | Staking de EcoTokens com distribuição proporcional de recompensas |
| `EcoDAO.sol` | AccessControl + ReentrancyGuard | Governança on-chain com quorum, período de votação e execução de propostas |

### Stack técnica

- **Solidity** `^0.8.20` — contratos inteligentes
- **Hardhat 3** — ambiente de desenvolvimento, testes e deploy
- **TypeChain** — bindings TypeScript estritamente tipados para os contratos
- **OpenZeppelin Contracts v5** — ERC-20, ERC-721, AccessControl, ReentrancyGuard
- **Chainlink AggregatorV3Interface** — price feed ETH/USD on-chain para cálculo de taxa
- **Ethers.js v6** — interação com a blockchain no frontend e nos scripts
- **Next.js 14** — frontend React com sistema de abas (Logística / Staking / DAO)

---

## Pré-requisitos

- **Node.js** ≥ 20 LTS
- **npm** ≥ 10
- **MetaMask** instalado no navegador (para o frontend)
- Conta Alchemy ou Infura com endpoint Sepolia (para deploy em testnet)

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/leomatiazzz/tracktrash-web3.git
cd tracktrash-web3

# Instale as dependências do protocolo (raiz)
npm install

# Instale as dependências do frontend
cd frontend && npm install && cd ..
```

### Variáveis de ambiente

Copie o arquivo de exemplo e preencha suas chaves:

```bash
cp .env.example .env
```

Edite o `.env` com:

```dotenv
# Endpoint RPC da Sepolia (Alchemy, Infura ou similar)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/SUA_CHAVE

# Chave privada da carteira de deploy (sem o prefixo 0x)
PRIVATE_KEY=sua_chave_privada_aqui

# Chave da API do Etherscan (para verificação de contratos)
ETHERSCAN_API_KEY=sua_chave_etherscan_aqui
```

> ⚠️ **Nunca comite o arquivo `.env`** — ele já está no `.gitignore`.

---

## Compilação de contratos

```bash
npm run build
```

Isso executa `hardhat compile` e gera os artefatos em `artifacts/` e os tipos TypeChain em `types/`.

---

## Testes automatizados

```bash
npm test
```

Os testes cobrem os contratos `EcoStaking` e `ReverseLogistics` com asserções estritamente tipadas via TypeChain.

---

## Relatório de auditoria (cobertura de testes)

```bash
npm run audit
```

Executa `hardhat test --coverage` e gera um relatório de cobertura de linhas, branches, funções e statements. O relatório HTML é salvo em `coverage/index.html`.

> Este relatório serve como auditoria básica de cobertura de código para fins de entrega e revisão.

---

## Rodar o nó local

```bash
npx hardhat node
```

Sobe um nó Hardhat local em `http://127.0.0.1:8545` com 20 contas pré-financiadas.

---

## Deploy local (Hardhat Node)

Com o nó local rodando em outro terminal:

```bash
npm run deploy:local
```

O script gera automaticamente o arquivo `frontend/src/services/contracts.json` com endereços e ABIs dos contratos deployados.

---

## Deploy na testnet Sepolia

```bash
npm run deploy:sepolia
```

Após o deploy, verifique os contratos no Etherscan:

```bash
npx hardhat verify --network sepolia <ENDERECO_DO_CONTRATO> <ARG1> <ARG2> ...
```

---

## Rodar o frontend localmente

```bash
cd frontend
npm run dev
```

Acesse `http://localhost:3000`. O frontend lê automaticamente os endereços de `frontend/src/services/contracts.json`.

**Abas disponíveis:**

| Aba | Funcionalidade |
|---|---|
| **Logística** | Registrar devolução de item + mint de EcoBadge NFT |
| **Staking** | Travar EcoTokens e acumular recompensas por segundo |
| **DAO** | Visualizar e votar em propostas de governança |

---

## Endereços do deploy (Sepolia)

> Redeploy realizado com o padrão **mint-on-demand** — contratos com `MINTER_ROLE` concedem tokens diretamente aos usuários, sem pool pré-financiado.

| Contrato | Endereço |
|---|---|
| `EcoToken` | [0xEe1aE11911b89ca343CFD89634b1A4De651915e9](https://sepolia.etherscan.io/address/0xEe1aE11911b89ca343CFD89634b1A4De651915e9) |
| `EcoBadge` | [0x7F42eB80fBec6B17B4286862d86b871858897888](https://sepolia.etherscan.io/address/0x7F42eB80fBec6B17B4286862d86b871858897888) |
| `MockPriceFeed` | [0x7b23dE9Ecc1703C58Fb1F765A3657d575ef738Cd](https://sepolia.etherscan.io/address/0x7b23dE9Ecc1703C58Fb1F765A3657d575ef738Cd) |
| `ReverseLogistics` | [0x626332A414efbb1Fe4680C038F06d8cDb5f74E3E](https://sepolia.etherscan.io/address/0x626332A414efbb1Fe4680C038F06d8cDb5f74E3E) |
| `EcoStaking` | [0xa8f93E23F5e65cC80aD67b68f45817b592b60aA1](https://sepolia.etherscan.io/address/0xa8f93E23F5e65cC80aD67b68f45817b592b60aA1) |
| `EcoDAO` | [0x6Bec3b09c541e6e1fdedf86B3a6d2234e15155C4](https://sepolia.etherscan.io/address/0x6Bec3b09c541e6e1fdedf86B3a6d2234e15155C4) |


---

## Estrutura do repositório

```
tracktrash/
├── contracts/              # Contratos Solidity
│   ├── EcoToken.sol
│   ├── EcoBadge.sol
│   ├── ReverseLogistics.sol
│   ├── EcoStaking.sol
│   ├── EcoDAO.sol
│   └── mocks/
│       └── MockV3Aggregator.sol
├── scripts/
│   └── deploy.ts           # Script de deploy com TypeChain (estritamente tipado)
├── test/
│   ├── EcoStaking.ts
│   └── ReverseLogistics.ts
├── types/                  # Bindings TypeChain (gerados automaticamente)
├── frontend/               # Next.js 14 com Tailwind CSS
│   ├── app/
│   │   ├── page.js         # Página principal com sistema de abas
│   │   ├── layout.js
│   │   └── components/
│   │       ├── Navbar.js
│   │       ├── Card.js
│   │       ├── LogisticsTab.js
│   │       ├── StakingTab.js
│   │       └── DAOTab.js
│   └── lib/
│       └── Web3Service.js  # Camada de abstração Ethers.js
├── hardhat.config.ts       # Configuração do Hardhat (Sepolia + Etherscan)
├── package.json
└── README.md
```

---

## Como reproduzir o projeto

Quer rodar o TrackTrash do zero, testar os contratos inteligentes ou reproduzir o ambiente de desenvolvimento completo?

Preparamos um guia detalhado cobrindo cada etapa — da instalação do ambiente ao primeiro registro de devolução na testnet Sepolia, incluindo a configuração do MetaMask, o deploy dos contratos e os testes automatizados.

📄 **[Guia passo a passo para reprodução manual](INSTRUÇÕES.md)**

> O guia inclui: configuração do ambiente local, deploy local com Hardhat Node, deploy na Sepolia, execução do frontend e dicas de troubleshooting para os erros mais comuns.

---

## Segurança e Auditoria

Os contratos inteligentes do protocolo TrackTrash foram submetidos a uma análise de segurança utilizando **Slither v0.11.5** (análise estática desenvolvida pela Trail of Bits). A auditoria cobriu o contrato principal `ReverseLogistics.sol` e suas dependências OpenZeppelin.

**Resultado:** nenhuma vulnerabilidade crítica ou de alta severidade foi identificada. Os achados encontrados são classificados como `Low` ou `Informational` e possuem mitigações já em vigor (como o `ReentrancyGuard` da OpenZeppelin e o controle de acesso via `AccessControl`).

📋 **[Ler o Relatório de Auditoria Completo](AUDITORIA.md)**

> A auditoria foi realizada com `solc 0.8.26` via `solc-select` e `slither` com remapping das dependências OpenZeppelin. O relatório segue o formato acadêmico exigido, com escopo, metodologia, achados detalhados, tabela resumo e recomendações de correção.

---

## Licença

Este projeto foi desenvolvido para fins educacionais em hackathon e capacitação Web3.

### NOTA:

O projeto TrackTrash foi inicialmente desenvolvido em equipe durante o hackathon Low Hack, promovido pelo Hackathon Brasil em parceria com a Siemens, com foco no tema de sustentabilidade e gestão de resíduos eletrônicos.

A solução original foi concebida e implementada em um período de 48 horas, utilizando ferramentas de low-code, como o Mendix.

Posteriormente, com o consentimento dos integrantes da equipe 338, fiz a adaptação do projeto para Web3 e o aprimoramento dos contratos inteligentes.

Para contato com os demais membros da equipe ou acesso aos respectivos perfis profissionais (LinkedIn), solicita-se contato prévio direto comigo, para que as informações sejam compartilhadas de forma organizada.
