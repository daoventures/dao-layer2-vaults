const { ethers } = require("hardhat")

const JOEUSDCVaultAddr = "0xD94F6CFb3C1b6ADe800a0E169eA132d0417c633e"
const PNGUSDTVaultAddr = "0x5BE1Ec837c902f63BeB9D9dcCDf4E587bcfFD066"
const LYDDAIVaultAddr = "0x42f13B9566Df544aF34fE1b8c645aB16E908598f"

const treasuryAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
const communityAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
const adminAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"

const proxyAdminAddr = "0x29fBe3298569722Cfe26a122223Da1C0EC92829f"
const avaxStableVaultImplAddr = "0x6B28dbfa6703A836A1dB8409f7C977693ED218dE"

const main = async () => {
    const [deployer] = await ethers.getSigners()

    // Deploy DeXToken-Stablecon strategy
    // const DeXStableStrategyFac = await ethers.getContractFactory("DeXStableStrategy", deployer)
    const DeXStableStrategyFac = await ethers.getContractFactory("DeXStableStrategyKovan", deployer)
    const deXStableStrategyImpl = await DeXStableStrategyFac.deploy()
    await deXStableStrategyImpl.deployTransaction.wait()
    console.log("DAO Avalanche DeXToken-Stablecoin strategy (implementation) contract address:", deXStableStrategyImpl.address)

    // const deXStableStrategyArtifact = await artifacts.readArtifact("DeXStableStrategy")
    const deXStableStrategyArtifact = await artifacts.readArtifact("DeXStableStrategyKovan")
    const deXStableStrategyInterface = new ethers.utils.Interface(deXStableStrategyArtifact.abi)
    const dataDeXStableStrategy = deXStableStrategyInterface.encodeFunctionData(
        "initialize",
        [JOEUSDCVaultAddr, PNGUSDTVaultAddr, LYDDAIVaultAddr]
    )
    const DeXStableStrategyProxy = await ethers.getContractFactory("AvaxProxy", deployer)
    const deXStableStrategyProxy = await DeXStableStrategyProxy.deploy(
        deXStableStrategyImpl.address, proxyAdminAddr, dataDeXStableStrategy,
    )
    await deXStableStrategyProxy.deployTransaction.wait()
    console.log("DAO Avalanche DeXToken-Stablecoin strategy (proxy) contract address:", deXStableStrategyProxy.address)
    const deXStableStrategy = await ethers.getContractAt("DeXStableStrategy", deXStableStrategyProxy.address, deployer)

    // Deploy DeXToken-Stablecon vault
    // const avaxStableVaultArtifact = await artifacts.readArtifact("AvaxStableVault")
    const avaxStableVaultArtifact = await artifacts.readArtifact("AvaxStableVaultKovan")
    const avaxStableVaultInterface = new ethers.utils.Interface(avaxStableVaultArtifact.abi)
    const dataAvaxStableVault = avaxStableVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L2 Avalanche DeX-Stable", "daoAXS",
            treasuryAddr, communityAddr, adminAddr, deXStableStrategy.address
        ]
    )
    const AvaxStableVaultProxy = await ethers.getContractFactory("AvaxProxy", deployer)
    const avaxStableVaultProxy = await AvaxStableVaultProxy.deploy(
        avaxStableVaultImplAddr, proxyAdminAddr, dataAvaxStableVault,
    )
    await avaxStableVaultProxy.deployTransaction.wait()
    // const avaxStableVault = await ethers.getContractAt("AvaxStableVault", avaxStableVaultProxy.address, deployer)
    const avaxStableVault = await ethers.getContractAt("AvaxStableVaultKovan", avaxStableVaultProxy.address, deployer)
    console.log("DAO Avalanche DeXToken-Stablecoin vault (proxy) contract address:", avaxStableVault.address)

    tx = await deXStableStrategy.setVault(avaxStableVault.address)
    await tx.wait()
    console.log("Set vault successfully")

    // Set whitelist
    // const JOEUSDCVault = await ethers.getContractAt("AvaxVaultL1", JOEUSDCVaultAddr, deployer)
    const JOEUSDCVault = await ethers.getContractAt("AvaxVaultL1Kovan", JOEUSDCVaultAddr, deployer)
    tx = await JOEUSDCVault.setWhitelistAddress(deXStableStrategy.address, true)
    await tx.wait()
    // const PNGUSDTVault = await ethers.getContractAt("AvaxVaultL1", PNGUSDTVaultAddr, deployer)
    const PNGUSDTVault = await ethers.getContractAt("AvaxVaultL1Kovan", PNGUSDTVaultAddr, deployer)
    tx = await PNGUSDTVault.setWhitelistAddress(deXStableStrategy.address, true)
    await tx.wait()
    // const LYDDAIVault = await ethers.getContractAt("AvaxVaultL1", LYDDAIVaultAddr, deployer)
    const LYDDAIVault = await ethers.getContractAt("AvaxVaultL1Kovan", LYDDAIVaultAddr, deployer)
    tx = await LYDDAIVault.setWhitelistAddress(deXStableStrategy.address, true)
    await tx.wait()
    console.log("Set whitelist successfully")
}
main()
