const { ethers } = require("hardhat")

async function main() {
    const [deployer] = await ethers.getSigners()

    const UniV3Vault = await ethers.getContractFactory("UniswapV3", deployer)
    // const UniV3Vault = await ethers.getContractFactory("UniswapV3Kovan", deployer)
    const uniV3Vault = await UniV3Vault.deploy()

    const UniV3Factory = await ethers.getContractFactory("UniV3Factory", deployer)
    const uniV3Factory = await UniV3Factory.deploy(uniV3Vault.address)

    console.log("Uniswap V3 vault (implementation) contract address:", uniV3Vault.address)
    console.log("Uniswap V3 factory contract address:", uniV3Factory.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })