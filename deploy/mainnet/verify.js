const { run } = require("hardhat")

const vaultImpl = "0x984baa2bed520988b486bedb47857d9108cececa"
const strategyImpl = "0x86f490f050d9f7b45eb11a984f2bced3881ddefe"

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