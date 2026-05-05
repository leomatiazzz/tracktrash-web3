# Diretrizes Arquiteturais - Protocolo Web3 de Logistica Reversa

## 1) Versao do Solidity

- Todos os contratos inteligentes do protocolo devem ser desenvolvidos com `Solidity ^0.8.20`.
- Nao e permitido utilizar versoes inferiores sem justificativa tecnica formal.

## 2) Padronizacao e Seguranca com OpenZeppelin

- E obrigatorio o uso da biblioteca OpenZeppelin em todos os contratos relevantes.
- A implementacao deve incluir, obrigatoriamente, os modulos:
  - `ReentrancyGuard` para mitigacao de ataques de reentrancia;
  - `AccessControl` para controle de permissoes baseado em papeis.
- Evitar logica autoral para controles ja cobertos por contratos padrao da OpenZeppelin.

## 3) Componentes Obrigatorios do Protocolo

O protocolo deve conter, no minimo, os seguintes contratos:

### 3.1) EcoToken (ERC-20)

- Token ERC-20 chamado `EcoToken`.
- Objetivo: recompensar participantes da logistica reversa.

### 3.2) EcoBadge (ERC-721)

- NFT ERC-721 chamado `EcoBadge`.
- Objetivo: representar certificacoes e conquistas ambientais.

### 3.3) Contrato de Staking

- Contrato de staking para bloqueio de `EcoToken` e distribuicao de recompensas.
- Deve proteger fluxos de saque e reivindicacao com `ReentrancyGuard`.

### 3.4) DAO Simples

- Contrato de governanca simples para criacao e votacao de propostas.
- A DAO deve permitir, no minimo:
  - criacao de propostas;
  - votacao;
  - execucao de propostas aprovadas.

## 4) Frontend

- O frontend sera desenvolvido com `Next.js`.
- A integracao com blockchain sera feita com `ethers.js`.
- O frontend deve contemplar, no minimo:
  - conexao de carteira;
  - visualizacao de saldo do `EcoToken`;
  - visualizacao de `EcoBadge`;
  - interacao com staking;
  - interacao com governanca da DAO.

## 5) Estrutura Recomendada de Projeto

- `contracts/`: contratos Solidity;
- `scripts/`: deploy e automacoes;
- `test/`: testes de contratos;
- `frontend/`: aplicacao Next.js;
- `docs/`: documentacao complementar.
