const { ethers, tasks } = require("hardhat")

const JOEAVAXVaultAddr = "0x4b77AB80C2822A94fF82C319D2893b35C9a36fEE"
const PNGAVAXVaultAddr = "0x60f512aAE69075dA29b06D0E0aE6756De1Ce796e"
const LYDAVAXVaultAddr = "0x3e9C0F4E19D3AEf72DC5529fF0344AA0D3275328"

const treasuryAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
const communityAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
const adminAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"

const proxyAdminAddr = "0x29fBe3298569722Cfe26a122223Da1C0EC92829f"
const avaxVaultImplAddr = "0x6B28dbfa6703A836A1dB8409f7C977693ED218dE"

const main = async () => {
    const [deployer] = await ethers.getSigners()

    // Deploy DeX-Avax strategy
    // const DeXAvaxStrategyFac = await ethers.getContractFactory("DeXAvaxStrategy", deployer)
    const DeXAvaxStrategyFac = await ethers.getContractFactory("DeXAvaxStrategyKovan", deployer)
    const deXAvaxStrategyImpl = await DeXAvaxStrategyFac.deploy()
    await deXAvaxStrategyImpl.deployTransaction.wait()
    console.log("DAO Avalanche DeXToken-AVAX strategy (implementation) contract address:", deXAvaxStrategyImpl.address)

    // const deXAvaxStrategyArtifact = await artifacts.readArtifact("DeXAvaxStrategy")
    const deXAvaxStrategyArtifact = await artifacts.readArtifact("DeXAvaxStrategyKovan")
    const deXAvaxStrategyInterface = new ethers.utils.Interface(deXAvaxStrategyArtifact.abi)
    const dataDeXAvaxStrategy = deXAvaxStrategyInterface.encodeFunctionData(
        "initialize",
        [JOEAVAXVaultAddr, PNGAVAXVaultAddr, LYDAVAXVaultAddr]
    )
    const DeXAvaxStrategyProxy = await ethers.getContractFactory("AvaxProxy", deployer)
    const deXAvaxStrategyProxy = await DeXAvaxStrategyProxy.deploy(
        deXAvaxStrategyImpl.address, proxyAdminAddr, dataDeXAvaxStrategy,
    )
    await deXAvaxStrategyProxy.deployTransaction.wait()
    console.log("DAO Avalanche DeXToken-AVAX strategy (proxy) contract address:", deXAvaxStrategyProxy.address)
    const deXAvaxStrategy = await ethers.getContractAt("DeXAvaxStrategy", deXAvaxStrategyProxy.address, deployer)

    // Deploy DeX-Avax vault
    // const avaxVaultArtifact = await artifacts.readArtifact("AvaxVault")
    const avaxVaultArtifact = await artifacts.readArtifact("AvaxVaultKovan")
    const avaxVaultInterface = new ethers.utils.Interface(avaxVaultArtifact.abi)
    const dataAvaxVault = avaxVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L2 Avalanche DeX-AVAX", "daoAXA",
            treasuryAddr, communityAddr, adminAddr, deXAvaxStrategy.address
        ]
    )
    const AvaxVaultProxy = await ethers.getContractFactory("AvaxProxy", deployer)
    const avaxVaultProxy = await AvaxVaultProxy.deploy(
        avaxVaultImplAddr, proxyAdminAddr, dataAvaxVault,
    )
    await avaxVaultProxy.deployTransaction.wait()
    // const avaxVault = await ethers.getContractAt("AvaxVault", avaxVaultProxy.address, deployer)
    const avaxVault = await ethers.getContractAt("AvaxVaultKovan", avaxVaultProxy.address, deployer)
    console.log("DAO Avalanche DeXToken-AVAX vault (proxy) contract address:", avaxVault.address)

    tx = await deXAvaxStrategy.setVault(avaxVault.address)
    await tx.wait()
    console.log("Set vault successfully")

    // Set whitelist
    // const JOEAVAXVault = await ethers.getContractAt("AvaxVaultL1", JOEAVAXVaultAddr, deployer)
    const JOEAVAXVault = await ethers.getContractAt("AvaxVaultL1Kovan", JOEAVAXVaultAddr, deployer)
    tx = await JOEAVAXVault.setWhitelistAddress(deXAvaxStrategy.address, true)
    await tx.wait()
    // const PNGAVAXVault = await ethers.getContractAt("AvaxVaultL1", PNGAVAXVaultAddr, deployer)
    const PNGAVAXVault = await ethers.getContractAt("AvaxVaultL1Kovan", PNGAVAXVaultAddr, deployer)
    tx = await PNGAVAXVault.setWhitelistAddress(deXAvaxStrategy.address, true)
    await tx.wait()
    // const LYDAVAXVault = await ethers.getContractAt("AvaxVaultL1", LYDAVAXVaultAddr, deployer)
    const LYDAVAXVault = await ethers.getContractAt("AvaxVaultL1Kovan", LYDAVAXVaultAddr, deployer)
    tx = await LYDAVAXVault.setWhitelistAddress(deXAvaxStrategy.address, true)
    await tx.wait()
    console.log("Set whitelist successfully")
}
main()
