const { ethers, network } = require("hardhat")
const { mainnet } = require("../addresses")

const mMSFTUSTVaultAddr = "0x5eCd72e7f320361B3BAA179be9aB3AD6AAa3FE62"
const mTWTRUSTVaultAddr = "0x18bd3966B47573A66CA66286F792caAA2670124b"
const mTSLAUSTVaultAddr = "0x6870801E20f3e20E549B955e9a1bFbE8a4e238Df"
const mGOOGLUSTVaultAddr = "0x385f56B7B1E075Bd8560f27F9EC8BeFC9600b73A"
const mAMZNUSTVaultAddr = "0x8Ae48A768F8270E8349f2d4f1511311a1143e9Ed"
const mAAPLUSTVaultAddr = "0x4bc507377331d0Ff135d33CD0DE41a4322B4Abe5"
const mNFLXUSTVaultAddr = "0xB0AbAF1A2c194CAF79662371233fB49414655bA9"

// Kovan
// const mMSFTUSTVaultAddr = "0x151248F112c01070eD166940114Ffa10dc66aE1d"
// const mTWTRUSTVaultAddr = "0x9abc617aE193B985072e8749D848CBf908E37df8"
// const mTSLAUSTVaultAddr = "0x4030B33ba5eE44e2453dB6bD563C2633670Ad14C"
// const mGOOGLUSTVaultAddr = "0x772Dfe29Ad7c73da6094defEbF586CB951Ab4968"
// const mAMZNUSTVaultAddr = "0x3Ec01eDFc9eeD14D99584f10834410165A88706C"
// const mAPPLUSTVaultAddr = "0x568AD887f3DA8622d8c0091068360e03528b9990"
// const mNFLXUSTVaultAddr = "0x1DDD09828F03Bda41C4FAD2376693f91687Ab4AE"

const daoProxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"
// const daoProxyAdminAddr = "0x852c2F84adb2BAB6e6E6C260AAa95B2753E69e5f" // Kovan

async function main() {
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)
    // const [me] = await ethers.getSigners()
    // await me.sendTransaction({to: deployer.address, value: ethers.utils.parseEther("10")})

    // const StonksStrategy = await ethers.getContractFactory("StonksStrategy", deployer)
    // // const StonksStrategy = await ethers.getContractFactory("StonksStrategyKovan", deployer)
    // const stonksStrategy = await StonksStrategy.deploy({gasLimit: 5460000})
    // await stonksStrategy.deployTransaction.wait()
    // console.log("DAO Stonks V2 strategy (implementation) contract address:", stonksStrategy.address)
    // const stonksStrategyImplAddr = "0xB103F669E87f67376FB9458A67226f2774a0B4FD"

    // const stonksStrategyArtifact = await artifacts.readArtifact("StonksStrategy")
    // // const stonksStrategyArtifact = await artifacts.readArtifact("StonksStrategyKovan")
    // const stonksStrategyInterface = new ethers.utils.Interface(stonksStrategyArtifact.abi)
    // const dataStonksStrategy = stonksStrategyInterface.encodeFunctionData(
    //     "initialize",
    //     [
    //         mMSFTUSTVaultAddr, mTWTRUSTVaultAddr, mTSLAUSTVaultAddr, mGOOGLUSTVaultAddr, mAMZNUSTVaultAddr, mAPPLUSTVaultAddr, mNFLXUSTVaultAddr
    //     ]
    // )
    // const StonksStrategyProxy = await ethers.getContractFactory("StonksProxy", deployer)
    // // const stonksStrategyProxy = await StonksStrategyProxy.deploy(stonksStrategy.address, daoProxyAdminAddr, dataStonksStrategy)
    // const stonksStrategyProxy = await StonksStrategyProxy.deploy(
    //     stonksStrategyImplAddr, daoProxyAdminAddr, dataStonksStrategy,
    //     {gasLimit: 1751000}
    // )
    // await stonksStrategyProxy.deployTransaction.wait()
    // console.log("DAO Stonks V2 strategy (proxy) contract address:", stonksStrategyProxy.address)
    const stonksStrategyProxyAddr = "0x07450fFdAA82eC583F2928bF69293d05e53A4ae9"
    const stonksStrategy = await ethers.getContractAt("StonksStrategy", stonksStrategyProxyAddr, deployer)

    // const stonksVaultProxyAddr = "0xD0b14644B0F91239075ED8a415769C4E20D37cF9"
    // const tx = await stonksStrategy.setVault(stonksVaultProxyAddr)
    // await tx.wait()
    // console.log("Set Stonks V2 vault proxy contract address successfully in Stonks V2 strategy proxy contract")

    // const mMSFTUSTVault = await ethers.getContractAt("Mirror", mMSFTUSTVaultAddr, deployer)
    // tx = await mMSFTUSTVault.connect(deployer).setWhitelistAddress(stonksStrategy.address, true)
    // await tx.wait()
    // console.log("Stonks V2 strategy proxy contract had successfully whitelisted in DAO L1 mMSFTUSTVault vault contract")
    // const mTWTRUSTVault = await ethers.getContractAt("Mirror", mTWTRUSTVaultAddr, deployer)
    // tx = await mTWTRUSTVault.connect(deployer).setWhitelistAddress(stonksStrategy.address, true)
    // await tx.wait()
    // console.log("Stonks V2 strategy proxy contract had successfully whitelisted in DAO L1 mTWTRUSTVault vault contract")
    // const mTSLAUSTVault = await ethers.getContractAt("Mirror", mTSLAUSTVaultAddr, deployer)
    // tx = await mTSLAUSTVault.connect(deployer).setWhitelistAddress(stonksStrategy.address, true)
    // await tx.wait()
    // console.log("Stonks V2 strategy proxy contract had successfully whitelisted in DAO L1 mTSLAUSTVault vault contract")
    // const mGOOGLUSTVault = await ethers.getContractAt("Mirror", mGOOGLUSTVaultAddr, deployer)
    // tx = await mGOOGLUSTVault.connect(deployer).setWhitelistAddress(stonksStrategy.address, true)
    // await tx.wait()
    // console.log("Stonks V2 strategy proxy contract had successfully whitelisted in DAO L1 mGOOGLUSTVault vault contract")
    // const mAMZNUSTVault = await ethers.getContractAt("Mirror", mAMZNUSTVaultAddr, deployer)
    // tx = await mAMZNUSTVault.connect(deployer).setWhitelistAddress(stonksStrategy.address, true)
    // await tx.wait()
    // console.log("Stonks V2 strategy proxy contract had successfully whitelisted in DAO L1 mAMZNUSTVault vault contract")
    // const mAAPLUSTVault = await ethers.getContractAt("Mirror", mAAPLUSTVaultAddr, deployer)
    // tx = await mAAPLUSTVault.connect(deployer).setWhitelistAddress(stonksStrategy.address, true)
    // await tx.wait()
    // console.log("Stonks V2 strategy proxy contract had successfully whitelisted in DAO L1 mAAPLUSTVault vault contract")
    // const mNFLXUSTVault = await ethers.getContractAt("Mirror", mNFLXUSTVaultAddr, deployer)
    // tx = await mNFLXUSTVault.connect(deployer).setWhitelistAddress(stonksStrategy.address, true)
    // await tx.wait()
    // console.log("Stonks V2 strategy proxy contract had successfully whitelisted in DAO L1 mNFLXUSTVault vault contract")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })