const { ethers } = require("hardhat")
const { mainnet } = require("../addresses")

const sushiFactoryAddr = "0x1D5c8FA8aa068726b84f6b45992C8f0f225A4ff3"

async function main() {
    const [deployer] = await ethers.getSigners()
    let tx

    // await network.provider.request({method: "hardhat_impersonateAccount", params: ["0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"]})
    // const deployer = await ethers.getSigner("0x3f68A3c1023d736D8Be867CA49Cb18c543373B99")

    // const sushiVaultArtifact = await artifacts.readArtifact("Sushi")
    // // const sushiVaultArtifact = await artifacts.readArtifact("SushiKovan")
    // const sushiVaultInterface = new ethers.utils.Interface(sushiVaultArtifact.abi)
    // const dataMANAETH = sushiVaultInterface.encodeFunctionData(
    //     "initialize",
    //     [
    //         "DAO L1 Sushi MANA-ETH", "daoSushiMANA", 240,
    //         mainnet.treasury, mainnet.community, mainnet.strategist, mainnet.admin
    //     ]
    // )
    // const sushiFactory = await ethers.getContractAt("SushiFactory", sushiFactoryAddr, deployer)
    // tx = await sushiFactory.createVault(dataMANAETH, {gasLimit: 970000})
    // tx.wait()
    // const MANAETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))

    // console.log("Sushi MANA-ETH vault (proxy) contract address:", MANAETHVaultAddr)

    const MANAETHVault = await ethers.getContractAt("Sushi", "0x5eF6d1CEfdd8Cff9945fA72CC065185758690A69", deployer)
    tx = await MANAETHVault.setWhitelistAddress("0xfa83CA66FDaCC4028DAB383de4adc8aB7DB21FF2", true)
    await tx.wait()
    console.log("Set whitelist successfully")
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })