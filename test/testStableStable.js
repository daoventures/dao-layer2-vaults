const { ethers, network, artifacts } = require("hardhat");
const IERC20_ABI = require("../abis/IERC20_ABI.json")
const router_ABI = require("../abis/router_ABI.json")

const USDTAddr = "0xc7198437980c041c805A1EDcbA50c1Ce5db95118"
const USDCAddr = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"
const DAIAddr = "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70"
const WAVAXAddr = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
const JOEAddr = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"

const joeRouterAddr = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"
const joeStakingContractAddr = "0xd6a4F121CA35509aF06A0Be99093d08462f53052"

describe("DAO Avalanche", function () {
    it("Should work on DeXToken-Stablecoin strategy", async function () {
        let tx, receipt, tokenPriceMin
        const [deployer, client, client2, client3, treasury, community, admin, multisig] = await ethers.getSigners()

        // const adminAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
        // await network.provider.request({method: "hardhat_impersonateAccount", params: [adminAddr]})
        // const admin = await ethers.getSigner(adminAddr)
        // await deployer.sendTransaction({to: adminAddr, value: ethers.utils.parseEther("10")})

        // Deploy AvaxVaultL1
        const avaxVaultL1Fac = await ethers.getContractFactory("AvaxVaultL1", deployer)
        const avaxVaultL1 = await avaxVaultL1Fac.deploy()
        const avaxVaultL1Artifact = await artifacts.readArtifact("AvaxVaultL1")
        const avaxVaultL1Interface = new ethers.utils.Interface(avaxVaultL1Artifact.abi)

        const avaxVaultL1FactoryFac = await ethers.getContractFactory("AvaxVaultL1Factory", deployer)
        const avaxVaultL1Factory = await avaxVaultL1FactoryFac.deploy(avaxVaultL1.address)
        await avaxVaultL1Factory.transferOwnership(multisig.address)
        
        // Deploy USDT-USDC
        const dataUSDTUSDC = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Joe USDT-USDC", "daoUSDTUSDC",
                joeRouterAddr, joeStakingContractAddr, JOEAddr, 49, false,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await avaxVaultL1Factory.connect(multisig).createVault(dataUSDTUSDC)
        await tx.wait()
        const USDTUSDCVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const USDTUSDCVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const USDTUSDCVault = await ethers.getContractAt("AvaxVaultL1", USDTUSDCVaultAddr, deployer)

        // Deploy USDT-DAI
        const dataUSDTDAI = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Joe USDT-DAI", "daoUSDTDAI",
                joeRouterAddr, joeStakingContractAddr, JOEAddr, 31, false,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await avaxVaultL1Factory.connect(multisig).createVault(dataUSDTDAI)
        await tx.wait()
        const USDTDAIVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const USDTDAIVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const USDTDAIVault = await ethers.getContractAt("AvaxVaultL1", USDTDAIVaultAddr, deployer)

        // Deploy USDC-DAI
        const dataUSDCDAI = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Joe USDC-DAI", "daoUSDCDAI",
                joeRouterAddr, joeStakingContractAddr, JOEAddr, 40, false,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await avaxVaultL1Factory.connect(multisig).createVault(dataUSDCDAI)
        await tx.wait()
        const USDCDAIVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const USDCDAIVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const USDCDAIVault = await ethers.getContractAt("AvaxVaultL1", USDCDAIVaultAddr, deployer)

        // Deploy proxy admin
        const proxyAdminFac = await ethers.getContractFactory("DAOProxyAdmin", deployer)
        const proxyAdmin = await proxyAdminFac.deploy()

        // Deploy Stable-Stable strategy contract
        const StableStableStrategyFac = await ethers.getContractFactory("StableStableStrategy", deployer)
        const stableStableStrategyImpl = await StableStableStrategyFac.deploy()
        const stableStableStrategyArtifact = await artifacts.readArtifact("StableStableStrategy")
        const stableStableStrategyInterface = new ethers.utils.Interface(stableStableStrategyArtifact.abi)
        const dataStableStableStrategy = stableStableStrategyInterface.encodeFunctionData(
            "initialize",
            [USDTUSDCVaultAddr, USDTDAIVaultAddr, USDCDAIVaultAddr]
        )
        const StableStableStrategyProxy = await ethers.getContractFactory("AvaxProxy", deployer)
        const stableStableStrategyProxy = await StableStableStrategyProxy.deploy(
            stableStableStrategyImpl.address, proxyAdmin.address, dataStableStableStrategy,
        )
        const stableStableStrategy = await ethers.getContractAt("StableStableStrategy", stableStableStrategyProxy.address, deployer)
        // const stableStableStrategyProxyAddr = "0x3845d7c09374Df1ae6Ce4728c99DD20D3d75F414"
        // const stableStableStrategy = await ethers.getContractAt("StableStableStrategy", stableStableStrategyProxyAddr, deployer)

        // Deploy AvaxStable vault contract
        const AvaxStableVaultFac = await ethers.getContractFactory("AvaxStableVault", deployer)
        const avaxStableVaultImpl = await AvaxStableVaultFac.deploy()
        const avaxStableVaultArtifact = await artifacts.readArtifact("AvaxStableVault")
        const avaxStableVaultInterface = new ethers.utils.Interface(avaxStableVaultArtifact.abi)
        const dataAvaxStableVault = avaxStableVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L2 Avalanche Stable-Stable", "daoA2S",
                treasury.address, community.address, admin.address, stableStableStrategy.address
            ]
        )
        const AvaxStableVaultProxy = await ethers.getContractFactory("AvaxProxy", deployer)
        const avaxStableVaultProxy = await AvaxStableVaultProxy.deploy(
            avaxStableVaultImpl.address, proxyAdmin.address, dataAvaxStableVault,
        )
        const avaxStableVault = await ethers.getContractAt("AvaxStableVault", avaxStableVaultProxy.address, deployer)
        // const avaxStableVaultProxyAddr = "0x3845d7c09374Df1ae6Ce4728c99DD20D3d75F414"
        // const avaxStableVault = await ethers.getContractAt("AvaxStableVault", avaxStableVaultProxyAddr, deployer)

        await stableStableStrategy.connect(admin).setVault(avaxStableVault.address)

        // Set whitelist
        await USDTUSDCVault.connect(admin).setWhitelistAddress(stableStableStrategy.address, true)
        await USDTDAIVault.connect(admin).setWhitelistAddress(stableStableStrategy.address, true)
        await USDCDAIVault.connect(admin).setWhitelistAddress(stableStableStrategy.address, true)

        // Swap & transfer Stablecoins to client
        const joeRouter = new ethers.Contract(joeRouterAddr, router_ABI, deployer)    
        await joeRouter.swapAVAXForExactTokens(
            ethers.utils.parseUnits("20000", 6), [WAVAXAddr, USDTAddr], deployer.address, Math.ceil(Date.now() / 1000),
            {value: ethers.utils.parseEther("400")}
        )   
        await joeRouter.swapAVAXForExactTokens(
            ethers.utils.parseUnits("20000", 6), [WAVAXAddr, USDCAddr], deployer.address, Math.ceil(Date.now() / 1000),
            {value: ethers.utils.parseEther("400")}
        )   
        await joeRouter.swapAVAXForExactTokens(
            ethers.utils.parseUnits("10000", 18), [WAVAXAddr, DAIAddr], deployer.address, Math.ceil(Date.now() / 1000),
            {value: ethers.utils.parseEther("200")}
        )
        const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, deployer)
        const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, deployer)
        const DAIContract = new ethers.Contract(DAIAddr, IERC20_ABI, deployer)
        await USDTContract.transfer(client.address, ethers.utils.parseUnits("10000", 6))
        await USDTContract.transfer(client2.address, ethers.utils.parseUnits("10000", 6))
        await USDCContract.transfer(client.address, ethers.utils.parseUnits("10000", 6))
        await USDCContract.transfer(client3.address, ethers.utils.parseUnits("10000", 6))
        await DAIContract.transfer(client.address, ethers.utils.parseUnits("10000", 18))

        // Deposit
        await USDTContract.connect(client).approve(avaxStableVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client).approve(avaxStableVault.address, ethers.constants.MaxUint256)
        await DAIContract.connect(client).approve(avaxStableVault.address, ethers.constants.MaxUint256)
        tx = await avaxStableVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 213760
        await avaxStableVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        await avaxStableVault.connect(client).deposit(ethers.utils.parseUnits("10000", 18), DAIAddr)
        // console.log(ethers.utils.formatEther(await avaxStableVault.balanceOf(client.address))) // 0.0

        // Invest
        tokenPriceMin = [0]
        // tokenPriceMin: 0 because slippage swap between Stablecoins with Curve is set in contract
        // This variable just for consistency
        tx = await avaxStableVault.connect(admin).invest(tokenPriceMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 2686255
        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 29651.313839751356971659
        // console.log(ethers.utils.formatEther(
        //     (await avaxStableVault.balanceOf(client.address))
        //     .mul(await avaxStableVault.getPricePerFullShare())
        //     .div(ethers.utils.parseEther("1"))
        // )) // User share in USD
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 0.998360735345163534
        // console.log(ethers.utils.formatEther(await avaxStableVault.balanceOf(client.address))) // 29700.0
        // console.log(ethers.utils.formatEther(await stableStableStrategy.getAllPoolInUSD())) // 26978.313839751356971659
        // console.log(ethers.utils.formatEther(await stableStableStrategy.watermark())) // 27027.0

        // Farm invest
        await USDTUSDCVault.connect(admin).invest()
        await USDTDAIVault.connect(admin).invest()
        await USDCDAIVault.connect(admin).invest()

        // Check fees
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(treasury.address), 6)) // 150.0
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(community.address), 6)) // 150.0
        // console.log(ethers.utils.formatEther(await avaxStableVault.fees())) // 0.0

        // Check Stablecoins keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxStableVault.address), 6)) // 891.0
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxStableVault.address), 6)) // 891.0
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxStableVault.address), 18)) // 891.0

        // Second invest
        await USDTContract.connect(client2).approve(avaxStableVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client3).approve(avaxStableVault.address, ethers.constants.MaxUint256)
        await avaxStableVault.connect(client2).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        await avaxStableVault.connect(client3).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        tx = await avaxStableVault.connect(admin).invest(tokenPriceMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 2363801
        // console.log(ethers.utils.formatEther(await avaxStableVault.balanceOf(client2.address))) // 9916.255366931342957457
        // console.log(ethers.utils.formatEther(await avaxStableVault.balanceOf(client3.address))) // 9916.255366931342957457
        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 49413.539835314206351639
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 0.997598125013534885
        // console.log(ethers.utils.formatEther(await stableStableStrategy.getAllPoolInUSD())) // 45555.461005314206351639
        // console.log(ethers.utils.formatEther(await stableStableStrategy.watermark())) // 45641.92117

        // Farm invest
        await USDTUSDCVault.connect(admin).invest()
        await USDTDAIVault.connect(admin).invest()
        await USDCDAIVault.connect(admin).invest()
        // console.log(ethers.utils.formatEther(await USDTUSDCVault.getPricePerFullShare(true))) // 2013599513941.298752286582229693
        // console.log(ethers.utils.formatEther(await USDTUSDCVault.getPricePerFullShare(false))) // 1.0
        // console.log(ethers.utils.formatEther(await USDTDAIVault.getPricePerFullShare(true))) // 2032148.25001281185449602
        // console.log(ethers.utils.formatEther(await USDTDAIVault.getPricePerFullShare(false))) // 1.0
        // console.log(ethers.utils.formatEther(await USDCDAIVault.getPricePerFullShare(true))) // 2009858.373167995776935599
        // console.log(ethers.utils.formatEther(await USDCDAIVault.getPricePerFullShare(false))) // 1.0

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await USDTUSDCVault.getAllPoolInUSD())) // 3333 15193.597551706713513899
        // console.log(ethers.utils.formatEther(await USDTDAIVault.getAllPoolInUSD())) // 3333 15184.716294929265024628
        // console.log(ethers.utils.formatEther(await USDCDAIVault.getAllPoolInUSD())) // 3333 15177.147158678227813112

        // Yield in farms
        for (let i=0; i<10000; i++) {
            await network.provider.send("evm_mine")
        }
        // console.log(ethers.utils.formatEther(await USDTUSDCVault.getPendingRewards())) // 0.627588191614769482
        // console.log(ethers.utils.formatEther(await USDTDAIVault.getPendingRewards())) // 0.315651389308446882
        // console.log(ethers.utils.formatEther(await USDCDAIVault.getPendingRewards())) // 0.359628231478107453
        await USDTUSDCVault.connect(admin).yield()
        await USDTDAIVault.connect(admin).yield()
        await USDCDAIVault.connect(admin).yield()
        // console.log(ethers.utils.formatEther(await USDTUSDCVault.getPricePerFullShare(false))) // 1.000049505590382785
        // console.log(ethers.utils.formatEther(await USDTDAIVault.getPricePerFullShare(false))) // 1.000024924004653992
        // console.log(ethers.utils.formatEther(await USDCDAIVault.getPricePerFullShare(false))) // 1.000028410516220664

        // Assume profit
        await joeRouter.swapExactAVAXForTokens(
            0, [WAVAXAddr, JOEAddr], USDTUSDCVaultAddr, Math.ceil(Date.now() / 1000),
            {value: ethers.utils.parseEther("5")}
        )
        await USDTUSDCVault.connect(admin).yield()

        // Collect profit
        tx = await avaxStableVault.connect(admin).collectProfitAndUpdateWatermark()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 330948
        // console.log(ethers.utils.formatEther(await avaxStableVault.fees())) // 24.137167371415570001
        console.log(ethers.utils.formatEther(await stableStableStrategy.watermark())) // 45762.607006857077850005
        console.log(ethers.utils.formatEther(await stableStableStrategy.getAllPoolInUSD())) // 45762.607006857077850005
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 1.001292846550158764

        // Test reimburse
        // await avaxStableVault.connect(admin).reimburse(0, USDTAddr, ethers.utils.parseUnits("1000", 6), [0])
        // await avaxStableVault.connect(admin).reimburse(1, USDCAddr, ethers.utils.parseUnits("1000", 6), [0])
        // await avaxStableVault.connect(admin).reimburse(2, DAIAddr, ethers.utils.parseUnits("1000", 18), [0])
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxStableVault.address), 18))
        // console.log(ethers.utils.formatEther(await stableStableStrategy.watermark()))

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await USDTUSDCVault.getAllPoolInUSD())) // 3333
        // console.log(ethers.utils.formatEther(await USDTDAIVault.getAllPoolInUSD())) // 3333
        // console.log(ethers.utils.formatEther(await USDCDAIVault.getAllPoolInUSD())) // 3333

        // Test emergency withdraw
        // await avaxStableVault.connect(admin).emergencyWithdraw()
        // console.log(ethers.utils.formatEther(await USDTUSDCVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await USDTDAIVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await USDCDAIVault.getAllPoolInUSD()))

        // await avaxStableVault.connect(admin).reinvest(tokenPriceMin)
        // console.log(ethers.utils.formatEther(await stableStableStrategy.watermark())) // 45767.19191
        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 49541.797835623333785152
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 1.000187495073903023
        // console.log(ethers.utils.formatEther(await USDTUSDCVault.getAllPoolInUSD())) // 3333 15234.604168995609807372
        // console.log(ethers.utils.formatEther(await USDTDAIVault.getAllPoolInUSD())) // 3333 15225.665550110132612752
        // console.log(ethers.utils.formatEther(await USDCDAIVault.getAllPoolInUSD())) // 3333 15218.069176517591365028

        // Withdraw
        console.log("-----withdraw-----")

        tokenPriceMin = [0]
        await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(3), USDTAddr, tokenPriceMin)
        await avaxStableVault.connect(client2).withdraw(avaxStableVault.balanceOf(client2.address), USDTAddr, tokenPriceMin)
        await avaxStableVault.connect(client3).withdraw(avaxStableVault.balanceOf(client3.address), USDTAddr, tokenPriceMin)
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client.address), 6)) // 9908.161941
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 9923.612469
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 9923.611656

        // await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(3), USDCAddr, tokenPriceMin)
        // await avaxStableVault.connect(client2).withdraw(avaxStableVault.balanceOf(client2.address), USDCAddr, tokenPriceMin)
        // await avaxStableVault.connect(client3).withdraw(avaxStableVault.balanceOf(client3.address), USDCAddr, tokenPriceMin)
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client.address), 6)) // 9902.820562
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client2.address), 6)) // 9917.320646
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client3.address), 6)) // 9917.319771

        // await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(3), DAIAddr, tokenPriceMin)
        // await avaxStableVault.connect(client2).withdraw(avaxStableVault.balanceOf(client2.address), DAIAddr, tokenPriceMin)
        // await avaxStableVault.connect(client3).withdraw(avaxStableVault.balanceOf(client3.address), DAIAddr, tokenPriceMin)
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client.address), 18)) // 9895.098918328119977869
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client2.address), 18)) // 9909.593982571705937397
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client3.address), 18)) // 9909.592624750584106563

        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 19825.598394591435288122
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 1.00129284821168865
        console.log(ethers.utils.formatEther(await stableStableStrategy.watermark())) // 17475.196160272936251995
        console.log(ethers.utils.formatEther(await stableStableStrategy.getAllPoolInUSD())) // 17475.196165459079705805

        // console.log(ethers.utils.formatEther(await USDTUSDCVault.getAllPoolInUSD())) // 3333 5880.688324093891358601
        // console.log(ethers.utils.formatEther(await USDTDAIVault.getAllPoolInUSD())) // 3333 5798.689983230208499646
        // console.log(ethers.utils.formatEther(await USDCDAIVault.getAllPoolInUSD())) // 3333 5795.817858134979847558

        // // Test withdraw within token keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxStableVault.address), 18))
        // tx = await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(35), DAIAddr, tokenPriceMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // // 366294 936925 1196225 2340591
        // // 366323 937567 1197436 2525234
        // // 366235 937570 1197439 2525172
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxStableVault.address), 18))
    })
});