const { ethers } = require("hardhat")
const { mainnet } = require("../addresses")

const curveFactoryAddr = "0x084F149E5B293eB0244fBEc1B4Ed76a56a498134"

async function main() {
    let tx
    const [deployer] = await ethers.getSigners()

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    const curveVaultArtifact = await artifacts.readArtifact("Curve")
    // const curveVaultArtifact = await artifacts.readArtifact("CurveKovan")
    const curveVaultInterface = new ethers.utils.Interface(curveVaultArtifact.abi)
    const dataHBTCWBTC = curveVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 Curve HBTC-WBTC", "daoCurveHBTC", 8,
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const curveFactory = await ethers.getContractAt("CurveFactory", curveFactoryAddr, deployer)
    tx = await curveFactory.createVault(dataHBTCWBTC, {gasLimit: 762000})
    await tx.wait()
    const HBTCWBTCVaultAddr = await curveFactory.getVault((await curveFactory.getVaultLength()).sub(1))
    const HBTCWBTCVault = await ethers.getContractAt("Curve", HBTCWBTCVaultAddr, deployer)
    console.log("Curve HBTC-WBTC vault (proxy) contract address:", HBTCWBTCVaultAddr)

    // Deploy Curve zap
    const CurveZap = await ethers.getContractFactory("CurveHBTCZapKovan", deployer)
    const curveZap = await CurveZap.deploy(HBTCWBTCVaultAddr,  {gasLimit: 900100})
    await curveZap.deployTransaction.wait()
    console.log("Curve HBTC Zap contract address:", curveZap.address)
    
    tx = await HBTCWBTCVault.setCurveZap(curveZap.address)
    await tx.wait()
    console.log("Curve HBTC Zap had set successfully into Curve HBTC-WBTC vault")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })