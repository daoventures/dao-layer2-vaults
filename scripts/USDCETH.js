const { ethers, network } = require("hardhat")
const { mainnet } = require("../addresses")

// const sushiFactoryAddr = "0x1D5c8FA8aa068726b84f6b45992C8f0f225A4ff3"
const sushiFactoryAddr = "0xA9A09D4F4382c147E314381918F2da703ea1a911" // Kovan

async function main() {
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)

    // const sushiVaultArtifact = await artifacts.readArtifact("Sushi")
    const sushiVaultArtifact = await artifacts.readArtifact("SushiKovan")
    const sushiVaultInterface = new ethers.utils.Interface(sushiVaultArtifact.abi)
    const dataUSDCETH = sushiVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 Sushi USDC-ETH", "daoSushiUSDC", 1,
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const sushiFactory = await ethers.getContractAt("SushiFactory", sushiFactoryAddr, deployer)
    const tx = await sushiFactory.createVault(dataUSDCETH, {gasLimit: 982000})
    await tx.wait()
    const USDCETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))

    console.log("Sushi USDC-ETH vault (proxy) contract address:", USDCETHVaultAddr)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
