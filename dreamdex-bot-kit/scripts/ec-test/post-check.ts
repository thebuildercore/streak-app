/**
 * Post-run check: open orders for the configured wallet. Emits JSON on stdout.
 *   npx tsx scripts/ec-test/post-check.ts
 */
import { config as dotenv } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.env") });

const { createExchange, loadConfig, shutdown } = await import("@dreamdex-bot-kit/ec-core");

async function main() {
  const cfg = loadConfig();
  if (!cfg.privateKey) {
    console.log(JSON.stringify({ openOrders: null, reason: "no PRIVATE_KEY" }));
    return;
  }
  const ctx = createExchange({ withSigner: true });
  // NOT exchange.fetchOpenOrders(): with no symbol it sweeps the binary, spot AND
  // perp portfolios and maps every row against the loaded symbol table, which is
  // what made this check time out on testnet (500+ symbols). The binary
  // portfolio is one indexer query and it is the only one this kit can leak
  // orders into.
  const portfolio = await ctx.exchange.client.getPortfolio(ctx.exchange.walletAddress!);
  const open = portfolio.openOrders ?? [];
  const collateral = cfg.addresses.collateral ?? cfg.addresses.testUsdc;
  let collateralHuman: number | null = null;
  const addr = ctx.exchange.walletAddress!;
  if (collateral) {
    const bal = await ctx.exchange.client.getErc20Balance(collateral, addr);
    collateralHuman = Number(bal) / 10 ** cfg.decimals;
  }
  await shutdown(ctx);
  console.log(
    JSON.stringify({
      openOrders: open.length,
      orders: open.map((o) => ({ id: o.orderId, side: o.side, price: o.price, remaining: o.quantityRemaining })),
      collateral: collateralHuman,
      wallet: addr,
    }),
  );
}

// Exit explicitly. `shutdown()` races the exchange's close against a 3s timeout,
// so when the websocket does not close in time the socket keeps the event loop
// alive and this probe never returns — which the harness saw as a timeout and
// scored as "open orders unknown". The answer was already on stdout by then.
main().then(
  () => process.exit(0),
  (e) => {
    console.error(JSON.stringify({ error: (e as Error).message }));
    process.exit(1);
  },
);
