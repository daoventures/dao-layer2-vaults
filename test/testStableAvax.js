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
const pngStakingContractAddr = "0x84b536da1a2d9b0609f9da73139674cc2d75af2d"

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
        
        // Deploy USDT-AVAX
        const dataUSDTAVAX = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Lydia USDT-AVAX", "daoLydUSDT",
                lydRouterAddr, lydStakingContractAddr, LYDAddr, 17, false,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await avaxVaultL1Factory.connect(multisig).createVault(dataUSDTAVAX)
        await tx.wait()
        const USDTAVAXVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const USDTAVAXVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const USDTAVAXVault = await ethers.getContractAt("AvaxVaultL1", USDTAVAXVaultAddr, deployer)

        // Deploy USDC-AVAX
        const dataUSDCAVAX = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Pangolin USDC-AVAX", "daoPngUSDC",
                pngRouterAddr, pngStakingContractAddr, PNGAddr, 999, true,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await avaxVaultL1Factory.connect(multisig).createVault(dataUSDCAVAX)
        await tx.wait()
        const USDCAVAXVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const USDCAVAXVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const USDCAVAXVault = await ethers.getContractAt("AvaxVaultL1", USDCAVAXVaultAddr, deployer)

        // Deploy DAI-AVAX
        const dataDAIAVAX = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Lydia DAI-AVAX", "daoJoeDAI",
                joeRouterAddr, joeStakingContractAddr, JOEAddr, 37, false,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await avaxVaultL1Factory.connect(multisig).createVault(dataDAIAVAX)
        await tx.wait()
        const DAIAVAXVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const DAIAVAXVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const DAIAVAXVault = await ethers.getContractAt("AvaxVaultL1", DAIAVAXVaultAddr, deployer)

        // Deploy proxy admin
        const proxyAdminFac = await ethers.getContractFactory("DAOProxyAdmin", deployer)
        const proxyAdmin = await proxyAdminFac.deploy()

        // Deploy Stable-AVAX strategy
        const StableAvaxStrategyFac = await ethers.getContractFactory("StableAvaxStrategy", deployer)
        const stableAvaxStrategyImpl = await StableAvaxStrategyFac.deploy()
        const stableAvaxStrategyArtifact = await artifacts.readArtifact("StableAvaxStrategy")
        const stableAvaxStrategyInterface = new ethers.utils.Interface(stableAvaxStrategyArtifact.abi)
        const dataStableAvaxStrategy = stableAvaxStrategyInterface.encodeFunctionData(
            "initialize",
            [USDTAVAXVaultAddr, USDCAVAXVaultAddr, DAIAVAXVaultAddr]
        )
        const StableAvaxStrategyProxy = await ethers.getContractFactory("AvaxProxy", deployer)
        const stableAvaxStrategyProxy = await StableAvaxStrategyProxy.deploy(
            stableAvaxStrategyImpl.address, proxyAdmin.address, dataStableAvaxStrategy,
        )
        const stableAvaxStrategy = await ethers.getContractAt("StableAvaxStrategy", stableAvaxStrategyProxy.address, deployer)
        // const stableAvaxStrategyProxyAddr = "0x3845d7c09374Df1ae6Ce4728c99DD20D3d75F414"
        // const stableAvaxStrategy = await ethers.getContractAt("StableAvaxStrategy", stableAvaxStrategyProxyAddr, deployer)

        // Deploy Stable-AVAX vault
        const AvaxStableVaultFac = await ethers.getContractFactory("AvaxStableVault", deployer)
        const avaxStableVaultImpl = await AvaxStableVaultFac.deploy()
        const avaxStableVaultArtifact = await artifacts.readArtifact("AvaxStableVault")
        const avaxStableVaultInterface = new ethers.utils.Interface(avaxStableVaultArtifact.abi)
        const dataAvaxStableVault = avaxStableVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L2 Avalanche Stable-AVAX", "daoASA",
                treasury.address, community.address, admin.address, stableAvaxStrategy.address
            ]
        )
        const AvaxStableVaultProxy = await ethers.getContractFactory("AvaxProxy", deployer)
        const avaxStableVaultProxy = await AvaxStableVaultProxy.deploy(
            avaxStableVaultImpl.address, proxyAdmin.address, dataAvaxStableVault,
        )
        const avaxStableVault = await ethers.getContractAt("AvaxStableVault", avaxStableVaultProxy.address, deployer)
        // const avaxStableVaultProxyAddr = "0x3845d7c09374Df1ae6Ce4728c99DD20D3d75F414"
        // const avaxStableVault = await ethers.getContractAt("AvaxStableVault", avaxStableVaultProxyAddr, deployer)

        await stableAvaxStrategy.connect(admin).setVault(avaxStableVault.address)

        // Set whitelist
        await USDTAVAXVault.connect(admin).setWhitelistAddress(stableAvaxStrategy.address, true)
        await USDCAVAXVault.connect(admin).setWhitelistAddress(stableAvaxStrategy.address, true)
        await DAIAVAXVault.connect(admin).setWhitelistAddress(stableAvaxStrategy.address, true)

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
        const USDTPriceInAVAX = (await lydRouter.getAmountsOut(ethers.utils.parseUnits("1", 6), [USDTAddr, WAVAXAddr]))[1]
        const USDTPriceInAVAXMin = USDTPriceInAVAX.mul(95).div(100)
        const USDCPriceInAVAX = (await pngRouter.getAmountsOut(ethers.utils.parseUnits("1", 6), [USDCAddr, WAVAXAddr]))[1]
        const USDCPriceInAVAXMin = USDCPriceInAVAX.mul(95).div(100)
        const DAIPriceInAVAX = (await joeRouter.getAmountsOut(ethers.utils.parseUnits("1", 18), [DAIAddr, WAVAXAddr]))[1]
        const DAIPriceInAVAXMin = DAIPriceInAVAX.mul(95).div(100)

        tokenPriceMin = [0, USDCPriceInAVAXMin, USDTPriceInAVAXMin, DAIPriceInAVAXMin]
        // tokenPriceMin: Fist element 0 because slippage swap between Stablecoins with Curve is set in contract
        tx = await avaxStableVault.connect(admin).invest(tokenPriceMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 2438096
        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 29617.375560147600345004
        // console.log(ethers.utils.formatEther(
        //     (await avaxStableVault.balanceOf(client.address))
        //     .mul(await avaxStableVault.getPricePerFullShare())
        //     .div(ethers.utils.parseEther("1"))
        // )) // User share in USD
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 0.997218032328202031
        // console.log(ethers.utils.formatEther(await avaxStableVault.balanceOf(client.address))) // 29700.0
        // console.log(ethers.utils.formatEther(await stableAvaxStrategy.getAllPoolInUSD())) // 26944.375560147600345004
        // console.log(ethers.utils.formatEther(await stableAvaxStrategy.watermark())) // 27027.0

        // Farm invest
        await USDTAVAXVault.connect(admin).invest()
        await USDCAVAXVault.connect(admin).invest()
        await DAIAVAXVault.connect(admin).invest()

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
        // console.log(receipt.gasUsed.toString()) // 2111364
        // console.log(ethers.utils.formatEther(await avaxStableVault.balanceOf(client2.address))) // 9927.618313205286583194
        // console.log(ethers.utils.formatEther(await avaxStableVault.balanceOf(client3.address))) // 9927.618313205286583194
        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 49313.827668198380990541
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 0.995128487428439949
        // console.log(ethers.utils.formatEther(await stableAvaxStrategy.getAllPoolInUSD())) // 45457.785136198380990541
        // console.log(ethers.utils.formatEther(await stableAvaxStrategy.watermark())) // 45643.957468

        // Farm invest
        await USDTAVAXVault.connect(admin).invest()
        await USDCAVAXVault.connect(admin).invest()
        await DAIAVAXVault.connect(admin).invest()
        // console.log(ethers.utils.formatEther(await USDTAVAXVault.getPricePerFullShare(true))) // 15092315.708770534218511152
        // console.log(ethers.utils.formatEther(await USDTAVAXVault.getPricePerFullShare(false))) // 1.0
        // console.log(ethers.utils.formatEther(await USDCAVAXVault.getPricePerFullShare(true))) // 16608527.564915455856125436
        // console.log(ethers.utils.formatEther(await USDCAVAXVault.getPricePerFullShare(false))) // 1.0
        // console.log(ethers.utils.formatEther(await DAIAVAXVault.getPricePerFullShare(true))) // 15.353671131882631645
        // console.log(ethers.utils.formatEther(await DAIAVAXVault.getPricePerFullShare(false))) // 1.0

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await USDTAVAXVault.getAllPoolInUSD())) // 500 2239.869235621337160827
        // console.log(ethers.utils.formatEther(await USDCAVAXVault.getAllPoolInUSD())) // 4500 20469.834187192162355225
        // console.log(ethers.utils.formatEther(await DAIAVAXVault.getAllPoolInUSD())) // 5000 22748.081713384881474489

        // Yield in farms
        for (let i=0; i<10000; i++) {
            await network.provider.send("evm_mine")
        }
        // console.log(ethers.utils.formatEther(await USDTAVAXVault.getPendingRewards())) // 8.380460062800024826
        // console.log(ethers.utils.formatEther(await USDCAVAXVault.getPendingRewards())) // 0.396959466678815045
        // console.log(ethers.utils.formatEther(await DAIAVAXVault.getPendingRewards())) // 1.510169116054587292
        await USDTAVAXVault.connect(admin).yield()
        await USDCAVAXVault.connect(admin).yield()
        await DAIAVAXVault.connect(admin).yield()
        // console.log(ethers.utils.formatEther(await USDTAVAXVault.getPricePerFullShare(false))) // 1.000147035074494258
        // console.log(ethers.utils.formatEther(await USDCAVAXVault.getPricePerFullShare(false))) // 1.000017000855552061
        // console.log(ethers.utils.formatEther(await DAIAVAXVault.getPricePerFullShare(false))) // 1.000079805801580049

        // Assume profit
        await joeRouter.swapExactAVAXForTokens(
            0, [WAVAXAddr, JOEAddr], DAIAVAXVaultAddr, Math.ceil(Date.now() / 1000),
            {value: ethers.utils.parseEther("10")}
        )
        await DAIAVAXVault.connect(admin).yield()

        // Collect profit
        tx = await avaxStableVault.connect(admin).collectProfitAndUpdateWatermark()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 294392
        // console.log(ethers.utils.formatEther(await avaxStableVault.fees())) // 45.737242419693538178
        // console.log(ethers.utils.formatEther(await stableAvaxStrategy.watermark())) // 45872.643680098467690892
        // console.log(ethers.utils.formatEther(await stableAvaxStrategy.getAllPoolInUSD())) // 45872.643680098467690892
        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 49682.948969678774152714
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 1.002577171495133904

        // Test reimburse
        const AVAXPriceInUSDTMin = ((await lydRouter.getAmountsOut(ethers.utils.parseEther("1"), [WAVAXAddr, USDTAddr]))[1]).mul(95).div(100)
        const AVAXPriceInUSDCMin = ((await pngRouter.getAmountsOut(ethers.utils.parseEther("1"), [WAVAXAddr, USDCAddr]))[1]).mul(95).div(100)
        const AVAXPriceInDAIMin = ((await joeRouter.getAmountsOut(ethers.utils.parseEther("1"), [WAVAXAddr, DAIAddr]))[1]).mul(95).div(100)
        // await avaxStableVault.connect(admin).reimburse(0, USDTAddr, ethers.utils.parseUnits("1000", 6), [AVAXPriceInUSDTMin])
        // await avaxStableVault.connect(admin).reimburse(1, USDCAddr, ethers.utils.parseUnits("1000", 6), [AVAXPriceInUSDCMin])
        // await avaxStableVault.connect(admin).reimburse(2, DAIAddr, ethers.utils.parseUnits("1000", 18), [AVAXPriceInDAIMin])
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxStableVault.address), 18))
        // console.log(ethers.utils.formatEther(await stableAvaxStrategy.watermark()))

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await USDTAVAXVault.getAllPoolInUSD())) // 500
        // console.log(ethers.utils.formatEther(await USDCAVAXVault.getAllPoolInUSD())) // 4500
        // console.log(ethers.utils.formatEther(await DAIAVAXVault.getAllPoolInUSD())) // 5000

        // Test emergency withdraw
        // await avaxStableVault.connect(admin).emergencyWithdraw()
        // console.log(ethers.utils.formatEther(await USDTAVAXVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await USDCAVAXVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await DAIAVAXVault.getAllPoolInUSD()))

        // await avaxStableVault.connect(admin).reinvest(tokenPriceMin)
        // console.log(ethers.utils.formatEther(await stableAvaxStrategy.watermark())) // 45777.771686
        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 49454.295530342498253839
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 0.997963058943113226
        // console.log(ethers.utils.formatEther(await USDTAVAXVault.getAllPoolInUSD())) // 500 2238.60988968338822291
        // console.log(ethers.utils.formatEther(await USDCAVAXVault.getAllPoolInUSD())) // 4500 20534.112803504707895132
        // console.log(ethers.utils.formatEther(await DAIAVAXVault.getAllPoolInUSD())) // 5000 22818.836326154402135797

        // Withdraw
        console.log("-----withdraw-----")

        tokenPriceMin = [0, AVAXPriceInUSDTMin, AVAXPriceInUSDCMin, AVAXPriceInDAIMin]
        // tokenPriceMin: Fist element 0 because slippage swap between Stablecoins with Curve is set in contract
        await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(3), USDTAddr, tokenPriceMin)
        await avaxStableVault.connect(client2).withdraw(avaxStableVault.balanceOf(client2.address), USDTAddr, tokenPriceMin)
        await avaxStableVault.connect(client3).withdraw(avaxStableVault.balanceOf(client3.address), USDTAddr, tokenPriceMin)
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client.address), 6)) // 9922.909893
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 9946.950877
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 9943.427111

        // await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(3), USDCAddr, tokenPriceMin)
        // await avaxStableVault.connect(client2).withdraw(avaxStableVault.balanceOf(client2.address), USDCAddr, tokenPriceMin)
        // await avaxStableVault.connect(client3).withdraw(avaxStableVault.balanceOf(client3.address), USDCAddr, tokenPriceMin)
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client.address), 6)) // 9917.557231
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client2.address), 6)) // 9940.643479
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client3.address), 6)) // 9937.122684

        // await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(3), DAIAddr, tokenPriceMin)
        // await avaxStableVault.connect(client2).withdraw(avaxStableVault.balanceOf(client2.address), DAIAddr, tokenPriceMin)
        // await avaxStableVault.connect(client3).withdraw(avaxStableVault.balanceOf(client3.address), DAIAddr, tokenPriceMin)
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client.address), 18)) // 9909.879152702417101382
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client2.address), 18)) // 9932.649094250616715903
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client3.address), 18)) // 9929.066690358649883495

        // console.log(ethers.utils.formatEther(await avaxStableVault.getAllPoolInUSD())) // 19867.957056823533977328
        // console.log(ethers.utils.formatEther(await avaxStableVault.getPricePerFullShare())) // 1.00343217458704717
        // console.log(ethers.utils.formatEther(await stableAvaxStrategy.watermark())) // 17515.043076977761026513
        // console.log(ethers.utils.formatEther(await stableAvaxStrategy.getAllPoolInUSD())) // 17540.173033243227515506

        // console.log(ethers.utils.formatEther(await USDTAVAXVault.getAllPoolInUSD())) // 500 862.628806458041429153
        // console.log(ethers.utils.formatEther(await USDCAVAXVault.getAllPoolInUSD())) // 4500 7825.166084316314936481
        // console.log(ethers.utils.formatEther(await DAIAVAXVault.getAllPoolInUSD())) // 5000 8852.378142468871149872

        // Test withdraw within token keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxStableVault.address), 18))
        // tx = await avaxStableVault.connect(client).withdraw((await avaxStableVault.balanceOf(client.address)).div(35),DAIAddr, tokenPriceMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // // 330276 900907 1160207 2022414
        // // 330305 901549 1161418 2207057
        // // 330217 901552 1161421 2206995
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxStableVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxStableVault.address), 18))
    })
});