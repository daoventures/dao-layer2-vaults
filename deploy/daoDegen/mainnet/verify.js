const { run } = require("hardhat")

const vaultImpl = "0x84EEc4e9BEC17f2b46981665EE3A583C41d62E6f"
const strategyImpl = "0xC4f5828211e776de812F456b326bD66A792C5534"

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