const { ethers, network } = require("hardhat")
const { mainnet, kovan } = require("../addresses")

const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"
const stonksStrategyProxyAddr = ""

async function main() {
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)

    const StonksVault = await ethers.getContractFactory("StonksVault", deployer)
    // const StonksVault = await ethers.getContractFactory("StonksVaultKovan", deployer)
    const stonksVault = await StonksVault.deploy()
    await stonksVault.deployTransaction.wait()
    console.log("DAO Stonks V2 vault (implementation) contract address:", stonksVault.address)

    const stonksVaultArtifact = await artifacts.readArtifact("StonksVault")
    // const stonksVaultArtifact = await artifacts.readArtifact("StonksVaultKovan")
    const stonksVaultInterface = new ethers.utils.Interface(stonksVaultArtifact.abi)
    const dataStonksVault = stonksVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L2 Stonks V2", "daoSTO2",
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
            mainnet.biconomy, stonksStrategyProxyAddr
        ]
    )
    const StonksVaultProxy = await ethers.getContractFactory("StonksProxy", deployer)
    const stonksVaultProxy = await StonksVaultProxy.deploy(stonksVault.address, daoProxyAdminAddr, dataStonksVault)
    await stonksVaultProxy.deployTransaction.wait()
    console.log("DAO Stonks V2 vault (proxy) contract address:", stonksVaultProxy.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })