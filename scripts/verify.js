const { run } = require('hardhat')

const contractAddr = "0xBE47025F8761fFAbd0bf732a3D76cFDBE4a46d84"
const contractName = "CurveHBTCZap"

async function main() {
    await run('verify:verify', {
        address: contractAddr,
        constructorArguments: [
            "0xB2010f55C684A9F1701178920f5269a1180504E1",
            // daoProxyAdminAddr,
            // dataMVFStrategy
          ],
        contract: `contracts/${contractName}.sol:${contractName}`
    })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })