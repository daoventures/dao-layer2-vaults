const { ethers } = require("hardhat")

const USDTAVAXVaultAddr = "0xC7B70E07d64d575A3a7Cf8ea302d4A4652B8Bdd7"
const USDCAVAXVaultAddr = "0x6e3659ee054F1b3CE0c36D2c22D17728d317C742"
const DAIAVAXVaultAddr = "0xB9e0ab8C7690Eb9EcBF011c778FE2872c01A6339"

const treasuryAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
const communityAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
const adminAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"

const proxyAdminAddr = "0x29fBe3298569722Cfe26a122223Da1C0EC92829f"
const avaxStableVaultImplAddr = "0x6B28dbfa6703A836A1dB8409f7C977693ED218dE"

const main = async () => {
    const [deployer] = await ethers.getSigners()

    // Deploy Stablecoin-AVAX strategy
    // const StableAvaxStrategyFac = await ethers.getContractFactory("StableAvaxStrategy", deployer)
    const StableAvaxStrategyFac = await ethers.getContractFactory("StableAvaxStrategyKovan", deployer)
    const stableAvaxStrategyImpl = await StableAvaxStrategyFac.deploy()
    await stableAvaxStrategyImpl.deployTransaction.wait()
    console.log("DAO Avalanche Stablecoin-AVAX strategy (implementation) contract address:", stableAvaxStrategyImpl.address)

    // const stableAvaxStrategyArtifact = await artifacts.readArtifact("StableAvaxStrategy")
    const stableAvaxStrategyArtifact = await artifacts.readArtifact("StableAvaxStrategyKovan")
    const stableAvaxStrategyInterface = new ethers.utils.Interface(stableAvaxStrategyArtifact.abi)
    const dataStableAvaxStrategy = stableAvaxStrategyInterface.encodeFunctionData(
        "initialize",
        [USDTAVAXVaultAddr, USDCAVAXVaultAddr, DAIAVAXVaultAddr]
    )
    const StableAvaxStrategyProxy = await ethers.getContractFactory("AvaxProxy", deployer)
    const stableAvaxStrategyProxy = await StableAvaxStrategyProxy.deploy(
        stableAvaxStrategyImpl.address, proxyAdminAddr, dataStableAvaxStrategy,
    )
    await stableAvaxStrategyProxy.deployTransaction.wait()
    console.log("DAO Avalanche Stablecoin-AVAX strategy (proxy) contract address:", stableAvaxStrategyProxy.address)
    const stableAvaxStrategy = await ethers.getContractAt("StableAvaxStrategy", stableAvaxStrategyProxy.address, deployer)

    // Deploy Stablecoin-AVAX vault
    // const avaxStableVaultArtifact = await artifacts.readArtifact("AvaxStableVault")
    const avaxStableVaultArtifact = await artifacts.readArtifact("AvaxStableVaultKovan")
    const avaxStableVaultInterface = new ethers.utils.Interface(avaxStableVaultArtifact.abi)
    const dataAvaxStableVault = avaxStableVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L2 Avalanche Stable-AVAX", "daoASA",
            treasuryAddr, communityAddr, adminAddr, stableAvaxStrategy.address
        ]
    )
    const AvaxStableVaultProxy = await ethers.getContractFactory("AvaxProxy", deployer)
    const avaxStableVaultProxy = await AvaxStableVaultProxy.deploy(
        avaxStableVaultImplAddr, proxyAdminAddr, dataAvaxStableVault,
    )
    await avaxStableVaultProxy.deployTransaction.wait()
    // const avaxStableVault = await ethers.getContractAt("AvaxStableVault", avaxStableVaultProxy.address, deployer)
    const avaxStableVault = await ethers.getContractAt("AvaxStableVaultKovan", avaxStableVaultProxy.address, deployer)
    console.log("DAO Avalanche Stablecoin-AVAX vault (proxy) contract address:", avaxStableVault.address)

    tx = await stableAvaxStrategy.setVault(avaxStableVault.address)
    await tx.wait()
    console.log("Set vault successfully")

    // Set whitelist
    // const USDTAVAXVault = await ethers.getContractAt("AvaxVaultL1", USDTAVAXVaultAddr, deployer)
    const USDTAVAXVault = await ethers.getContractAt("AvaxVaultL1Kovan", USDTAVAXVaultAddr, deployer)
    tx = await USDTAVAXVault.setWhitelistAddress(stableAvaxStrategy.address, true)
    await tx.wait()
    // const USDCAVAXVault = await ethers.getContractAt("AvaxVaultL1", USDCAVAXVaultAddr, deployer)
    const USDCAVAXVault = await ethers.getContractAt("AvaxVaultL1Kovan", USDCAVAXVaultAddr, deployer)
    tx = await USDCAVAXVault.setWhitelistAddress(stableAvaxStrategy.address, true)
    await tx.wait()
    // const DAIAVAXVault = await ethers.getContractAt("AvaxVaultL1", DAIAVAXVaultAddr, deployer)
    const DAIAVAXVault = await ethers.getContractAt("AvaxVaultL1Kovan", DAIAVAXVaultAddr, deployer)
    tx = await DAIAVAXVault.setWhitelistAddress(stableAvaxStrategy.address, true)
    await tx.wait()
    console.log("Set whitelist successfully")
}
main()
