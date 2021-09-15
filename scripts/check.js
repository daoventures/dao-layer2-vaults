const { ethers } = require('hardhat')

const contractAddr = "0x4BDf436712dA82ABaBE5f5d29218548d47B92166"
const contractName = "ILVETHVaultKovan"

async function main() {
    const [deployer] = await ethers.getSigners()
    const contract = await ethers.getContractAt(contractName, contractAddr, deployer)
    // console.log(contract.address)
    // console.log(await contract.name())
    // console.log(await contract.symbol())
    console.log(await contract.admin())
    // console.log(await contract.implementation())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })