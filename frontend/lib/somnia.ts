// lib/somnia.ts
import { SomniaMarkets, SOMNIA_MAINNET_ADDRESSES } from '@somnia-chain/markets-sdk';
import { somniaMainnet } from '@somnia-chain/markets-sdk/chains';

// Initialize the client for the Mainnet
export const somnia = new SomniaMarkets({
    indexerUrl: 'https://prd.smk.somnia.host/v1/graphql',
    chain: somniaMainnet,
    wsRpcUrl: 'wss://api.infra.mainnet.somnia.network/ws',
    addresses: SOMNIA_MAINNET_ADDRESSES,
});

export const { client } = somnia;