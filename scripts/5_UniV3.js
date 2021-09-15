const { ethers } = require("hardhat")

async function main() {
    const [deployer] = await ethers.getSigners()

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    // const UniV3Vault = await ethers.getContractFactory("UniswapV3", deployer)
    // // const UniV3Vault = await ethers.getContractFactory("UniswapV3Kovan", deployer)
    // const uniV3Vault = await UniV3Vault.deploy()
    // console.log("Uniswap V3 vault (implementation) contract address:", uniV3Vault.address)
    const uniV3VaultAddr = "0x33755362194248a5870CE1cf90B26bD21a3bA06d"

    const UniV3Factory = await ethers.getContractFactory("UniV3Factory", deployer)
    // const uniV3Factory = await UniV3Factory.deploy(uniV3Vault.address)
    const uniV3Factory = await UniV3Factory.deploy(uniV3VaultAddr)
    console.log("Uniswap V3 factory contract address:", uniV3Factory.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })