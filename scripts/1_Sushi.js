const { ethers } = require("hardhat")

const sushiAddr = "0xa4DCbe792f51E13Fc0E6961BBEc436a881e73194"

async function main() {
    const [deployer] = await ethers.getSigners()

    // const SushiVault = await ethers.getContractFactory("Sushi", deployer)
    // // const SushiVault = await ethers.getContractFactory("SushiKovan", deployer)
    // const sushiVault = await SushiVault.deploy()
    // console.log("Sushi vault (implementation) contract address:", sushiVault.address)

    const SushiFactory = await ethers.getContractFactory("SushiFactory", deployer)
    // const sushiFactory = await SushiFactory.deploy(sushiVault.address)
    const sushiFactory = await SushiFactory.deploy(sushiAddr)
    console.log("Sushi factory contract address:", sushiFactory.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })