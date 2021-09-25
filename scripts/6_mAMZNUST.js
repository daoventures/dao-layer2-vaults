const { ethers, network } = require("hardhat")
const { mainnet } = require("../addresses")

const mirrorFactoryAddr = "0xd45442945E740370E7Ed024F287cb787D3043948"
const AMZNPoolAddr = "0x1fABef2C2DAB77f01053E9600F70bE1F3F657F51"

async function main() {
    const [deployer] = await ethers.getSigners()

    // const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    // await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
    // const deployer = await ethers.getSigner(deployerAddr)

    const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    // const mirrorVaultArtifact = await artifacts.readArtifact("MirrorKovan")
    const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)
    const dataMAMZNUST = mirrorVaultInterface.encodeFunctionData(
        "initialize",
        [
            "DAO L1 Mirror mAMZN-UST", "daoMirrorMAMZN", AMZNPoolAddr,
            mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
        ]
    )
    const mirrorFactory = await ethers.getContractAt("MirrorFactory", mirrorFactoryAddr, deployer)
    const tx = await mirrorFactory.createVault(dataMAMZNUST, {gasLimit: 920000})
    await tx.wait()
    const MAMZNUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))

    console.log("Mirror mAMZN-UST vault (proxy) contract address:", MAMZNUSTVaultAddr)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })