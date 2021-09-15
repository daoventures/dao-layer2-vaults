const { ethers, upgrades } = require("hardhat")
const { mainnet } = require("../addresses")

const proxyAdminAddr = "0x974dBC1348c5697e893FFd932681Cb48b5789fA8"

async function main() {
    const [deployer] = await ethers.getSigners()

    // const MVFVault = await ethers.getContractFactory("MVFVaultKovan", deployer)
    // const mvfVault = await MVFVault.deploy()
    // console.log(mvfVault.address)

    const mvfVaultArtifact = await artifacts.readArtifact("MVFVaultKovan")
    const mvfVaultInterface = new ethers.utils.Interface(mvfVaultArtifact.abi)
    const dataMVFVault = mvfVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L2 Metaverse-Farmer", "daoMVF",
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
            mainnet.biconomy, deployer.address
        ]
    )
    const MVFVaultProxy = await ethers.getContractFactory("MVFVaultProxy", deployer)
    const mvfVaultProxy = await MVFVaultProxy.deploy("0x364BF647549E81c6aF215Bbdd8DF2797d000db67", proxyAdminAddr, dataMVFVault)
    console.log(mvfVaultProxy.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
