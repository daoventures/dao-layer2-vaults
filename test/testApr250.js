const { ethers, network, artifacts } = require("hardhat");
const IERC20_ABI = require("../abis/IERC20_ABI.json")
const router_ABI = require("../abis/router_ABI.json")
const masterChef_ABI = require("../abis/masterChef_ABI.json")
const pair_ABI = require("../abis/pair_ABI.json")
const middleware = require("../middleware/withdraw.js")

const USDTAddr = "0xc7198437980c041c805A1EDcbA50c1Ce5db95118"
const USDCAddr = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"
const DAIAddr = "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70"
const WAVAXAddr = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
const TIMEAddr = "0xb54f16fB19478766A268F172C9480f8da1a7c9C3"
const JOEAddr = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"
const PNGAddr = "0x60781C2586D68229fde47564546784ab3fACA982"
const LYDAddr = "0x4C9B4E1AC6F24CdE3660D5E4Ef1eBF77C710C084"

const joePairAddr = "0xb5c9e891AF3063004a441BA4FaB4cA3D6DEb5626" // YAK-JOE
const pngPairAddr = "0x2f151656065e1d1be83bd5b6f5e7509b59e6512d" // TIME-WAVAX
const lydPairAddr = "0x7Be2c5B9dEE94102cF3920BF7192010Be04D806B" // ETH-LYD

const joeRouterAddr = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"
const joeStakingContractAddr = "0xd6a4F121CA35509aF06A0Be99093d08462f53052"
const joeStakingContractV3Addr = "0x188bED1968b795d5c9022F6a0bb5931Ac4c18F00"

const pngRouterAddr = "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"
const pngStakingContractAddr = "0x0875E51e54FBB7e63B1819acb069Dc8d684563EB" // TIME-WAVAX

const lydRouterAddr = "0xA52aBE4676dbfd04Df42eF7755F01A3c41f28D27"
const lydStakingContractAddr = "0xFb26525B14048B7BB1F3794F6129176195Db7766"

const TIMEWAVAXAddr = "0xf64e1c5b6e17031f5504481ac8145f4c3eab4917"

describe("DAO Avalanche", function () {
    it("Should work on APR250 strategy", async function () {
        let tx, receipt, amountsOutMin
        // const [deployer, client, client2, client3, treasury, community, admin, multisig] = await ethers.getSigners()
        const [deployer, client, client2, client3, treasury, community] = await ethers.getSigners()

        const adminAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
        await network.provider.request({method: "hardhat_impersonateAccount", params: [adminAddr]})
        const admin = await ethers.getSigner(adminAddr)
        await deployer.sendTransaction({to: adminAddr, value: ethers.utils.parseEther("10")})

        // Deploy AvaxVaultL1
        // const avaxVaultL1Fac = await ethers.getContractFactory("AvaxVaultL1", deployer)
        // const avaxVaultL1 = await avaxVaultL1Fac.deploy()
        const avaxVaultL1Artifact = await artifacts.readArtifact("AvaxVaultL1")
        const avaxVaultL1Interface = new ethers.utils.Interface(avaxVaultL1Artifact.abi)

        // const avaxVaultL1FactoryFac = await ethers.getContractFactory("AvaxVaultL1Factory", deployer)
        // const avaxVaultL1Factory = await avaxVaultL1FactoryFac.deploy(avaxVaultL1.address)
        // await avaxVaultL1Factory.transferOwnership(multisig.address)
        const avaxVaultL1Factory = await ethers.getContractAt("AvaxVaultL1Factory", "0x04DDc3281f71DC70879E312BbF759d54f514f07f", deployer)

        // Upgrade AvaxVaultL1
        // const avaxVaultL1Fac = await ethers.getContractFactory("AvaxVaultL1", deployer)
        // const avaxVaultL1Impl = await avaxVaultL1Fac.deploy()
        // await avaxVaultL1Factory.connect(admin).updateLogic(avaxVaultL1Impl.address)
        
        // Deploy YAK-AVAX (Joe)
        const dataYAKAVAX = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Joe YAK-AVAX", "daoJoeYAK",
                joeRouterAddr, joeStakingContractV3Addr, JOEAddr, 1, false,
                treasury.address, community.address, admin.address,
            ]
        )
        // tx = await avaxVaultL1Factory.connect(multisig).createVault(dataYAKAVAX)
        tx = await avaxVaultL1Factory.connect(admin).createVault(dataYAKAVAX)
        await tx.wait()
        const YAKAVAXVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const YAKAVAXVaultAddr = "0xFe67a4BAe72963BE1181B211180d8e617B5a8dee"
        const YAKAVAXVault = await ethers.getContractAt("AvaxVaultL1", YAKAVAXVaultAddr, deployer)

        // Deploy TIME-AVAX
        const dataTIMEAVAX = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Pangolin TIME-AVAX", "daoPngTIME",
                pngRouterAddr, pngStakingContractAddr, PNGAddr, 999, true,
                treasury.address, community.address, admin.address,
            ]
        )
        // tx = await avaxVaultL1Factory.connect(multisig).createVault(dataPNGAVAX)
        tx = await avaxVaultL1Factory.connect(admin).createVault(dataTIMEAVAX)
        await tx.wait()
        const TIMEAVAXVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const TIMEAVAXVaultAddr = "0x7eEcFB07b7677aa0e1798a4426b338dA23f9De34"
        const TIMEAVAXVault = await ethers.getContractAt("AvaxVaultL1", TIMEAVAXVaultAddr, deployer)

        // Deploy LYD-ETH
        const dataLYDETH = avaxVaultL1Interface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Lydia LYD-ETH", "daolydETH",
                lydRouterAddr, lydStakingContractAddr, LYDAddr, 19, false,
                treasury.address, community.address, admin.address,
            ]
        )
        // tx = await avaxVaultL1Factory.connect(multisig).createVault(dataLYDETH)
        tx = await avaxVaultL1Factory.connect(admin).createVault(dataLYDETH)
        await tx.wait()
        const LYDETHVaultAddr = await avaxVaultL1Factory.getVault((await avaxVaultL1Factory.getVaultLength()).sub(1))
        // const LYDETHVaultAddr = "0xffEaB42879038920A31911f3E93295bF703082ed"
        const LYDETHVault = await ethers.getContractAt("AvaxVaultL1", LYDETHVaultAddr, deployer)

        // Deploy proxy admin
        // const proxyAdminFac = await ethers.getContractFactory("DAOProxyAdmin", deployer)
        // const proxyAdmin = await proxyAdminFac.deploy()
        const proxyAdmin = await ethers.getContractAt("DAOProxyAdmin", "0xd02C2Ff6ef80f1d096Bc060454054B607d26763E", deployer)

        // Deploy APR250 strategy
        const apr250StrategyFac = await ethers.getContractFactory("APR250Strategy", deployer)
        const apr250StrategyImpl = await apr250StrategyFac.deploy()
        const apr250StrategyArtifact = await artifacts.readArtifact("APR250Strategy")
        const apr250StrategyInterface = new ethers.utils.Interface(apr250StrategyArtifact.abi)
        const dataApr250Strategy = apr250StrategyInterface.encodeFunctionData(
            "initialize",
            [
                joePairAddr, pngPairAddr, lydPairAddr,
                YAKAVAXVaultAddr, TIMEAVAXVaultAddr, LYDETHVaultAddr
            ]
        )
        const apr250StrategyProxyFac = await ethers.getContractFactory("AvaxProxy", deployer)
        const apr250StrategyProxy = await apr250StrategyProxyFac.deploy(
            apr250StrategyImpl.address, proxyAdmin.address, dataApr250Strategy,
        )
        const apr250Strategy = await ethers.getContractAt("APR250Strategy", apr250StrategyProxy.address, deployer)
        // const apr250StrategyProxyAddr = "0xDE5d4923e7Db1242a26693aA04Fa0C0FCf7D11f4"
        // const apr250Strategy = await ethers.getContractAt("APR250Strategy", apr250StrategyProxyAddr, deployer)

        const AvaxVaultFac = await ethers.getContractFactory("AvaxVault", deployer)
        const avaxVaultImpl = await AvaxVaultFac.deploy()
        const avaxVaultArtifact = await artifacts.readArtifact("AvaxVault")
        const avaxVaultInterface = new ethers.utils.Interface(avaxVaultArtifact.abi)
        const dataAvaxVault = avaxVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L2 Avalanche APR250", "daoAPR",
                treasury.address, community.address, admin.address, apr250Strategy.address
            ]
        )
        const AvaxVaultProxy = await ethers.getContractFactory("AvaxProxy", deployer)
        const avaxVaultProxy = await AvaxVaultProxy.deploy(
            avaxVaultImpl.address, proxyAdmin.address, dataAvaxVault,
        )
        const avaxVault = await ethers.getContractAt("AvaxVault", avaxVaultProxy.address, deployer)
        // const avaxVaultProxyAddr = "0xa4DCbe792f51E13Fc0E6961BBEc436a881e73194"
        // const avaxVault = await ethers.getContractAt("AvaxVault", avaxVaultProxyAddr, deployer)

        await apr250Strategy.setVault(avaxVault.address)

        // Set whitelist
        await YAKAVAXVault.connect(admin).setWhitelistAddress(apr250Strategy.address, true)
        await TIMEAVAXVault.connect(admin).setWhitelistAddress(apr250Strategy.address, true)
        await LYDETHVault.connect(admin).setWhitelistAddress(apr250Strategy.address, true)

        // Swap & transfer Stablecoins to client
        const joeRouter = new ethers.Contract(joeRouterAddr, router_ABI, deployer)    
        await joeRouter.swapAVAXForExactTokens(
            ethers.utils.parseUnits("20000", 6), [WAVAXAddr, USDTAddr], deployer.address, Math.ceil(Date.now() / 1000) + 10000,
            {value: ethers.utils.parseEther("400")}
        )   
        await joeRouter.swapAVAXForExactTokens(
            ethers.utils.parseUnits("20000", 6), [WAVAXAddr, USDCAddr], deployer.address, Math.ceil(Date.now() / 1000) + 10000,
            {value: ethers.utils.parseEther("400")}
        )   
        await joeRouter.swapAVAXForExactTokens(
            ethers.utils.parseUnits("10000", 18), [WAVAXAddr, DAIAddr], deployer.address, Math.ceil(Date.now() / 1000) + 10000,
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
        await USDTContract.connect(client).approve(avaxVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client).approve(avaxVault.address, ethers.constants.MaxUint256)
        await DAIContract.connect(client).approve(avaxVault.address, ethers.constants.MaxUint256)
        tx = await avaxVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 213737
        await avaxVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        await avaxVault.connect(client).deposit(ethers.utils.parseUnits("10000", 18), DAIAddr)
        // console.log(ethers.utils.formatEther(await avaxVault.balanceOf(client.address))) // 0.0

        // Invest
        amountsOutMin = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        tx = await avaxVault.connect(admin).invest(amountsOutMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 1832677
        // console.log(ethers.utils.formatEther(await avaxVault.getAllPoolInUSD())) // 28958.074839465288498629
        // console.log(ethers.utils.formatEther(
        //     (await avaxVault.balanceOf(client.address))
        //     .mul(await avaxVault.getPricePerFullShare())
        //     .div(ethers.utils.parseEther("1"))
        // )) // User share in USD
        // console.log(ethers.utils.formatEther(await avaxVault.getPricePerFullShare())) // 0.975019354864151127
        // console.log((await apr250Strategy.getCurrentCompositionPerc()).toString()); // 2044,3901,4053
        // console.log(ethers.utils.formatEther(await avaxVault.balanceOf(client.address))) // 29700.0
        // console.log(ethers.utils.formatEther(await apr250Strategy.getAllPoolInUSD())) // 26285.074839465288498629
        // console.log(ethers.utils.formatEther(await apr250Strategy.watermark())) // 27027.0

        // Farm invest
        await YAKAVAXVault.connect(admin).invest()
        await TIMEAVAXVault.connect(admin).invest()
        await LYDETHVault.connect(admin).invest()

        // Check fees
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(treasury.address), 6)) // 150.0
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(community.address), 6)) // 150.0
        // console.log(ethers.utils.formatEther(await avaxVault.fees())) // 0.0

        // Check Stablecoins keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxVault.address), 6)) // 891.0
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxVault.address), 6)) // 891.0
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxVault.address), 18)) // 891.0

        // Second invest
        await USDTContract.connect(client2).approve(avaxVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client3).approve(avaxVault.address, ethers.constants.MaxUint256)
        await avaxVault.connect(client2).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        await avaxVault.connect(client3).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        tx = await avaxVault.connect(admin).invest(amountsOutMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 1464036
        // console.log(ethers.utils.formatEther(await avaxVault.balanceOf(client2.address))) // 10153.644592398231074686
        // console.log(ethers.utils.formatEther(await avaxVault.balanceOf(client3.address))) // 10153.644592398231074686
        // console.log(ethers.utils.formatEther(await avaxVault.getAllPoolInUSD())) // 48278.661980358157420066
        // console.log(ethers.utils.formatEther(await avaxVault.getPricePerFullShare())) // 0.965432495289829605
        // console.log((await apr250Strategy.getCurrentCompositionPerc()).toString()); // 2017,3962,4019
        // console.log(ethers.utils.formatEther(await apr250Strategy.getAllPoolInUSD())) // 44462.177490358157420066
        // console.log(ethers.utils.formatEther(await apr250Strategy.watermark())) // 45683.51551

        // Farm invest
        await YAKAVAXVault.connect(admin).invest()
        await TIMEAVAXVault.connect(admin).invest()
        await LYDETHVault.connect(admin).invest()
        // console.log(ethers.utils.formatEther(await YAKAVAXVault.getPricePerFullShare(true))) // 1262.8588676320702043
        // console.log(ethers.utils.formatEther(await YAKAVAXVault.getPricePerFullShare(false))) // 1.0
        // console.log(ethers.utils.formatEther(await TIMEAVAXVault.getPricePerFullShare(true))) // 55375764.140940716169876461
        // console.log(ethers.utils.formatEther(await TIMEAVAXVault.getPricePerFullShare(false))) // 1.0
        // console.log(ethers.utils.formatEther(await LYDETHVault.getPricePerFullShare(true))) // 35.985086384998570094
        // console.log(ethers.utils.formatEther(await LYDETHVault.getPricePerFullShare(false))) // 1.0

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await YAKAVAXVault.getAllPoolInUSD())) // 2000 8969.090180197210022783
        // console.log(ethers.utils.formatEther(await TIMEAVAXVault.getAllPoolInUSD())) // 4000 17619.503234595987201309
        // console.log(ethers.utils.formatEther(await LYDETHVault.getAllPoolInUSD())) // 4000 17873.584075564960196089

        // Yield in farms
        for (let i=0; i<10000; i++) {
            await network.provider.send("evm_mine")
        }
        // console.log(ethers.utils.formatEther((await YAKAVAXVault.getPendingRewards())[0])) // 0.920666589678555007
        // console.log(ethers.utils.formatEther((await YAKAVAXVault.getPendingRewards())[1])) // 0.007261799538057526
        // console.log(ethers.utils.formatEther((await TIMEAVAXVault.getPendingRewards())[0])) // 2.137052240105903119
        // console.log(ethers.utils.formatEther((await LYDETHVault.getPendingRewards())[0])) // 197.482941976077953833
        await YAKAVAXVault.connect(admin).yield()
        await TIMEAVAXVault.connect(admin).yield()
        await LYDETHVault.connect(admin).yield()
        // console.log(ethers.utils.formatEther(await YAKAVAXVault.getPricePerFullShare(false))) // 1.000213478108146153
        // console.log(ethers.utils.formatEther(await TIMEAVAXVault.getPricePerFullShare(false))) // 1.000126164965733469
        // console.log(ethers.utils.formatEther(await LYDETHVault.getPricePerFullShare(false))) // 1.0005987168825783

        // Assume profit
        await joeRouter.swapExactAVAXForTokens(
            0, [WAVAXAddr, JOEAddr], YAKAVAXVaultAddr, Math.ceil(Date.now() / 1000) + 10000,
            {value: ethers.utils.parseEther("30")}
        )
        await YAKAVAXVault.connect(admin).yield()

        // Collect profit
        tx = await avaxVault.connect(admin).collectProfitAndUpdateWatermark()
        receipt = await tx.wait()
        console.log(receipt.gasUsed.toString()) // 307116
        console.log(ethers.utils.formatEther(await avaxVault.fees())) // 94.720897618868309157
        console.log(ethers.utils.formatEther(await apr250Strategy.watermark())) // 46157.119998094341545786
        console.log(ethers.utils.formatEther(await apr250Strategy.getAllPoolInUSD())) // 46157.119998094341545786
        console.log(ethers.utils.formatEther(await avaxVault.getPricePerFullShare())) // 0.99743226244785075

        // Test reimburse
        // const AVAXPriceInUSDTMin = ((await joeRouter.getAmountsOut(ethers.utils.parseEther("1"), [WAVAXAddr, USDTAddr]))[1]).mul(95).div(100)
        // const AVAXPriceInUSDCMin = ((await joeRouter.getAmountsOut(ethers.utils.parseEther("1"), [WAVAXAddr, USDCAddr]))[1]).mul(95).div(100)
        // const AVAXPriceInDAIMin = ((await joeRouter.getAmountsOut(ethers.utils.parseEther("1"), [WAVAXAddr, DAIAddr]))[1]).mul(95).div(100)
        // const JOEPriceInAVAXMin = ((await joeRouter.getAmountsOut(ethers.utils.parseEther("1"), [JOEAddr, WAVAXAddr]))[1]).mul(95).div(100)
        // const PNGPriceInAVAXMin = ((await pngRouter.getAmountsOut(ethers.utils.parseEther("1"), [PNGAddr, WAVAXAddr]))[1]).mul(95).div(100)
        // const LYDPriceInAVAXMin = ((await lydRouter.getAmountsOut(ethers.utils.parseEther("1"), [LYDAddr, WAVAXAddr]))[1]).mul(95).div(100)
        // await avaxVault.connect(admin).reimburse(0, USDTAddr, ethers.utils.parseUnits("1000", 6), [JOEPriceInAVAXMin, AVAXPriceInUSDTMin])
        // await avaxVault.connect(admin).reimburse(1, USDCAddr, ethers.utils.parseUnits("1000", 6), [PNGPriceInAVAXMin, AVAXPriceInUSDCMin])
        // await avaxVault.connect(admin).reimburse(2, DAIAddr, ethers.utils.parseUnits("1000", 18), [LYDPriceInAVAXMin, AVAXPriceInDAIMin])
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxVault.address), 18))
        // console.log(ethers.utils.formatEther(await apr250Strategy.watermark())) // 44697.578644351970332677
        // console.log((await apr250Strategy.getCurrentCompositionPerc()).toString());

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await YAKAVAXVault.getAllPoolInUSD())) // 4500 20464.744092911234147069
        // console.log(ethers.utils.formatEther(await TIMEAVAXVault.getAllPoolInUSD())) // 4500 20464.05268839398514812
        // console.log(ethers.utils.formatEther(await LYDETHVault.getAllPoolInUSD())) // 1000 4555.939291862540779607

        // Test emergency withdraw
        // await avaxVault.connect(admin).emergencyWithdraw()
        // console.log(ethers.utils.formatEther(await YAKAVAXVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await TIMEAVAXVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await LYDETHVault.getAllPoolInUSD()))

        // await avaxVault.connect(admin).reinvest(tokenPriceMin)
        // console.log(ethers.utils.formatEther(await apr250Strategy.watermark())) // 45737.700863078580395425
        // console.log((await apr250Strategy.getCurrentCompositionPerc()).toString()); // 4498,4498,1002
        // console.log(ethers.utils.formatEther(await avaxVault.getAllPoolInUSD())) // 49411.658560794983399728
        // console.log(ethers.utils.formatEther(await avaxVault.getPricePerFullShare())) // 0.996923065394557798
        // console.log(ethers.utils.formatEther(await YAKAVAXVault.getAllPoolInUSD())) // 4500 20499.739575482749036949
        // console.log(ethers.utils.formatEther(await TIMEAVAXVault.getAllPoolInUSD())) // 4500 20498.043471501565513769
        // console.log(ethers.utils.formatEther(await LYDETHVault.getAllPoolInUSD())) // 1000 4569.196146681062913684

        // Withdraw
        // console.log("-----withdraw-----")

        // const pair_ABI = require("../middleware/pair_ABI.json")
        // const avaxVaultL1ABI = require("../middleware/AvaxVaultL1.json").abi
        // const avaxVaultABI = require("../middleware/AvaxVault.json").abi
        // const avaxStableVaultABI = require("../middleware/AvaxStableVault.json").abi
        // const apr250StrategyABI = require("../middleware/DeXAvaxStrategy.json").abi
        // const deXStableStrategyABI = require("../middleware/DeXStableStrategy.json").abi
        // const stableAvaxStrategyABI = require("../middleware/StableAvaxStrategy.json").abi
        // const stableStableStrategyABI = require("../middleware/StableStableStrategy.json").abi

        // const dexAvaxVaultAddr = avaxVault.address
        // const dexAvaxStrategyAddr = apr250Strategy.address

        // const getAmountsOutMinDeXAvax = async (shareToWithdraw, stablecoinAddr, provider) => {
        //     // provider = new ethers.providers.Web3Provider(provider) // uncomment this to change Web3 provider to Ethers provider
        //     if (!ethers.BigNumber.isBigNumber(shareToWithdraw)) shareToWithdraw = new ethers.BigNumber.from(shareToWithdraw)
        
        //     const avaxVault = new ethers.Contract(dexAvaxVaultAddr, avaxVaultABI, provider)
        //     const dexAvaxStrategy = new ethers.Contract(dexAvaxStrategyAddr, apr250StrategyABI, provider)
        
        //     const amtWithdrawInUSD = (
        //         (await avaxVault.getAllPoolInUSD())
        //             .sub(await avaxVault.totalPendingDepositAmt()))
        //             .mul(shareToWithdraw)
        //             .div(await avaxVault.totalSupply()
        //     )
        
        //     const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, provider)
        //     const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, provider)
        //     const DAIContract = new ethers.Contract(DAIAddr, IERC20_ABI, provider)
        //     const USDTAmtInVault = (await USDTContract.balanceOf(avaxVault.address)).mul(ethers.utils.parseUnits("1", 12))
        //     const USDCAmtInVault = (await USDCContract.balanceOf(avaxVault.address)).mul(ethers.utils.parseUnits("1", 12))
        //     const DAIAmtInVault = await DAIContract.balanceOf(avaxVault.address)
        //     const totalAmtInVault = USDTAmtInVault.add(USDCAmtInVault).add(DAIAmtInVault).sub(await avaxVault.fees())
        
        //     let amountsOutMin
        //     if (amtWithdrawInUSD.gt(totalAmtInVault)) {
        //         const oneEther = ethers.utils.parseEther("1")
        
        //         let stablecoinAmtInVault
        //         if (stablecoinAddr == USDTAddr) stablecoinAmtInVault = USDTAmtInVault
        //         else if (stablecoinAddr == USDCAddr) stablecoinAmtInVault = USDCAmtInVault
        //         else stablecoinAmtInVault = DAIAmtInVault
        //         const amtToWithdrawFromStrategy = amtWithdrawInUSD.sub(stablecoinAmtInVault)
        //         const strategyAllPoolInUSD = await dexAvaxStrategy.getAllPoolInUSD()
        //         const sharePerc = amtToWithdrawFromStrategy.mul(oneEther).div(strategyAllPoolInUSD)
        
        //         const WAVAXContract = new ethers.Contract(WAVAXAddr, IERC20_ABI, provider)
        //         const WAVAXAmtBefore = await WAVAXContract.balanceOf(dexAvaxStrategyAddr)
        //         let totalWithdrawWAVAX = WAVAXAmtBefore
        //         let WAVAXAmt, _WAVAXAmt
        
        //         const YAKAVAXVault = new ethers.Contract(YAKAVAXVaultAddr, avaxVaultL1ABI, provider)
        //         const YAKAVAXVaultAmt = (await YAKAVAXVault.balanceOf(dexAvaxStrategyAddr)).mul(sharePerc).div(oneEther)
        //         const JOEAVAXAmt = (await YAKAVAXVault.getAllPool()).mul(YAKAVAXVaultAmt).div(await YAKAVAXVault.totalSupply())
        //         const JOEAVAX = new ethers.Contract(JOEAVAXAddr, pair_ABI, provider)
        //         const [JOEReserve, WAVAXReserveJOE] = await JOEAVAX.getReserves()
        //         const JOEAmt = JOEReserve.mul(JOEAVAXAmt).div(await JOEAVAX.totalSupply())
        //         WAVAXAmt = WAVAXReserveJOE.mul(JOEAVAXAmt).div(await JOEAVAX.totalSupply())
        //         totalWithdrawWAVAX = totalWithdrawWAVAX.add(WAVAXAmt)
        //         const joeRouter = new ethers.Contract(joeRouterAddr, router_ABI, provider)
        //         _WAVAXAmt = (await joeRouter.getAmountsOut(JOEAmt, [JOEAddr, WAVAXAddr]))[1]
        //         const _WAVAXAmtMinJoe = _WAVAXAmt.mul(995).div(1000)
        //         totalWithdrawWAVAX = totalWithdrawWAVAX.add(_WAVAXAmt)
        
        //         const TIMEAVAXVault = new ethers.Contract(TIMEAVAXVaultAddr, avaxVaultL1ABI, provider)
        //         const TIMEAVAXVaultAmt = (await TIMEAVAXVault.balanceOf(dexAvaxStrategyAddr)).mul(sharePerc).div(oneEther)
        //         const PNGAVAXAmt = (await TIMEAVAXVault.getAllPool()).mul(TIMEAVAXVaultAmt).div(await TIMEAVAXVault.totalSupply())
        //         const PNGAVAX = new ethers.Contract(PNGAVAXAddr, pair_ABI, provider)
        //         const [PNGReserve, WAVAXReservePNG] = await PNGAVAX.getReserves()
        //         const PNGAmt = PNGReserve.mul(PNGAVAXAmt).div(await PNGAVAX.totalSupply())
        //         WAVAXAmt = WAVAXReservePNG.mul(PNGAVAXAmt).div(await PNGAVAX.totalSupply())
        //         totalWithdrawWAVAX = totalWithdrawWAVAX.add(WAVAXAmt)
        //         const pngRouter = new ethers.Contract(pngRouterAddr, router_ABI, provider)
        //         _WAVAXAmt = (await pngRouter.getAmountsOut(PNGAmt, [PNGAddr, WAVAXAddr]))[1]
        //         const _WAVAXAmtMinPng = _WAVAXAmt.mul(995).div(1000)
        //         totalWithdrawWAVAX = totalWithdrawWAVAX.add(_WAVAXAmt)
        
        //         const LYDETHVault = new ethers.Contract(LYDETHVaultAddr, avaxVaultL1ABI, provider)
        //         const LYDETHVaultAmt = (await LYDETHVault.balanceOf(dexAvaxStrategyAddr)).mul(sharePerc).div(oneEther)
        //         const LYDAVAXAmt = (await LYDETHVault.getAllPool()).mul(LYDETHVaultAmt).div(await LYDETHVault.totalSupply())
        //         const LYDAVAX = new ethers.Contract(LYDAVAXAddr, pair_ABI, provider)
        //         const [LYDReserve, WAVAXReserveLYD] = await LYDAVAX.getReserves()
        //         const LYDAmt = LYDReserve.mul(LYDAVAXAmt).div(await LYDAVAX.totalSupply())
        //         WAVAXAmt = WAVAXReserveLYD.mul(LYDAVAXAmt).div(await LYDAVAX.totalSupply())
        //         totalWithdrawWAVAX = totalWithdrawWAVAX.add(WAVAXAmt)
        //         const lydRouter = new ethers.Contract(lydRouterAddr, router_ABI, provider)
        //         _WAVAXAmt = (await lydRouter.getAmountsOut(LYDAmt, [LYDAddr, WAVAXAddr]))[1]
        //         const _WAVAXAmtMinLyd = _WAVAXAmt.mul(995).div(1000)
        //         totalWithdrawWAVAX = totalWithdrawWAVAX.add(_WAVAXAmt)
        
        //         totalWithdrawWAVAX = totalWithdrawWAVAX.sub(WAVAXAmtBefore)

        //         const withdrawAmtInStablecoin = (await joeRouter.getAmountsOut(totalWithdrawWAVAX, [WAVAXAddr, stablecoinAddr]))[1]
        //         const withdrawAmtInStablecoinMin = withdrawAmtInStablecoin.mul(995).div(1000)

        //         // console.log(_WAVAXAmtMinJoe.toString())
        //         // console.log(_WAVAXAmtMinPng.toString())
        //         // console.log(_WAVAXAmtMinLyd.toString())
        //         // console.log(withdrawAmtInStablecoinMin.toString())
                
        //         amountsOutMin = [
        //             withdrawAmtInStablecoinMin,
        //             _WAVAXAmtMinJoe,
        //             _WAVAXAmtMinPng,
        //             _WAVAXAmtMinLyd
        //         ]
        //     } else {
        //         amountsOutMin = []
        //     }
        
        //     return amountsOutMin
        // }

        // amountsOutMin = await middleware.getAmountsOutMinDeXAvax((await avaxVault.balanceOf(client.address)).div(3), USDTAddr, deployer)
        // await avaxVault.connect(client).withdraw((await avaxVault.balanceOf(client.address)).div(3), USDTAddr, amountsOutMin)
        // amountsOutMin = await middleware.getAmountsOutMinDeXAvax(await avaxVault.balanceOf(client2.address), USDTAddr, deployer)
        // await avaxVault.connect(client2).withdraw(avaxVault.balanceOf(client2.address), USDTAddr, amountsOutMin)
        // amountsOutMin = await middleware.getAmountsOutMinDeXAvax(await avaxVault.balanceOf(client3.address), USDTAddr, deployer)
        // await avaxVault.connect(client3).withdraw(avaxVault.balanceOf(client3.address), USDTAddr, amountsOutMin)
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client.address), 6)) // 9842.995039
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 9859.888491
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 9853.75948

        // amountsOutMin = await getAmountsOutMinDeXAvax(
        //     avaxVault.address, apr250Strategy.address, (await avaxVault.balanceOf(client.address)).div(3), USDCAddr, deployer
        // )
        // await avaxVault.connect(client).withdraw((await avaxVault.balanceOf(client.address)).div(3), USDCAddr, amountsOutMin)
        // amountsOutMin = await getAmountsOutMinDeXAvax(avaxVault.address, apr250Strategy.address, await avaxVault.balanceOf(client2.address), USDCAddr, deployer)
        // await avaxVault.connect(client2).withdraw(avaxVault.balanceOf(client2.address), USDCAddr, amountsOutMin)
        // amountsOutMin = await getAmountsOutMinDeXAvax(avaxVault.address, apr250Strategy.address, await avaxVault.balanceOf(client3.address), USDCAddr, deployer)
        // await avaxVault.connect(client3).withdraw(avaxVault.balanceOf(client3.address), USDCAddr, amountsOutMin)
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client.address), 6)) // 9844.080167
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client2.address), 6)) // 9861.726068
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client3.address), 6)) // 9856.199273

        // amountsOutMin = await getAmountsOutMinDeXAvax(
        //     avaxVault.address, apr250Strategy.address, (await avaxVault.balanceOf(client.address)).div(3), DAIAddr, deployer
        // )
        // await avaxVault.connect(client).withdraw((await avaxVault.balanceOf(client.address)).div(3), DAIAddr, amountsOutMin)
        // amountsOutMin = await getAmountsOutMinDeXAvax(avaxVault.address, apr250Strategy.address, await avaxVault.balanceOf(client2.address), DAIAddr, deployer)
        // await avaxVault.connect(client2).withdraw(avaxVault.balanceOf(client2.address), DAIAddr, amountsOutMin)
        // amountsOutMin = await getAmountsOutMinDeXAvax(avaxVault.address, apr250Strategy.address, await avaxVault.balanceOf(client3.address), DAIAddr, deployer)
        // await avaxVault.connect(client3).withdraw(avaxVault.balanceOf(client3.address), DAIAddr, amountsOutMin)
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client.address), 18)) // 9841.539386186864417744
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client2.address), 18)) // 9854.417211070852915627
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client3.address), 18)) // 9840.180822409327116238

        // console.log(ethers.utils.formatEther(await avaxVault.getAllPoolInUSD())) // 19782.81963545362035058
        // console.log(ethers.utils.formatEther(await avaxVault.getPricePerFullShare())) // 0.999132304820889916
        // console.log((await apr250Strategy.getCurrentCompositionPerc()).toString()); // 4525,4479,995
        // console.log(ethers.utils.formatEther(await apr250Strategy.watermark())) // 17432.783199093938958873
        // console.log(ethers.utils.formatEther(await apr250Strategy.getAllPoolInUSD())) // 17420.262203324014417115

        // console.log(ethers.utils.formatEther(await YAKAVAXVault.getAllPoolInUSD())) // 4500 20499.739575482749036949
        // console.log(ethers.utils.formatEther(await TIMEAVAXVault.getAllPoolInUSD())) // 4500 20498.043471501565513769
        // console.log(ethers.utils.formatEther(await LYDETHVault.getAllPoolInUSD())) // 1000 4569.196146681062913684

        // Test withdraw within token keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxVault.address), 18))
        // amountsOutMin = await getAmountsOutMinDeXAvax(
        //     avaxVault.address, apr250Strategy.address, (await avaxVault.balanceOf(client.address)).div(5), DAIAddr, deployer
        // )
        // tx = await avaxVault.connect(client).withdraw((await avaxVault.balanceOf(client.address)).div(5), DAIAddr, amountsOutMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // // 320574 891124 1150322 1269075
        // // 320636 891799 1151599 1269295
        // // 320536 891835 1151635 1269195
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxVault.address), 18))
    })

    // it("Should calculate APR for Sushi-style staking contract", async function () {
    //     const [deployer] = await ethers.getSigners()
    //     let tx

    //     const lydRouterAddr = "0xA52aBE4676dbfd04Df42eF7755F01A3c41f28D27"
    //     const lydStakingContractAddr = "0xFb26525B14048B7BB1F3794F6129176195Db7766"
    //     const LYDAddr = "0x4c9b4e1ac6f24cde3660d5e4ef1ebf77c710c084"
    //     const LYDAVAXAddr = "0xfba4edaad3248b03f1a3261ad06ad846a8e50765"
    //     const oneEther = ethers.utils.parseEther("1")

    //     const masterChef = new ethers.Contract(lydStakingContractAddr, [
    //         "function poolInfo(uint) external view returns (address, uint, uint, uint)",
    //         "function totalAllocPoint() external view returns (uint)",
    //         "function lydPerSec() external view returns (uint)"
    //     ], deployer)
    //     const allocPoint = (await masterChef.poolInfo(4))[1]
    //     const totalAllocPoint = await masterChef.totalAllocPoint()
    //     const LYDPerSec = (await masterChef.lydPerSec()).mul(allocPoint).div(totalAllocPoint)
    //     const LYDPerYear = LYDPerSec.mul(86400).mul(365)

    //     // Calculate AVAX amount for reward
    //     const router = new ethers.Contract(lydRouterAddr, router_ABI, deployer)
    //     const AVAXPerLYD = (await router.getAmountsOut(oneEther, [LYDAddr, WAVAXAddr]))[1]
    //     const LYDPerYearInAVAX = LYDPerYear.mul(AVAXPerLYD).div(oneEther)
    //     // console.log(ethers.utils.formatEther(LYDPerYearInAVAX))

    //     // Calculate AVAX amount for stacked LP token
    //     const LYDAVAXContract = new ethers.Contract(LYDAVAXAddr, pair_ABI, deployer)
    //     const stakedLYDAVAX = await LYDAVAXContract.balanceOf(lydStakingContractAddr)
    //     const [reserveLYD, reserveWAVAX] = await LYDAVAXContract.getReserves()
    //     const totalSupplyLYDAVAX = await LYDAVAXContract.totalSupply()
    //     const WAVAXAmt = reserveWAVAX.mul(stakedLYDAVAX).div(totalSupplyLYDAVAX)
    //     const LYDAmt = reserveLYD.mul(stakedLYDAVAX).div(totalSupplyLYDAVAX)
    //     const _WAVAXAmt = LYDAmt.mul(AVAXPerLYD).div(oneEther)
    //     const LYDAVAXPriceInAVAX = WAVAXAmt.add(_WAVAXAmt)
    //     // console.log(ethers.utils.formatEther(LYDAVAXPriceInAVAX))

    //     // Calculate APR
    //     const apr = LYDPerYearInAVAX.mul(10000).div(LYDAVAXPriceInAVAX)
    //     console.log(apr.toString())
    // })
});