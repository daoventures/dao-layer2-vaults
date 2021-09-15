const { ethers, upgrades } = require("hardhat")

const proxyAdminAddr = "0x974dBC1348c5697e893FFd932681Cb48b5789fA8"
const mvfVaultProxyAddr = "0xcBb69E3621ce4EB0d99B60f0E0430dCD5f52fC95"

async function main() {
    const [deployer] = await ethers.getSigners()

    // const MVFVault = await ethers.getContractFactory("MVFVault")
    const MVFVault = await ethers.getContractFactory("MVFVaultKovan")
    const mvfVault = await MVFVault.deploy()
    await mvfVault.deployTransaction.wait()
    console.log("New implementation contract for MVFVault:", mvfVault.address)

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)
    await proxyAdmin.upgrade(mvfVaultProxyAddr, mvfVault.address)
    console.log("MVFVault upgraded successfully")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })