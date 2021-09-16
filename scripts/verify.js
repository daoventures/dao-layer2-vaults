const { run } = require('hardhat')
const { mainnet } = require("../addresses")

const contractAddr = "0xfa83CA66FDaCC4028DAB383de4adc8aB7DB21FF2"
const contractName = "MVFStrategyProxy"

const ILVETHVaultAddr = "0x7422e91c420910B086126000b950DA11bfeda266"
const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"

async function main() {
    const mvfStrategyArtifact = await artifacts.readArtifact("MVFStrategy")
    const mvfStrategyInterface = new ethers.utils.Interface(mvfStrategyArtifact.abi)
    const dataMVFStrategy = mvfStrategyInterface.encodeFunctionData(
        "initialize",
        [
            "0xcE097910Fc2DB329683353dcebF881A48cbA181e",
            "0x4aE61842Eb4E4634F533cb35B697a01319C457e2",
            "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e",
            "0xF9b0707dEE34d36088A093d85b300A3B910E00fC",
        ]
    )

    await run('verify:verify', {
        address: contractAddr,
        constructorArguments: [
            "0xB56AE1cDb49e45332932Ef664dD7B8925276dA3A",
            daoProxyAdminAddr,
            dataMVFStrategy
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