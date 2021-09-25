const { ethers } = require("hardhat")

async function main() {
    const [deployer] = await ethers.getSigners()

    const curveZap = await ethers.getContractAt("CurveHBTCZap", "0x12922b9b65A13331554C9dDDC2D19C9ec06fA47F", deployer)
    console.log(await curveZap.vault())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })