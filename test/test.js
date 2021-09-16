const { ethers, artifacts, network, upgrades } = require("hardhat")
const IERC20_ABI = require("../abis/IERC20_ABI.json")

const GOOGLPoolAddr = "0x5b64BB4f69c8C03250Ac560AaC4C7401d78A1c32"
const mGOOGLUSTAddr = "0x4b70ccD1Cf9905BE1FaEd025EADbD3Ab124efe9a"

const mGOOGLUSTHolderAddr = "0x5071af77f17050477d21350e6dbeac13b5e7928f"

describe("Metaverse-Farmer", () => {
    it("should work for Mirror L1 mGOOGLUST vault contract", async () => {
        let tx, receipt
        const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

        // Deploy
        const MirrorVault = await ethers.getContractFactory("Mirror", deployer)
        const mirrorVault = await MirrorVault.deploy()
        const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
        const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)

        const MirrorFactory = await ethers.getContractFactory("MirrorFactory", deployer)
        const mirrorFactory = await MirrorFactory.deploy(mirrorVault.address)
        await mirrorFactory.transferOwnership(multisig.address)
        
        const datamGOOGLUST = mirrorVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Mirror mGOOGL-UST", "daoMirrorMGOOGL", GOOGLPoolAddr,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await mirrorFactory.connect(multisig).createVault(datamGOOGLUST)
        const mGOOGLUSTVaultAddr = await mirrorFactory.getVault(0)
        const mGOOGLUSTVault = await ethers.getContractAt("Mirror", mGOOGLUSTVaultAddr, deployer)

        // Unlock & transfer
        network.provider.request({method: "hardhat_impersonateAccount", params: [mGOOGLUSTHolderAddr]})
        const unlockedAcc = await ethers.getSigner(mGOOGLUSTHolderAddr)
        const mGOOGLUSTContract = new ethers.Contract(mGOOGLUSTAddr, IERC20_ABI, unlockedAcc)
        await mGOOGLUSTContract.transfer(client.address, ethers.utils.parseEther("1"))
        await mGOOGLUSTContract.transfer(client2.address, ethers.utils.parseEther("1"))

        // Whitelist
        await mGOOGLUSTVault.connect(admin).setWhitelistAddress(client.address, true)

        // Deposit
        await mGOOGLUSTContract.connect(client).approve(mGOOGLUSTVault.address, ethers.constants.MaxUint256)
        tx = await mGOOGLUSTVault.connect(client).deposit(ethers.utils.parseEther("1"))
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.balanceOf(client.address)))

        // Invest
        tx = await mGOOGLUSTVault.connect(admin).invest()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())

        // Second deposit
        await mGOOGLUSTContract.connect(client2).approve(mGOOGLUSTVault.address, ethers.constants.MaxUint256)
        await mGOOGLUSTVault.connect(client2).deposit(ethers.utils.parseEther("1"))
        // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.balanceOf(client2.address)))

        // Check fees (deposit fees)
        // console.log(ethers.utils.formatEther(await mGOOGLUSTContract.balanceOf(treasury.address)))
        // console.log(ethers.utils.formatEther(await mGOOGLUSTContract.balanceOf(community.address)))
        // console.log(ethers.utils.formatEther(await mGOOGLUSTContract.balanceOf(strategist.address)))

        // Second invest
        tx = await mGOOGLUSTVault.connect(admin).invest()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInUSD()))

        // Check pending rewards
        // console.log((await mGOOGLUSTVault.getPendingRewards()).toString())

        // // Yield
        // // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getPricePerFullShare()))
        // network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
        // const binanceAcc = await ethers.getSigner(binanceAddr)
        // const SUSHIContract = new ethers.Contract(SUSHIAddr, IERC20_ABI, binanceAcc)
        // await SUSHIContract.transfer(mGOOGLUSTVault.address, ethers.utils.parseEther("1"))
        // tx = await mGOOGLUSTVault.connect(admin).yield()
        // // receipt = await tx.wait()
        // // console.log(receipt.gasUsed.toString())
        // // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getPricePerFullShare()))

        // // Check fees (yield fees)
        // // console.log(ethers.utils.formatEther(await admin.getBalance()))
        // // console.log(ethers.utils.formatEther(await community.getBalance()))
        // // console.log(ethers.utils.formatEther(await strategist.getBalance()))

        // // Emergency withdrawal
        // await mGOOGLUSTVault.connect(admin).emergencyWithdraw()
        // await mGOOGLUSTVault.connect(admin).reinvest()

        // // Getter function
        // await network.provider.send("evm_mine")
        // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getPendingRewards()))
        // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPool()))
        // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInETH()))
        // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther((await mGOOGLUSTVault.balanceOf(client.address))
        //     .mul(await mGOOGLUSTVault.getPricePerFullShare(true))
        //     .div(ethers.utils.parseEther("1"))
        // ))

        // // Withdraw
        // tx = await mGOOGLUSTVault.connect(client).withdraw(mGOOGLUSTVault.balanceOf(client.address))
        // // receipt = await tx.wait()
        // // console.log(receipt.gasUsed.toString())
        // console.log(ethers.utils.formatEther(await mGOOGLUSTContract.balanceOf(client.address)))

        // tx = await mGOOGLUSTVault.connect(client2).withdraw(mGOOGLUSTVault.balanceOf(client2.address))
        // // receipt = await tx.wait()
        // // console.log(receipt.gasUsed.toString())
        // console.log(ethers.utils.formatEther(await mGOOGLUSTContract.balanceOf(client2.address)))
    })
})