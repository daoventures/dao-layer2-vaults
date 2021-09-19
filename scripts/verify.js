const { run } = require('hardhat')

const contractAddr = "0xF4489528a40356a2f37A4a91c00F69b620894c0d"
const contractName = "CitadelV2VaultKovan"

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