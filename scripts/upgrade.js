const { ethers, upgrades } = require("hardhat")

const proxyAdminAddr = "0x0A25131608AbAeCA03AE160efAAFb008dd34a4ab"
const mvfVaultProxy = "0xc11156425Cf89fec05f04F6c748D39BCBf56aFA5"

async function main() {
    const [deployer] = await ethers.getSigners()

    const MVFVault = await ethers.getContractFactory("MVFVault")
    const MVFVault = await ethers.getContractFactory("MVFVaultKovan")
    const mvfVault = await MVFVault.deploy()
    await mvfVault.deployTransaction.wait()
    console.log("New implementation contract for MVFVault:", mvfVault.address)

    // const MVFVault = await ethers.getContractFactory("MVFVaultKovan", deployer);
    // await upgrades.upgradeProxy(mvfVaultProxy, MVFVault);
    // console.log("MVFVault upgraded");

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)
    await proxyAdmin.upgradeTo(mvfVaultProxy, mvfVault.address)
    console.log("MVFVault upgraded successfully")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })