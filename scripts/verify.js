const { run } = require('hardhat')
const { mainnet, kovan } = require("../addresses")

const contractAddr = "0x038cbe75BE8A7829934008EBF08cF727B8F0e7Fb"
const contractName = "StonksStrategyKovan"

const mirrorImpl = "0xE4809Ed214631017737A3d7FA3e78600Ee96Eb85"

const stonksVaultImpl = "0xa4639BD9d9864773659EFCa50D309fA5ae68DE31" // Kovan
const stonksStrategyImpl = "0x3a89b8dddc27cec4E75b5A1DE789d65A7F02e9e5" // Kovan
const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan
const stonksStrategyProxyAddr = "0xA8a3b0412A25C1183DFcFed6dc7b6aCd584A6383" // Kovan

const mMSFTUSTVaultAddr = "0x151248F112c01070eD166940114Ffa10dc66aE1d" // Kovan
const mTWTRUSTVaultAddr = "0x9abc617aE193B985072e8749D848CBf908E37df8" // Kovan
const mTSLAUSTVaultAddr = "0x4030B33ba5eE44e2453dB6bD563C2633670Ad14C" // Kovan
const mGOOGLUSTVaultAddr = "0x772Dfe29Ad7c73da6094defEbF586CB951Ab4968" // Kovan
const mAMZNUSTVaultAddr = "0x3Ec01eDFc9eeD14D99584f10834410165A88706C" // Kovan
const mAPPLUSTVaultAddr = "0x568AD887f3DA8622d8c0091068360e03528b9990" // Kovan
const mNFLXUSTVaultAddr = "0x1DDD09828F03Bda41C4FAD2376693f91687Ab4AE" // Kovan

async function main() {
    // // const stonksStrategyArtifact = await artifacts.readArtifact("StonksStrategy")
    // const stonksStrategyArtifact = await artifacts.readArtifact("StonksStrategyKovan")
    // const stonksStrategyInterface = new ethers.utils.Interface(stonksStrategyArtifact.abi)
    // const dataStonksStrategy = stonksStrategyInterface.encodeFunctionData(
    //     "initialize",
    //     // [
    //     //     "DAO L2 Stonks V2", "daoSTO2",
    //     //     // mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin,
    //     //     // mainnet.biconomy, stonksStrategyProxyAddr
    //     //     kovan.treasury, kovan.community, kovan.strategist, kovan.admin,
    //     //     kovan.biconomy, stonksStrategyProxyAddr
    //     // ]
    //     [
    //         mMSFTUSTVaultAddr, mTWTRUSTVaultAddr, mTSLAUSTVaultAddr, mGOOGLUSTVaultAddr, mAMZNUSTVaultAddr, mAPPLUSTVaultAddr, mNFLXUSTVaultAddr
    //     ]
    // )

    await run('verify:verify', {
        address: contractAddr,
        // constructorArguments: [
        //     mirrorImpl,
        //     // daoProxyAdminAddr,
        //     // dataStonksStrategy
        // ],
        contract: `contracts/${contractName}.sol:${contractName}`
    })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })