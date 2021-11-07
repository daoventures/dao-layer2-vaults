const { ethers } = require("hardhat")
require("dotenv").config()

const AXSETHVaultAddr = "0xcE097910Fc2DB329683353dcebF881A48cbA181e"
const SLPETHVaultAddr = "0x4aE61842Eb4E4634F533cb35B697a01319C457e2"
const ILVVaultAddr = "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e"

async function main() {
    let tx
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)
    // const [me] = await ethers.getSigners()
    // await me.sendTransaction({to: deployer.address, value: ethers.utils.parseEther("10")})

    const AXSETHVault = await ethers.getContractAt("Sushi", AXSETHVaultAddr, deployer)
    tx = await AXSETHVault.yield()
    await tx.wait()
    console.log("Success call yield for DAO L1 Sushi AXS-ETH vault contract")

    const SLPETHVault = await ethers.getContractAt("Sushi", SLPETHVaultAddr, deployer)
    tx = await SLPETHVault.yield()
    await tx.wait()
    console.log("Success call yield for DAO L1 Sushi SLP-ETH vault contract")

    const ILVVault = await ethers.getContractAt("ILVETHVault", ILVVaultAddr, deployer)
    tx = await ILVVault.harvest()
    await tx.wait()
    console.log("Success call yield for DAO L1 Sushi ILV-ETH vault contract")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })