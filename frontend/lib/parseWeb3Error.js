/**
 * parseWeb3Error — converte erros crus do ethers.js / MetaMask em mensagens
 * legíveis em português, sem expor JSON interno ao usuário.
 */
export function parseWeb3Error(err) {
  const code    = err?.code ?? err?.error?.code;
  const message = err?.message ?? String(err);

  // ── Usuário rejeitou ──────────────────────────────────────────────────────
  if (
    code === 4001 ||
    code === "ACTION_REJECTED" ||
    /user rejected|user denied|rejected the request/i.test(message)
  ) {
    return "Transação rejeitada pelo usuário.";
  }

  // ── Saldo insuficiente ────────────────────────────────────────────────────
  if (
    code === "INSUFFICIENT_FUNDS" ||
    /insufficient funds/i.test(message)
  ) {
    return "Saldo insuficiente para pagar a taxa de gás.";
  }

  // ── Gas muito baixo ───────────────────────────────────────────────────────
  if (/gas tip cap|gas price below|maxFeePerGas/i.test(message)) {
    return "Taxa de gás muito baixa. Tente novamente em alguns segundos.";
  }

  // ── Contrato reverteu ─────────────────────────────────────────────────────
  if (
    code === "CALL_EXCEPTION" ||
    /execution reverted|transaction reverted|revert/i.test(message)
  ) {
    // Tenta extrair o motivo do revert
    const reasonMatch = message.match(/reason="([^"]+)"/);
    if (reasonMatch) return `Contrato reverteu: ${reasonMatch[1]}`;

    // Motivos comuns inferidos pela mensagem
    if (/insufficient fee|insufficient msg\.value/i.test(message))
      return "Taxa ETH insuficiente. Aumente o valor no campo Taxa (mín. 0.002 ETH).";
    if (/missing revert data/i.test(message))
      return "Transação revertida pelo contrato. Verifique a taxa (mín. 0.002 ETH) e a rede (Sepolia).";

    return "Contrato reverteu a transação. Verifique os parâmetros e o valor da taxa.";
  }

  // ── Rede incorreta ────────────────────────────────────────────────────────
  if (code === "NETWORK_ERROR" || /network/i.test(message)) {
    return "Erro de rede. Verifique se o MetaMask está na Sepolia.";
  }

  // ── Contrato não encontrado ───────────────────────────────────────────────
  if (/could not decode result data|BAD_DATA/i.test(message)) {
    return "Contrato não encontrado nesta rede. Verifique se está na Sepolia.";
  }

  // ── Timeout / RPC ─────────────────────────────────────────────────────────
  if (/timeout|TIMEOUT|etimedout/i.test(message)) {
    return "Tempo esgotado ao contatar a rede. Tente novamente.";
  }

  // ── Fallback: limpa o payload JSON mas mantém a mensagem principal ────────
  const clean = message
    .split(" (error=")[0]
    .split(", payload=")[0]
    .split(" (action=")[0]
    .trim()
    .slice(0, 200);

  return clean || "Erro desconhecido. Verifique o console para detalhes.";
}
