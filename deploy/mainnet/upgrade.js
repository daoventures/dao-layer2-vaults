const { ethers, network, artifacts } = require("hardhat")
const { mainnet: addresses } = require("../../addresses/citadelBSC")

const proxyAdminAddr = "0x72eB6E3f163E8CFD1Ebdd7B2f4ffB60b6e420448" //"0x87C079A8Eb5459aaCe1f31E125C8992Df6Ff2168"
const safuStrategyProxy = "0xdac6E0CD7A535038f5d836155784603FaC1ba23d" //"0x81390703430015A751F967694d5CCb8745FdA254"

module.exports = async () => {
    const [deployer] = await ethers.getSigners() 

    //todo comment
    // await network.provider.request({
    //     method: "hardhat_impersonateAccount",
    //     params: [deployerAddress]
    // })

    // const deployer = await ethers.getSigner(deployerAddress)

    const DaoSafuStrategy = await ethers.getContractFactory("DaoSafuStrategy")
    const daoSafuStrategy = await DaoSafuStrategy.deploy()

    console.log("New implementation contract for DaoSafuVault:", daoSafuStrategy.address)

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgradeAndCall(address proxy, address implementation, bytes memory data) public payable"
    ], deployer)


    let artifacts_strategy = await artifacts.readArtifact("DaoSafuStrategy")
    let abi = artifacts_strategy.abi
    let interface = new ethers.utils.Interface(abi)
    let data = interface.encodeFunctionData("postUpgrade", [])

    // const str = await ethers.getContractAt("DaoSafuStrategy", safuStrategyProxy) //todo remove
    // let ownerBeforeUpgrade = await str.owner()

    await proxyAdmin.upgradeAndCall(safuStrategyProxy, daoSafuStrategy.address, data)
    
    // console.log("owner", ownerBeforeUpgrade, await str.owner())
    
    // let vault = await ethers.getContractAt("DaoSafuVault", "0xB9E35635084B8B198f4bF4EE787D5949b46338f1") //todo remove
    // await vault.connect(deployer).invest()

    console.log("daoSafuStrategy upgraded successfully")
}

module.exports.tags = ["safu_upgrade_strategy"]