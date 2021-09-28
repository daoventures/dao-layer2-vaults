const { run } = require("hardhat")

const vaultImpl = ""
const strategyImpl = ""

module.exports = async () => {

    await run("verify:verify", {
        address: strategyImpl,
        contract: "contracts/safu/DaoDegenStrategy.sol:DaoDegenStrategy"
    })

    await run("verify:verify", {
        address: vaultImpl,
        contract: "contracts/safu/DaoDegenVault.sol:DaoDegenVault"
    })

}

module.exports.tags = ["degen_mainnet_verify"]