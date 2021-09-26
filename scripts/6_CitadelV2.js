const { ethers, upgrades } = require("hardhat")
const { mainnet, kovan } = require("../addresses")

// const HBTCWBTCVaultAddr = "0xB2010f55C684A9F1701178920f5269a1180504E1" // Curve HBTC-WBTC vault (proxy) contract address
// const WBTCETHVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F" // Sushi WBTC-ETH vault (proxy) contract address
// const DPIETHVaultAddr = "0x397E18750351a707A010A5eB188a7A6AbFda4Fcd" // Sushi DPI-ETH vault (proxy) contract address
// const DAIETHVaultAddr = "0x37e19484982425b77624FF95612D6aFE8f3159F4" // Uniswap V3 DAI-ETH vault (proxy) contract address

const HBTCWBTCVaultAddr = "0xBB285Fd62C7C9010dBB3B8be3F9D94afc2fCF759" // Kovan
const WBTCETHVaultAddr = "0x70850d2e00D3FC3Ec6c4750C99FC504b023e2a9d" // Kovan
const DPIETHVaultAddr = "0x83aCB6478E7716CA365e5BEa21Fe05A94B289BE4" // Kovan
const DAIETHVaultAddr = "0x244517fE869B3054B83b6F005A895957d6feEAe6" // Kovan

// const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"
const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan

async function main() {
    const [deployer] = await ethers.getSigners()

    // const CitadelV2Strategy = await ethers.getContractFactory("CitadelV2Strategy", deployer)
    const CitadelV2Strategy = await ethers.getContractFactory("CitadelV2StrategyKovan", deployer)
    const citadelV2Strategy = await CitadelV2Strategy.deploy()
    await citadelV2Strategy.deployTransaction.wait()
    console.log("Citadel V2 strategy (implementation) contract address:", citadelV2Strategy.address)

    // const citadelV2StrategyArtifact = await artifacts.readArtifact("CitadelV2Strategy")
    const citadelV2StrategyArtifact = await artifacts.readArtifact("CitadelV2StrategyKovan")
    const citadelV2StrategyInterface = new ethers.utils.Interface(citadelV2StrategyArtifact.abi)
    const dataCitadelV2Strategy = citadelV2StrategyInterface.encodeFunctionData(
        "initialize",
        [
            HBTCWBTCVaultAddr, WBTCETHVaultAddr, DPIETHVaultAddr, DAIETHVaultAddr
        ]
    )
    const CitadelV2StrategyProxy = await ethers.getContractFactory("CitadelV2Proxy", deployer)
    const citadelV2StrategyProxy = await CitadelV2StrategyProxy.deploy(citadelV2Strategy.address, daoProxyAdminAddr, dataCitadelV2Strategy)
    await citadelV2StrategyProxy.deployTransaction.wait()
    console.log("Citadel V2 strategy (proxy) contract address:", citadelV2StrategyProxy.address)

    // const CitadelV2Vault = await ethers.getContractFactory("CitadelV2Vault", deployer)
    const CitadelV2Vault = await ethers.getContractFactory("CitadelV2VaultKovan", deployer)
    const citadelV2Vault = await CitadelV2Vault.deploy()
    await citadelV2Vault.deployTransaction.wait()
    console.log("Citadel V2 vault (implementation) contract address:", citadelV2Vault.address)

    // const citadelV2VaultArtifact = await artifacts.readArtifact("CitadelV2Vault")
    const citadelV2VaultArtifact = await artifacts.readArtifact("CitadelV2VaultKovan")
    const citadelV2VaultInterface = new ethers.utils.Interface(citadelV2VaultArtifact.abi)
    const dataCitadelV2Vault = citadelV2VaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L2 Citadel V2", "daoCDV2",
            // mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
            // mainnet.biconomy, citadelV2Vault.address
            kovan.treasury, kovan.community, kovan.strategist, kovan.admin,
            kovan.biconomy, citadelV2Vault.address
        ]
    )
    const CitadelV2VaultProxy = await ethers.getContractFactory("CitadelV2Proxy", deployer)
    const citadelV2VaultProxy = await CitadelV2VaultProxy.deploy(citadelV2Vault.address, daoProxyAdminAddr, dataCitadelV2Vault)
    await citadelV2VaultProxy.deployTransaction.wait()
    console.log("Citadel V2 vault (proxy) contract address:", citadelV2VaultProxy.address)

    const tx = await citadelV2StrategyProxy.setVault(citadelV2VaultProxy.address)
    await tx.wait()
    console.log("Set Citadel V2 Vault proxy contract address successfully in Citadel V2 Strategy proxy contract")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
