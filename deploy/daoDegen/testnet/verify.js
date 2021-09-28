const { run } = require("hardhat")

const vaultImpl = "0x4d897a145caf265c4a3077406b31c685d1d2dd41"
const strategyImpl = "0x0acF9F56a96023b14C3137E75468dcCE5aE87b4c"

module.exports = async () => {

    await run("verify:verify", {
        address: strategyImpl,
        contract: "contracts/daoDegen/DaoDegenStrategyTestnet.sol:DaoDegenStrategyTestnet"
    })

    await run("verify:verify", {
        address: vaultImpl,
        contract: "contracts/daoDegen/DaoDegenVaultTestnet.sol:DaoDegenVaultTestnet"
    })

}

module.exports.tags = ["degen_testnet_verify"]

// Compilation finished successfully
// Strategy Proxy:  0xD1Fc92873FcC59708CF26e2b8302188735cAf526
// Vault Proxy:  0x56F2005C3Fec21DD3c21899FbCEb1aAE5B4bc5dA