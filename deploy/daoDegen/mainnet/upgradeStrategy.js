const { ethers, network, artifacts } = require("hardhat")

const proxyAdminAddr = "0x72eB6E3f163E8CFD1Ebdd7B2f4ffB60b6e420448"
const degenStrategyProxy = "0xeAa8c430d17c894134AcFA0561853F37363CE887" 
// const deployerAddress = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
module.exports = async () => {
    const [deployer] = await ethers.getSigners() 

    
    // await network.provider.request({
        // method: "hardhat_impersonateAccount",
        // params: [deployerAddress]
    // })

    // const deployer = await ethers.getSigner(deployerAddress)

    const DaoDegenStrategy = await ethers.getContractFactory("DaoDegenStrategy")
    const daoDegenStrategy = await DaoDegenStrategy.deploy()

    console.log("New implementation contract for DaoDegenStrategy:", daoDegenStrategy.address)

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)

    await proxyAdmin.upgrade(degenStrategyProxy, daoDegenStrategy.address)

    console.log("daoDegenStrategy upgraded successfully")
}

module.exports.tags = ["degen_upgrade_strategy"]