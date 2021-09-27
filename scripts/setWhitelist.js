const { ethers } = require("hardhat")

const AXSETHProxyAddr = "0xcE097910Fc2DB329683353dcebF881A48cbA181e"
const SLPETHProxyAddr = "0x4aE61842Eb4E4634F533cb35B697a01319C457e2"
const GHSTETHProxyAddr = "0xF9b0707dEE34d36088A093d85b300A3B910E00fC"
const ILVETHProxyAddr = "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e"

const MVFStrategyProxyAddr = "0xfa83CA66FDaCC4028DAB383de4adc8aB7DB21FF2"

async function main() {
    let tx;
    const [deployer] = await ethers.getSigners()

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    const AXSETHProxyContract = await ethers.getContractAt("Sushi", AXSETHProxyAddr, deployer)
    tx = await AXSETHProxyContract.setWhitelistAddress(MVFStrategyProxyAddr, true, {gasLimit: 70400})
    await tx.wait()
    console.log("AXSETH:", await AXSETHProxyContract.isWhitelisted(MVFStrategyProxyAddr))

    const SLPETHProxyContract = await ethers.getContractAt("Sushi", SLPETHProxyAddr, deployer)
    tx = await SLPETHProxyContract.setWhitelistAddress(MVFStrategyProxyAddr, true, {gasLimit: 70400})
    await tx.wait()
    console.log("SLPETH:", await SLPETHProxyContract.isWhitelisted(MVFStrategyProxyAddr))

    const GHSTETHProxyContract = await ethers.getContractAt("Sushi", GHSTETHProxyAddr, deployer)
    tx = await GHSTETHProxyContract.setWhitelistAddress(MVFStrategyProxyAddr, true, {gasLimit: 70400})
    await tx.wait()
    console.log("GHSTETH:", await GHSTETHProxyContract.isWhitelisted(MVFStrategyProxyAddr))

    const ILVETHProxyContract = await ethers.getContractAt("Sushi", ILVETHProxyAddr, deployer)
    tx = await ILVETHProxyContract.setWhitelistAddress(MVFStrategyProxyAddr, true, {gasLimit: 70400})
    await tx.wait()
    console.log("ILVETH:", await ILVETHProxyContract.isWhitelisted(MVFStrategyProxyAddr))
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })