const { ethers, network } = require("hardhat")
const { mainnet } = require("../addresses")

const mirrorFactoryAddr = "0xd45442945E740370E7Ed024F287cb787D3043948"
const MSFTPoolAddr = "0x27a14c03C364D3265e0788f536ad8d7afB0695F7"

async function main() {
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)

    const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    // const mirrorVaultArtifact = await artifacts.readArtifact("MirrorKovan")
    const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)
    const dataMMSFTUST = mirrorVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 Mirror mMSFT-UST", "daoMirrorMMSFT", MSFTPoolAddr,
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const mirrorFactory = await ethers.getContractAt("MirrorFactory", mirrorFactoryAddr, deployer)
    const tx = await mirrorFactory.createVault(dataMMSFTUST, {gasLimit: 941000})
    await tx.wait()
    const MMSFTUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))

    console.log("Mirror mMSFT-UST vault (proxy) contract address:", MMSFTUSTVaultAddr)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })