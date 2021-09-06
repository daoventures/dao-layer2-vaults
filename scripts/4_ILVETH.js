const { ethers, upgrades } = require("hardhat")
const { mainnet } = require("../addresses")

async function main() {
    const [deployer] = await ethers.getSigners()

    const ILVETHVaultFactory = await ethers.getContractFactory("ILVETHVault", deployer)
    // const ILVETHVaultFactory = await ethers.getContractFactory("ILVETHVaultKovan", deployer)
        const ILVETHVault = await upgrades.deployProxy(ILVETHVaultFactory, [
            "DAO L1 Sushi ILV-ETH", "daoSushiILV",
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ])
        await ILVETHVault.deployed()

    console.log("Sushi ILV-ETH vault (proxy) contract address:", ILVETHVault.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })