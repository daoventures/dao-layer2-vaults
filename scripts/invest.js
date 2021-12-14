const { ethers } = require("hardhat")

const AXSETHProxyAddr = "0xcE097910Fc2DB329683353dcebF881A48cbA181e"
const MANAETHProxyAddr = "0x5eF6d1CEfdd8Cff9945fA72CC065185758690A69"
const ILVETHProxyAddr = "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e"

async function main() {
    let tx, receipt
    const [deployer] = await ethers.getSigners()

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    const AXSETHProxyContract = await ethers.getContractAt("Sushi", AXSETHProxyAddr, deployer)
    tx = await AXSETHProxyContract.invest({gasLimit: 210000})
    receipt = await tx.wait()
    console.log("Successfully called invest function for AXSETHVault at", receipt.transactionHash)

    const MANAETHProxyContract = await ethers.getContractAt("Sushi", MANAETHProxyAddr, deployer)
    tx = await MANAETHProxyContract.invest({gasLimit: 210000})
    receipt = await tx.wait()
    console.log("Successfully called invest function for MANAETHVault at", receipt.transactionHash)

    // ILVETH vault can call through MetaMask with Eden/Flashbot network
    // const ILVETHProxyContract = await ethers.getContractAt("ILVETHVault", ILVETHProxyAddr, deployer)
    // await ILVETHProxyContract.invest()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
