const { ethers } = require("hardhat")
const { mainnet } = require("../addresses")

const uniV3FactoryAddr = "0xbd27EE9153998fa77BdeBf422c5B65d421A9d8ce"
const GHSTETHPoolAddr = "0xFbA31F01058DB09573a383F26a088f23774d4E5d"

async function main() {
    const [deployer] = await ethers.getSigners()

    const uniV3VaultArtifact = await artifacts.readArtifact("UniswapV3")
    // const uniV3VaultArtifact = await artifacts.readArtifact("UniswapV3Kovan")
    const uniV3VaultInterface = new ethers.utils.Interface(uniV3VaultArtifact.abi)
    const dataGHSTETH = uniV3VaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 UniV3 GHST-ETH", "daoUniV3GHST", GHSTETHPoolAddr,
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const uniV3Factory = await ethers.getContractAt("UniV3Factory", uniV3FactoryAddr, deployer)
    const tx = await uniV3Factory.createVault(dataGHSTETH)
    await tx.wait()
    const GHSTETHVaultAddr = await uniV3Factory.getVault((await uniV3Factory.getVaultLength()).sub(1))

    console.log("Uniswap V3 GHST-ETH vault (proxy) contract address:", GHSTETHVaultAddr)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })