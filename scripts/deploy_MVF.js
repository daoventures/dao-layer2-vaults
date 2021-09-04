const { ethers } = require("hardhat")

async function main() {
    const [deployer] = await ethers.getSigners()

    const MVFStrategy = await ethers.getContractFactory("MVFStrategyKovan", deployer)
    const mvfStrategy = await upgrades.deployProxy(MVFStrategy, [
        deployer.address, deployer.address, deployer.address, deployer.address, 0
    ])

    const MVFVault = await ethers.getContractFactory("MVFVaultKovan", deployer)
    const mvfVault = await upgrades.deployProxy(MVFVault, [
        "DAO L2 Metaverse-Farmer", "daoMVF",
        deployer.address, deployer.address, deployer.address, deployer.address,
        deployer.address, mvfStrategy.address
    ])
    await mvfStrategy.setVault(mvfVault.address)

    console.log('MVFVault proxy address:', mvfVault.address)
    console.log('MVFStrategy proxy address:', mvfStrategy.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })