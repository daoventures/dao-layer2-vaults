const { ethers } = require("hardhat")

async function main() {
    const [deployer] = await ethers.getSigners()

    const MirrorVault = await ethers.getContractFactory("Mirror", deployer)
    // const MirrorVault = await ethers.getContractFactory("MirrorKovan", deployer)
    const mirrorVault = await MirrorVault.deploy({gasLimit: 4180000})
    await mirrorVault.deployTransaction.wait()
    console.log("Mirror vault (implementation) contract address:", mirrorVault.address)
    
    const MirrorFactory = await ethers.getContractFactory("MirrorFactory", deployer)
    const mirrorFactory = await MirrorFactory.deploy(mirrorVault.address, {gasLimit: 1500000})
    await mirrorFactory.deployTransaction.wait()
    console.log("Mirror factory contract address:", mirrorFactory.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })