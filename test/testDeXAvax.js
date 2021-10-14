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
const pngRouterAddr = "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"
const lydRouterAddr = "0xA52aBE4676dbfd04Df42eF7755F01A3c41f28D27"

describe("DAO Avalanche", function () {
    it("Should work on DeXToken-AVAX strategy", async function () {
        let tx, receipt, tokenPriceMin
        const [deployer, client, client2, client3, treasury, community, admin, multisig] = await ethers.getSigners()

        // const adminAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
        // await network.provider.request({method: "hardhat_impersonateAccount", params: [adminAddr]})
        // const admin = await ethers.getSigner(adminAddr)
        // await deployer.sendTransaction({to: adminAddr, value: ethers.utils.parseEther("10")})

        // Deploy JoeImpl
        const JoeVault = await ethers.getContractFactory("JoeImpl", deployer)
        const joeVault = await JoeVault.deploy()
        const joeVaultArtifact = await artifacts.readArtifact("JoeImpl")
        const joeVaultInterface = new ethers.utils.Interface(joeVaultArtifact.abi)

        const JoeFactory = await ethers.getContractFactory("JoeFactory", deployer)
        const joeFactory = await JoeFactory.deploy(joeVault.address)
        await joeFactory.transferOwnership(multisig.address)
        
        // Deploy JOE-AVAX
        const dataJOEAVAX = joeVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Joe JOE-AVAX", "daoJoeJOE", 0,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await joeFactory.connect(multisig).createVault(dataJOEAVAX)
        await tx.wait()
        const JOEAVAXVaultAddr = await joeFactory.getVault((await joeFactory.getVaultLength()).sub(1))
        // const JOEAVAXVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const JOEAVAXVault = await ethers.getContractAt("JoeImpl", JOEAVAXVaultAddr, deployer)

        // Deploy PngImpl
        const PngVault = await ethers.getContractFactory("PngImpl", deployer)
        const pngVault = await PngVault.deploy()
        const pngVaultArtifact = await artifacts.readArtifact("PngImpl")
        const pngVaultInterface = new ethers.utils.Interface(pngVaultArtifact.abi)

        const PngFactory = await ethers.getContractFactory("PngFactory", deployer)
        const pngFactory = await PngFactory.deploy(pngVault.address)
        await pngFactory.transferOwnership(multisig.address)

        // Deploy PNG-AVAX
        const dataPNGAVAX = pngVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Pangolin PNG-AVAX", "daoPngPNG",
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await pngFactory.connect(multisig).createVault(dataPNGAVAX)
        await tx.wait()
        const PNGAVAXVaultAddr = await pngFactory.getVault((await pngFactory.getVaultLength()).sub(1))
        // const PNGAVAXVaultAddr = "0x397E18750351a707A010A5eB188a7A6AbFda4Fcd"
        const PNGAVAXVault = await ethers.getContractAt("PngImpl", PNGAVAXVaultAddr, deployer)

        // Deploy LydImpl
        const LydVault = await ethers.getContractFactory("LydImpl", deployer)
        const lydVault = await LydVault.deploy()
        const lydVaultArtifact = await artifacts.readArtifact("LydImpl")
        const lydVaultInterface = new ethers.utils.Interface(lydVaultArtifact.abi)

        const LydFactory = await ethers.getContractFactory("LydFactory", deployer)
        const lydFactory = await LydFactory.deploy(lydVault.address)
        await lydFactory.transferOwnership(multisig.address)

        // Deploy LYD-AVAX
        const dataLYDAVAX = lydVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Lydia LYD-AVAX", "daoLydLYD", 4,
                treasury.address, community.address, admin.address,
            ]
        )
        tx = await lydFactory.connect(multisig).createVault(dataLYDAVAX)
        await tx.wait()
        const LYDAVAXVaultAddr = await lydFactory.getVault((await lydFactory.getVaultLength()).sub(1))
        // const LYDAVAXVaultAddr = "0x37e19484982425b77624FF95612D6aFE8f3159F4"
        const LYDAVAXVault = await ethers.getContractAt("LydImpl", LYDAVAXVaultAddr, deployer)

        // Deploy proxy admin
        const proxyAdminFac = await ethers.getContractFactory("DAOProxyAdmin", deployer)
        const proxyAdmin = await proxyAdminFac.deploy()

        // Deploy Avax-DeX strategy
        const DeXAvaxStrategyFac = await ethers.getContractFactory("DeXAvaxStrategy", deployer)
        const deXAvaxStrategyImpl = await DeXAvaxStrategyFac.deploy()
        const deXAvaxStrategyArtifact = await artifacts.readArtifact("DeXAvaxStrategy")
        const deXAvaxStrategyInterface = new ethers.utils.Interface(deXAvaxStrategyArtifact.abi)
        const dataDeXAvaxStrategy = deXAvaxStrategyInterface.encodeFunctionData(
            "initialize",
            [JOEAVAXVaultAddr, PNGAVAXVaultAddr, LYDAVAXVaultAddr]
        )
        const DeXAvaxStrategyProxy = await ethers.getContractFactory("AvaxProxy", deployer)
        const deXAvaxStrategyProxy = await DeXAvaxStrategyProxy.deploy(
            deXAvaxStrategyImpl.address, proxyAdmin.address, dataDeXAvaxStrategy,
        )
        const deXAvaxStrategy = await ethers.getContractAt("DeXAvaxStrategy", deXAvaxStrategyProxy.address, deployer)
        // const deXAvaxStrategyProxyAddr = "0x3845d7c09374Df1ae6Ce4728c99DD20D3d75F414"
        // const deXAvaxStrategy = await ethers.getContractAt("DeXAvaxStrategy", deXAvaxStrategyProxyAddr, deployer)

        const AvaxVaultFac = await ethers.getContractFactory("AvaxVault", deployer)
        const avaxVaultImpl = await AvaxVaultFac.deploy()
        const avaxVaultArtifact = await artifacts.readArtifact("AvaxVault")
        const avaxVaultInterface = new ethers.utils.Interface(avaxVaultArtifact.abi)
        const dataAvaxVault = avaxVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L2 AVAX", "daoAVAX",
                treasury.address, community.address, admin.address, deXAvaxStrategy.address
            ]
        )
        const AvaxVaultProxy = await ethers.getContractFactory("AvaxProxy", deployer)
        const avaxVaultProxy = await AvaxVaultProxy.deploy(
            avaxVaultImpl.address, proxyAdmin.address, dataAvaxVault,
        )
        const avaxVault = await ethers.getContractAt("AvaxVault", avaxVaultProxy.address, deployer)
        // const avaxVaultProxyAddr = "0x3845d7c09374Df1ae6Ce4728c99DD20D3d75F414"
        // const avaxVault = await ethers.getContractAt("AvaxVault", avaxVaultProxyAddr, deployer)

        await deXAvaxStrategy.connect(admin).setVault(avaxVault.address)

        // Set whitelist
        await JOEAVAXVault.connect(admin).setWhitelistAddress(deXAvaxStrategy.address, true)
        await PNGAVAXVault.connect(admin).setWhitelistAddress(deXAvaxStrategy.address, true)
        await LYDAVAXVault.connect(admin).setWhitelistAddress(deXAvaxStrategy.address, true)

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
        await USDTContract.connect(client).approve(avaxVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client).approve(avaxVault.address, ethers.constants.MaxUint256)
        await DAIContract.connect(client).approve(avaxVault.address, ethers.constants.MaxUint256)
        tx = await avaxVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 213727
        await avaxVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        await avaxVault.connect(client).deposit(ethers.utils.parseUnits("10000", 18), DAIAddr)
        // console.log(ethers.utils.formatEther(await avaxVault.balanceOf(client.address))) // 0.0

        // Invest
        const pngRouter = new ethers.Contract(pngRouterAddr, router_ABI, deployer)    
        const lydRouter = new ethers.Contract(lydRouterAddr, router_ABI, deployer)    
        const USDCPriceInAVAX = (await joeRouter.getAmountsOut(ethers.utils.parseUnits("1", 6), [USDCAddr, WAVAXAddr]))[1]
        const USDCPriceInAVAXMin = USDCPriceInAVAX.mul(95).div(100)
        const AVAXPriceInJOE = (await joeRouter.getAmountsOut(ethers.utils.parseUnits("1", 18), [WAVAXAddr, JOEAddr]))[1]
        const AVAXPriceInJOEMin = AVAXPriceInJOE.mul(95).div(100)
        const AVAXPriceInPNG = (await pngRouter.getAmountsOut(ethers.utils.parseUnits("1", 18), [WAVAXAddr, PNGAddr]))[1]
        const AVAXPriceInPNGMin = AVAXPriceInPNG.mul(95).div(100)
        const AVAXPriceInLYD = (await lydRouter.getAmountsOut(ethers.utils.parseUnits("1", 18), [WAVAXAddr, LYDAddr]))[1]
        const AVAXPriceInLYDMin = AVAXPriceInLYD.mul(95).div(100)

        tokenPriceMin = [USDCPriceInAVAXMin, AVAXPriceInJOEMin, AVAXPriceInPNGMin, AVAXPriceInLYDMin]
        tx = await avaxVault.connect(admin).invest(tokenPriceMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 1549948
        // console.log(ethers.utils.formatEther(await avaxVault.getAllPoolInUSD())) // 29604.064510890979812288
        // console.log(ethers.utils.formatEther(
        //     (await avaxVault.balanceOf(client.address))
        //     .mul(await avaxVault.getPricePerFullShare())
        //     .div(ethers.utils.parseEther("1"))
        // )) // User share in USD
        // console.log(ethers.utils.formatEther(await avaxVault.getPricePerFullShare())) // 0.996769848851548141
        // console.log((await deXAvaxStrategy.getCurrentCompositionPerc()).toString()); // 4498,4498,1002
        // console.log(ethers.utils.formatEther(await avaxVault.balanceOf(client.address))) // 29700.0
        // console.log(ethers.utils.formatEther(await deXAvaxStrategy.getAllPoolInUSD())) // 26931.064510890979812288
        // console.log(ethers.utils.formatEther(await deXAvaxStrategy.watermark())) // 27027.0

        // Farm invest
        await JOEAVAXVault.connect(admin).invest()
        await PNGAVAXVault.connect(admin).invest()
        await LYDAVAXVault.connect(admin).invest()

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
        tx = await avaxVault.connect(admin).invest(tokenPriceMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 1227257
        // console.log(ethers.utils.formatEther(await avaxVault.balanceOf(client2.address))) // 9932.082126487391421081
        // console.log(ethers.utils.formatEther(await avaxVault.balanceOf(client3.address))) // 9932.082126487391421081
        // console.log(ethers.utils.formatEther(await avaxVault.getAllPoolInUSD())) // 49339.979943167760077136
        // console.log(ethers.utils.formatEther(await avaxVault.getPricePerFullShare())) // 0.995476887118225392
        // console.log((await deXAvaxStrategy.getCurrentCompositionPerc()).toString()); // 4499,4499,1001
        // console.log(ethers.utils.formatEther(await deXAvaxStrategy.getAllPoolInUSD())) // 45484.736073167760077136
        // console.log(ethers.utils.formatEther(await deXAvaxStrategy.watermark())) // 45644.75613

        // Farm invest
        await JOEAVAXVault.connect(admin).invest()
        await PNGAVAXVault.connect(admin).invest()
        await LYDAVAXVault.connect(admin).invest()
        // console.log(ethers.utils.formatEther(await JOEAVAXVault.getPricePerFullShare(true))) // 20.135850201528075922
        // console.log(ethers.utils.formatEther(await JOEAVAXVault.getPricePerFullShare(false))) // 1.0
        // console.log(ethers.utils.formatEther(await PNGAVAXVault.getPricePerFullShare(true))) // 17.268105419952374524
        // console.log(ethers.utils.formatEther(await PNGAVAXVault.getPricePerFullShare(false))) // 1.0
        // console.log(ethers.utils.formatEther(await LYDAVAXVault.getPricePerFullShare(true))) // 3.936646766338057283
        // console.log(ethers.utils.formatEther(await LYDAVAXVault.getPricePerFullShare(false))) // 1.0

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await JOEAVAXVault.getAllPoolInUSD())) // 4500 20464.744092911234147069
        // console.log(ethers.utils.formatEther(await PNGAVAXVault.getAllPoolInUSD())) // 4500 20464.05268839398514812
        // console.log(ethers.utils.formatEther(await LYDAVAXVault.getAllPoolInUSD())) // 1000 4555.939291862540779607

        // Yield in farms
        for (let i=0; i<10000; i++) {
            await network.provider.send("evm_mine")
        }
        // console.log(ethers.utils.formatEther(await JOEAVAXVault.getPendingRewards())) // 4.194296135963758004
        // console.log(ethers.utils.formatEther(await PNGAVAXVault.getPendingRewards())) // 0.410789862988081663
        // console.log(ethers.utils.formatEther(await LYDAVAXVault.getPendingRewards())) // 33.258511976690202149
        await JOEAVAXVault.connect(admin).yield()
        await PNGAVAXVault.connect(admin).yield()
        await LYDAVAXVault.connect(admin).yield()
        // console.log(ethers.utils.formatEther(await JOEAVAXVault.getPricePerFullShare(false))) // 1.000246578297388232
        // console.log(ethers.utils.formatEther(await PNGAVAXVault.getPricePerFullShare(false))) // 1.000017612922989381
        // console.log(ethers.utils.formatEther(await LYDAVAXVault.getPricePerFullShare(false))) // 1.000288940137158355

        // Assume profit
        await joeRouter.swapExactAVAXForTokens(
            0, [WAVAXAddr, JOEAddr], JOEAVAXVaultAddr, Math.ceil(Date.now() / 1000),
            {value: ethers.utils.parseEther("5")}
        )
        await JOEAVAXVault.connect(admin).yield()

        // Collect profit
        tx = await avaxVault.connect(admin).collectProfitAndUpdateWatermark()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 282400
        // console.log(ethers.utils.formatEther(await avaxVault.fees())) // 10.564558377891538148
        // console.log(ethers.utils.formatEther(await deXAvaxStrategy.watermark())) // 45697.578921889457690743
        // console.log(ethers.utils.formatEther(await deXAvaxStrategy.getAllPoolInUSD())) // 45697.578921889457690743
        // console.log(ethers.utils.formatEther(await avaxVault.getPricePerFullShare())) // 0.999558027058594013

        // Test reimburse
        const AVAXPriceInUSDTMin = ((await joeRouter.getAmountsOut(ethers.utils.parseEther("1"), [WAVAXAddr, USDTAddr]))[1]).mul(95).div(100)
        const AVAXPriceInUSDCMin = ((await joeRouter.getAmountsOut(ethers.utils.parseEther("1"), [WAVAXAddr, USDCAddr]))[1]).mul(95).div(100)
        const AVAXPriceInDAIMin = ((await joeRouter.getAmountsOut(ethers.utils.parseEther("1"), [WAVAXAddr, DAIAddr]))[1]).mul(95).div(100)
        const JOEPriceInAVAXMin = ((await joeRouter.getAmountsOut(ethers.utils.parseEther("1"), [JOEAddr, WAVAXAddr]))[1]).mul(95).div(100)
        const PNGPriceInAVAXMin = ((await pngRouter.getAmountsOut(ethers.utils.parseEther("1"), [PNGAddr, WAVAXAddr]))[1]).mul(95).div(100)
        const LYDPriceInAVAXMin = ((await lydRouter.getAmountsOut(ethers.utils.parseEther("1"), [LYDAddr, WAVAXAddr]))[1]).mul(95).div(100)
        // await avaxVault.connect(admin).reimburse(0, USDTAddr, ethers.utils.parseUnits("1000", 6), [JOEPriceInAVAXMin, AVAXPriceInUSDTMin])
        // await avaxVault.connect(admin).reimburse(1, USDCAddr, ethers.utils.parseUnits("1000", 6), [PNGPriceInAVAXMin, AVAXPriceInUSDCMin])
        // await avaxVault.connect(admin).reimburse(2, DAIAddr, ethers.utils.parseUnits("1000", 18), [LYDPriceInAVAXMin, AVAXPriceInDAIMin])
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxVault.address), 18))
        // console.log(ethers.utils.formatEther(await deXAvaxStrategy.watermark())) // 44697.578644351970332677
        // console.log((await deXAvaxStrategy.getCurrentCompositionPerc()).toString());

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await JOEAVAXVault.getAllPoolInUSD())) // 4500 20464.744092911234147069
        // console.log(ethers.utils.formatEther(await PNGAVAXVault.getAllPoolInUSD())) // 4500 20464.05268839398514812
        // console.log(ethers.utils.formatEther(await LYDAVAXVault.getAllPoolInUSD())) // 1000 4555.939291862540779607

        // Test emergency withdraw
        // await avaxVault.connect(admin).emergencyWithdraw()
        // console.log(ethers.utils.formatEther(await JOEAVAXVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await PNGAVAXVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(await LYDAVAXVault.getAllPoolInUSD()))

        // await avaxVault.connect(admin).reinvest(tokenPriceMin)
        // console.log(ethers.utils.formatEther(await deXAvaxStrategy.watermark())) // 45737.700863078580395425
        // console.log((await deXAvaxStrategy.getCurrentCompositionPerc()).toString()); // 4498,4498,1002
        // console.log(ethers.utils.formatEther(await avaxVault.getAllPoolInUSD())) // 49411.658560794983399728
        // console.log(ethers.utils.formatEther(await avaxVault.getPricePerFullShare())) // 0.996923065394557798
        // console.log(ethers.utils.formatEther(await JOEAVAXVault.getAllPoolInUSD())) // 4500 20499.739575482749036949
        // console.log(ethers.utils.formatEther(await PNGAVAXVault.getAllPoolInUSD())) // 4500 20498.043471501565513769
        // console.log(ethers.utils.formatEther(await LYDAVAXVault.getAllPoolInUSD())) // 1000 4569.196146681062913684

        // Withdraw
        console.log("-----withdraw-----")

        tokenPriceMin = [AVAXPriceInUSDTMin, JOEPriceInAVAXMin, PNGPriceInAVAXMin, LYDPriceInAVAXMin]
        await avaxVault.connect(client).withdraw((await avaxVault.balanceOf(client.address)).div(3), USDTAddr, tokenPriceMin)
        await avaxVault.connect(client2).withdraw(avaxVault.balanceOf(client2.address), USDTAddr, tokenPriceMin)
        await avaxVault.connect(client3).withdraw(avaxVault.balanceOf(client3.address), USDTAddr, tokenPriceMin)
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client.address), 6)) // 9842.995039
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 9859.888491
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 9853.75948

        // tokenPriceMin = [AVAXPriceInUSDCMin, JOEPriceInAVAXMin, PNGPriceInAVAXMin, LYDPriceInAVAXMin]
        // await avaxVault.connect(client).withdraw((await avaxVault.balanceOf(client.address)).div(3), USDCAddr, tokenPriceMin)
        // await avaxVault.connect(client2).withdraw(avaxVault.balanceOf(client2.address), USDCAddr, tokenPriceMin)
        // await avaxVault.connect(client3).withdraw(avaxVault.balanceOf(client3.address), USDCAddr, tokenPriceMin)
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client.address), 6)) // 9844.080167
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client2.address), 6)) // 9861.726068
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client3.address), 6)) // 9856.199273

        // tokenPriceMin = [AVAXPriceInDAIMin, JOEPriceInAVAXMin, PNGPriceInAVAXMin, LYDPriceInAVAXMin]
        // await avaxVault.connect(client).withdraw((await avaxVault.balanceOf(client.address)).div(3), DAIAddr, tokenPriceMin)
        // await avaxVault.connect(client2).withdraw(avaxVault.balanceOf(client2.address), DAIAddr, tokenPriceMin)
        // await avaxVault.connect(client3).withdraw(avaxVault.balanceOf(client3.address), DAIAddr, tokenPriceMin)
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client.address), 18)) // 9841.539386186864417744
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client2.address), 18)) // 9854.417211070852915627
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client3.address), 18)) // 9840.180822409327116238

        // console.log(ethers.utils.formatEther(await avaxVault.getAllPoolInUSD())) // 19782.81963545362035058
        // console.log(ethers.utils.formatEther(await avaxVault.getPricePerFullShare())) // 0.999132304820889916
        // console.log((await deXAvaxStrategy.getCurrentCompositionPerc()).toString()); // 4525,4479,995
        // console.log(ethers.utils.formatEther(await deXAvaxStrategy.watermark())) // 17432.783199093938958873
        // console.log(ethers.utils.formatEther(await deXAvaxStrategy.getAllPoolInUSD())) // 17420.262203324014417115

        // console.log(ethers.utils.formatEther(await JOEAVAXVault.getAllPoolInUSD())) // 4500 20499.739575482749036949
        // console.log(ethers.utils.formatEther(await PNGAVAXVault.getAllPoolInUSD())) // 4500 20498.043471501565513769
        // console.log(ethers.utils.formatEther(await LYDAVAXVault.getAllPoolInUSD())) // 1000 4569.196146681062913684

        // Test withdraw within token keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxVault.address), 18))
        // tx = await avaxVault.connect(client).withdraw((await avaxVault.balanceOf(client.address)).div(35), USDTAddr, tokenPriceMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // // 320574 891124 1150322 1269075
        // // 320636 891799 1151599 1269295
        // // 320536 891835 1151635 1269195
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(avaxVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(avaxVault.address), 18))
    })
});