const { ethers } = require("hardhat")

const proxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"

const mvfStrategyProxyAddr = "0xfa83CA66FDaCC4028DAB383de4adc8aB7DB21FF2"
const mvfStrategyImplAddr = ""

const mvfVaultProxyAddr = "0x5b3ae8b672a753906b1592d44741f71fbd05ba8c"
const mvfVaultImplAddr = ""

async function main() {
    const [deployer] = await ethers.getSigners()
    let tx

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)
    // const [me] = await ethers.getSigners()
    // await me.sendTransaction({to: deployer.address, value: ethers.utils.parseEther("10")})

    const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
        "function upgrade(address, address) external"
    ], deployer)

    // Upgrade Strategy
    const MVFStrategyImpl = await ethers.getContractFactory("MVFStrategy", deployer)
    const mvfStrategyImpl = await MVFStrategyImpl.deploy() // Remember to set gas limit
    await mvfStrategyImpl.deployTransaction.wait()
    console.log("New implementation contract for MVFStrategy:", mvfStrategyImpl.address)

    tx = await proxyAdmin.upgrade(mvfStrategyProxyAddr, mvfStrategyImpl.address) // For localhost test deploy
    // tx = await proxyAdmin.upgrade(mvfStrategyProxyAddr, mvfStrategyImplAddr)
    await tx.wait()
    console.log("MVFStrategy upgraded successfully")

    // Upgrade Vault
    // const MVFVaultImpl = await ethers.getContractFactory("MVFVault", deployer)
    // const mvfVaultImpl = await MVFVaultImpl.deploy() // Remember to set gas limit
    // await mvfVaultImpl.deployTransaction.wait()
    // console.log("New implementation contract for MVFVault:", mvfVaultImpl.address)

    // tx = await proxyAdmin.upgrade(mvfVaultProxyAddr, mvfVaultImpl.address) // For localhost test deploy
    // // tx = await proxyAdmin.upgrade(mvfVaultProxyAddr, mvfVaultImplAddr)
    // await tx.wait()
    // console.log("MVFVault upgraded successfully")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })