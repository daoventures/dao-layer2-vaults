const { ethers } = require("hardhat")

async function main() {
    const [deployer] = await ethers.getSigners()

    // const SushiVault = await ethers.getContractFactory("Sushi", deployer)
    const SushiVault = await ethers.getContractFactory("SushiKovan", deployer)
    const sushiVault = await SushiVault.deploy()

    const SushiFactory = await ethers.getContractFactory("SushiFactory", deployer)
    const sushiFactory = await SushiFactory.deploy(sushiVault.address)

    console.log("Sushi vault (implementation) contract address:", sushiVault.address)
    console.log("Sushi factory contract address:", sushiFactory.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })