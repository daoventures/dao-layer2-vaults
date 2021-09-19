const { ethers } = require("hardhat")

async function main() {
    const [deployer] = await ethers.getSigners()

    const CurveVault = await ethers.getContractFactory("Curve", deployer)
    // const CurveVault = await ethers.getContractFactory("CurveKovan", deployer)
    const curveVault = await CurveVault.deploy({gasLimit: 3900000})
    await curveVault.deployTransaction.wait()
    console.log("Curve vault (implementation) contract address:", curveVault.address)
    
    const CurveFactory = await ethers.getContractFactory("CurveFactory", deployer)
    const curveFactory = await CurveFactory.deploy(curveVault.address, {gasLimit: 1500000})
    await curveFactory.deployTransaction.wait()
    console.log("Curve factory contract address:", curveFactory.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })