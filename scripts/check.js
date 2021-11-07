const { ethers } = require("hardhat")

const HBTCWBTCVaultAddr = "0xB2010f55C684A9F1701178920f5269a1180504E1"
const WBTCETHVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
const DPIETHVaultAddr = "0x397E18750351a707A010A5eB188a7A6AbFda4Fcd"
const DAIETHVaultAddr = "0x37e19484982425b77624FF95612D6aFE8f3159F4"

async function main() {
    const [deployer] = await ethers.getSigners()

    const HBTCWBTCVault = await ethers.getContractAt("Curve", HBTCWBTCVaultAddr, deployer)
    console.log(ethers.utils.formatEther(await HBTCWBTCVault.getPendingRewards()))
    
    const WBTCETHVault = await ethers.getContractAt("Sushi", WBTCETHVaultAddr, deployer)
    console.log(ethers.utils.formatEther(await WBTCETHVault.getPendingRewards()))
    
    const DPIETHVault = await ethers.getContractAt("Sushi", DPIETHVaultAddr, deployer)
    console.log(ethers.utils.formatEther(await DPIETHVault.getPendingRewards()))
    
    const DAIETHVault = await ethers.getContractAt("Sushi", DAIETHVaultAddr, deployer)
    console.log(ethers.utils.formatEther(await DAIETHVault.getPendingRewards()))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })