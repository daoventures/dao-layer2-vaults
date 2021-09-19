const { ethers, artifacts, network, upgrades } = require("hardhat")
const IERC20_ABI = require("../abis/IERC20_ABI.json")

const MSFTPoolAddr = "0x27a14c03C364D3265e0788f536ad8d7afB0695F7"
const mMSFTUSTAddr = "0xeAfAD3065de347b910bb88f09A5abE580a09D655"
const mMSFTUSTHolderAddr = "" // Cannot test because holder not enough token

const TWTRPoolAddr = "0x99d737ab0df10cdC99c6f64D0384ACd5C03AEF7F"
const mTWTRUSTAddr = "0x34856be886A2dBa5F7c38c4df7FD86869aB08040"
const mTWTRUSTHolderAddr = "0x7ba605bc00ea26512a639d5e0335eaeb3e81ad94"

const TSLAPoolAddr = "0x43DFb87a26BA812b0988eBdf44e3e341144722Ab"
const mTSLAUSTAddr = "0x5233349957586A8207c52693A959483F9aeAA50C"
const mTSLAUSTHolderAddr = "0xdd89b048dfc8eb978386c82cc8e30c8d65532ba8"

const GOOGLPoolAddr = "0x5b64BB4f69c8C03250Ac560AaC4C7401d78A1c32"
const mGOOGLUSTAddr = "0x4b70ccD1Cf9905BE1FaEd025EADbD3Ab124efe9a"
const mGOOGLUSTHolderAddr = "0x5071af77f17050477d21350e6dbeac13b5e7928f"

const AMZNPoolAddr = "0x1fABef2C2DAB77f01053E9600F70bE1F3F657F51"
const mAMZNUSTAddr = "0x0Ae8cB1f57e3b1b7f4f5048743710084AA69E796"
const mAMZNUSTHolderAddr = "0x58b8dc27728f35db95bfd4b70c13cf2463373447"

const APPLPoolAddr = "0x735659C8576d88A2Eb5C810415Ea51cB06931696"
const mAPPLUSTAddr = "0xB022e08aDc8bA2dE6bA4fECb59C6D502f66e953B"
const mAPPLUSTHolderAddr = "0x0c722f3dcf2bebb50fcca45cd6715ee31a2ad793"

const NFLXPoolAddr = "0x29cF719d134c1C18daB61C2F4c0529C4895eCF44"
const mNFLXUSTAddr = "0xC99A74145682C4b4A6e9fa55d559eb49A6884F75"
const mNFLXUSTHolderAddr = "0x7ba605bc00ea26512a639d5e0335eaeb3e81ad94"

const binanceAddr = "0x28C6c06298d514Db089934071355E5743bf21d60"

const MIRAddr = "0x09a3EcAFa817268f77BE1283176B946C4ff2E608"
const USTAddr = "0xa47c8bf37f92abed4a126bda807a7b7498661acd"
const USDTAddr = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDCAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAIAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

describe("DAO Stonks V2", () => {
    it("should work for DAO L2 Stonks contract", async () => {
        let tx, receipt
        const [deployer, client, client2, client3, treasury, community, strategist, admin, biconomy, multisig] = await ethers.getSigners()

        // Deploy Mirror factory & implementation
        const MirrorVault = await ethers.getContractFactory("Mirror", deployer)
        const mirrorVault = await MirrorVault.deploy()
        const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
        const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)

        const MirrorFactory = await ethers.getContractFactory("MirrorFactory", deployer)
        const mirrorFactory = await MirrorFactory.deploy(mirrorVault.address)
        await mirrorFactory.transferOwnership(multisig.address)

        // Deploy Microsoft vault
        const datamMSFTUST = mirrorVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Mirror mMSFT-UST", "daoMirrorMMSFT", MSFTPoolAddr,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await mirrorFactory.connect(multisig).createVault(datamMSFTUST)
        const mMSFTUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))
        const mMSFTUSTVault = await ethers.getContractAt("Mirror", mMSFTUSTVaultAddr, deployer)

        // Deploy Twitter vault
        const datamTWTRUST = mirrorVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Mirror mTWTR-UST", "daoMirrorMTWTR", TWTRPoolAddr,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await mirrorFactory.connect(multisig).createVault(datamTWTRUST)
        const mTWTRUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))
        const mTWTRUSTVault = await ethers.getContractAt("Mirror", mTWTRUSTVaultAddr, deployer)

        // Deploy Tesla vault
        const datamTSLAUST = mirrorVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Mirror mTSLA-UST", "daoMirrorMTSLA", TSLAPoolAddr,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await mirrorFactory.connect(multisig).createVault(datamTSLAUST)
        const mTSLAUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))
        const mTSLAUSTVault = await ethers.getContractAt("Mirror", mTSLAUSTVaultAddr, deployer)

        // Deploy Google vault
        const datamGOOGLUST = mirrorVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Mirror mGOOGL-UST", "daoMirrorMGOOGL", GOOGLPoolAddr,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await mirrorFactory.connect(multisig).createVault(datamGOOGLUST)
        const mGOOGLUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))
        const mGOOGLUSTVault = await ethers.getContractAt("Mirror", mGOOGLUSTVaultAddr, deployer)

        // Deploy Amazon vault
        const datamAMZNUST = mirrorVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Mirror mAMZN-UST", "daoMirrorMAMZN", AMZNPoolAddr,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await mirrorFactory.connect(multisig).createVault(datamAMZNUST)
        const mAMZNUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))
        const mAMZNUSTVault = await ethers.getContractAt("Mirror", mAMZNUSTVaultAddr, deployer)

        // Deploy Apple vault
        const datamAPPLUST = mirrorVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Mirror mAPPL-UST", "daoMirrorMAPPL", APPLPoolAddr,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await mirrorFactory.connect(multisig).createVault(datamAPPLUST)
        const mAPPLUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))
        const mAPPLUSTVault = await ethers.getContractAt("Mirror", mAPPLUSTVaultAddr, deployer)

        // Deploy Netflix vault
        const datamNFLXUST = mirrorVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Mirror mNFLX-UST", "daoMirrorMNFLX", NFLXPoolAddr,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await mirrorFactory.connect(multisig).createVault(datamNFLXUST)
        const mNFLXUSTVaultAddr = await mirrorFactory.getVault((await mirrorFactory.getVaultLength()).sub(1))
        const mNFLXUSTVault = await ethers.getContractAt("Mirror", mNFLXUSTVaultAddr, deployer)

        // Deploy Stonks
        const StonksStrategy = await ethers.getContractFactory("StonksStrategy", deployer)
        const stonksStrategy = await upgrades.deployProxy(StonksStrategy, [
            mMSFTUSTVaultAddr, mTWTRUSTVaultAddr, mTSLAUSTVaultAddr, mGOOGLUSTVaultAddr, mAMZNUSTVaultAddr, mAPPLUSTVaultAddr, mNFLXUSTVaultAddr
        ])
        const StonksVault = await ethers.getContractFactory("StonksVault", deployer)
        const stonksVault = await upgrades.deployProxy(StonksVault, [
            "DAO L2 Stonks V2", "daoSTO2",
            treasury.address, community.address, strategist.address, admin.address,
            biconomy.address, stonksStrategy.address
        ])
        await stonksStrategy.setVault(stonksVault.address)
        
        // Set whitelist
        await mMSFTUSTVault.connect(admin).setWhitelistAddress(stonksStrategy.address, true)
        await mTWTRUSTVault.connect(admin).setWhitelistAddress(stonksStrategy.address, true)
        await mTSLAUSTVault.connect(admin).setWhitelistAddress(stonksStrategy.address, true)
        await mGOOGLUSTVault.connect(admin).setWhitelistAddress(stonksStrategy.address, true)
        await mAMZNUSTVault.connect(admin).setWhitelistAddress(stonksStrategy.address, true)
        await mAPPLUSTVault.connect(admin).setWhitelistAddress(stonksStrategy.address, true)
        await mNFLXUSTVault.connect(admin).setWhitelistAddress(stonksStrategy.address, true)

        // Unlock & transfer Stablecoins to client
        network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
        const binanceAcc = await ethers.getSigner(binanceAddr)
        const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, binanceAcc)
        const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, binanceAcc)
        const DAIContract = new ethers.Contract(DAIAddr, IERC20_ABI, binanceAcc)
        await USDTContract.transfer(client.address, ethers.utils.parseUnits("10000", 6))
        await USDTContract.transfer(client2.address, ethers.utils.parseUnits("10000", 6))
        await USDCContract.transfer(client.address, ethers.utils.parseUnits("10000", 6))
        await USDCContract.transfer(client3.address, ethers.utils.parseUnits("10000", 6))
        await DAIContract.transfer(client.address, ethers.utils.parseUnits("10000", 18))

        // Deposit
        await USDTContract.connect(client).approve(stonksVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client).approve(stonksVault.address, ethers.constants.MaxUint256)
        await DAIContract.connect(client).approve(stonksVault.address, ethers.constants.MaxUint256)
        tx = await stonksVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        await stonksVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        await stonksVault.connect(client).deposit(ethers.utils.parseUnits("10000", 18), DAIAddr)
        // console.log(ethers.utils.formatEther(await stonksVault.balanceOf(client.address)))

        // Invest
        tx = await stonksVault.connect(admin).invest()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // console.log(ethers.utils.formatEther(await stonksVault.getAllPoolInETH())) // 8.179868425431329996
        // console.log(ethers.utils.formatEther(await stonksVault.getAllPoolInUSD())) // 29777.35820600784586746
        // console.log(ethers.utils.formatEther(
        //     (await stonksVault.balanceOf(client.address))
        //     .mul(await stonksVault.getPricePerFullShare())
        //     .div(ethers.utils.parseEther("1")) // 29777.35820600784585
        // )) // User share in USD
        // console.log(ethers.utils.formatEther(await stonksVault.getPricePerFullShare())) // 0.992578606866928195
        // console.log((await stonksStrategy.getCurrentCompositionPerc()).toString()); // 1428,1428,1428,1428,1428,1428,1428
        // console.log(ethers.utils.formatEther(await stonksVault.balanceOf(client.address))) // 30000.0
        // console.log(ethers.utils.formatEther(await stonksStrategy.watermark())) // 30000.0

        // Check fees
        // await stonksVault.connect(admin).transferOutFees()
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(treasury.address), 6))
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(community.address), 6))
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(strategist.address), 6))
        // console.log(ethers.utils.formatEther(await stonksVault.fees()))

        // Check Stablecoins keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(stonksVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(stonksVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(stonksVault.address), 18))

        // Second invest
        await USDTContract.connect(client2).approve(stonksVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client3).approve(stonksVault.address, ethers.constants.MaxUint256)
        tx = await stonksVault.connect(client2).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        receipt = await tx.wait()
        console.log(receipt.gasUsed.toString())
        await stonksVault.connect(client3).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        // console.log(ethers.utils.formatEther(await stonksVault.getAvailableInvest()))
        tx = await stonksVault.connect(admin).invest()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 2285996
        // console.log(ethers.utils.formatEther(await stonksVault.balanceOf(client2.address))) // 10110.782672207558898048
        // console.log(ethers.utils.formatEther(await stonksVault.balanceOf(client3.address))) // 10110.782672207558898048
        // console.log(ethers.utils.formatEther(await stonksVault.getAllPoolInETH())) // 13.644751236593533787
        // console.log(ethers.utils.formatEther(await stonksVault.getAllPoolInUSD())) // 49671.293482020702167575
        // console.log(ethers.utils.formatEther(await stonksVault.getPricePerFullShare())) // 0.989043116067356738
        // console.log((await stonksStrategy.getCurrentCompositionPerc()).toString()); // 1428,1428,1428,1428,1428,1428,1428
        // console.log(ethers.utils.formatEther(await stonksStrategy.watermark())) // 50000.0
        // console.log(ethers.utils.formatEther(await stonksVault.getAvailableInvest()))

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await mMSFTUSTVault.getAllPoolInUSD())) // 7095.948795472014612215
        // console.log(ethers.utils.formatEther(await mTWTRUSTVault.getAllPoolInUSD())) // 7095.948795472014612215
        // console.log(ethers.utils.formatEther(await mTSLAUSTVault.getAllPoolInUSD())) // 7095.964880722116693756
        // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInUSD())) // 7095.724645310536278354
        // console.log(ethers.utils.formatEther(await mAMZNUSTVault.getAllPoolInUSD())) // 7095.654618516811107034
        // console.log(ethers.utils.formatEther(await mAPPLUSTVault.getAllPoolInUSD())) // 7096.020705852583208862
        // console.log(ethers.utils.formatEther(await mNFLXUSTVault.getAllPoolInUSD())) // 7095.955348735692916506

        // Assume profit
        network.provider.request({method: "hardhat_impersonateAccount", params: [mAMZNUSTHolderAddr]})
        const unlockedAcc = await ethers.getSigner(mAMZNUSTHolderAddr)
        const mAMZNUSTContract = new ethers.Contract(mAMZNUSTAddr, IERC20_ABI, unlockedAcc)
        await mAMZNUSTContract.transfer(mAMZNUSTVaultAddr, ethers.utils.parseEther("5"))

        // Collect profit
        // const currentWatermark = await stonksStrategy.watermark()
        // const currentPool = await stonksVault.getAllPoolInUSD()
        // console.log(ethers.utils.formatEther(currentPool.sub(currentWatermark))) // 268.688076396889013834
        // console.log(ethers.utils.formatEther(await stonksVault.getPricePerFullShare())) // 1.000938296758745125
        tx = await stonksVault.connect(admin).collectProfitAndUpdateWatermark() 
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 377354
        // console.log(ethers.utils.formatEther(await stonksVault.fees())) // 53.737615279377802766
        // console.log(ethers.utils.formatEther(await stonksStrategy.watermark())) // 50214.950461117511211068
        // console.log(ethers.utils.formatEther(await stonksVault.getAllPoolInUSD())) // 50214.950461117511211068
        // console.log(ethers.utils.formatEther(await stonksVault.getPricePerFullShare())) // 0.999868285999206868

        // Test reimburse
        // await stonksVault.connect(admin).reimburse(0, USDTAddr, ethers.utils.parseUnits("1000", 6))
        // await stonksVault.connect(admin).reimburse(1, USDCAddr, ethers.utils.parseUnits("1000", 6))
        // await stonksVault.connect(admin).reimburse(2, DAIAddr, ethers.utils.parseUnits("1000", 18))
        // await stonksVault.connect(admin).reimburse(3, USDTAddr, ethers.utils.parseUnits("1000", 6))
        // await stonksVault.connect(admin).reimburse(4, USDCAddr, ethers.utils.parseUnits("1000", 6))
        // await stonksVault.connect(admin).reimburse(5, DAIAddr, ethers.utils.parseUnits("1000", 18))
        // await stonksVault.connect(admin).reimburse(6, USDTAddr, ethers.utils.parseUnits("1000", 6))
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(stonksVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(stonksVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(stonksVault.address), 18))
        // console.log(ethers.utils.formatEther(await stonksStrategy.watermark())) // 50293.071170472067808352
        // console.log((await stonksStrategy.getCurrentCompositionPerc()).toString());

        // Test emergency withdraw
        // await stonksVault.connect(admin).emergencyWithdraw()
        // console.log(ethers.utils.formatEther(await mMSFTUSTVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await mTWTRUSTVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await mTSLAUSTVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await mAMZNUSTVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await mAPPLUSTVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await mNFLXUSTVault.getAllPoolInUSD()))
        // const USTContract = new ethers.Contract(USTAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await USTContract.balanceOf(stonksVault.address)))
        // console.log(ethers.utils.formatEther(await USTContract.balanceOf(stonksStrategy.address)))

        // await stonksVault.connect(admin).reinvest()
        // console.log(ethers.utils.formatEther(await stonksStrategy.watermark())) // 50293.071170472067808352
        // console.log((await stonksStrategy.getCurrentCompositionPerc()).toString()); // 1428,1428,1428,1428,1428,1428,1428
        // console.log(ethers.utils.formatEther(await stonksVault.getAllPoolInUSD())) // 50024.641064451285003052
        // console.log(ethers.utils.formatEther(await stonksVault.getPricePerFullShare())) // 0.996078890042288741

        // Withdraw
        console.log("-----withdraw-----")
        await stonksVault.connect(client).withdraw((await stonksVault.balanceOf(client.address)).div(3), USDTAddr)
        await stonksVault.connect(client2).withdraw(stonksVault.balanceOf(client2.address), USDTAddr)
        await stonksVault.connect(client3).withdraw(stonksVault.balanceOf(client3.address), USDTAddr)
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client.address), 6)) // 10020.343307
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 10130.696151
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 10130.037173

        // await stonksVault.connect(client).withdraw((await stonksVault.balanceOf(client.address)).div(3), USDCAddr)
        // await stonksVault.connect(client2).withdraw(stonksVault.balanceOf(client2.address), USDCAddr)
        // await stonksVault.connect(client3).withdraw(stonksVault.balanceOf(client3.address), USDCAddr)
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client.address), 6)) // 10019.233023
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client2.address), 6)) // 10129.573627
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client3.address), 6)) // 10128.914708

        // await stonksVault.connect(client).withdraw((await stonksVault.balanceOf(client.address)).div(3), DAIAddr)
        // await stonksVault.connect(client2).withdraw(stonksVault.balanceOf(client2.address), DAIAddr)
        // await stonksVault.connect(client3).withdraw(stonksVault.balanceOf(client3.address), DAIAddr)
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client.address), 18)) // 10016.808704262031885107
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client2.address), 18)) // 10127.122539132309537071
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client3.address), 18)) // 10126.463710071705723272

        // console.log(ethers.utils.formatEther(await stonksVault.getAllPoolInUSD())) // 19994.078134800171431727
        // console.log(ethers.utils.formatEther(await stonksVault.getPricePerFullShare())) // 0.999703906740008571
        // console.log((await stonksStrategy.getCurrentCompositionPerc()).toString()); // 1411,1411,1411,1411,1530,1411,1411
        // console.log(ethers.utils.formatEther(await stonksStrategy.watermark())) // 19999.020884322386855677

        // console.log(ethers.utils.formatEther(await mMSFTUSTVault.getAllPoolInUSD())) // 2829.99341725763732707
        // console.log(ethers.utils.formatEther(await mTWTRUSTVault.getAllPoolInUSD())) // 2829.993137693699720961
        // console.log(ethers.utils.formatEther(await mTSLAUSTVault.getAllPoolInUSD())) // 2829.958715072539953781
        // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInUSD())) // 2829.86330444897997172
        // console.log(ethers.utils.formatEther(await mAMZNUSTVault.getAllPoolInUSD())) // 3068.045883581543136473
        // console.log(ethers.utils.formatEther(await mAPPLUSTVault.getAllPoolInUSD())) // 2829.988068633484443712
        // console.log(ethers.utils.formatEther(await mNFLXUSTVault.getAllPoolInUSD())) // 2829.973223391664680776
    })


    // it("should work for Mirror L1 mTWTRUST vault contract", async () => {
    //     let tx, receipt
    //     const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

    //     // Deploy
    //     const MirrorVault = await ethers.getContractFactory("Mirror", deployer)
    //     const mirrorVault = await MirrorVault.deploy()
    //     const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    //     const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)

    //     const MirrorFactory = await ethers.getContractFactory("MirrorFactory", deployer)
    //     const mirrorFactory = await MirrorFactory.deploy(mirrorVault.address)
    //     await mirrorFactory.transferOwnership(multisig.address)
        
    //     const datamTWTRUST = mirrorVaultInterface.encodeFunctionData(
    //         "initialize",
    //         [
    //             "DAO L1 Mirror mTWTR-UST", "daoMirrorMTWTR", TWTRPoolAddr,
    //             treasury.address, community.address, strategist.address, admin.address,
    //         ]
    //     )
    //     await mirrorFactory.connect(multisig).createVault(datamTWTRUST)
    //     const mTWTRUSTVaultAddr = await mirrorFactory.getVault(0)
    //     const mTWTRUSTVault = await ethers.getContractAt("Mirror", mTWTRUSTVaultAddr, deployer)

    //     // Unlock & transfer
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [mTWTRUSTHolderAddr]})
    //     const unlockedAcc = await ethers.getSigner(mTWTRUSTHolderAddr)
    //     const mTWTRUSTContract = new ethers.Contract(mTWTRUSTAddr, IERC20_ABI, unlockedAcc)
    //     await mTWTRUSTContract.transfer(client.address, ethers.utils.parseEther("1"))
    //     await mTWTRUSTContract.transfer(client2.address, ethers.utils.parseEther("1"))

    //     // Whitelist
    //     await mTWTRUSTVault.connect(admin).setWhitelistAddress(client.address, true)

    //     // Deposit
    //     await mTWTRUSTContract.connect(client).approve(mTWTRUSTVault.address, ethers.constants.MaxUint256)
    //     tx = await mTWTRUSTVault.connect(client).deposit(ethers.utils.parseEther("1"))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mTWTRUSTVault.balanceOf(client.address)))

    //     // Invest
    //     tx = await mTWTRUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())

    //     // Second deposit
    //     await mTWTRUSTContract.connect(client2).approve(mTWTRUSTVault.address, ethers.constants.MaxUint256)
    //     await mTWTRUSTVault.connect(client2).deposit(ethers.utils.parseEther("1"))
    //     // console.log(ethers.utils.formatEther(await mTWTRUSTVault.balanceOf(client2.address)))

    //     // Check fees (deposit fees)
    //     // console.log(ethers.utils.formatEther(await mTWTRUSTContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await mTWTRUSTContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await mTWTRUSTContract.balanceOf(strategist.address)))

    //     // Second invest
    //     tx = await mTWTRUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mTWTRUSTVault.getAllPoolInUSD()))

    //     // Yield (assume profit)
    //     // console.log(ethers.utils.formatEther(await mTWTRUSTVault.getPricePerFullShare(false)))
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
    //     const binanceAcc = await ethers.getSigner(binanceAddr)
    //     const MIRContract = new ethers.Contract(MIRAddr, IERC20_ABI, binanceAcc)
    //     await MIRContract.transfer(mTWTRUSTVault.address, ethers.utils.parseEther("1"))
    //     tx = await mTWTRUSTVault.connect(admin).yield()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mTWTRUSTVault.getPricePerFullShare(false)))

    //     // Check fees (yield fees)
    //     // console.log(ethers.utils.formatEther(await admin.getBalance()))
    //     // console.log(ethers.utils.formatEther(await community.getBalance()))
    //     // console.log(ethers.utils.formatEther(await strategist.getBalance()))

    //     // // Emergency withdrawal
    //     // await mTWTRUSTVault.connect(admin).emergencyWithdraw()
    //     // await mTWTRUSTVault.connect(admin).reinvest()

    //     // Getter function
    //     await network.provider.send("evm_mine")
    //     console.log(ethers.utils.formatEther(await mTWTRUSTVault.getPendingRewards())) // 0.000001522011525163
    //     console.log(ethers.utils.formatEther(await mTWTRUSTVault.getAllPool())) // 1.900000192883245977
    //     console.log(ethers.utils.formatEther(await mTWTRUSTVault.getAllPoolInETH())) // 0.008679396488105619
    //     console.log(ethers.utils.formatEther(await mTWTRUSTVault.getAllPoolInUSD())) // 31.52931285843937124
    //     console.log(ethers.utils.formatEther((await mTWTRUSTVault.balanceOf(client.address)) // 16.594375188652300652
    //         .mul(await mTWTRUSTVault.getPricePerFullShare(true))
    //         .div(ethers.utils.parseEther("1"))
    //     ))

    //     // Withdraw
    //     tx = await mTWTRUSTVault.connect(client).withdraw(mTWTRUSTVault.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mTWTRUSTContract.balanceOf(client.address))) // 1.000000101517497882

    //     tx = await mTWTRUSTVault.connect(client2).withdraw(mTWTRUSTVault.balanceOf(client2.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mTWTRUSTContract.balanceOf(client2.address))) // 0.900000091365748095
    // })


    // it("should work for Mirror L1 mTSLAUST vault contract", async () => {
    //     let tx, receipt
    //     const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

    //     // Deploy
    //     const MirrorVault = await ethers.getContractFactory("Mirror", deployer)
    //     const mirrorVault = await MirrorVault.deploy()
    //     const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    //     const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)

    //     const MirrorFactory = await ethers.getContractFactory("MirrorFactory", deployer)
    //     const mirrorFactory = await MirrorFactory.deploy(mirrorVault.address)
    //     await mirrorFactory.transferOwnership(multisig.address)
        
    //     const datamTSLAUST = mirrorVaultInterface.encodeFunctionData(
    //         "initialize",
    //         [
    //             "DAO L1 Mirror mTSLA-UST", "daoMirrorMTSLA", TSLAPoolAddr,
    //             treasury.address, community.address, strategist.address, admin.address,
    //         ]
    //     )
    //     await mirrorFactory.connect(multisig).createVault(datamTSLAUST)
    //     const mTSLAUSTVaultAddr = await mirrorFactory.getVault(0)
    //     const mTSLAUSTVault = await ethers.getContractAt("Mirror", mTSLAUSTVaultAddr, deployer)

    //     // Unlock & transfer
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [mTSLAUSTHolderAddr]})
    //     const unlockedAcc = await ethers.getSigner(mTSLAUSTHolderAddr)
    //     await deployer.sendTransaction({to: unlockedAcc.address, value: ethers.utils.parseEther("10")})
    //     const mTSLAUSTContract = new ethers.Contract(mTSLAUSTAddr, IERC20_ABI, unlockedAcc)
    //     await mTSLAUSTContract.transfer(client.address, ethers.utils.parseEther("1"))
    //     await mTSLAUSTContract.transfer(client2.address, ethers.utils.parseEther("1"))

    //     // Whitelist
    //     await mTSLAUSTVault.connect(admin).setWhitelistAddress(client.address, true)

    //     // Deposit
    //     await mTSLAUSTContract.connect(client).approve(mTSLAUSTVault.address, ethers.constants.MaxUint256)
    //     tx = await mTSLAUSTVault.connect(client).deposit(ethers.utils.parseEther("1"))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mTSLAUSTVault.balanceOf(client.address)))

    //     // Invest
    //     tx = await mTSLAUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())

    //     // Second deposit
    //     await mTSLAUSTContract.connect(client2).approve(mTSLAUSTVault.address, ethers.constants.MaxUint256)
    //     await mTSLAUSTVault.connect(client2).deposit(ethers.utils.parseEther("1"))
    //     // console.log(ethers.utils.formatEther(await mTSLAUSTVault.balanceOf(client2.address)))

    //     // Check fees (deposit fees)
    //     // console.log(ethers.utils.formatEther(await mTSLAUSTContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await mTSLAUSTContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await mTSLAUSTContract.balanceOf(strategist.address)))

    //     // Second invest
    //     tx = await mTSLAUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mTSLAUSTVault.getAllPoolInUSD()))

    //     // Yield (assume profit)
    //     // console.log(ethers.utils.formatEther(await mTSLAUSTVault.getPricePerFullShare(false)))
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
    //     const binanceAcc = await ethers.getSigner(binanceAddr)
    //     const MIRContract = new ethers.Contract(MIRAddr, IERC20_ABI, binanceAcc)
    //     await MIRContract.transfer(mTSLAUSTVault.address, ethers.utils.parseEther("1"))
    //     tx = await mTSLAUSTVault.connect(admin).yield()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mTSLAUSTVault.getPricePerFullShare(false)))

    //     // Check fees (yield fees)
    //     // console.log(ethers.utils.formatEther(await admin.getBalance()))
    //     // console.log(ethers.utils.formatEther(await community.getBalance()))
    //     // console.log(ethers.utils.formatEther(await strategist.getBalance()))

    //     // // Emergency withdrawal
    //     // await mTSLAUSTVault.connect(admin).emergencyWithdraw()
    //     // await mTSLAUSTVault.connect(admin).reinvest()

    //     // Getter function
    //     await network.provider.send("evm_mine")
    //     console.log(ethers.utils.formatEther(await mTSLAUSTVault.getPendingRewards())) // 0.00000496092619397
    //     console.log(ethers.utils.formatEther(await mTSLAUSTVault.getAllPool())) // 1.900000197307489176
    //     console.log(ethers.utils.formatEther(await mTSLAUSTVault.getAllPoolInETH())) // 0.030169112596209846
    //     console.log(ethers.utils.formatEther(await mTSLAUSTVault.getAllPoolInUSD())) // 109.594185610824358469
    //     console.log(ethers.utils.formatEther((await mTSLAUSTVault.balanceOf(client.address)) // 57.681150321486504457
    //         .mul(await mTSLAUSTVault.getPricePerFullShare(true))
    //         .div(ethers.utils.parseEther("1"))
    //     ))

    //     // Withdraw
    //     tx = await mTSLAUSTVault.connect(client).withdraw(mTSLAUSTVault.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mTSLAUSTContract.balanceOf(client.address))) // 1.000000103846046934

    //     tx = await mTSLAUSTVault.connect(client2).withdraw(mTSLAUSTVault.balanceOf(client2.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mTSLAUSTContract.balanceOf(client2.address))) // 0.900000093461442242
    // })


    // it("should work for Mirror L1 mGOOGLUST vault contract", async () => {
    //     let tx, receipt
    //     const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

    //     // Deploy
    //     const MirrorVault = await ethers.getContractFactory("Mirror", deployer)
    //     const mirrorVault = await MirrorVault.deploy()
    //     const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    //     const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)

    //     const MirrorFactory = await ethers.getContractFactory("MirrorFactory", deployer)
    //     const mirrorFactory = await MirrorFactory.deploy(mirrorVault.address)
    //     await mirrorFactory.transferOwnership(multisig.address)
        
    //     const datamGOOGLUST = mirrorVaultInterface.encodeFunctionData(
    //         "initialize",
    //         [
    //             "DAO L1 Mirror mGOOGL-UST", "daoMirrorMGOOGL", GOOGLPoolAddr,
    //             treasury.address, community.address, strategist.address, admin.address,
    //         ]
    //     )
    //     await mirrorFactory.connect(multisig).createVault(datamGOOGLUST)
    //     const mGOOGLUSTVaultAddr = await mirrorFactory.getVault(0)
    //     const mGOOGLUSTVault = await ethers.getContractAt("Mirror", mGOOGLUSTVaultAddr, deployer)

    //     // Unlock & transfer
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [mGOOGLUSTHolderAddr]})
    //     const unlockedAcc = await ethers.getSigner(mGOOGLUSTHolderAddr)
    //     const mGOOGLUSTContract = new ethers.Contract(mGOOGLUSTAddr, IERC20_ABI, unlockedAcc)
    //     await mGOOGLUSTContract.transfer(client.address, ethers.utils.parseEther("1"))
    //     await mGOOGLUSTContract.transfer(client2.address, ethers.utils.parseEther("1"))

    //     // Whitelist
    //     await mGOOGLUSTVault.connect(admin).setWhitelistAddress(client.address, true)

    //     // Deposit
    //     await mGOOGLUSTContract.connect(client).approve(mGOOGLUSTVault.address, ethers.constants.MaxUint256)
    //     tx = await mGOOGLUSTVault.connect(client).deposit(ethers.utils.parseEther("1"))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.balanceOf(client.address)))

    //     // Invest
    //     tx = await mGOOGLUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())

    //     // Second deposit
    //     await mGOOGLUSTContract.connect(client2).approve(mGOOGLUSTVault.address, ethers.constants.MaxUint256)
    //     await mGOOGLUSTVault.connect(client2).deposit(ethers.utils.parseEther("1"))
    //     // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.balanceOf(client2.address)))

    //     // Check fees (deposit fees)
    //     // console.log(ethers.utils.formatEther(await mGOOGLUSTContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await mGOOGLUSTContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await mGOOGLUSTContract.balanceOf(strategist.address)))

    //     // Second invest
    //     tx = await mGOOGLUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInUSD()))

    //     // Yield (assume profit)
    //     // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getPricePerFullShare(false)))
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
    //     const binanceAcc = await ethers.getSigner(binanceAddr)
    //     const MIRContract = new ethers.Contract(MIRAddr, IERC20_ABI, binanceAcc)
    //     await MIRContract.transfer(mGOOGLUSTVault.address, ethers.utils.parseEther("1"))
    //     tx = await mGOOGLUSTVault.connect(admin).yield()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getPricePerFullShare(false)))

    //     // Check fees (yield fees)
    //     // console.log(ethers.utils.formatEther(await admin.getBalance()))
    //     // console.log(ethers.utils.formatEther(await community.getBalance()))
    //     // console.log(ethers.utils.formatEther(await strategist.getBalance()))

    //     // // Emergency withdrawal
    //     // await mGOOGLUSTVault.connect(admin).emergencyWithdraw()
    //     // await mGOOGLUSTVault.connect(admin).reinvest()

    //     // Getter function
    //     await network.provider.send("evm_mine")
    //     console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getPendingRewards())) // 0.000000879866435658
    //     console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPool())) // 1.900000084819443358
    //     console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInETH())) // 0.058921378061136803
    //     console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInUSD())) // 214.04144464259220837
    //     console.log(ethers.utils.formatEther((await mGOOGLUSTVault.balanceOf(client.address)) // 112.653391917153793878
    //         .mul(await mGOOGLUSTVault.getPricePerFullShare(true))
    //         .div(ethers.utils.parseEther("1"))
    //     ))

    //     // Withdraw
    //     tx = await mGOOGLUSTVault.connect(client).withdraw(mGOOGLUSTVault.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mGOOGLUSTContract.balanceOf(client.address))) // 1.014176543988181653

    //     tx = await mGOOGLUSTVault.connect(client2).withdraw(mGOOGLUSTVault.balanceOf(client2.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mGOOGLUSTContract.balanceOf(client2.address))) // 0.912758889589363488
    // })


    // it("should work for Mirror L1 mAMZNUST vault contract", async () => {
    //     let tx, receipt
    //     const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

    //     // Deploy
    //     const MirrorVault = await ethers.getContractFactory("Mirror", deployer)
    //     const mirrorVault = await MirrorVault.deploy()
    //     const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    //     const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)

    //     const MirrorFactory = await ethers.getContractFactory("MirrorFactory", deployer)
    //     const mirrorFactory = await MirrorFactory.deploy(mirrorVault.address)
    //     await mirrorFactory.transferOwnership(multisig.address)
        
    //     const datamAMZNUST = mirrorVaultInterface.encodeFunctionData(
    //         "initialize",
    //         [
    //             "DAO L1 Mirror mAMZN-UST", "daoMirrorMAMZN", AMZNPoolAddr,
    //             treasury.address, community.address, strategist.address, admin.address,
    //         ]
    //     )
    //     await mirrorFactory.connect(multisig).createVault(datamAMZNUST)
    //     const mAMZNUSTVaultAddr = await mirrorFactory.getVault(0)
    //     const mAMZNUSTVault = await ethers.getContractAt("Mirror", mAMZNUSTVaultAddr, deployer)

    //     // Unlock & transfer
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [mAMZNUSTHolderAddr]})
    //     const unlockedAcc = await ethers.getSigner(mAMZNUSTHolderAddr)
    //     const mAMZNUSTContract = new ethers.Contract(mAMZNUSTAddr, IERC20_ABI, unlockedAcc)
    //     await mAMZNUSTContract.transfer(client.address, ethers.utils.parseEther("1"))
    //     await mAMZNUSTContract.transfer(client2.address, ethers.utils.parseEther("1"))

    //     // Whitelist
    //     await mAMZNUSTVault.connect(admin).setWhitelistAddress(client.address, true)

    //     // Deposit
    //     await mAMZNUSTContract.connect(client).approve(mAMZNUSTVault.address, ethers.constants.MaxUint256)
    //     tx = await mAMZNUSTVault.connect(client).deposit(ethers.utils.parseEther("1"))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mAMZNUSTVault.balanceOf(client.address)))

    //     // Invest
    //     tx = await mAMZNUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())

    //     // Second deposit
    //     await mAMZNUSTContract.connect(client2).approve(mAMZNUSTVault.address, ethers.constants.MaxUint256)
    //     await mAMZNUSTVault.connect(client2).deposit(ethers.utils.parseEther("1"))
    //     // console.log(ethers.utils.formatEther(await mAMZNUSTVault.balanceOf(client2.address)))

    //     // Check fees (deposit fees)
    //     // console.log(ethers.utils.formatEther(await mAMZNUSTContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await mAMZNUSTContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await mAMZNUSTContract.balanceOf(strategist.address)))

    //     // Second invest
    //     tx = await mAMZNUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mAMZNUSTVault.getAllPoolInUSD()))

    //     // Yield (assume profit)
    //     // console.log(ethers.utils.formatEther(await mAMZNUSTVault.getPricePerFullShare(false)))
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
    //     const binanceAcc = await ethers.getSigner(binanceAddr)
    //     const MIRContract = new ethers.Contract(MIRAddr, IERC20_ABI, binanceAcc)
    //     await MIRContract.transfer(mAMZNUSTVault.address, ethers.utils.parseEther("1"))
    //     tx = await mAMZNUSTVault.connect(admin).yield()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mAMZNUSTVault.getPricePerFullShare(false)))

    //     // Check fees (yield fees)
    //     // console.log(ethers.utils.formatEther(await admin.getBalance()))
    //     // console.log(ethers.utils.formatEther(await community.getBalance()))
    //     // console.log(ethers.utils.formatEther(await strategist.getBalance()))

    //     // // Emergency withdrawal
    //     // await mAMZNUSTVault.connect(admin).emergencyWithdraw()
    //     // await mAMZNUSTVault.connect(admin).reinvest()

    //     // Getter function
    //     await network.provider.send("evm_mine")
    //     console.log(ethers.utils.formatEther(await mAMZNUSTVault.getPendingRewards())) // 0.000000955414519155
    //     console.log(ethers.utils.formatEther(await mAMZNUSTVault.getAllPool())) // 1.900000084048078048
    //     console.log(ethers.utils.formatEther(await mAMZNUSTVault.getAllPoolInETH())) // 0.064566334937376183
    //     console.log(ethers.utils.formatEther(await mAMZNUSTVault.getAllPoolInUSD())) // 234.54766436273736137
    //     console.log(ethers.utils.formatEther((await mAMZNUSTVault.balanceOf(client.address)) // 123.446139138282821773
    //         .mul(await mAMZNUSTVault.getPricePerFullShare(true))
    //         .div(ethers.utils.parseEther("1"))
    //     ))

    //     // Withdraw
    //     tx = await mAMZNUSTVault.connect(client).withdraw(mAMZNUSTVault.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mAMZNUSTContract.balanceOf(client.address))) // 1.000000102783389451

    //     tx = await mAMZNUSTVault.connect(client2).withdraw(mAMZNUSTVault.balanceOf(client2.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mAMZNUSTContract.balanceOf(client2.address))) // 0.900000092505050506
    // })


    // it("should work for Mirror L1 mAPPLUST vault contract", async () => {
    //     let tx, receipt
    //     const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

    //     // Deploy
    //     const MirrorVault = await ethers.getContractFactory("Mirror", deployer)
    //     const mirrorVault = await MirrorVault.deploy()
    //     const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    //     const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)

    //     const MirrorFactory = await ethers.getContractFactory("MirrorFactory", deployer)
    //     const mirrorFactory = await MirrorFactory.deploy(mirrorVault.address)
    //     await mirrorFactory.transferOwnership(multisig.address)
        
    //     const datamAPPLUST = mirrorVaultInterface.encodeFunctionData(
    //         "initialize",
    //         [
    //             "DAO L1 Mirror mAPPL-UST", "daoMirrorMAPPL", APPLPoolAddr,
    //             treasury.address, community.address, strategist.address, admin.address,
    //         ]
    //     )
    //     await mirrorFactory.connect(multisig).createVault(datamAPPLUST)
    //     const mAPPLUSTVaultAddr = await mirrorFactory.getVault(0)
    //     const mAPPLUSTVault = await ethers.getContractAt("Mirror", mAPPLUSTVaultAddr, deployer)

    //     // Unlock & transfer
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [mAPPLUSTHolderAddr]})
    //     const unlockedAcc = await ethers.getSigner(mAPPLUSTHolderAddr)
    //     const mAPPLUSTContract = new ethers.Contract(mAPPLUSTAddr, IERC20_ABI, unlockedAcc)
    //     await mAPPLUSTContract.transfer(client.address, ethers.utils.parseEther("1"))
    //     await mAPPLUSTContract.transfer(client2.address, ethers.utils.parseEther("1"))

    //     // Whitelist
    //     await mAPPLUSTVault.connect(admin).setWhitelistAddress(client.address, true)

    //     // Deposit
    //     await mAPPLUSTContract.connect(client).approve(mAPPLUSTVault.address, ethers.constants.MaxUint256)
    //     tx = await mAPPLUSTVault.connect(client).deposit(ethers.utils.parseEther("1"))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mAPPLUSTVault.balanceOf(client.address)))

    //     // Invest
    //     tx = await mAPPLUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())

    //     // Second deposit
    //     await mAPPLUSTContract.connect(client2).approve(mAPPLUSTVault.address, ethers.constants.MaxUint256)
    //     await mAPPLUSTVault.connect(client2).deposit(ethers.utils.parseEther("1"))
    //     // console.log(ethers.utils.formatEther(await mAPPLUSTVault.balanceOf(client2.address)))

    //     // Check fees (deposit fees)
    //     // console.log(ethers.utils.formatEther(await mAPPLUSTContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await mAPPLUSTContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await mAPPLUSTContract.balanceOf(strategist.address)))

    //     // Second invest
    //     tx = await mAPPLUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mAPPLUSTVault.getAllPoolInUSD()))

    //     // Yield (assume profit)
    //     // console.log(ethers.utils.formatEther(await mAPPLUSTVault.getPricePerFullShare(false)))
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
    //     const binanceAcc = await ethers.getSigner(binanceAddr)
    //     const MIRContract = new ethers.Contract(MIRAddr, IERC20_ABI, binanceAcc)
    //     await MIRContract.transfer(mAPPLUSTVault.address, ethers.utils.parseEther("1"))
    //     tx = await mAPPLUSTVault.connect(admin).yield()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mAPPLUSTVault.getPricePerFullShare(false)))

    //     // Check fees (yield fees)
    //     // console.log(ethers.utils.formatEther(await admin.getBalance()))
    //     // console.log(ethers.utils.formatEther(await community.getBalance()))
    //     // console.log(ethers.utils.formatEther(await strategist.getBalance()))

    //     // // Emergency withdrawal
    //     // await mAPPLUSTVault.connect(admin).emergencyWithdraw()
    //     // await mAPPLUSTVault.connect(admin).reinvest()

    //     // Getter function
    //     await network.provider.send("evm_mine")
    //     console.log(ethers.utils.formatEther(await mAPPLUSTVault.getPendingRewards())) // 0.000002571563992022
    //     console.log(ethers.utils.formatEther(await mAPPLUSTVault.getAllPool())) // 1.900000206661516435
    //     console.log(ethers.utils.formatEther(await mAPPLUSTVault.getAllPoolInETH())) // 0.013433603530257075
    //     console.log(ethers.utils.formatEther(await mAPPLUSTVault.getAllPoolInUSD())) // 48.799739601958917467
    //     console.log(ethers.utils.formatEther((await mAPPLUSTVault.balanceOf(client.address)) // 25.684073474715219719
    //         .mul(await mAPPLUSTVault.getPricePerFullShare(true))
    //         .div(ethers.utils.parseEther("1"))
    //     ))

    //     // Withdraw
    //     tx = await mAPPLUSTVault.connect(client).withdraw(mAPPLUSTVault.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mAPPLUSTContract.balanceOf(client.address))) // 1.000000108769219176

    //     tx = await mAPPLUSTVault.connect(client2).withdraw(mAPPLUSTVault.balanceOf(client2.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mAPPLUSTContract.balanceOf(client2.address))) // 0.900000097892297259
    // })


    // it("should work for Mirror L1 mNFLXUST vault contract", async () => {
    //     let tx, receipt
    //     const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

    //     // Deploy
    //     const MirrorVault = await ethers.getContractFactory("Mirror", deployer)
    //     const mirrorVault = await MirrorVault.deploy()
    //     const mirrorVaultArtifact = await artifacts.readArtifact("Mirror")
    //     const mirrorVaultInterface = new ethers.utils.Interface(mirrorVaultArtifact.abi)

    //     const MirrorFactory = await ethers.getContractFactory("MirrorFactory", deployer)
    //     const mirrorFactory = await MirrorFactory.deploy(mirrorVault.address)
    //     await mirrorFactory.transferOwnership(multisig.address)
        
    //     const datamNFLXUST = mirrorVaultInterface.encodeFunctionData(
    //         "initialize",
    //         [
    //             "DAO L1 Mirror mNFLX-UST", "daoMirrorMNFLX", NFLXPoolAddr,
    //             treasury.address, community.address, strategist.address, admin.address,
    //         ]
    //     )
    //     await mirrorFactory.connect(multisig).createVault(datamNFLXUST)
    //     const mNFLXUSTVaultAddr = await mirrorFactory.getVault(0)
    //     const mNFLXUSTVault = await ethers.getContractAt("Mirror", mNFLXUSTVaultAddr, deployer)

    //     // Unlock & transfer
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [mNFLXUSTHolderAddr]})
    //     const unlockedAcc = await ethers.getSigner(mNFLXUSTHolderAddr)
    //     const mNFLXUSTContract = new ethers.Contract(mNFLXUSTAddr, IERC20_ABI, unlockedAcc)
    //     await mNFLXUSTContract.transfer(client.address, ethers.utils.parseEther("1"))
    //     // await mNFLXUSTContract.transfer(client2.address, ethers.utils.parseEther("1"))

    //     // Whitelist
    //     await mNFLXUSTVault.connect(admin).setWhitelistAddress(client.address, true)

    //     // Deposit
    //     await mNFLXUSTContract.connect(client).approve(mNFLXUSTVault.address, ethers.constants.MaxUint256)
    //     tx = await mNFLXUSTVault.connect(client).deposit(ethers.utils.parseEther("1"))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mNFLXUSTVault.balanceOf(client.address)))

    //     // Invest
    //     tx = await mNFLXUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())

    //     // Second deposit
    //     // await mNFLXUSTContract.connect(client2).approve(mNFLXUSTVault.address, ethers.constants.MaxUint256)
    //     // await mNFLXUSTVault.connect(client2).deposit(ethers.utils.parseEther("1"))
    //     // console.log(ethers.utils.formatEther(await mNFLXUSTVault.balanceOf(client2.address)))

    //     // Check fees (deposit fees)
    //     // console.log(ethers.utils.formatEther(await mNFLXUSTContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await mNFLXUSTContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await mNFLXUSTContract.balanceOf(strategist.address)))

    //     // Second invest
    //     // tx = await mNFLXUSTVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mNFLXUSTVault.getAllPoolInUSD()))

    //     // Yield (assume profit)
    //     // console.log(ethers.utils.formatEther(await mNFLXUSTVault.getPricePerFullShare(false)))
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
    //     const binanceAcc = await ethers.getSigner(binanceAddr)
    //     const MIRContract = new ethers.Contract(MIRAddr, IERC20_ABI, binanceAcc)
    //     await MIRContract.transfer(mNFLXUSTVault.address, ethers.utils.parseEther("1"))
    //     tx = await mNFLXUSTVault.connect(admin).yield()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mNFLXUSTVault.getPricePerFullShare(false)))

    //     // Check fees (yield fees)
    //     // console.log(ethers.utils.formatEther(await admin.getBalance()))
    //     // console.log(ethers.utils.formatEther(await community.getBalance()))
    //     // console.log(ethers.utils.formatEther(await strategist.getBalance()))

    //     // // Emergency withdrawal
    //     // await mNFLXUSTVault.connect(admin).emergencyWithdraw()
    //     // await mNFLXUSTVault.connect(admin).reinvest()

    //     // Getter function
    //     await network.provider.send("evm_mine")
    //     console.log(ethers.utils.formatEther(await mNFLXUSTVault.getPendingRewards())) // 0.000000200688826835
    //     console.log(ethers.utils.formatEther(await mNFLXUSTVault.getAllPool())) // 1.000000035991752608
    //     console.log(ethers.utils.formatEther(await mNFLXUSTVault.getAllPoolInETH())) // 0.013974072328657952
    //     console.log(ethers.utils.formatEther(await mNFLXUSTVault.getAllPoolInUSD())) // 50.763080009135702894
    //     console.log(ethers.utils.formatEther((await mNFLXUSTVault.balanceOf(client.address)) // 50.763080009135702894
    //         .mul(await mNFLXUSTVault.getPricePerFullShare(true))
    //         .div(ethers.utils.parseEther("1"))
    //     ))

    //     // Withdraw
    //     tx = await mNFLXUSTVault.connect(client).withdraw(mNFLXUSTVault.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await mNFLXUSTContract.balanceOf(client.address))) // 1.000000035991752608

    //     // tx = await mNFLXUSTVault.connect(client2).withdraw(mNFLXUSTVault.balanceOf(client2.address))
    //     // // receipt = await tx.wait()
    //     // // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await mNFLXUSTContract.balanceOf(client2.address))) // 
    // })
})