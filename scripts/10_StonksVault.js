const { ethers, network } = require("hardhat")
const { mainnet, kovan } = require("../addresses")

const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan
const stonksStrategyProxyAddr = "0xA8a3b0412A25C1183DFcFed6dc7b6aCd584A6383" // Kovan

async function main() {
    const [deployer] = await ethers.getSigners()

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    // const StonksVault = await ethers.getContractFactory("StonksVault", deployer)
    const StonksVault = await ethers.getContractFactory("StonksVaultKovan", deployer)
    const stonksVault = await StonksVault.deploy()
    await stonksVault.deployTransaction.wait()
    console.log("DAO Stonks V2 vault (implementation) contract address:", stonksVault.address)

    // const stonksVaultArtifact = await artifacts.readArtifact("StonksVault")
    const stonksVaultArtifact = await artifacts.readArtifact("StonksVaultKovan")
    const stonksVaultInterface = new ethers.utils.Interface(stonksVaultArtifact.abi)
    const dataStonksVault = stonksVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L2 Stonks V2", "daoSTO2",
            // mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
            // mainnet.biconomy, stonksStrategyProxyAddr
            kovan.treasury, kovan.community, kovan.strategist, kovan.admin,
            kovan.biconomy, stonksStrategyProxyAddr
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