import hre from "hardhat";

async function main() {
    console.log("Deploying CopyTradeVault...");

    // Get the contract factory
    const Vault = await hre.ethers.getContractFactory("CopyTradeVault");

    // Deploy the contract (Pass the testnet USDC address to the constructor)
    const usdcAddress = "0xE9CC37904875B459Fa5D0FE37680d36F1ED55e38";
    const vault = await Vault.deploy(usdcAddress);

    await vault.waitForDeployment();

    console.log(`✅ CopyTradeVault deployed at: ${await vault.getAddress()}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});