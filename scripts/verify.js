const { run } = require('hardhat')
const { mainnet, kovan } = require("../addresses")

const contractAddr = "0x5e6F52DC4569900D7B523e12809dC5910c11E2b0"
const contractName = "StonksVault"

const mirrorImpl = "0xE4809Ed214631017737A3d7FA3e78600Ee96Eb85"

const stonksVaultImpl = "0xa4639BD9d9864773659EFCa50D309fA5ae68DE31" // Kovan
const stonksStrategyImpl = "0xB103F669E87f67376FB9458A67226f2774a0B4FD"
const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"
const stonksStrategyProxyAddr = "0xA8a3b0412A25C1183DFcFed6dc7b6aCd584A6383" // Kovan

const mMSFTUSTVaultAddr = "0x5eCd72e7f320361B3BAA179be9aB3AD6AAa3FE62"
const mTWTRUSTVaultAddr = "0x18bd3966B47573A66CA66286F792caAA2670124b"
const mTSLAUSTVaultAddr = "0x6870801E20f3e20E549B955e9a1bFbE8a4e238Df"
const mGOOGLUSTVaultAddr = "0x385f56B7B1E075Bd8560f27F9EC8BeFC9600b73A"
const mAMZNUSTVaultAddr = "0x8Ae48A768F8270E8349f2d4f1511311a1143e9Ed"
const mAPPLUSTVaultAddr = "0x4bc507377331d0Ff135d33CD0DE41a4322B4Abe5"
const mNFLXUSTVaultAddr = "0xB0AbAF1A2c194CAF79662371233fB49414655bA9"

// const mMSFTUSTVaultAddr = "0x151248F112c01070eD166940114Ffa10dc66aE1d" // Kovan
// const mTWTRUSTVaultAddr = "0x9abc617aE193B985072e8749D848CBf908E37df8" // Kovan
// const mTSLAUSTVaultAddr = "0x4030B33ba5eE44e2453dB6bD563C2633670Ad14C" // Kovan
// const mGOOGLUSTVaultAddr = "0x772Dfe29Ad7c73da6094defEbF586CB951Ab4968" // Kovan
// const mAMZNUSTVaultAddr = "0x3Ec01eDFc9eeD14D99584f10834410165A88706C" // Kovan
// const mAPPLUSTVaultAddr = "0x568AD887f3DA8622d8c0091068360e03528b9990" // Kovan
// const mNFLXUSTVaultAddr = "0x1DDD09828F03Bda41C4FAD2376693f91687Ab4AE" // Kovan

async function main() {
    // const stonksStrategyArtifact = await artifacts.readArtifact("StonksStrategy")
    // // const stonksStrategyArtifact = await artifacts.readArtifact("StonksStrategyKovan")
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
        //     stonksStrategyImpl,
        //     daoProxyAdminAddr,
        //     dataStonksStrategy
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