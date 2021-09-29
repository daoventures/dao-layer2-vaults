const { ethers } = require("hardhat")

const proxyAdminAddr = "0xF395553875bbcBD48261F0C87327c463509b424B"
const degenvaultProxy = "0x56F2005C3Fec21DD3c21899FbCEb1aAE5B4bc5dA"

module.exports = async () => {
    const [deployer] = await ethers.getSigners()

    // const DaoSafuVault = await ethers.getContractFactory("DaoSafuVault")
    const DaoDegenVault = await ethers.getContractFactory("DaoDegenVaultTestnet")
    const daoDegenVault = await DaoDegenVault.deploy()
    // let test = await daoSafuVault.deployTransaction.wait()
    // console.log(test, daoSafuVault)
    console.log("New implementation contract for daoDegenVault:", daoDegenVault.address)

    const proxyAdmin = await ethers.getContractAt([
        "function upgrade(address, address) external"
    ], proxyAdminAddr, deployer)

    await proxyAdmin.upgrade(degenvaultProxy, daoDegenVault.address)
    console.log("DaoDegenVault upgraded successfully")
}

module.exports.tags = ["degen_testnet_upgrade_vault"]