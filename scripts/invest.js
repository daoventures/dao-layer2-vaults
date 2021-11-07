const { ethers } = require("hardhat")
require("dotenv").config()

const mMSFTUSTVaultAddr = "0x5eCd72e7f320361B3BAA179be9aB3AD6AAa3FE62"
const mTWTRUSTVaultAddr = "0x18bd3966B47573A66CA66286F792caAA2670124b"
const mTSLAUSTVaultAddr = "0x6870801E20f3e20E549B955e9a1bFbE8a4e238Df"
const mGOOGLUSTVaultAddr = "0x385f56B7B1E075Bd8560f27F9EC8BeFC9600b73A"
const mAMZNUSTVaultAddr = "0x8Ae48A768F8270E8349f2d4f1511311a1143e9Ed"
const mAAPLUSTVaultAddr = "0x4bc507377331d0Ff135d33CD0DE41a4322B4Abe5"
const mNFLXUSTVaultAddr = "0xB0AbAF1A2c194CAF79662371233fB49414655bA9"

const strategyAddr = "0x07450fFdAA82eC583F2928bF69293d05e53A4ae9"

async function main() {
    let tx
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)
    // const [me] = await ethers.getSigners()
    // await me.sendTransaction({to: deployer.address, value: ethers.utils.parseEther("10")})

    // const mMSFTUSTVault = await ethers.getContractAt("Mirror", mMSFTUSTVaultAddr, deployer)
    // tx = await mMSFTUSTVault.invest()
    // await tx.wait()
    // console.log("Success call invest for DAO L1 Mirror MSFT-UST vault contract")

    const mTWTRUSTVault = await ethers.getContractAt("Mirror", mTWTRUSTVaultAddr, deployer)
    tx = await mTWTRUSTVault.invest()
    await tx.wait()
    console.log("Success call invest for DAO L1 Mirror TWTR-UST vault contract")

    const mTSLAUSTVault = await ethers.getContractAt("Mirror", mTSLAUSTVaultAddr, deployer)
    tx = await mTSLAUSTVault.invest()
    await tx.wait()
    console.log("Success call invest for DAO L1 Mirror TSLA-UST vault contract")

    const mGOOGLUSTVault = await ethers.getContractAt("Mirror", mGOOGLUSTVaultAddr, deployer)
    tx = await mGOOGLUSTVault.invest()
    await tx.wait()
    console.log("Success call invest for DAO L1 Mirror GOOGL-UST vault contract")

    const mAMZNUSTVault = await ethers.getContractAt("Mirror", mAMZNUSTVaultAddr, deployer)
    tx = await mAMZNUSTVault.invest()
    await tx.wait()
    console.log("Success call invest for DAO L1 Mirror AMZN-UST vault contract")

    const mAAPLUSTVault = await ethers.getContractAt("Mirror", mAAPLUSTVaultAddr, deployer)
    tx = await mAAPLUSTVault.invest()
    await tx.wait()
    console.log("Success call invest for DAO L1 Mirror AAPL-UST vault contract")

    const mNFLXUSTVault = await ethers.getContractAt("Mirror", mNFLXUSTVaultAddr, deployer)
    tx = await mNFLXUSTVault.invest()
    await tx.wait()
    console.log("Success call invest for DAO L1 Mirror NFLX-UST vault contract")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })