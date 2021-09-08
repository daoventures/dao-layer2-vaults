const { run } = require('hardhat')

const contractAddr = "0x4EB305ee77a35BDe1952F0Cae5D6D53FFA89E290"
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