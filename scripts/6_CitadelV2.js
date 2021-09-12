const { ethers, upgrades } = require("hardhat")
const { mainnet } = require("../addresses")

const HBTCWBTCVaultAddr = "0xBB285Fd62C7C9010dBB3B8be3F9D94afc2fCF759" // Curve HBTC-WBTC vault (proxy) contract address
const WBTCETHVaultAddr = "0x70850d2e00D3FC3Ec6c4750C99FC504b023e2a9d" // Sushi WBTC-ETH vault (proxy) contract address
const DPIETHVaultAddr = "0x83aCB6478E7716CA365e5BEa21Fe05A94B289BE4" // Sushi DPI-ETH vault (proxy) contract address
const DAIETHVaultAddr = "0x244517fE869B3054B83b6F005A895957d6feEAe6" // Uniswap V3 DAI-ETH vault (proxy) contract address

async function main() {
    const [deployer] = await ethers.getSigners()

    // const CitadelV2Strategy = await ethers.getContractFactory("CitadelV2Strategy", deployer)
    const CitadelV2Strategy = await ethers.getContractFactory("CitadelV2StrategyKovan", deployer)
    const citadelV2Strategy = await upgrades.deployProxy(CitadelV2Strategy, [
        HBTCWBTCVaultAddr, WBTCETHVaultAddr, DPIETHVaultAddr, DAIETHVaultAddr
    ])

    // const CitadelV2Vault = await ethers.getContractFactory("CitadelV2Vault", deployer)
    const CitadelV2Vault = await ethers.getContractFactory("CitadelV2VaultKovan", deployer)
    const citadelV2Vault = await upgrades.deployProxy(CitadelV2Vault, [
        "DAO L2 Citadel V2", "daoCDV2",
        mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
        mainnet.biconomy, citadelV2Strategy.address
    ])
    await citadelV2Strategy.setVault(citadelV2Vault.address)

    console.log('Citadel V2 vault (proxy) contract address:', citadelV2Vault.address)
    console.log('Citadel V2 strategy (proxy) contract address:', citadelV2Strategy.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })