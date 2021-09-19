const { run } = require('hardhat')
const { mainnet, kovan } = require("../addresses")

const contractAddr = "0x7739933d775BF2eD5EAEC76BC61c581A82e25b0c"
const contractName = "StonksProxy"

const stonksVaultImpl = "0xa4639BD9d9864773659EFCa50D309fA5ae68DE31" // Kovan
const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan
const stonksStrategyProxyAddr = "0xA8a3b0412A25C1183DFcFed6dc7b6aCd584A6383" // Kovan

async function main() {
    // const stonksVaultArtifact = await artifacts.readArtifact("StonksVault")
    const stonksVaultArtifact = await artifacts.readArtifact("StonksVaultKovan")
    const stonksVaultInterface = new ethers.utils.Interface(stonksVaultArtifact.abi)
    const dataStonksVault = stonksVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L2 Stonks V2", "daoSTO2",
            // mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
            // mainnet.biconomy, stonksStrategyProxyAddr
            kovan.treasury, kovan.community, kovan.strategist, kovan.admin,
            kovan.biconomy, stonksStrategyProxyAddr
        ]
    )

    await run('verify:verify', {
        address: contractAddr,
        constructorArguments: [
            stonksVaultImpl,
            daoProxyAdminAddr,
            dataStonksVault
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