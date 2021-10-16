const { ethers, network, artifacts } = require("hardhat");
const IERC20_ABI = require("../abis/IERC20_ABI.json")
const router_ABI = require("../abis/router_ABI.json")

const USDTAddr = "0xc7198437980c041c805A1EDcbA50c1Ce5db95118"
const USDCAddr = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"
const DAIAddr = "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70"
const WAVAXAddr = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
const JOEAddr = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"
const PNGAddr = "0x60781C2586D68229fde47564546784ab3fACA982"
const LYDAddr = "0x4C9B4E1AC6F24CdE3660D5E4Ef1eBF77C710C084"

const joeRouterAddr = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"
const joeStakingContractAddr = "0xd6a4F121CA35509aF06A0Be99093d08462f53052"

const pngRouterAddr = "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"
const pngStakingContractAddr = "0x7216d1e173c1f1Ed990239d5c77d74714a837Cd5"

const lydRouterAddr = "0xA52aBE4676dbfd04Df42eF7755F01A3c41f28D27"
const lydStakingContractAddr = "0xFb26525B14048B7BB1F3794F6129176195Db7766"

describe("DAO Avalanche", function () {
    it("Should work on DeXToken-AVAX strategy", async function () {
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
        
        // Deploy JOE-USDC
        const dataJOEUSDC = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Joe JOE-USDC", "daoJoeUSDC",
                joeRouterAddr, joeStakingContractAddr, JOEAddr, 58, false,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await avaxVaultL1Factory.connect(multisig).createVault(dataJOEUSDC)
        await tx.wait()
        const JOEUSDCVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const JOEUSDCVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const JOEUSDCVault = await ethers.getContractAt("AvaxVaultL1", JOEUSDCVaultAddr, deployer)

        // Deploy PNG-USDT
        const dataPNGUSDT = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Pangolin PNG-USDT", "daoPngUSDT",
                pngRouterAddr, pngStakingContractAddr, PNGAddr, 999, true,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await avaxVaultL1Factory.connect(multisig).createVault(dataPNGUSDT)
        await tx.wait()
        const PNGUSDTVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const PNGUSDTVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const PNGUSDTVault = await ethers.getContractAt("AvaxVaultL1", PNGUSDTVaultAddr, deployer)

        // Deploy LYD-DAI
        const dataLYDDAI = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Lydia LYD-DAI", "daolydDAI",
                lydRouterAddr, lydStakingContractAddr, LYDAddr, 26, false,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await avaxVaultL1Factory.connect(multisig).createVault(dataLYDDAI)
        await tx.wait()
        const LYDDAIVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const LYDDAIVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const LYDDAIVault = await ethers.getContractAt("AvaxVaultL1", LYDDAIVaultAddr, deployer)

        // Deploy proxy admin
        const proxyAdminFac = await ethers.getContractFactory("DAOProxyAdmin", deployer)
        const proxyAdmin = await proxyAdminFac.deploy()

        // Deploy DeX-Stable strategy
        const DeXStableStrategyFac = await ethers.getContractFactory("DeXStableStrategy", deployer)
        const deXStableStrategyImpl = await DeXStableStrategyFac.deploy()
        const deXStableStrategyArtifact = await artifacts.readArtifact("DeXStableStrategy")
        const deXStableStrategyInterface = new ethers.utils.Interface(deXStableStrategyArtifact.abi)
        const dataDeXStableStrategy = deXStableStrategyInterface.encodeFunctionData(
            "initialize",
            [JOEUSDCVaultAddr, PNGUSDTVaultAddr, LYDDAIVaultAddr]
        )
        const DeXStableStrategyProxy = await ethers.getContractFactory("AvaxProxy", deployer)
        const deXStableStrategyProxy = await DeXStableStrategyProxy.deploy(
            deXStableStrategyImpl.address, proxyAdmin.address, dataDeXStableStrategy,
        )
        const deXStableStrategy = await ethers.getContractAt("DeXStableStrategy", deXStableStrategyProxy.address, deployer)
        // const deXStableStrategyProxyAddr = "0x3845d7c09374Df1ae6Ce4728c99DD20D3d75F414"
        // const deXStableStrategy = await ethers.getContractAt("DeXStableStrategy", deXStableStrategyProxyAddr, deployer)

        const AvaxStableVaultFac = await ethers.getContractFactory("AvaxStableVault", deployer)
        const avaxStableVaultImpl = await AvaxStableVaultFac.deploy()
        const avaxStableVaultArtifact = await artifacts.readArtifact("AvaxStableVault")
        const avaxStableVaultInterface = new ethers.utils.Interface(avaxStableVaultArtifact.abi)
        const dataAvaxStableVault = avaxStableVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L2 AVAX", "daoAVAX",
                treasury.address, community.address, admin.address, deXStableStrategy.address
            ]
        )
        const AvaxStableVaultProxy = await ethers.getContractFactory("AvaxProxy", deployer)
        const avaxStableVaultProxy = await AvaxStableVaultProxy.deploy(
            avaxStableVaultImpl.address, proxyAdmin.address, dataAvaxStableVault,
        )
        const avaxStableVault = await ethers.getContractAt("AvaxStableVault", avaxStableVaultProxy.address, deployer)
        // const avaxStableVaultProxyAddr = "0x3845d7c09374Df1ae6Ce4728c99DD20D3d75F414"
        // const avaxStableVault = await ethers.getContractAt("AvaxStableVault", avaxStableVaultProxyAddr, deployer)

        await deXStableStrategy.connect(admin).setVault(avaxStableVault.address)

        // Set whitelist
        await JOEUSDCVault.connect(admin).setWhitelistAddress(deXStableStrategy.address, true)
        await PNGUSDTVault.connect(admin).setWhitelistAddress(deXStableStrategy.address, true)
        await LYDDAIVault.connect(admin).setWhitelistAddress(deXStableStrategy.address, true)

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
        const pngRouter = new ethers.Contract(pngRouterAddr, router_ABI, deployer)    
        const lydRouter = new ethers.Contract(lydRouterAddr, router_ABI, deployer)    
        const USDCPriceInJOE = (await joeRouter.getAmountsOut(ethers.utils.parseUnits("1", 6), [USDCAddr, JOEAddr]))[1]
        const USDCPriceInJOEMin = USDCPriceInJOE.mul(95).div(100)
        const USDTPriceInPNG = (await pngRouter.getAmountsOut(ethers.utils.parseUnits("1", 6), [USDTAddr, PNGAddr]))[1]
        const USDTPriceInPNGMin = USDTPriceInPNG.mul(95).div(100)
        const DAIPriceInLYD = (await lydRouter.getAmountsOut(ethers.utils.parseUnits("1", 18), [DAIAddr, LYDAddr]))[1]
        const DAIPriceInLYDMin = DAIPriceInLYD.mul(95).div(100)

        tokenPriceMin = [0, USDCPriceInJOEMin, USDTPriceInPNGMin, DAIPriceInLYDMin]
        // tokenPriceMin: Fist element 0 because slippage swap between Stablecoins with Curve is set in contract
        tx = await avaxStableVault.connect(admin).invest(tokenPriceMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 2615548
        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 29561.851422398943466473
        // console.log(ethers.utils.formatEther(
        //     (await avaxStableVault.balanceOf(client.address))
        //     .mul(await avaxStableVault.getPricePerFullShare())
        //     .div(ethers.utils.parseEther("1"))
        // )) // User share in USD
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 0.995348532740705167
        // console.log((await deXStableStrategy.getCurrentCompositionPerc()).toString()); // 8012,995,991
        // console.log(ethers.utils.formatEther(await avaxStableVault.balanceOf(client.address))) // 29700.0
        // console.log(ethers.utils.formatEther(await deXStableStrategy.getAllPoolInUSD())) // 26888.851422398943466473
        // console.log(ethers.utils.formatEther(await deXStableStrategy.watermark())) // 27027.0

        // Farm invest
        await JOEUSDCVault.connect(admin).invest()
        await PNGUSDTVault.connect(admin).invest()
        await LYDDAIVault.connect(admin).invest()

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
        // console.log(receipt.gasUsed.toString()) // 1227257
        // console.log(ethers.utils.formatEther(await avaxStableVault.balanceOf(client2.address))) // 9946.264724719311007985
        // console.log(ethers.utils.formatEther(await avaxStableVault.balanceOf(client3.address))) // 9946.264724719311007985
        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 49193.733169807869510202
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 0.991958541254941639
        // console.log((await deXStableStrategy.getCurrentCompositionPerc()).toString()); // 8014,994,990
        // console.log(ethers.utils.formatEther(await deXStableStrategy.getAllPoolInUSD())) // 45341.022085807869510202
        // console.log(ethers.utils.formatEther(await deXStableStrategy.watermark())) // 45647.288916

        // Farm invest
        await JOEUSDCVault.connect(admin).invest()
        await PNGUSDTVault.connect(admin).invest()
        await LYDDAIVault.connect(admin).invest()
        // console.log(ethers.utils.formatEther(await JOEUSDCVault.getPricePerFullShare(true))) // 2732112.241636324268525623
        // console.log(ethers.utils.formatEther(await JOEUSDCVault.getPricePerFullShare(false))) // 1.0
        // console.log(ethers.utils.formatEther(await PNGUSDTVault.getPricePerFullShare(true))) // 2277173.917980692040873329
        // console.log(ethers.utils.formatEther(await PNGUSDTVault.getPricePerFullShare(false))) // 1.0
        // console.log(ethers.utils.formatEther(await LYDDAIVault.getPricePerFullShare(true))) // 0.452341872902175398
        // console.log(ethers.utils.formatEther(await LYDDAIVault.getPricePerFullShare(false))) // 1.0

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await JOEUSDCVault.getAllPoolInUSD())) // 8000 36339.587876207428668568
        // console.log(ethers.utils.formatEther(await PNGUSDTVault.getAllPoolInUSD())) // 1000 4510.548778915419681055
        // console.log(ethers.utils.formatEther(await LYDDAIVault.getAllPoolInUSD())) // 1000 4490.885430685021160579

        // Yield in farms
        for (let i=0; i<10000; i++) {
            await network.provider.send("evm_mine")
        }
        // console.log(ethers.utils.formatEther(await JOEUSDCVault.getPendingRewards())) // 10.526053939259000515
        // console.log(ethers.utils.formatEther(await PNGUSDTVault.getPendingRewards())) // 0.071328041682289088
        // console.log(ethers.utils.formatEther(await LYDDAIVault.getPendingRewards())) // 58.2357063965079293
        await JOEUSDCVault.connect(admin).yield()
        await PNGUSDTVault.connect(admin).yield()
        await LYDDAIVault.connect(admin).yield()
        // console.log(ethers.utils.formatEther(await JOEUSDCVault.getPricePerFullShare(false))) // 1.000345434947775379
        // console.log(ethers.utils.formatEther(await PNGUSDTVault.getPricePerFullShare(false))) // 1.000013635622723089
        // console.log(ethers.utils.formatEther(await LYDDAIVault.getPricePerFullShare(false))) // 1.000000000005041914

        // Assume profit
        await joeRouter.swapExactAVAXForTokens(
            0, [WAVAXAddr, JOEAddr], JOEUSDCVaultAddr, Math.ceil(Date.now() / 1000),
            {value: ethers.utils.parseEther("10")}
        )
        await JOEUSDCVault.connect(admin).yield()

        // Collect profit
        tx = await avaxStableVault.connect(admin).collectProfitAndUpdateWatermark()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 360696
        // console.log(ethers.utils.formatEther(await avaxStableVault.fees())) // 23.152950197600713014
        // console.log(ethers.utils.formatEther(await deXStableStrategy.watermark())) // 45763.053666988003565072
        // console.log(ethers.utils.formatEther(await deXStableStrategy.getAllPoolInUSD())) // 45763.053666988003565072
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 1.000001660559618456

        // Test reimburse
        const JOEPriceInUSDTMin = ((await joeRouter.getAmountsOut(ethers.utils.parseEther("1"), [JOEAddr, USDTAddr]))[1]).mul(95).div(100)
        const PNGPriceInUSDTMin = ((await pngRouter.getAmountsOut(ethers.utils.parseEther("1"), [PNGAddr, USDTAddr]))[1]).mul(95).div(100)
        const LYDPriceInUSDTMin = ((await lydRouter.getAmountsOut(ethers.utils.parseEther("1"), [LYDAddr, USDTAddr]))[1]).mul(95).div(100)
        // await avaxStableVault.connect(admin).reimburse(0, USDTAddr, ethers.utils.parseUnits("1000", 6), [JOEPriceInUSDTMin])
        // await avaxStableVault.connect(admin).reimburse(1, USDCAddr, ethers.utils.parseUnits("1000", 6), [PNGPriceInUSDTMin])
        // await avaxStableVault.connect(admin).reimburse(2, DAIAddr, ethers.utils.parseUnits("1000", 18), [LYDPriceInUSDTMin])
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxStableVault.address), 18))
        // console.log(ethers.utils.formatEther(await deXStableStrategy.watermark())) // 44697.578644351970332677
        // console.log((await deXStableStrategy.getCurrentCompositionPerc()).toString()); // 8362,820,816

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await JOEUSDCVault.getAllPoolInUSD())) // 4500
        // console.log(ethers.utils.formatEther(await PNGUSDTVault.getAllPoolInUSD())) // 4500
        // console.log(ethers.utils.formatEther(await LYDDAIVault.getAllPoolInUSD())) // 1000

        // Test emergency withdraw
        // await avaxStableVault.connect(admin).emergencyWithdraw()
        // console.log(ethers.utils.formatEther(await JOEUSDCVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await PNGUSDTVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await LYDDAIVault.getAllPoolInUSD()))

        // await avaxStableVault.connect(admin).reinvest(tokenPriceMin)
        // console.log(ethers.utils.formatEther(await deXStableStrategy.watermark())) // 45832.894172
        // console.log((await deXStableStrategy.getCurrentCompositionPerc()).toString()); // 8019,992,987
        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 49298.464015599685582522
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 0.994070368317495344
        // console.log(ethers.utils.formatEther(await JOEUSDCVault.getAllPoolInUSD())) // 8000 36438.355983802366765469
        // console.log(ethers.utils.formatEther(await PNGUSDTVault.getAllPoolInUSD())) // 1000 4510.296983343005942896
        // console.log(ethers.utils.formatEther(await LYDDAIVault.getAllPoolInUSD())) // 1000 4487.086959454312874157

        // Withdraw
        console.log("-----withdraw-----")

        tokenPriceMin = [0, JOEPriceInUSDTMin, PNGPriceInUSDTMin, LYDPriceInUSDTMin]
        // tokenPriceMin: Fist element 0 because slippage swap between Stablecoins with Curve is set in contract
        // await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(3), USDTAddr, tokenPriceMin)
        // await avaxStableVault.connect(client2).withdraw(avaxStableVault.balanceOf(client2.address), USDTAddr, tokenPriceMin)
        // await avaxStableVault.connect(client3).withdraw(avaxStableVault.balanceOf(client3.address), USDTAddr, tokenPriceMin)
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client.address), 6)) // 9948.075488
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 9986.128357
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 9967.789996

        // await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(3), USDCAddr, tokenPriceMin)
        // await avaxStableVault.connect(client2).withdraw(avaxStableVault.balanceOf(client2.address), USDCAddr, tokenPriceMin)
        // await avaxStableVault.connect(client3).withdraw(avaxStableVault.balanceOf(client3.address), USDCAddr, tokenPriceMin)
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client.address), 6)) // 9942.704721
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client2.address), 6)) // 9979.795487
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client3.address), 6)) // 9961.470204

        // await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(3), DAIAddr, tokenPriceMin)
        // await avaxStableVault.connect(client2).withdraw(avaxStableVault.balanceOf(client2.address), DAIAddr, tokenPriceMin)
        // await avaxStableVault.connect(client3).withdraw(avaxStableVault.balanceOf(client3.address), DAIAddr, tokenPriceMin)
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client.address), 18)) // 9938.153826203525206565
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client2.address), 18)) // 9970.938266430669888662
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client3.address), 18)) // 9952.62678215557253069

        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 19799.413978305543528376
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 0.99997040294472442
        // console.log((await deXStableStrategy.getCurrentCompositionPerc()).toString()); // 8033,985,981
        // console.log(ethers.utils.formatEther(await deXStableStrategy.watermark())) // 17451.695150255964265898
        // console.log(ethers.utils.formatEther(await deXStableStrategy.getAllPoolInUSD())) // 17450.71138650314424139

        // console.log(ethers.utils.formatEther(await JOEUSDCVault.getAllPoolInUSD())) // 8000 14018.509400936527146488
        // console.log(ethers.utils.formatEther(await PNGUSDTVault.getAllPoolInUSD())) // 1000 1719.928442100795264078
        // console.log(ethers.utils.formatEther(await LYDDAIVault.getAllPoolInUSD())) // 1000 1712.273543465821830824

        // Test withdraw within token keep in vault
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxStableVault.address), 6))
        console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxStableVault.address), 6))
        console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxStableVault.address), 18))
        tx = await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(5), DAIAddr, tokenPriceMin)
        receipt = await tx.wait()
        console.log(receipt.gasUsed.toString())
        // 396530 967149 1226449 2295641
        // 396559 967791 1227660 2295703
        // 396459 967794 1227663 2295641
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxStableVault.address), 6))
        console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxStableVault.address), 6))
        console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxStableVault.address), 18))
    })
});