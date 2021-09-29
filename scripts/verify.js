const { run } = require('hardhat')
const { mainnet, kovan } = require("../addresses")

const contractAddr = "0xfd2f8DB43Bcd7817Bc6CD83A3Bbf18DBE8227E55"
const contractName = "TAProxy"

const strategyImpl = "0x5f5298943Ff78bfd02aC122b5A8b69EAEf46404a"
const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f"
const WBTCETHVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F" // Kovan
const USDCETHVaultAddr = "0x4Fe35F3e3728942715378a3D5684f86b693328a3" // Kovan

async function main() {
    // const taStrategyArtifact = await artifacts.readArtifact("TAStrategy")
    const taStrategyArtifact = await artifacts.readArtifact("TAStrategyKovan")
    const taStrategyInterface = new ethers.utils.Interface(taStrategyArtifact.abi)
    const dataTAStrategy = taStrategyInterface.encodeFunctionData(
        "initialize",
        // [
        //     "DAO L2 TA V2", "daoSTO2",
        //     // mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
        //     // mainnet.biconomy, taStrategyProxyAddr
        //     kovan.treasury, kovan.community, kovan.strategist, kovan.admin,
        //     kovan.biconomy, taStrategyProxyAddr
        // ]
        [
            WBTCETHVaultAddr, USDCETHVaultAddr, true
        ]
    )

    await run('verify:verify', {
        address: contractAddr,
        constructorArguments: [
            strategyImpl,
            daoProxyAdminAddr,
            dataTAStrategy
        ],
        contract: `contracts/${contractName}.sol:${contractName}`
    })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })