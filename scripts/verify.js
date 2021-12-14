const { run } = require('hardhat')
const { mainnet } = require("../addresses")

const contractAddr = "0x853F5d3c3850bD422FEB38D774827B609b4Cc84e"
const contractName = "MVFVault"

// const AXSETHVaultAddr = "0x6A4EfC6Ab4792Fc8DCd5A488791CBDD45675d239" // Kovan
// const SLPETHVaultAddr = "0x777d14f93166FA67e9cd6b869bd0F87F45FdC497" // Kovan
// const ILVETHVaultAddr = "0x4Ba84ba0e07a30Bdde5E73aB8f94959b7ce1f7EF" // Kovan
// const GHSTETHVaultAddr = "0x8C2bf8B337A7dc91660DD7783f9A4EFCEcC7bf65" // Kovan
// const daoProxyAdminAddr = "0x0A25131608AbAeCA03AE160efAAFb008dd34a4ab" // Kovan
// const mvfStrategyImplAddr = "0x9A5cC5AD35076B06a73bc8D98282761b14A998e0" // Kovan

async function main() {
    // // const mvfStrategyArtifact = await artifacts.readArtifact("MVFStrategy")
    // const mvfStrategyArtifact = await artifacts.readArtifact("MVFStrategyKovan")
    // const mvfStrategyInterface = new ethers.utils.Interface(mvfStrategyArtifact.abi)
    // const dataMVFStrategy = mvfStrategyInterface.encodeFunctionData(
    //     "initialize",
    //     [AXSETHVaultAddr, SLPETHVaultAddr, ILVETHVaultAddr, GHSTETHVaultAddr]
    // )

    await run('verify:verify', {
        address: contractAddr,
        // constructorArguments: [
        //     mvfStrategyImplAddr,
        //     daoProxyAdminAddr,
        //     dataMVFStrategy
        //   ],
        contract: `contracts/${contractName}.sol:${contractName}`
    })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })