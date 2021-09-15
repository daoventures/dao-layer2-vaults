const { ethers, upgrades } = require("hardhat")
const { mainnet } = require("../addresses")

const AXSETHVaultAddr = "0xcE097910Fc2DB329683353dcebF881A48cbA181e" // Sushi AXS-ETH vault (proxy) contract address
const SLPETHVaultAddr = "0x4aE61842Eb4E4634F533cb35B697a01319C457e2" // Sushi SLP-ETH vault (proxy) contract address
const ILVETHVaultAddr = "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e" // Sushi ILV-ETH vault (proxy) contract address
const GHSTETHVaultAddr = "0xF9b0707dEE34d36088A093d85b300A3B910E00fC" // Uniswap V3 GHST-ETH vault (proxy) contract address

const mvfStrategyImplAddr = ""
const mvfVaultImplAddr = ""
const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"

const mvfStrategyProxyAddr = ""
const mvfVaultProxyAddr = ""

async function main() {
    const [deployer] = await ethers.getSigners()

    const MVFStrategy = await ethers.getContractFactory("MVFStrategy", deployer)
    const mvfStrategy = await MVFStrategy.deploy()
    console.log(mvfStrategy.address)

    // const mvfStrategyArtifact = await artifacts.readArtifact("MVFStrategy")
    // const mvfStrategyInterface = new ethers.utils.Interface(mvfStrategyArtifact.abi)
    // const dataMVFStrategy = mvfStrategyInterface.encodeFunctionData(
    //     "initialize",
    //     [
    //         AXSETHVaultAddr, SLPETHVaultAddr, ILVETHVaultAddr, GHSTETHVaultAddr
    //     ]
    // )
    // const MVFStrategyProxy = await ethers.getContractFactory("MVFStrategyProxy", deployer)
    // const mvfStrategyProxy = await MVFStrategyProxy.deploy(mvfStrategyImplAddr, daoProxyAdminAddr, dataMVFStrategy)
    // console.log(mvfStrategyProxy.address)




    // const MVFVault = await ethers.getContractFactory("MVFVault", deployer)
    // const mvfVault = await MVFVault.deploy()
    // console.log(mvfVault.address)

    // const mvfVaultArtifact = await artifacts.readArtifact("MVFVault")
    // const mvfVaultInterface = new ethers.utils.Interface(mvfVaultArtifact.abi)
    // const dataMVFVault = mvfVaultInterface.encodeFunctionData(
    //     "initialize",
    //     [
    //         "DAO L2 Metaverse-Farmer", "daoMVF",
        //     mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
        //     mainnet.biconomy, mvfStrategyProxyAddr
    //     ]
    // )
    // const MVFVaultProxy = await ethers.getContractFactory("MVFVaultProxy", deployer)
    // const mvfVaultProxy = await MVFVaultProxy.deploy(mvfVaultImplAddr, daoProxyAdminAddr, dataMVFVault)
    // console.log(mvfVaultProxy.address)

    // const mvfStrategyProxy = await ethers.getContractAt("MVFStrategy", mvfStrategyProxyAddr)
    // await mvfStrategyProxy.setVault(mvfVaultProxyAddr)
    // console.log(await mvfStrategyProxy.vault())

















    // const MVFStrategy = await ethers.getContractFactory("MVFStrategy", deployer)
    // // const MVFStrategy = await ethers.getContractFactory("MVFStrategyKovan", deployer)
    // const mvfStrategy = await upgrades.deployProxy(MVFStrategy, [
    //     AXSETHVaultAddr, SLPETHVaultAddr, ILVETHVaultAddr, GHSTETHVaultAddr
    // ])
    // console.log('Metaverse-Farmer strategy (proxy) contract address:', mvfStrategy.address)

    // const MVFVault = await ethers.getContractFactory("MVFVault", deployer)
    // // const MVFVault = await ethers.getContractFactory("MVFVaultKovan", deployer)
    // const mvfVault = await upgrades.deployProxy(MVFVault, [
    //     "DAO L2 Metaverse-Farmer", "daoMVF",
    //     mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
    //     mainnet.biconomy, mvfStrategy.address
    // ])
    // await mvfStrategy.setVault(mvfVault.address)
    // console.log('Metaverse-Farmer vault (proxy) contract address:', mvfVault.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
