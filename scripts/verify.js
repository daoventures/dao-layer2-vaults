const { run } = require('hardhat')

const contractAddr = "0x3cE5C90d18A5D050ed9060E6239545a1bB0c192b"
const contractName = "MVFVaultKovan"

async function main() {
    await run('verify:verify', {
        address: contractAddr,
        contract: `contracts/${contractName}.sol:${contractName}`
    })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })