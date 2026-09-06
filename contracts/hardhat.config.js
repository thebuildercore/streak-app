import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

export default {
    solidity: {
        compilers: [
            { version: "0.8.20" },
            { version: "0.8.24" },
        ],
    },
    paths: {
        sources: "./src",
    },
    networks: {
        somnia: {
            url: process.env.RPC_URL || "https://dream-rpc.somnia.network",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
    },
};