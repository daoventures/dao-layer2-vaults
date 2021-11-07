const { ethers, network } = require("hardhat")
require("dotenv").config()

const HBTCWBTCVaultAddr = "0xB2010f55C684A9F1701178920f5269a1180504E1"
const WBTCETHVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
const DPIETHVaultAddr = "0x397E18750351a707A010A5eB188a7A6AbFda4Fcd"
const DAIETHVaultAddr = "0x37e19484982425b77624FF95612D6aFE8f3159F4"

async function main() {
    let tx
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)
    // const [me] = await ethers.getSigners()
    // await me.sendTransaction({to: deployer.address, value: ethers.utils.parseEther("10")})

    const HBTCWBTCVault = await ethers.getContractAt("Curve", HBTCWBTCVaultAddr, deployer)
    tx = await HBTCWBTCVault.invest()
    await tx.wait()
    console.log("Success call invest for DAO L1 Curve HBTC-WBTC vault contract")

    // const WBTCETHVault = await ethers.getContractAt("Sushi", WBTCETHVaultAddr, deployer)
    // tx = await WBTCETHVault.invest()
    // await tx.wait()
    // console.log("Success call invest for DAO L1 Sushi WBTC-ETH vault contract")

    // const DPIETHVault = await ethers.getContractAt("Sushi", DPIETHVaultAddr, deployer)
    // tx = await DPIETHVault.invest()
    // await tx.wait()
    // console.log("Success call invest for DAO L1 Sushi DPI-ETH vault contract")

    // const DAIETHVault = await ethers.getContractAt("Sushi", DAIETHVaultAddr, deployer)
    // tx = await DAIETHVault.invest()
    // await tx.wait()
    // console.log("Success call invest for DAO L1 Sushi DAI-ETH vault contract")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })