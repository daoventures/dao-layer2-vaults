const { ethers } = require("hardhat")
const { mainnet } = require("../addresses")

const curveFactoryAddr = "0x0A04D6F6350151996C4d61169a8932407E64dDaf"

async function main() {
    const [deployer] = await ethers.getSigners()

    // const curveVaultArtifact = await artifacts.readArtifact("Curve")
    const curveVaultArtifact = await artifacts.readArtifact("CurveKovan")
    const curveVaultInterface = new ethers.utils.Interface(curveVaultArtifact.abi)
    const dataHBTCWBTC = curveVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 Curve HBTC-WBTC", "daoCurveHBTC", 8,
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const curveFactory = await ethers.getContractAt("CurveFactory", curveFactoryAddr, deployer)
    const tx = await curveFactory.createVault(dataHBTCWBTC)
    await tx.wait()
    const HBTCWBTCVaultAddr = await curveFactory.getVault((await curveFactory.getVaultLength()).sub(1))
    const HBTCWBTCVault = await ethers.getContractAt("Curve", HBTCWBTCVaultAddr, deployer)

    console.log("Curve HBTC-WBTC vault (proxy) contract address:", HBTCWBTCVaultAddr)

    // Deploy Curve zap
    const CurveZap = await ethers.getContractFactory("CurveHBTCZapKovan", deployer)
    const curveZap = await CurveZap.deploy(HBTCWBTCVaultAddr)
    await HBTCWBTCVault.setCurveZap(curveZap.address)

    console.log("Curve HBTC Zap contract address:", curveZap.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })