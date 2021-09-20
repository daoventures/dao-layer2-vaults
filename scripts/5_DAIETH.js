const { ethers } = require("hardhat")
const { mainnet } = require("../addresses")

const sushiFactoryAddr = "0x1D5c8FA8aa068726b84f6b45992C8f0f225A4ff3"

async function main() {
    const [deployer] = await ethers.getSigners()

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    const sushiVaultArtifact = await artifacts.readArtifact("Sushi")
    // const sushiVaultArtifact = await artifacts.readArtifact("SushiKovan")
    const sushiVaultInterface = new ethers.utils.Interface(sushiVaultArtifact.abi)
    const dataDAIETH = sushiVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 Sushi DAI-ETH", "daoSushiDAI", 2,
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const sushiFactory = await ethers.getContractAt("SushiFactory", sushiFactoryAddr, deployer)
    const tx = await sushiFactory.createVault(dataDAIETH, {gasLimit: 964000})
    await tx.wait()
    const DAIETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))

    console.log("Sushi DAI-ETH vault (proxy) contract address:", DAIETHVaultAddr)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })