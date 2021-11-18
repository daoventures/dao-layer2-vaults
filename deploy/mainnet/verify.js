const { run } = require("hardhat")

const vaultImpl = "0x33755362194248a5870CE1cf90B26bD21a3bA06d"
const strategyImpl = "0xfc302A755a1c3C5E3094073d5640606880D671B4"

module.exports = async () => {

    await run("verify:verify", {
        address: strategyImpl,
        contract: "contracts/safu/DaoSafuStrategy.sol:DaoSafuStrategy"
    })

    await run("verify:verify", {
        address: vaultImpl,
        contract: "contracts/safu/DaoSafuVault.sol:DaoSafuVault"
    })

}

module.exports.tags = ["safu_mainnet_verify"]