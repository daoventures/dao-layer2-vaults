const { ethers } = require("hardhat")

const proxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f"
const citadelV2VaultProxyAddr = "0x6435B8fc860381A7088ccD745FC73F5c844e8Bad"

async function main() {
    const [deployer] = await ethers.getSigners()

    // const CitadelV2Vault = await ethers.getContractFactory("CitadelV2Vault")
    const CitadelV2Vault = await ethers.getContractFactory("CitadelV2VaultKovan")
    const citadelV2Vault = await CitadelV2Vault.deploy()
    await citadelV2Vault.deployTransaction.wait()
    console.log("New implementation contract for CitadelV2Vault:", citadelV2Vault.address)

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)
    await proxyAdmin.upgrade(citadelV2VaultProxyAddr, citadelV2Vault.address)
    console.log("CitadelV2Vault upgraded successfully")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })