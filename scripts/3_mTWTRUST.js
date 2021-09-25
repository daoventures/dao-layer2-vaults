const { ethers, network } = require("hardhat")
const { mainnet } = require("../addresses")

const mirrorFactoryAddr = "0xd45442945E740370E7Ed024F287cb787D3043948"
const TWTRPoolAddr = "0x99d737ab0df10cdC99c6f64D0384ACd5C03AEF7F"

async function main() {
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)

    const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    // const mirrorVaultArtifact = await artifacts.readArtifact("MirrorKovan")
    const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)
    const dataMTWTRUST = mirrorVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 Mirror mTWTR-UST", "daoMirrorMTWTR", TWTRPoolAddr,
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const mirrorFactory = await ethers.getContractAt("MirrorFactory", mirrorFactoryAddr, deployer)
    const tx = await mirrorFactory.createVault(dataMTWTRUST, {gasLimit: 940000})
    await tx.wait()
    const MTWTRUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))

    console.log("Mirror mTWTR-UST vault (proxy) contract address:", MTWTRUSTVaultAddr)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })