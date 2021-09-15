const { ethers, upgrades } = require("hardhat")
const { mainnet } = require("../addresses")

const ILVETHVaultImplAddr = "0x7422e91c420910B086126000b950DA11bfeda266"
const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"

async function main() {
    const [deployer] = await ethers.getSigners()

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    // const DAOProxyAdmin = await ethers.getContractFactory("DAOProxyAdmin", deployer)
    // const daoProxyAdmin = await DAOProxyAdmin.deploy()
    // console.log("DAO proxy admin contract address:", daoProxyAdmin.address)

    const ILVETHVaultArtifact = await artifacts.readArtifact("ILVETHVault")
    const ILVETHVaultInterface = new ethers.utils.Interface(ILVETHVaultArtifact.abi)
    const dataILVETH = ILVETHVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 Sushi ILV-ETH", "daoSushiILV",
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const ILVETHVaultProxy = await ethers.getContractFactory("ILVETHVaultProxy", deployer)
    const ilvEthVaultProxy = await ILVETHVaultProxy.deploy(ILVETHVaultImplAddr, daoProxyAdminAddr, dataILVETH)
    console.log("Sushi ILV-ETH vault (proxy) contract address:", ilvEthVaultProxy.address)











    // const ILVETHVaultFactory = await ethers.getContractFactory("ILVETHVault", deployer)
    // // const ILVETHVaultFactory = await ethers.getContractFactory("ILVETHVaultKovan", deployer)
    //     const ILVETHVault = await upgrades.deployProxy(ILVETHVaultFactory, [
    //         "DAO L1 Sushi ILV-ETH", "daoSushiILV",
    //         mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
    //     ])
    //     await ILVETHVault.deployed()

    // console.log("Sushi ILV-ETH vault (proxy) contract address:", ILVETHVault.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })