const { ethers, upgrades } = require("hardhat")
const { mainnet } = require("../addresses")

const AXSETHVaultAddr = "0x6A4EfC6Ab4792Fc8DCd5A488791CBDD45675d239" // Sushi AXS-ETH vault (proxy) contract address
const SLPETHVaultAddr = "0x777d14f93166FA67e9cd6b869bd0F87F45FdC497" // Sushi SLP-ETH vault (proxy) contract address
const ILVETHVaultAddr = "0x4Ba84ba0e07a30Bdde5E73aB8f94959b7ce1f7EF" // Sushi ILV-ETH vault (proxy) contract address
const GHSTETHVaultAddr = "0x8C2bf8B337A7dc91660DD7783f9A4EFCEcC7bf65" // Uniswap V3 GHST-ETH vault (proxy) contract address

async function main() {
    const [deployer] = await ethers.getSigners()

    const MVFStrategy = await ethers.getContractFactory("MVFStrategy", deployer)
    // const MVFStrategy = await ethers.getContractFactory("MVFStrategyKovan", deployer)
    const mvfStrategy = await upgrades.deployProxy(MVFStrategy, [
        AXSETHVaultAddr, SLPETHVaultAddr, ILVETHVaultAddr, GHSTETHVaultAddr
    ])

    const MVFVault = await ethers.getContractFactory("MVFVault", deployer)
    // const MVFVault = await ethers.getContractFactory("MVFVaultKovan", deployer)
    const mvfVault = await upgrades.deployProxy(MVFVault, [
        "DAO L2 Metaverse-Farmer", "daoMVF",
        mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
        mainnet.biconomy, mvfStrategy.address
    ])
    await mvfStrategy.setVault(mvfVault.address)

    console.log('Metaverse-Farmer vault (proxy) contract address:', mvfVault.address)
    console.log('Metaverse-Farmer contract (proxy) address:', mvfStrategy.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })