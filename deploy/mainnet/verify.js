const { run } = require("hardhat")

const vaultImpl = "0xEBADF005F74a0d96FB75232Aa947C346535F57Ec"
const strategyImpl = "0xD18B48324f96D15575f9fAF9A8d21255A36825C4"

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