const { ethers } = require("hardhat")

const AXSETHProxyAddr = "0xcE097910Fc2DB329683353dcebF881A48cbA181e"
const SLPETHProxyAddr = "0x4aE61842Eb4E4634F533cb35B697a01319C457e2"
const GHSTETHProxyAddr = "0xF9b0707dEE34d36088A093d85b300A3B910E00fC"
const ILVETHProxyAddr = "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e"

async function main() {
    let tx, receipt
    const [deployer] = await ethers.getSigners()

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    const AXSETHProxyContract = await ethers.getContractAt("Sushi", AXSETHProxyAddr, deployer)
    tx = await AXSETHProxyContract.invest()
    receipt = await tx.wait()
    console.log("Successfully called invest function for AXSETHVault at", receipt.transactionHash)

    const SLPETHProxyContract = await ethers.getContractAt("Sushi", SLPETHProxyAddr, deployer)
    tx = await SLPETHProxyContract.invest()
    receipt = await tx.wait()
    console.log("Successfully called invest function for SLPETHVault at", receipt.transactionHash)

    // ILVETH vault can call through MetaMask with Eden network
    // const ILVETHProxyContract = await ethers.getContractAt("ILVETHVault", ILVETHProxyAddr, deployer)
    // await ILVETHProxyContract.invest()

    // Uniswap V3 vault has no invest function
    // const GHSTETHProxyContract = await ethers.getContractAt("UniswapV3", GHSTETHProxyAddr, deployer)
    // await GHSTETHProxyContract.invest()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })