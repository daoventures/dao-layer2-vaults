const { run } = require('hardhat')
const { mainnet } = require("../addresses")

const contractAddr = "0xf778b6ae1227f98F6fC37b805c44689F49b152ad"
const contractName = "MVFVaultKovan"

const ILVETHVaultAddr = "0x7422e91c420910B086126000b950DA11bfeda266"
const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"

async function main() {
    // const mvfVaultArtifact = await artifacts.readArtifact("MVFVaultKovan")
    // const mvfVaultInterface = new ethers.utils.Interface(mvfVaultArtifact.abi)
    // const dataMVFVault = mvfVaultInterface.encodeFunctionData(
    //     "initialize",
    //     [
    //         "DAO L2 Metaverse-Farmer", "daoMVF",
    //         mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
    //         mainnet.biconomy, "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    //     ]
    // )

    await run('verify:verify', {
        address: contractAddr,
        // constructorArguments: [
        //     "0x364BF647549E81c6aF215Bbdd8DF2797d000db67",
        //     "0x974dBC1348c5697e893FFd932681Cb48b5789fA8",
        //     dataMVFVault
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