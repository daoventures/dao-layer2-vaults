const { ethers, network } = require("hardhat")
const { mainnet } = require("../addresses")

const mirrorFactoryAddr = "0xd45442945E740370E7Ed024F287cb787D3043948"
const GOOGLPoolAddr = "0x5b64BB4f69c8C03250Ac560AaC4C7401d78A1c32"

async function main() {
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)

    const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    // const mirrorVaultArtifact = await artifacts.readArtifact("MirrorKovan")
    const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)
    const dataMGOOGLUST = mirrorVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 Mirror mGOOGL-UST", "daoMirrorMGOOGL", GOOGLPoolAddr,
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const mirrorFactory = await ethers.getContractAt("MirrorFactory", mirrorFactoryAddr, deployer)
    const tx = await mirrorFactory.createVault(dataMGOOGLUST, {gasLimit: 920000})
    await tx.wait()
    const MGOOGLUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))

    console.log("Mirror mGOOGL-UST vault (proxy) contract address:", MGOOGLUSTVaultAddr)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })