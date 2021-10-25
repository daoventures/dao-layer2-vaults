const { ethers, network, artifacts } = require("hardhat")
const { mainnet: addresses } = require("../../addresses/citadelBSC")

const proxyAdminAddr = "0x72eB6E3f163E8CFD1Ebdd7B2f4ffB60b6e420448" //"0x87C079A8Eb5459aaCe1f31E125C8992Df6Ff2168"
const daoDegenVaultProxy = "0x5E5d75c2d1eEC055e8c824c6C4763b59d5c7f065" //"0x81390703430015A751F967694d5CCb8745FdA254"
// const deployerAddress = "0x3f68a3c1023d736d8be867ca49cb18c543373b99"
module.exports = async ({deployments}) => {
    const [deployer] = await ethers.getSigners() 

    // todo comment
    // await network.provider.request({
    //     method: "hardhat_impersonateAccount",
    //     params: [deployerAddress]
    // })

    // const deployer = await ethers.getSigner(deployerAddress)

    const DaoDegenVault = await ethers.getContractFactory("DaoDegenVault")
    const daoDegenVault = await DaoDegenVault.deploy()


    console.log("New implementation contract for DaoDegenVault:", daoDegenVault.address)

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)

    await proxyAdmin.upgrade(daoDegenVaultProxy, daoDegenVault.address)

    console.log("daoDegenVault upgraded successfully")
}

module.exports.tags = ["degen_upgrade_vault"]