const { ethers, artifacts, network, upgrades } = require("hardhat")
const IERC20_ABI = require("../abis/IERC20_ABI.json")

const binanceAddr = "0x28C6c06298d514Db089934071355E5743bf21d60"

const USDTAddr = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDCAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAIAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

describe("DAO Technical Analysis", () => {
    it("should work for DAO L2 TA contract", async () => {
        let tx, receipt
        const [client, client2, client3, treasury, community, strategist, admin, biconomy, multisig] = await ethers.getSigners()

        const deployerAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
        await network.provider.request({method: "hardhat_impersonateAccount", params: [deployerAddr]})
        const deployer = await ethers.getSigner(deployerAddr)
        await client.sendTransaction({to: deployer.address, value: ethers.utils.parseEther("10")})

        // Get Sushi factory contract
        const sushiFactory = await ethers.getContractAt("SushiFactory", "0x1D5c8FA8aa068726b84f6b45992C8f0f225A4ff3", deployer)
        const sushiVaultArtifact = await artifacts.readArtifact("Sushi")
        const sushiVaultInterface = new ethers.utils.Interface(sushiVaultArtifact.abi)

        // Deploy WBTC-ETH vault
        const dataWBTCETH = sushiVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Sushi WBTC-ETH", "daoSushiWBTC", 21,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await sushiFactory.createVault(dataWBTCETH)
        const WBTCETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        const WBTCETHVault = await ethers.getContractAt("Sushi", WBTCETHVaultAddr, deployer)

        // Deploy USDC-ETH vault
        const dataUSDCETH = sushiVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Sushi USDC-ETH", "daoSushiUSDC", 1,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await sushiFactory.createVault(dataUSDCETH)
        const USDCETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        const USDCETHVault = await ethers.getContractAt("Sushi", USDCETHVaultAddr, deployer)

        // Deploy TA
        const TAStrategy = await ethers.getContractFactory("TAStrategy", deployer)
        const taStrategy = await upgrades.deployProxy(TAStrategy, [
            WBTCETHVaultAddr, USDCETHVaultAddr, true
        ])
        const TAVault = await ethers.getContractFactory("TAVault", deployer)
        const taVault = await upgrades.deployProxy(TAVault, [
            "DAO L2 Tech Anlys", "daoTAS",
            treasury.address, community.address, strategist.address, admin.address,
            biconomy.address, taStrategy.address
        ])
        await taStrategy.setVault(taVault.address)
        
        // Set whitelist
        await WBTCETHVault.connect(admin).setWhitelistAddress(taStrategy.address, true)
        await USDCETHVault.connect(admin).setWhitelistAddress(taStrategy.address, true)

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
        await USDTContract.connect(client).approve(taVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client).approve(taVault.address, ethers.constants.MaxUint256)
        await DAIContract.connect(client).approve(taVault.address, ethers.constants.MaxUint256)
        tx = await taVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        receipt = await tx.wait()
        console.log(receipt.gasUsed.toString()) // 220515
        await taVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        await taVault.connect(client).deposit(ethers.utils.parseUnits("10000", 18), DAIAddr)
        console.log(ethers.utils.formatEther(await taVault.balanceOf(client.address))) // 0.0

        // Invest
        tx = await taVault.connect(admin).invest()
        receipt = await tx.wait()
        console.log(receipt.gasUsed.toString()) // 862486
        console.log(ethers.utils.formatEther(await taVault.getAllPoolInETH())) // 8.179868425431329996
        console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 29777.35820600784586746
        console.log(ethers.utils.formatEther(
            (await taVault.balanceOf(client.address))
            .mul(await taVault.getPricePerFullShare())
            .div(ethers.utils.parseEther("1")) // 29777.35820600784585
        )) // User share in USD
        console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 0.992578606866928195
        console.log(ethers.utils.formatEther(await taVault.balanceOf(client.address))) // 30000.0
        console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 30000.0

        // // Check fees
        // // await taVault.connect(admin).transferOutFees()
        // // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(treasury.address), 6))
        // // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(community.address), 6))
        // // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(strategist.address), 6))
        // // console.log(ethers.utils.formatEther(await taVault.fees()))

        // // Check Stablecoins keep in vault
        // // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(taVault.address), 6))
        // // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(taVault.address), 6))
        // // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(taVault.address), 18))

        // // Second invest
        // await USDTContract.connect(client2).approve(taVault.address, ethers.constants.MaxUint256)
        // await USDCContract.connect(client3).approve(taVault.address, ethers.constants.MaxUint256)
        // tx = await taVault.connect(client2).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // await taVault.connect(client3).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        // // console.log(ethers.utils.formatEther(await taVault.getAvailableInvest()))
        // tx = await taVault.connect(admin).invest()
        // // receipt = await tx.wait()
        // // console.log(receipt.gasUsed.toString()) // 2285996
        // // console.log(ethers.utils.formatEther(await taVault.balanceOf(client2.address))) // 10110.782672207558898048
        // // console.log(ethers.utils.formatEther(await taVault.balanceOf(client3.address))) // 10110.782672207558898048
        // // console.log(ethers.utils.formatEther(await taVault.getAllPoolInETH())) // 13.644751236593533787
        // // console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 49671.293482020702167575
        // // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 0.989043116067356738
        // // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 50000.0
        // // console.log(ethers.utils.formatEther(await taVault.getAvailableInvest()))

        // // Check farm vault pool
        // // console.log(ethers.utils.formatEther(await mMSFTUSTVault.getAllPoolInUSD())) // 7095.948795472014612215
        // // console.log(ethers.utils.formatEther(await mTWTRUSTVault.getAllPoolInUSD())) // 7095.948795472014612215
        // // console.log(ethers.utils.formatEther(await mTSLAUSTVault.getAllPoolInUSD())) // 7095.964880722116693756
        // // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInUSD())) // 7095.724645310536278354
        // // console.log(ethers.utils.formatEther(await mAMZNUSTVault.getAllPoolInUSD())) // 7095.654618516811107034
        // // console.log(ethers.utils.formatEther(await mAPPLUSTVault.getAllPoolInUSD())) // 7096.020705852583208862
        // // console.log(ethers.utils.formatEther(await mNFLXUSTVault.getAllPoolInUSD())) // 7095.955348735692916506

        // // Assume profit
        // network.provider.request({method: "hardhat_impersonateAccount", params: [mAMZNUSTHolderAddr]})
        // const unlockedAcc = await ethers.getSigner(mAMZNUSTHolderAddr)
        // const mAMZNUSTContract = new ethers.Contract(mAMZNUSTAddr, IERC20_ABI, unlockedAcc)
        // await mAMZNUSTContract.transfer(mAMZNUSTVaultAddr, ethers.utils.parseEther("5"))

        // // Collect profit
        // // const currentWatermark = await taStrategy.watermark()
        // // const currentPool = await taVault.getAllPoolInUSD()
        // // console.log(ethers.utils.formatEther(currentPool.sub(currentWatermark))) // 268.688076396889013834
        // // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 1.000938296758745125
        // tx = await taVault.connect(admin).collectProfitAndUpdateWatermark() 
        // // receipt = await tx.wait()
        // // console.log(receipt.gasUsed.toString()) // 377354
        // // console.log(ethers.utils.formatEther(await taVault.fees())) // 53.737615279377802766
        // // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 50214.950461117511211068
        // // console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 50214.950461117511211068
        // // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 0.999868285999206868

        // // Test reimburse
        // // await taVault.connect(admin).reimburse(0, USDTAddr, ethers.utils.parseUnits("1000", 6))
        // // await taVault.connect(admin).reimburse(1, USDCAddr, ethers.utils.parseUnits("1000", 6))
        // // await taVault.connect(admin).reimburse(2, DAIAddr, ethers.utils.parseUnits("1000", 18))
        // // await taVault.connect(admin).reimburse(3, USDTAddr, ethers.utils.parseUnits("1000", 6))
        // // await taVault.connect(admin).reimburse(4, USDCAddr, ethers.utils.parseUnits("1000", 6))
        // // await taVault.connect(admin).reimburse(5, DAIAddr, ethers.utils.parseUnits("1000", 18))
        // // await taVault.connect(admin).reimburse(6, USDTAddr, ethers.utils.parseUnits("1000", 6))
        // // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(taVault.address), 6))
        // // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(taVault.address), 6))
        // // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(taVault.address), 18))
        // // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 50293.071170472067808352

        // // Test emergency withdraw
        // // await taVault.connect(admin).emergencyWithdraw()
        // // console.log(ethers.utils.formatEther(await mMSFTUSTVault.getAllPoolInUSD()))
        // // console.log(ethers.utils.formatEther(await mTWTRUSTVault.getAllPoolInUSD()))
        // // console.log(ethers.utils.formatEther(await mTSLAUSTVault.getAllPoolInUSD()))
        // // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInUSD()))
        // // console.log(ethers.utils.formatEther(await mAMZNUSTVault.getAllPoolInUSD()))
        // // console.log(ethers.utils.formatEther(await mAPPLUSTVault.getAllPoolInUSD()))
        // // console.log(ethers.utils.formatEther(await mNFLXUSTVault.getAllPoolInUSD()))
        // // const USTContract = new ethers.Contract(USTAddr, IERC20_ABI, deployer)
        // // console.log(ethers.utils.formatEther(await USTContract.balanceOf(taVault.address)))
        // // console.log(ethers.utils.formatEther(await USTContract.balanceOf(taStrategy.address)))

        // // await taVault.connect(admin).reinvest()
        // // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 50293.071170472067808352
        // // console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 50024.641064451285003052
        // // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 0.996078890042288741

        // // Withdraw
        // console.log("-----withdraw-----")
        // await taVault.connect(client).withdraw((await taVault.balanceOf(client.address)).div(3), USDTAddr)
        // await taVault.connect(client2).withdraw(taVault.balanceOf(client2.address), USDTAddr)
        // await taVault.connect(client3).withdraw(taVault.balanceOf(client3.address), USDTAddr)
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client.address), 6)) // 10020.343307
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 10130.696151
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 10130.037173

        // // await taVault.connect(client).withdraw((await taVault.balanceOf(client.address)).div(3), USDCAddr)
        // // await taVault.connect(client2).withdraw(taVault.balanceOf(client2.address), USDCAddr)
        // // await taVault.connect(client3).withdraw(taVault.balanceOf(client3.address), USDCAddr)
        // // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client.address), 6)) // 10019.233023
        // // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client2.address), 6)) // 10129.573627
        // // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client3.address), 6)) // 10128.914708

        // // await taVault.connect(client).withdraw((await taVault.balanceOf(client.address)).div(3), DAIAddr)
        // // await taVault.connect(client2).withdraw(taVault.balanceOf(client2.address), DAIAddr)
        // // await taVault.connect(client3).withdraw(taVault.balanceOf(client3.address), DAIAddr)
        // // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client.address), 18)) // 10016.808704262031885107
        // // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client2.address), 18)) // 10127.122539132309537071
        // // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client3.address), 18)) // 10126.463710071705723272

        // // console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 19994.078134800171431727
        // // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 0.999703906740008571
        // // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 19999.020884322386855677

        // // console.log(ethers.utils.formatEther(await mMSFTUSTVault.getAllPoolInUSD())) // 2829.99341725763732707
        // // console.log(ethers.utils.formatEther(await mTWTRUSTVault.getAllPoolInUSD())) // 2829.993137693699720961
        // // console.log(ethers.utils.formatEther(await mTSLAUSTVault.getAllPoolInUSD())) // 2829.958715072539953781
        // // console.log(ethers.utils.formatEther(await mGOOGLUSTVault.getAllPoolInUSD())) // 2829.86330444897997172
        // // console.log(ethers.utils.formatEther(await mAMZNUSTVault.getAllPoolInUSD())) // 3068.045883581543136473
        // // console.log(ethers.utils.formatEther(await mAPPLUSTVault.getAllPoolInUSD())) // 2829.988068633484443712
        // // console.log(ethers.utils.formatEther(await mNFLXUSTVault.getAllPoolInUSD())) // 2829.973223391664680776
    })
})
