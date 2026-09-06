import { getSomniaMarketsAbi } from '@somnia-chain/markets-sdk';

const abis = getSomniaMarketsAbi();

// We check for both placeOrder and createOrder just in case they renamed it 
// in the latest version of the SDK
const targetAbi = abis.SpotPool.find(f => f.name === 'placeOrder' || f.name === 'createOrder');

console.log(JSON.stringify(targetAbi, null, 2));