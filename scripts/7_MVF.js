const { ethers } = require("hardhat")
const { mainnet, kovan } = require("../addresses")

// const AXSETHVaultAddr = "0xcE097910Fc2DB329683353dcebF881A48cbA181e" // Sushi AXS-ETH vault (proxy) contract address
// const SLPETHVaultAddr = "0x4aE61842Eb4E4634F533cb35B697a01319C457e2" // Sushi SLP-ETH vault (proxy) contract address
// const ILVETHVaultAddr = "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e" // Sushi ILV-ETH vault (proxy) contract address
// const GHSTETHVaultAddr = "0xF9b0707dEE34d36088A093d85b300A3B910E00fC" // Uniswap V3 GHST-ETH vault (proxy) contract address

// Kovan
const AXSETHVaultAddr = "0x6A4EfC6Ab4792Fc8DCd5A488791CBDD45675d239"
const SLPETHVaultAddr = "0x777d14f93166FA67e9cd6b869bd0F87F45FdC497"
const ILVETHVaultAddr = "0x4Ba84ba0e07a30Bdde5E73aB8f94959b7ce1f7EF"
const GHSTETHVaultAddr = "0x8C2bf8B337A7dc91660DD7783f9A4EFCEcC7bf65"
const daoProxyAdminAddr = "0x0A25131608AbAeCA03AE160efAAFb008dd34a4ab"

// const mvfStrategyImplAddr = ""
// const mvfVaultImplAddr = ""
// const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"

// const mvfStrategyProxyAddr = "0xfa83CA66FDaCC4028DAB383de4adc8aB7DB21FF2"
// const mvfVaultProxyAddr = ""

async function main() {
    const [deployer] = await ethers.getSigners()

    // const MVFStrategy = await ethers.getContractFactory("MVFStrategy", deployer)
    const MVFStrategyImpl = await ethers.getContractFactory("MVFStrategyKovan", deployer)
    const mvfStrategyImpl = await MVFStrategyImpl.deploy()
    await mvfStrategyImpl.deployTransaction.wait()
    console.log("Metaverse-Farmer strategy (implementation) contract address:", mvfStrategyImpl.address)

    // const mvfStrategyArtifact = await artifacts.readArtifact("MVFStrategy")
    const mvfStrategyArtifact = await artifacts.readArtifact("MVFStrategyKovan")
    const mvfStrategyInterface = new ethers.utils.Interface(mvfStrategyArtifact.abi)
    const dataMVFStrategy = mvfStrategyInterface.encodeFunctionData(
        "initialize",
        [
            AXSETHVaultAddr, SLPETHVaultAddr, ILVETHVaultAddr, GHSTETHVaultAddr
        ]
    )
    const MVFStrategyProxy = await ethers.getContractFactory("MVFStrategyProxy", deployer)
    const mvfStrategyProxy = await MVFStrategyProxy.deploy(mvfStrategyImpl.address, daoProxyAdminAddr, dataMVFStrategy)
    await mvfStrategyProxy.deployTransaction.wait()
    console.log("Metaverse-Farmer strategy (proxy) contract address:", mvfStrategyProxy.address)

    // const MVFVault = await ethers.getContractFactory("MVFVault", deployer)
    const MVFVaultImpl = await ethers.getContractFactory("MVFVaultKovan", deployer)
    const mvfVaultImpl = await MVFVaultImpl.deploy()
    await mvfVaultImpl.deployTransaction.wait()
    console.log("Metaverse-Farmer vault (implementation) contract address:", mvfVaultImpl.address)

    // const mvfVaultArtifact = await artifacts.readArtifact("MVFVault")
    const mvfVaultArtifact = await artifacts.readArtifact("MVFVaultKovan")
    const mvfVaultInterface = new ethers.utils.Interface(mvfVaultArtifact.abi)
    const dataMVFVault = mvfVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L2 Metaverse-Farmer", "daoMVF",
            // mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
            // mainnet.biconomy, mvfStrategyProxyAddr
            kovan.treasury, kovan.community, kovan.strategist, kovan.admin,
            kovan.biconomy, mvfStrategyProxy.address
        ]
    )
    const MVFVaultProxy = await ethers.getContractFactory("MVFVaultProxy", deployer)
    const mvfVaultProxy = await MVFVaultProxy.deploy(mvfVaultImpl.address, daoProxyAdminAddr, dataMVFVault)
    await mvfVaultProxy.deployTransaction.wait()
    console.log("Metaverse-Farmer vault (proxy) contract address:", mvfVaultProxy.address)

    // const mvfStrategyProxy = await ethers.getContractAt("MVFStrategy", mvfStrategyProxyAddr, deployer)
    const mvfStrategy = await ethers.getContractAt("MVFStrategyKovan", mvfStrategyProxy.address, deployer)
    await mvfStrategy.setVault(mvfVaultProxy.address)
    console.log("Vault contract address for MVF strategy:", await mvfStrategy.vault())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
