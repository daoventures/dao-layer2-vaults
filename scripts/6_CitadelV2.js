const { ethers } = require("hardhat")
const { mainnet, kovan } = require("../addresses")

const HBTCWBTCVaultAddr = "0xB2010f55C684A9F1701178920f5269a1180504E1" // Curve HBTC-WBTC vault (proxy) contract address
const WBTCETHVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F" // Sushi WBTC-ETH vault (proxy) contract address
const DPIETHVaultAddr = "0x397E18750351a707A010A5eB188a7A6AbFda4Fcd" // Sushi DPI-ETH vault (proxy) contract address
const DAIETHVaultAddr = "0x37e19484982425b77624FF95612D6aFE8f3159F4" // Sushi DAI-ETH vault (proxy) contract address

// const HBTCWBTCVaultAddr = "0xBB285Fd62C7C9010dBB3B8be3F9D94afc2fCF759" // Kovan
// const WBTCETHVaultAddr = "0x70850d2e00D3FC3Ec6c4750C99FC504b023e2a9d" // Kovan
// const DPIETHVaultAddr = "0x83aCB6478E7716CA365e5BEa21Fe05A94B289BE4" // Kovan
// const DAIETHVaultAddr = "0x244517fE869B3054B83b6F005A895957d6feEAe6" // Kovan

const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"
// const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan

async function main() {
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)
    // const [me] = await ethers.getSigners()
    // await me.sendTransaction({to: deployer.address, value: ethers.utils.parseEther("10")})

    // const CitadelV2Strategy = await ethers.getContractFactory("CitadelV2Strategy", deployer)
    // // const CitadelV2Strategy = await ethers.getContractFactory("CitadelV2StrategyKovan", deployer)
    // const citadelV2Strategy = await CitadelV2Strategy.deploy({gasLimit: 4060000})
    // await citadelV2Strategy.deployTransaction.wait()
    // console.log("Citadel V2 strategy (implementation) contract address:", citadelV2Strategy.address)

    // const citadelV2StrategyImplAddr = "0x20a671BD1CEdC0C4ac5f74b14ab76dE8BC25B33C"
    // const citadelV2StrategyArtifact = await artifacts.readArtifact("CitadelV2Strategy")
    // // const citadelV2StrategyArtifact = await artifacts.readArtifact("CitadelV2StrategyKovan")
    // const citadelV2StrategyInterface = new ethers.utils.Interface(citadelV2StrategyArtifact.abi)
    // const dataCitadelV2Strategy = citadelV2StrategyInterface.encodeFunctionData(
    //     "initialize",
    //     [
    //         HBTCWBTCVaultAddr, WBTCETHVaultAddr, DPIETHVaultAddr, DAIETHVaultAddr
    //     ]
    // )
    // const CitadelV2StrategyProxy = await ethers.getContractFactory("CitadelV2Proxy", deployer)
    // const citadelV2StrategyProxy = await CitadelV2StrategyProxy.deploy(
    //     // citadelV2Strategy.address, daoProxyAdminAddr, dataCitadelV2Strategy,
    //     citadelV2StrategyImplAddr, daoProxyAdminAddr, dataCitadelV2Strategy,
    //     {gasLimit: 1360000}
    // )
    // await citadelV2StrategyProxy.deployTransaction.wait()
    // console.log("Citadel V2 strategy (proxy) contract address:", citadelV2StrategyProxy.address)
    const citadelV2StrategyProxyAddr = "0x3845d7c09374Df1ae6Ce4728c99DD20D3d75F414"
    const citadelV2Strategy = await ethers.getContractAt("CitadelV2Strategy", citadelV2StrategyProxyAddr, deployer)

    // const CitadelV2Vault = await ethers.getContractFactory("CitadelV2Vault", deployer)
    // // const CitadelV2Vault = await ethers.getContractFactory("CitadelV2VaultKovan", deployer)
    // const citadelV2Vault = await CitadelV2Vault.deploy({gasLimit: 6040000})
    // await citadelV2Vault.deployTransaction.wait()
    // console.log("Citadel V2 vault (implementation) contract address:", citadelV2Vault.address)
    // const citadelV2VaultImplAddr = "0xfbE9613a6bd9d28ceF286b01357789b2b02E46f5"

    // const citadelV2VaultArtifact = await artifacts.readArtifact("CitadelV2Vault")
    // // const citadelV2VaultArtifact = await artifacts.readArtifact("CitadelV2VaultKovan")
    // const citadelV2VaultInterface = new ethers.utils.Interface(citadelV2VaultArtifact.abi)
    // const dataCitadelV2Vault = citadelV2VaultInterface.encodeFunctionData(
    //     "initialize",
    //     [
    //         "DAO L2 Citadel V2", "daoCDV2",
    //         mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
    //         mainnet.biconomy, citadelV2Strategy.address
    //         // kovan.treasury, kovan.community, kovan.strategist, kovan.admin,
    //         // kovan.biconomy, citadelV2Strategy.address
    //     ]
    // )
    // const CitadelV2VaultProxy = await ethers.getContractFactory("CitadelV2Proxy", deployer)
    // const citadelV2VaultProxy = await CitadelV2VaultProxy.deploy(
    //     citadelV2VaultImplAddr, daoProxyAdminAddr, dataCitadelV2Vault,
    //     // citadelV2Vault.address, daoProxyAdminAddr, dataCitadelV2Vault,
    //     {gasLimit: 1638000}
    // )
    // await citadelV2VaultProxy.deployTransaction.wait()
    // console.log("Citadel V2 vault (proxy) contract address:", citadelV2VaultProxy.address)
    const citadelV2VaultAddr = "0xCc6C417E991e810477b486d992faACa1b7440E76"
    const citadelV2Vault = await ethers.getContractAt("CitadelV2Vault", citadelV2VaultAddr, deployer)

    // const tx = await citadelV2Strategy.setVault(citadelV2VaultAddr)
    // // const tx = await citadelV2Strategy.setVault(citadelV2VaultProxy.address)
    // await tx.wait()
    // console.log("Set Citadel V2 Vault proxy contract address successfully in Citadel V2 Strategy proxy contract")

    // const HBTCWBTCVault = await ethers.getContractAt("Curve", HBTCWBTCVaultAddr, deployer)
    // tx = await HBTCWBTCVault.setWhitelistAddress(citadelV2Strategy.address, true)
    // await tx.wait()
    // console.log("Citadel V2 Vault proxy contract had successfully whitelisted in DAO L1 HBTCWBTC vault contract")
    // const WBTCETHVault = await ethers.getContractAt("Sushi", WBTCETHVaultAddr, deployer)
    // tx = await WBTCETHVault.setWhitelistAddress(citadelV2Strategy.address, true)
    // await tx.wait()
    // console.log("Citadel V2 Vault proxy contract had successfully whitelisted in DAO L1 WBTCETH vault contract")
    // const DPIETHVault = await ethers.getContractAt("Sushi", DPIETHVaultAddr, deployer)
    // tx = await DPIETHVault.setWhitelistAddress(citadelV2Strategy.address, true)
    // await tx.wait()
    // console.log("Citadel V2 Vault proxy contract had successfully whitelisted in DAO L1 DPIETH vault contract")
    // const DAIETHVault = await ethers.getContractAt("Sushi", DAIETHVaultAddr, deployer)
    // tx = await DAIETHVault.setWhitelistAddress(citadelV2Strategy.address, true)
    // await tx.wait()
    // console.log("Citadel V2 Vault proxy contract had successfully whitelisted in DAO L1 DAIETH vault contract")

    const multiSigAddr = "0x59E83877bD248cBFe392dbB5A8a29959bcb48592"
    tx = await citadelV2Strategy.transferOwnership(multiSigAddr)
    await tx.wait()
    console.log("Citadel V2 strategy proxy contract had successfully transferred to Multi-Sig contract")
    tx = await citadelV2Vault.transferOwnership(multiSigAddr)
    await tx.wait()
    console.log("Citadel V2 xault proxy contract had successfully transferred to Multi-Sig contract")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
