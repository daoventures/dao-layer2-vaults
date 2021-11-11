const { ethers, network, artifacts } = require("hardhat")
const { mainnet: addresses } = require("../../addresses/citadelBSC")

const proxyAdminAddr = "0x72eB6E3f163E8CFD1Ebdd7B2f4ffB60b6e420448" //"0x87C079A8Eb5459aaCe1f31E125C8992Df6Ff2168"
const safuVaultProxy = "0xB9E35635084B8B198f4bF4EE787D5949b46338f1" //"0x81390703430015A751F967694d5CCb8745FdA254"
// const deployerAddress = "0x3f68a3c1023d736d8be867ca49cb18c543373b99"
module.exports = async ({deployments}) => {
    const [deployer] = await ethers.getSigners() 

    // todo comment
    // await network.provider.request({
    //     method: "hardhat_impersonateAccount",
    //     params: [deployerAddress]
    // })

    // const deployer = await ethers.getSigner(deployerAddress)

    const DaoSafuVault = await ethers.getContractFactory("DaoSafuVault")
    const daoSafuVault = await DaoSafuVault.deploy()


    console.log("New implementation contract for DaoSafuVault:", daoSafuVault.address)

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)

    await proxyAdmin.upgrade(safuVaultProxy, daoSafuVault.address)

    let vault = await ethers.getContractAt("DaoSafuVault", safuVaultProxy)
    await vault.connect(deployer).postUpgrade()

    console.log("daoSafuVault upgraded successfully")
}

module.exports.tags = ["safu_upgrade_vault"]