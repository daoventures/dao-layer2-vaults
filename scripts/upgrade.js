const { ethers } = require("hardhat")

const proxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan
const taVaultProxyAddr = "0xb72B89Fa6D222973379cbd9c5C88768e3a050Aed" // Kovan

async function main() {
    const [deployer] = await ethers.getSigners()

    // const TAVault = await ethers.getContractFactory("TAVault")
    const TAVault = await ethers.getContractFactory("TAVaultKovan")
    const taVault = await TAVault.deploy()
    await taVault.deployTransaction.wait()
    console.log("New implementation contract for TAVault:", taVault.address)

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)
    await proxyAdmin.upgrade(taVaultProxyAddr, taVault.address)
    console.log("TAVault upgraded successfully")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })