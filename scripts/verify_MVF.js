const { run } = require('hardhat')

const mvfVaultAddr = "0x7E1f6049F3F5F8d03D2381a3AE52a8C982aa1773"
const mvfStrategyAddr = "0x92f89862Fe4ca4d48B3F8f9af00a7d6F5392867E"

async function main() {
    await run('verify:verify', {
        address: mvfVaultAddr,
        contract: 'contracts/MVFVaultKovan.sol:MVFVaultKovan',
    })

    await run('verify:verify', {
        address: mvfStrategyAddr,
        contract: 'contracts/MVFStrategyKovan.sol:MVFStrategyKovan',
    })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })