const { run, ethers, artifacts } = require('hardhat')

const contractAddr = "0xfbE9613a6bd9d28ceF286b01357789b2b02E46f5"
const contractName = "CitadelV2Vault"

const HBTCWBTCVaultAddr = "0xB2010f55C684A9F1701178920f5269a1180504E1" // Curve HBTC-WBTC vault (proxy) contract address
const WBTCETHVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F" // Sushi WBTC-ETH vault (proxy) contract address
const DPIETHVaultAddr = "0x397E18750351a707A010A5eB188a7A6AbFda4Fcd" // Sushi DPI-ETH vault (proxy) contract address
const DAIETHVaultAddr = "0x37e19484982425b77624FF95612D6aFE8f3159F4" // Uniswap V3 DAI-ETH vault (proxy) contract address

// const HBTCWBTCVaultAddr = "0xBB285Fd62C7C9010dBB3B8be3F9D94afc2fCF759" // Kovan
// const WBTCETHVaultAddr = "0x70850d2e00D3FC3Ec6c4750C99FC504b023e2a9d" // Kovan
// const DPIETHVaultAddr = "0x83aCB6478E7716CA365e5BEa21Fe05A94B289BE4" // Kovan
// const DAIETHVaultAddr = "0x244517fE869B3054B83b6F005A895957d6feEAe6" // Kovan

const implContractAddr = "0x20a671BD1CEdC0C4ac5f74b14ab76dE8BC25B33C"

const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"
// const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan

async function main() {
    // const citadelV2StrategyArtifact = await artifacts.readArtifact("CitadelV2Strategy")
    // // const citadelV2StrategyArtifact = await artifacts.readArtifact("CitadelV2StrategyKovan")
    // const citadelV2StrategyInterface = new ethers.utils.Interface(citadelV2StrategyArtifact.abi)
    // const dataCitadelV2Strategy = citadelV2StrategyInterface.encodeFunctionData(
    //     "initialize",
    //     [
    //         HBTCWBTCVaultAddr, WBTCETHVaultAddr, DPIETHVaultAddr, DAIETHVaultAddr
    //     ]
    // )

    await run('verify:verify', {
        address: contractAddr,
        // constructorArguments: [
        //     implContractAddr,
        //     daoProxyAdminAddr,
        //     dataCitadelV2Strategy
        //   ],
        contract: `contracts/${contractName}.sol:${contractName}`
    })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
