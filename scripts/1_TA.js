const { ethers } = require("hardhat")
const { mainnet, kovan } = require("../addresses")

// const WBTCETHVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F" // Sushi WBTC-ETH vault (proxy) contract address
// const USDCETHVaultAddr = "0x4Fe35F3e3728942715378a3D5684f86b693328a3" // Sushi USDC-ETH vault (proxy) contract address

const WBTCETHVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F" // Kovan
const USDCETHVaultAddr = "0x4Fe35F3e3728942715378a3D5684f86b693328a3" // Kovan

// const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"
const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan

async function main() {
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)
    // const [me] = await ethers.getSigners()
    // await me.sendTransaction({to: deployer.address, value: ethers.utils.parseEther("10")})

    // const TAStrategy = await ethers.getContractFactory("TAStrategy", deployer)
    const TAStrategy = await ethers.getContractFactory("TAStrategyKovan", deployer)
    const taStrategy = await TAStrategy.deploy()
    await taStrategy.deployTransaction.wait()
    console.log("TA strategy (implementation) contract address:", taStrategy.address)

    // const taStrategyArtifact = await artifacts.readArtifact("TAStrategy")
    const taStrategyArtifact = await artifacts.readArtifact("TAStrategyKovan")
    const taStrategyInterface = new ethers.utils.Interface(taStrategyArtifact.abi)
    const dataTAStrategy = taStrategyInterface.encodeFunctionData(
        "initialize",
        [
            WBTCETHVaultAddr, USDCETHVaultAddr, true // Attack mode
        ]
    )
    const TAStrategyProxy = await ethers.getContractFactory("TAProxy", deployer)
    const taStrategyProxy = await TAStrategyProxy.deploy(
        taStrategy.address, daoProxyAdminAddr, dataTAStrategy,
    )
    await taStrategyProxy.deployTransaction.wait()
    console.log("TA strategy (proxy) contract address:", taStrategyProxy.address)

    // const TAVault = await ethers.getContractFactory("TAVault", deployer)
    const TAVault = await ethers.getContractFactory("TAVaultKovan", deployer)
    const taVault = await TAVault.deploy()
    await taVault.deployTransaction.wait()
    console.log("TA vault (implementation) contract address:", taVault.address)

    // const taVaultArtifact = await artifacts.readArtifact("TAVault")
    const taVaultArtifact = await artifacts.readArtifact("TAVaultKovan")
    const taVaultInterface = new ethers.utils.Interface(taVaultArtifact.abi)
    const dataTAVault = taVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L2 Tech Anlys", "daoTAS",
            // mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
            // mainnet.biconomy, taVault.address
            kovan.treasury, kovan.community, kovan.strategist, kovan.admin,
            kovan.biconomy, taVault.address
        ]
    )
    const TAVaultProxy = await ethers.getContractFactory("TAProxy", deployer)
    const taVaultProxy = await TAVaultProxy.deploy(
        taVault.address, daoProxyAdminAddr, dataTAVault,
    )
    await taVaultProxy.deployTransaction.wait()
    console.log("TA vault (proxy) contract address:", taVaultProxy.address)

    const taStrategyProxyContract = await ethers.getContractAt(
        "TAStrategy", taStrategyProxy.address, deployer
    )
    const tx = await taStrategyProxyContract.setVault(taVaultProxy.address)
    await tx.wait()
    console.log("Set TA Vault proxy contract address successfully in TA Strategy proxy contract")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
