const { run } = require('hardhat')

const contractAddr = "0xc4998e3F7CD16c4c12978D4BD3f90808b1d0AC1F"
const contractName = "CitadelV2StrategyKovan"

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