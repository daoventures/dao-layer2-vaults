const { run } = require('hardhat')

const contractAddr = "0x6A4EfC6Ab4792Fc8DCd5A488791CBDD45675d239"
const contractName = "SushiKovan"

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