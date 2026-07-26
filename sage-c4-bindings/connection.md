# Connection Setup

SAGE C4 PTR currently operates on the z.ink testnet. The public test realm client at `https://sage.staratlas.com` connects to that network through the RPC endpoint below.

In Star Atlas terms, this is the test environment for the browser game and its generated clients. Treat it as the place to verify C4 behavior before making any mainnet or production assumption.

| Purpose | Endpoint |
| --- | --- |
| HTTP RPC | `https://testnet-rpc.z.ink` |
| HTTP RPC alias | `https://rpc1.z.ink` |
| WebSocket RPC | `wss://testnet-rpc.z.ink` |
| Explorer | `https://explorer.z.ink` |

Use these endpoints for local experiments, account reads, and generated-client tests that need to talk to the same testnet environment as the SAGE C4 browser game.

::: warning Testnet endpoint
The z.ink network is not Solana mainnet. Do not mix these endpoints with production Star Atlas program addresses, production wallets, or mainnet assumptions.
:::

## Cluster configuration

```ts
export type SagePtrCluster = {
	http: string;
	ws: string;
	explorer: string;
	commitment: 'processed' | 'confirmed' | 'finalized';
};

export const sagePtrCluster: SagePtrCluster = {
	http: 'https://testnet-rpc.z.ink',
	ws: 'wss://testnet-rpc.z.ink',
	explorer: 'https://explorer.z.ink',
	commitment: 'confirmed'
};
```

## Health check

Use a direct RPC health check before debugging generated-client code. It catches endpoint and networking problems before they masquerade as decoder failures.

```ts
const response = await fetch('https://testnet-rpc.z.ink', {
	method: 'POST',
	headers: {
		'content-type': 'application/json'
	},
	body: JSON.stringify({
		jsonrpc: '2.0',
		id: 'health',
		method: 'getHealth'
	})
});

const payload = await response.json();

if (payload.result !== 'ok') {
	throw new Error(`SAGE PTR RPC is not healthy: ${JSON.stringify(payload)}`);
}
```

## CLI check

```bash
NO_DNA=1 solana -u https://testnet-rpc.z.ink epoch-info
```

## Known live checks

At discovery time:

- `getHealth` returned `ok`.
- `getGenesisHash` returned `6qaAozzun2WV83PRDgqf79WXtbqfnezKB3demjxXV5EY`.
- `getVersion` returned Solana core `3.1.8`.
- `https://rpc1.z.ink` and `https://testnet-rpc.z.ink` returned the same genesis hash.

The genesis hash is the stronger cluster identity check. An endpoint can be healthy and still point at the wrong SVM chain.

For the C4 program, game account, and query examples, continue with [Reading Live Game State](/sage-c4-bindings/reading-game-state).

::: warning PTR behavior
Treat every PTR endpoint as mutable. Pinning these constants in docs is useful for discoverability, but application code should keep cluster config in one place.
:::
