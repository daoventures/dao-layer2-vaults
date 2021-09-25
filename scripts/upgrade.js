const { ethers } = require("hardhat")

const proxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f"
const contractProxyAddr = "0x7739933d775BF2eD5EAEC76BC61c581A82e25b0c"
const contractName = "StonksVaultKovan"

async function main() {
    const [deployer] = await ethers.getSigners()

    const Contract = await ethers.getContractFactory(contractName)
    const contract = await Contract.deploy()
    await contract.deployTransaction.wait()
    console.log("New implementation contract for Contract:", contract.address)

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)
    await proxyAdmin.upgrade(contractProxyAddr, contract.address)
    console.log("Contract upgraded successfully")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })