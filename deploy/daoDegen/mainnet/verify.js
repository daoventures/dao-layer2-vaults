const { run } = require("hardhat")

const vaultImpl = "0x10F69c2e8e15229492A987aDe4fB203D05845eAb"
const strategyImpl = "0xE7bDc083b3E8cc84B97bB559F17f7106a6d7b027"

module.exports = async () => {

    await run("verify:verify", {
        address: strategyImpl,
        contract: "contracts/daoDegen/DaoDegenStrategy.sol:DaoDegenStrategy"
    })

    await run("verify:verify", {
        address: vaultImpl,
        contract: "contracts/daoDegen/DaoDegenVault.sol:DaoDegenVault"
    })

}

module.exports.tags = ["degen_mainnet_verify"]