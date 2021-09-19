const { ethers, network } = require("hardhat")
const { mainnet } = require("../addresses")

const mMSFTUSTVaultAddr = "0x151248F112c01070eD166940114Ffa10dc66aE1d"
const mTWTRUSTVaultAddr = "0x9abc617aE193B985072e8749D848CBf908E37df8"
const mTSLAUSTVaultAddr = "0x4030B33ba5eE44e2453dB6bD563C2633670Ad14C"
const mGOOGLUSTVaultAddr = "0x772Dfe29Ad7c73da6094defEbF586CB951Ab4968"
const mAMZNUSTVaultAddr = "0x3Ec01eDFc9eeD14D99584f10834410165A88706C"
const mAPPLUSTVaultAddr = "0x568AD887f3DA8622d8c0091068360e03528b9990"
const mNFLXUSTVaultAddr = "0x1DDD09828F03Bda41C4FAD2376693f91687Ab4AE"

const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan

async function main() {
    const [deployer] = await ethers.getSigners()

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    // const StonksStrategy = await ethers.getContractFactory("StonksStrategy", deployer)
    const StonksStrategy = await ethers.getContractFactory("StonksStrategyKovan", deployer)
    const stonksStrategy = await StonksStrategy.deploy()
    await stonksStrategy.deployTransaction.wait()
    console.log("DAO Stonks V2 strategy (implementation) contract address:", stonksStrategy.address)

    // const stonksStrategyArtifact = await artifacts.readArtifact("StonksStrategy")
    const stonksStrategyArtifact = await artifacts.readArtifact("StonksStrategyKovan")
    const stonksStrategyInterface = new ethers.utils.Interface(stonksStrategyArtifact.abi)
    const dataStonksStrategy = stonksStrategyInterface.encodeFunctionData(
        "initialize",
        [
            mMSFTUSTVaultAddr, mTWTRUSTVaultAddr, mTSLAUSTVaultAddr, mGOOGLUSTVaultAddr, mAMZNUSTVaultAddr, mAPPLUSTVaultAddr, mNFLXUSTVaultAddr
        ]
    )
    const StonksStrategyProxy = await ethers.getContractFactory("StonksProxy", deployer)
    const stonksStrategyProxy = await StonksStrategyProxy.deploy(stonksStrategy.address, daoProxyAdminAddr, dataStonksStrategy)
    await stonksStrategyProxy.deployTransaction.wait()
    console.log("DAO Stonks V2 strategy (proxy) contract address:", stonksStrategyProxy.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })