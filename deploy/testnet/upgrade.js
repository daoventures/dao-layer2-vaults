const { ethers } = require("hardhat")

const proxyAdminAddr = "0x87C079A8Eb5459aaCe1f31E125C8992Df6Ff2168"
const safuvaultProxy = "0x81390703430015A751F967694d5CCb8745FdA254"

module.exports = async () => {
    const [deployer] = await ethers.getSigners()

    // const DaoSafuVault = await ethers.getContractFactory("DaoSafuVault")
    const DaoSafuVault = await ethers.getContractFactory("DaoSafuVaultTestnet")
    const daoSafuVault = await DaoSafuVault.deploy()
    // let test = await daoSafuVault.deployTransaction.wait()
    // console.log(test, daoSafuVault)
    console.log("New implementation contract for DaoSafuVault:", daoSafuVault.address)

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)
    await proxyAdmin.upgrade(safuvaultProxy, daoSafuVault.address)
    console.log("DaoSafuVault upgraded successfully")
}

module.exports.tags = ["safu_testnet_upgrade_vault"]