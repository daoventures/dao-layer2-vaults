const { ethers, upgrades } = require("hardhat")
const { mainnet } = require("../addresses")

const AXSETHVaultAddr = "" // Sushi AXS-ETH vault (proxy) contract address
const SLPETHVaultAddr = "" // Sushi SLP-ETH vault (proxy) contract address
const ILVETHVaultAddr = "" // Sushi ILV-ETH vault (proxy) contract address
const GHSTETHVaultAddr = "" // Uniswap V3 GHST-ETH vault (proxy) contract address

async function main() {
    const [deployer] = await ethers.getSigners()

    const MVFStrategy = await ethers.getContractFactory("MVFStrategy", deployer)
    // const MVFStrategy = await ethers.getContractFactory("MVFStrategyKovan", deployer)
    const mvfStrategy = await upgrades.deployProxy(MVFStrategy, [
        AXSETHVaultAddr, SLPETHVaultAddr, ILVETHVaultAddr, GHSTETHVaultAddr
    ])

    console.log('Metaverse-Farmer strategy (proxy) contract address:', mvfStrategy.address)


    const MVFVault = await ethers.getContractFactory("MVFVault", deployer)
    // const MVFVault = await ethers.getContractFactory("MVFVaultKovan", deployer)
    const mvfVault = await upgrades.deployProxy(MVFVault, [
        "DAO L2 Metaverse-Farmer", "daoMVF",
        mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
        mainnet.biconomy, mvfStrategy.address
    ])
    await mvfStrategy.setVault(mvfVault.address)

    console.log('Metaverse-Farmer vault (proxy) contract address:', mvfVault.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
