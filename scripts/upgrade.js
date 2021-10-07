const { ethers } = require("hardhat")

const proxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan
const taStrategyProxyAddr = "0xfd2f8DB43Bcd7817Bc6CD83A3Bbf18DBE8227E55" // Kovan

async function main() {
    const [deployer] = await ethers.getSigners()

    // const TAStrategy = await ethers.getContractFactory("TAStrategy")
    const TAStrategy = await ethers.getContractFactory("TAStrategyKovan")
    const taStrategy = await TAStrategy.deploy()
    await taStrategy.deployTransaction.wait()
    console.log("New implementation contract for TAStrategy:", taStrategy.address)

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)
    await proxyAdmin.upgrade(taStrategyProxyAddr, taStrategy.address)
    console.log("TAStrategy upgraded successfully")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })