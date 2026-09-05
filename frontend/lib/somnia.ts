// lib/somnia.ts
import { SomniaMarkets } from '@somnia-chain/markets-sdk';
import { somniaShannon } from '@somnia-chain/markets-sdk/chains';

// Initialize the client for the Testnet
export const somnia = new SomniaMarkets({
    indexerUrl: 'https://stg.api.dreamdex.io', // DreamDEX testnet indexer URL
    chain: somniaShannon,
});

export const { client } = somnia;