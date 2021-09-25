const { ethers, network } = require("hardhat")
const { mainnet } = require("../addresses")

const mirrorFactoryAddr = "0xd45442945E740370E7Ed024F287cb787D3043948"
const APPLPoolAddr = "0x735659C8576d88A2Eb5C810415Ea51cB06931696"

async function main() {
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)

    const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    // const mirrorVaultArtifact = await artifacts.readArtifact("MirrorKovan")
    const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)
    const dataMAPPLUST = mirrorVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 Mirror mAPPL-UST", "daoMirrorMAPPL", APPLPoolAddr,
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const mirrorFactory = await ethers.getContractAt("MirrorFactory", mirrorFactoryAddr, deployer)
    const tx = await mirrorFactory.createVault(dataMAPPLUST, {gasLimit: 920000})
    await tx.wait()
    const MAPPLUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))

    console.log("Mirror mAPPL-UST vault (proxy) contract address:", MAPPLUSTVaultAddr)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })