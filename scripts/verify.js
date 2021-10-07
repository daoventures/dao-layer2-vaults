const { run } = require('hardhat')
const { mainnet, kovan } = require("../addresses")

const contractAddr = "0x2Ae8A9515f0a9B00FCafa649C6381AF132f832f9"
const contractName = "TAStrategyKovan"

const strategyImpl = "0x5f5298943Ff78bfd02aC122b5A8b69EAEf46404a"
const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f"
const WBTCETHStrategyAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F" // Kovan
const USDCETHStrategyAddr = "0x4Fe35F3e3728942715378a3D5684f86b693328a3" // Kovan

async function main() {
    // // const taStrategyArtifact = await artifacts.readArtifact("TAStrategy")
    // const taStrategyArtifact = await artifacts.readArtifact("TAStrategyKovan")
    // const taStrategyInterface = new ethers.utils.Interface(taStrategyArtifact.abi)
    // const dataTAStrategy = taStrategyInterface.encodeFunctionData(
    //     "initialize",
    //     // [
    //     //     "DAO L2 TA V2", "daoSTO2",
    //     //     // mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
    //     //     // mainnet.biconomy, taStrategyProxyAddr
    //     //     kovan.treasury, kovan.community, kovan.strategist, kovan.admin,
    //     //     kovan.biconomy, taStrategyProxyAddr
    //     // ]
    //     [
    //         WBTCETHStrategyAddr, USDCETHStrategyAddr, true
    //     ]
    // )

    await run('verify:verify', {
        address: contractAddr,
        // constructorArguments: [
        //     strategyImpl,
        //     daoProxyAdminAddr,
        //     dataTAStrategy
        // ],
        contract: `contracts/${contractName}.sol:${contractName}`
    })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })