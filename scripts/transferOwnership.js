const { ethers } = require("hardhat")

const AXSETHProxyAddr = "0xcE097910Fc2DB329683353dcebF881A48cbA181e"
const SLPETHProxyAddr = "0x4aE61842Eb4E4634F533cb35B697a01319C457e2"
const GHSTETHProxyAddr = "0xF9b0707dEE34d36088A093d85b300A3B910E00fC"

const multiSigAddr = "0x59E83877bD248cBFe392dbB5A8a29959bcb48592"

async function main() {
    let tx;
    const [deployer] = await ethers.getSigners()

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    const AXSETHProxyContract = await ethers.getContractAt("Sushi", AXSETHProxyAddr, deployer)
    tx = await AXSETHProxyContract.transferOwnership(multiSigAddr, {gasLimit: 46600})
    await tx.wait()
    console.log("AXSETH:", await AXSETHProxyContract.owner())

    const SLPETHProxyContract = await ethers.getContractAt("Sushi", SLPETHProxyAddr, deployer)
    tx = await SLPETHProxyContract.transferOwnership(multiSigAddr, {gasLimit: 46600})
    await tx.wait()
    console.log("SLPETH:", await SLPETHProxyContract.owner())

    const GHSTETHProxyContract = await ethers.getContractAt("UniswapV3", GHSTETHProxyAddr, deployer)
    tx = await GHSTETHProxyContract.transferOwnership(multiSigAddr, {gasLimit: 46600})
    await tx.wait()
    console.log("GHSTETH:", await GHSTETHProxyContract.owner())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })