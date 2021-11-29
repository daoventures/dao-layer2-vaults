const { ethers, artifacts, network, upgrades } = require("hardhat")
const Web3 = require("web3")
const IERC20_ABI = require("../abis/IERC20_ABI.json")
const router_ABI = require("../abis/router_ABI.json")
const pair_ABI = require("../abis/pair_ABI.json")
const v3Router_ABI = require("../abis/v3Router_ABI.json")
require("dotenv").config()

const USDTAddr = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDCAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAIAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const WETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const SUSHIAddr = "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2"
const AXSAddr = "0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b"
const MANAAddr = "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942"
const ILVAddr = "0x767FE9EDC9E0dF98E07454847909b5E959D7ca0E"

const AXSETHAddr = "0x0C365789DbBb94A29F8720dc465554c587e897dB"
const ILVETHAddr = "0x6a091a3406E0073C3CD6340122143009aDac0EDa"
const MANAETHAddr = "0x1bEC4db6c3Bc499F3DbF289F5499C30d541FEc97"
const GHSTETHAddr = "0xFbA31F01058DB09573a383F26a088f23774d4E5d"
const REVVETHAddr = "0x724d5c9c618A2152e99a45649a3B8cf198321f46"
const WILDAddr = "0x2a3bFF78B79A009976EeA096a51A948a3dC00e34"
const MVIAddr = "0x72e364F2ABdC788b7E918bc238B21f109Cd634D7"

const uniRouterAddr = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
const uniV3RouterAddr = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
const sRouterAddr = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
const sushiFarmAddr = "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd"
const ilvEthPoolAddr = "0x8B4d8443a0229349A9892D4F7CbE89eF5f843F72"

const binanceAddr = "0x28C6c06298d514Db089934071355E5743bf21d60"
const AXSETHHolderAddr = "0x14b993eeD8E8Ff78195c7fDa865Ce6431ecaAEbA"
const SLPETHHolderAddr = "0x68e845717eA2ae0Ca63E7B2c9f6052FE7397e96E"

describe("Metaverse-Farmer", () => {
    it("should work", async () => {
        let tx, receipt, amountsOutMin
        // const [deployer, client, client2, client3, treasury, community, strategist, biconomy, admin, multisig] = await ethers.getSigners()
        const [deployer, client, client2, client3, client4, treasury, community, strategist, biconomy, multisig] = await ethers.getSigners()

        const adminAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
        network.provider.request({method: "hardhat_impersonateAccount", params: [adminAddr]})
        const admin = await ethers.getSigner(adminAddr)
        await deployer.sendTransaction({to: admin.address, value: ethers.utils.parseEther("10")})

        // // Deploy Sushi
        // const SushiVault = await ethers.getContractFactory("Sushi", deployer)
        // const sushiVault = await SushiVault.deploy()
        const sushiVaultArtifact = await artifacts.readArtifact("Sushi")
        const sushiVaultInterface = new ethers.utils.Interface(sushiVaultArtifact.abi)

        // const SushiFactory = await ethers.getContractFactory("SushiFactory", deployer)
        // const sushiFactory = await SushiFactory.deploy(sushiVault.address)
        // await sushiFactory.transferOwnership(multisig.address)
        const sushiFactory = await ethers.getContractAt("SushiFactory", "0x1D5c8FA8aa068726b84f6b45992C8f0f225A4ff3", deployer)
        
        // // Deploy AXS-ETH
        // const dataAXSETH = sushiVaultInterface.encodeFunctionData(
        //     "initialize",
        //     [
        //         "DAO L1 Sushi AXS-ETH", "daoSushiAXS", 231,
        //         treasury.address, community.address, strategist.address, admin.address,
        //     ]
        // )
        // await sushiFactory.connect(multisig).createVault(dataAXSETH)
        // const AXSETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        // const AXSETHVault = await ethers.getContractAt("Sushi", AXSETHVaultAddr, deployer)

        // // Deploy SLP-ETH
        // const dataSLPETH = sushiVaultInterface.encodeFunctionData(
        //     "initialize",
        //     [
        //         "DAO L1 Sushi SLP-ETH", "daoSushiSLP", 290,
        //         treasury.address, community.address, strategist.address, admin.address,
        //     ]
        // )
        // await sushiFactory.connect(multisig).createVault(dataSLPETH)
        // const SLPETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        // const SLPETHVault = await ethers.getContractAt("Sushi", SLPETHVaultAddr, deployer)

        // Deploy MANA-ETH
        const dataMANAETH = sushiVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Sushi MANA-ETH", "daoSushiMANA", 240,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await sushiFactory.connect(admin).createVault(dataMANAETH)
        const MANAETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        const MANAETHVault = await ethers.getContractAt("Sushi", MANAETHVaultAddr, deployer)
        
        // // Deploy ILV-ETH
        // const ILVETHVaultFactory = await ethers.getContractFactory("ILVETHVault", deployer)
        // const ILVETHVault = await upgrades.deployProxy(ILVETHVaultFactory, [
        //     "DAO L1 Sushi ILV-ETH", "daoSushiILV",
        //     treasury.address, community.address, strategist.address, admin.address
        // ])
        // await ILVETHVault.deployed()
        // await ILVETHVault.transferOwnership(multisig.address)

        // // Deploy Uniswap V3
        // const UniV3Vault = await ethers.getContractFactory("UniswapV3", deployer)
        // const uniV3Vault = await UniV3Vault.deploy()
        // const uniV3VaultArtifact = await artifacts.readArtifact("UniswapV3")
        // const uniV3VaultInterface = new ethers.utils.Interface(uniV3VaultArtifact.abi)

        // const UniV3Factory = await ethers.getContractFactory("UniV3Factory", deployer)
        // const uniV3Factory = await UniV3Factory.deploy(uniV3Vault.address)
        // await uniV3Factory.transferOwnership(multisig.address)

        // // Deploy GHST-ETH
        // const dataGHSTETH = uniV3VaultInterface.encodeFunctionData(
        //     "initialize",
        //     [
        //         "DAO L1 UniV3 GHST-ETH", "daoUniV3GHST", GHSTETHAddr,
        //         treasury.address, community.address, strategist.address, admin.address,
        //     ]
        // )
        // await uniV3Factory.connect(multisig).createVault(dataGHSTETH)
        // const GHSTETHVaultAddr = await uniV3Factory.getVault((await uniV3Factory.getVaultLength()).sub(1))
        // const GHSTETHVault = await ethers.getContractAt("UniswapV3", GHSTETHVaultAddr, deployer)

        const AXSETHVault = await ethers.getContractAt("Sushi", "0xcE097910Fc2DB329683353dcebF881A48cbA181e", deployer)
        // const SLPETHVault = await ethers.getContractAt("Sushi", "0x4aE61842Eb4E4634F533cb35B697a01319C457e2", deployer)
        const ILVETHVault = await ethers.getContractAt("ILVETHVault", "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e", deployer)
        // const GHSTETHVault = await ethers.getContractAt("UniswapV3", "0xF9b0707dEE34d36088A093d85b300A3B910E00fC", deployer)
        
        // // Main contract
        // const MVFStrategyFactory = await ethers.getContractFactory("MVFStrategy")
        // const mvfStrategy = await MVFStrategyFactory.deploy()
        // // await mvfStrategy.initialize(AXSETHVaultAddr, SLPETHVault.address, ILVETHVault.address, GHSTETHVault.address)
        // await mvfStrategy.initialize(AXSETHVault.address, SLPETHVault.address, ILVETHVault.address, GHSTETHVault.address)
        // const MVFVaultFactory = await ethers.getContractFactory("MVFVault")
        // const mvfVault = await MVFVaultFactory.deploy()
        // await mvfVault.initialize(
        //     "DAO L2 Metaverse-Farmer", "daoMVF",
        //     treasury.address, community.address, strategist.address, admin.address,
        //     biconomy.address, mvfStrategy.address
        // )
        // await mvfStrategy.setVault(mvfVault.address)
        // await mvfVault.transferOwnership(multisig.address)
        // await mvfStrategy.transferOwnership(multisig.address)
        
        // Set whitelist
        // await AXSETHVault.connect(admin).setWhitelistAddress(mvfStrategy.address, true)
        // await SLPETHVault.connect(admin).setWhitelistAddress(mvfStrategy.address, true)
        // await ILVETHVault.connect(admin).setWhitelistAddress(mvfStrategy.address, true)
        // await GHSTETHVault.connect(admin).setWhitelistAddress(mvfStrategy.address, true)
        // await GHSTETHVault.connect(admin).setWhitelistAddress(mvfStrategy.address, true)
        await MANAETHVault.connect(admin).setWhitelistAddress("0xfa83CA66FDaCC4028DAB383de4adc8aB7DB21FF2", true)

        // Upgrade contracts
        const proxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"
        const proxyAdmin = await ethers.getContractAt("DAOProxyAdmin", proxyAdminAddr, admin)

        const mvfVaultProxyAddr = "0x5b3ae8b672a753906b1592d44741f71fbd05ba8c"
        const mvfVaultFac = await ethers.getContractFactory("MVFVault")
        const mvfVaultImpl = await mvfVaultFac.deploy()
        await proxyAdmin.upgrade(mvfVaultProxyAddr, mvfVaultImpl.address)
        const mvfVault = await ethers.getContractAt("MVFVault", mvfVaultProxyAddr, deployer)

        const mvfStrategyProxyAddr = "0xfa83CA66FDaCC4028DAB383de4adc8aB7DB21FF2"
        const mvfStrategyFac = await ethers.getContractFactory("MVFStrategy", deployer)
        const mvfStrategyImpl = await mvfStrategyFac.deploy()
        await proxyAdmin.upgrade(mvfStrategyProxyAddr, mvfStrategyImpl.address)
        const mvfStrategy = await ethers.getContractAt("MVFStrategy", mvfStrategyProxyAddr, deployer)

        await mvfVault.connect(admin).reimburse(4, USDCAddr, ethers.utils.parseUnits("4000", 6), [0, 0])

        // console.log((await mvfStrategy.getCurrentCompositionPerc()).toString())
        await mvfStrategy.swapTokensAndInvest(MANAETHVaultAddr, [0, 0, 0, 0, 0, 0, 0, 0, 0])
        // console.log((await mvfStrategy.getCurrentCompositionPerc()).toString())

        // const REVVContract = new ethers.Contract(REVVAddr, IERC20_ABI, deployer)
        // console.log((await REVVContract.balanceOf(mvfStrategy.address)).toString())
        // const SLPContract = new ethers.Contract(SLPAddr, IERC20_ABI, deployer)
        // console.log((await SLPContract.balanceOf(mvfStrategy.address)).toString())
        // const GHSTContract = new ethers.Contract(GHSTAddr, IERC20_ABI, deployer)
        // console.log((await GHSTContract.balanceOf(mvfStrategy.address)).toString())
        // const WETHContract = new ethers.Contract(WETHAddr, IERC20_ABI, deployer)
        // console.log((await WETHContract.balanceOf(mvfStrategy.address)).toString()) // 0.004112527448096814
        // console.log((await WETHContract.balanceOf(mvfVault.address)).toString())

        // console.log(ethers.utils.formatEther(await mvfVault.getAllPoolInUSD(true)))
        // console.log(ethers.utils.formatEther(await mvfVault.getPricePerFullShare()))
        // console.log((await mvfStrategy.getCurrentCompositionPerc()).toString());
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark()))

        // Unlock & transfer Stablecoins to client
        network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
        const unlockedAcc = await ethers.getSigner(binanceAddr)
        const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, unlockedAcc)
        const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, unlockedAcc)
        const DAIContract = new ethers.Contract(DAIAddr, IERC20_ABI, unlockedAcc)
        await USDTContract.transfer(client.address, ethers.utils.parseUnits("10000", 6))
        await USDTContract.transfer(client2.address, ethers.utils.parseUnits("10000", 6))
        await USDCContract.transfer(client.address, ethers.utils.parseUnits("10000", 6))
        await USDCContract.transfer(client3.address, ethers.utils.parseUnits("10000", 6))
        await DAIContract.transfer(client.address, ethers.utils.parseUnits("10000", 18))

        // Current status
        // console.log(ethers.utils.formatEther(await mvfVault.getAllPoolInUSD(true))) // 93285.58772474347474026
        // console.log(ethers.utils.formatEther(await mvfVault.getPricePerFullShare())) // 1.417613043117663186
        // console.log(ethers.utils.formatEther(await mvfStrategy.getAllPoolInUSD(false))) // 76977.033339445021181715
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 80563.879315243349350569

        // await mvfVault.connect(admin).collectProfitAndUpdateWatermark()
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 88886.045190113023588618
        // console.log(ethers.utils.formatEther(await mvfStrategy.getAllPoolInUSD(false))) // 88886.045190113023588618

        // console.log(ethers.utils.formatEther(await mvfVault.getAllPoolInUSD(false))) // 85575.110260537148911115

        // Deposit
        await USDTContract.connect(client).approve(mvfVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client).approve(mvfVault.address, ethers.constants.MaxUint256)
        await DAIContract.connect(client).approve(mvfVault.address, ethers.constants.MaxUint256)
        tx = await mvfVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        tx = await mvfVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 94735
        await mvfVault.connect(client).deposit(ethers.utils.parseUnits("10000", 18), DAIAddr)
        // console.log(ethers.utils.formatEther(await mvfVault.balanceOf(client.address)))

        // Invest
        amountsOutMin = [0, 0, 0, 0, 0, 0, 0, 0]
        tx = await mvfVault.connect(admin).invest(amountsOutMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 1614944
        // console.log(ethers.utils.formatEther(await mvfVault.getAllPoolInUSD(true))) // 134351.066341967462874612
        // console.log(ethers.utils.formatEther(
        //     (await mvfVault.balanceOf(client.address))
        //     .mul(await mvfVault.getPricePerFullShare())
        //     .div(ethers.utils.parseEther("1"))
        // )) // User share in USD 29674.140137261176085389
        // console.log(ethers.utils.formatEther(await mvfVault.getPricePerFullShare())) // 1.417613043117663186
        // console.log((await mvfStrategy.getCurrentCompositionPerc()).toString()); // 2510,2492,1495,498,3002
        // console.log(ethers.utils.formatEther(await mvfVault.balanceOf(client.address))) // 20932.468335647357027155
        // console.log(ethers.utils.formatEther((await mvfVault.balanceOf(client.address)).div(3))) // 5753.931580773069508027
        // console.log(ethers.utils.formatEther(await mvfStrategy.getAllPoolInUSD(false))) // 113124.591231563745809525
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 112908.406284040026913333

        // console.log(ethers.utils.formatEther(await mvfVault.getAllPoolInUSD(false))) // 115249.095333400348293693

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInUSD())) // 28399.157311735746481756
        // console.log(ethers.utils.formatEther(await ILVETHVault.getAllPoolInUSD())) // 37348.974278373366628848
        // console.log(ethers.utils.formatEther(await MANAETHVault.getAllPoolInUSD())) // 16920.059137195418243785
        // const WILD = new ethers.Contract(WILDAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await WILD.balanceOf(mvfStrategy.address))) // 886.626045819703486437
        // const MVI = new ethers.Contract(MVIAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await MVI.balanceOf(mvfStrategy.address))) // 98.12221038158587529

        // Check Stablecoins keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(mvfVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(mvfVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(mvfVault.address), 18))

        // Second invest
        await USDTContract.connect(client2).approve(mvfVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client3).approve(mvfVault.address, ethers.constants.MaxUint256)
        await mvfVault.connect(client2).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        await mvfVault.connect(client3).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        // console.log((await mvfVault.getTotalPendingDeposits()).toString()) // 2
        tx = await mvfVault.connect(admin).invest(amountsOutMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 2133452
        // console.log(ethers.utils.formatEther(await mvfVault.balanceOf(client2.address))) // 5781.195155300964088378
        // console.log(ethers.utils.formatEther(await mvfVault.balanceOf(client3.address))) // 5781.195155300964088378
        // console.log(ethers.utils.formatEther(await mvfVault.getAllPoolInUSD(true))) // 154331.927319123596551292
        // console.log(ethers.utils.formatEther(await mvfVault.getPricePerFullShare())) // 1.629103432757284648
        // console.log((await mvfStrategy.getCurrentCompositionPerc()).toString()) // 2508,2493,1496,498,3002
        // console.log(ethers.utils.formatEther(await mvfStrategy.getAllPoolInUSD(false))) // 131906.918989060823088858
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 131682.966234563745809525

        // console.log((await AXSETHVault.balanceOf(mvfStrategy.address)).toString()) // 17932012366187324818

        // Check user LP value in USD
        // const oneEther = ethers.utils.parseEther("1")
        // console.log(ethers.utils.formatEther((await mvfVault.balanceOf(client.address)).mul(await mvfVault.getPricePerFullShare()).div(oneEther))) // 29674.182995731820402022
        // console.log(ethers.utils.formatEther((await mvfVault.balanceOf(client2.address)).mul(await mvfVault.getPricePerFullShare()).div(oneEther))) // 9895.592927427051334166
        // console.log(ethers.utils.formatEther((await mvfVault.balanceOf(client3.address)).mul(await mvfVault.getPricePerFullShare()).div(oneEther))) // 9895.592927427051334166

        // L1 vaults invest
        await AXSETHVault.connect(admin).invest()
        await ILVETHVault.connect(admin).invest()
        await MANAETHVault.connect(admin).invest()
        // console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInUSD())) // 33088.501977794928372722
        // console.log(ethers.utils.formatEther(await ILVETHVault.getAllPoolInUSD())) // 42690.918525310548852
        // console.log(ethers.utils.formatEther(await MANAETHVault.getAllPoolInUSD())) // 19739.973445947712023321

        // Assume profit
        for (let i=0; i<10000; i++) {
            await network.provider.send("evm_mine")
        }
        await AXSETHVault.connect(admin).yield()
        await ILVETHVault.connect(admin).harvest()
        await MANAETHVault.connect(admin).yield()
        // const MVIUnlockedAddr = "0x6b9dfc960299166df15ab8a85f054c69e2be2353"
        // await network.provider.request({method: "hardhat_impersonateAccount", params: [MVIUnlockedAddr]})
        // const MVIUnlockedAcc = await ethers.getSigner(MVIUnlockedAddr)
        // const MVIContract = new ethers.Contract(MVIAddr, IERC20_ABI, MVIUnlockedAcc)
        // await MVIContract.transfer(mvfStrategy.address, ethers.utils.parseEther("10"))

        // Check watermark
        // console.log(ethers.utils.formatEther(await mvfVault.getPricePerFullShare())) // 1.632771152803074787
        // console.log(ethers.utils.formatEther(await mvfStrategy.getAllPoolInUSD(false))) // 132233.76758450780869875
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 131682.966234563745809525

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInUSD())) // 33409.68718493543419218
        // console.log(ethers.utils.formatEther(await ILVETHVault.getAllPoolInUSD())) // 43093.18251222914416696
        // console.log(ethers.utils.formatEther(await MANAETHVault.getAllPoolInUSD())) // 19745.636834254191816866
        // const WILD = new ethers.Contract(WILDAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await WILD.balanceOf(mvfStrategy.address))) // 1033.665134469129359423
        // const MVI = new ethers.Contract(MVIAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await MVI.balanceOf(mvfStrategy.address))) // 113.967905487154935761

        // Collect profit
        tx = await mvfVault.connect(admin).collectProfitAndUpdateWatermark()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 298848
        // console.log(ethers.utils.formatEther(await mvfVault.fees())) // 110.160269988812577845
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 132233.76758450780869875
        // console.log(ethers.utils.formatEther(await mvfStrategy.getAllPoolInUSD(false))) // 132233.76758450780869875
        // console.log(ethers.utils.formatEther(await mvfVault.getPricePerFullShare())) // 1.631534993198548795

        // Transfer out fees
        await mvfVault.connect(admin).transferOutFees()
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(treasury.address), 6)) // 
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(community.address), 6)) // 
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(strategist.address), 6)) // 
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 132233.76758450780869875
        // console.log(ethers.utils.formatEther(await mvfVault.fees())) // 0.0

        // Check user LP value in USD
        // const oneEther = ethers.utils.parseEther("1")
        // console.log(ethers.utils.formatEther((await mvfVault.balanceOf(client.address)).mul(await mvfVault.getPricePerFullShare()).div(oneEther))) // 29748.405262795285427003
        // console.log(ethers.utils.formatEther((await mvfVault.balanceOf(client2.address)).mul(await mvfVault.getPricePerFullShare()).div(oneEther))) // 9920.6780302200886136
        // console.log(ethers.utils.formatEther((await mvfVault.balanceOf(client3.address)).mul(await mvfVault.getPricePerFullShare()).div(oneEther))) // 9920.6780302200886136

        // Test reimburse
        // amountsOutMin = [0, 0]
        // await mvfVault.connect(admin).reimburse(3, USDTAddr, ethers.utils.parseUnits("1000", 6), amountsOutMin)
        // await mvfVault.connect(admin).reimburse(4, USDCAddr, ethers.utils.parseUnits("1000", 6), amountsOutMin)
        // await mvfVault.connect(admin).reimburse(2, DAIAddr, ethers.utils.parseUnits("1000", 18), amountsOutMin)
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(mvfVault.address), 6)) // 4513.074611
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(mvfVault.address), 6)) // 4623.23488
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(mvfVault.address), 18)) // 4024.040876670321693088
        // console.log((await mvfStrategy.getCurrentCompositionPerc()).toString()); // 2526,2487,1493,497,2994

        // console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInUSD())) // 33409.68718493543419218
        // console.log(ethers.utils.formatEther(await ILVETHVault.getAllPoolInUSD())) // 43093.18251222914416696
        // console.log(ethers.utils.formatEther(await MANAETHVault.getAllPoolInUSD())) // 19745.636834254191816866
        // const WILD = new ethers.Contract(WILDAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await WILD.balanceOf(mvfStrategy.address))) // 1033.665134469129359423
        // const MVI = new ethers.Contract(MVIAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await MVI.balanceOf(mvfStrategy.address))) // 113.967905487154935761

        // Test emergency withdraw
        // await mvfVault.connect(admin).emergencyWithdraw()
        // console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInUSD())) // 0.0
        // console.log(ethers.utils.formatEther(await ILVETHVault.getAllPoolInUSD())) // 10197.342636859290959388
        // console.log(ethers.utils.formatEther(await MANAETHVault.getAllPoolInUSD())) // 0.0
        // const WILD = new ethers.Contract(WILDAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await WILD.balanceOf(mvfStrategy.address))) // 0.0
        // const MVI = new ethers.Contract(MVIAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await MVI.balanceOf(mvfStrategy.address))) // 0.0
        // const WETHContract = new ethers.Contract(WETHAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await WETHContract.balanceOf(mvfStrategy.address))) // 0.0
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(mvfVault.address), 6)) // 47923.269732
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(mvfVault.address), 6)) // 48072.333528
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(mvfVault.address), 18)) // 47421.611091652403014598
        // console.log(ethers.utils.formatEther(await mvfVault.getAllPoolInUSD(true))) // 143417.214351652403014598  

        // amountsOutMin = [0, 0, 0, 0, 0, 0, 0, 0, 0]
        // await mvfVault.connect(admin).reinvest(amountsOutMin)
        // console.log(ethers.utils.formatEther(await mvfStrategy.getAllPoolInUSD(false))) // 130425.080221909306411981
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 118256.699987821929585398

        // await AXSETHVault.connect(admin).invest()
        // await ILVETHVault.connect(admin).invest()
        // await MANAETHVault.connect(admin).invest()

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInUSD())) // 32283.893621002522486896
        // console.log(ethers.utils.formatEther(await ILVETHVault.getAllPoolInUSD())) // 42753.530718937339264612
        // console.log(ethers.utils.formatEther(await MANAETHVault.getAllPoolInUSD())) // 19555.324616881867387432
        // const WILD = new ethers.Contract(WILDAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await WILD.balanceOf(mvfStrategy.address))) // 1023.534388680041215729
        // const MVI = new ethers.Contract(MVIAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await MVI.balanceOf(mvfStrategy.address))) // 113.741882300202336678

        // console.log((await AXSETHVault.balanceOf(mvfStrategy.address)).toString()) // 17932012366187324818

        // Withdraw
        console.log("-----withdraw-----")
        amountsOutMin = [0, 0, 0, 0, 0, 0]

        // const getAmountsOutMin = async (amountWithdrawInLP, stablecoinAddr, _provider) => {
            const amountWithdrawInLP = await mvfVault.balanceOf(client.address)
            const stablecoinAddr = USDTAddr
            const sushi_ABI = require("../abis/sushi_ABI.json")
            const ILVETH_ABI = require("../abis/ILVETH_ABI.json")

            const AXSETHVaultAddr = "0xcE097910Fc2DB329683353dcebF881A48cbA181e"
            const ILVETHVaultAddr = "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e"
            // const MANAETHVaultAddr = ""

            // const provider = new ethers.providers.Web3Provider(_provider)
            const provider = deployer
            const sRouter = new ethers.Contract(sRouterAddr, router_ABI, provider)
            const uRouter = new ethers.Contract(uniRouterAddr, router_ABI, provider)
            
            // const share = new ethers.BigNumber.from(amountWithdrawInLP)
            const share = amountWithdrawInLP
            const allPoolInUSD = await mvfVault["getAllPoolInUSD(bool)"](false)
            const amtWithdrawInUSD = (allPoolInUSD.sub(await mvfVault.totalPendingDepositAmt())).mul(share).div(await mvfVault.totalSupply())
            
            // const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, provider)
            // const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, provider)
            // const DAIContract = new ethers.Contract(DAIAddr, IERC20_ABI, provider)

            const USDTAmtInVault = (await USDTContract.balanceOf(mvfVault.address)).mul(ethers.utils.parseUnits("1", 12))
            const USDCAmtInVault = (await USDCContract.balanceOf(mvfVault.address)).mul(ethers.utils.parseUnits("1", 12))
            const DAIAmtInVault = await DAIContract.balanceOf(mvfVault.address)
            const totalAmtInVault = (USDTAmtInVault).add(USDCAmtInVault).add(DAIAmtInVault).sub(await mvfVault.fees())

            // let amountsOutMin
            // if (amtWithdrawInUSD.gt(totalAmtInVault)) {
                const oneEther = ethers.utils.parseEther("1")

                let stablecoinAmtInVault
                if (stablecoinAddr == USDTAddr) stablecoinAmtInVault = USDTAmtInVault
                else if (stablecoinAddr == USDCAddr) stablecoinAmtInVault = USDCAmtInVault
                else stablecoinAmtInVault = DAIAmtInVault
                const amtToWithdrawFromStrategy = amtWithdrawInUSD.sub(stablecoinAmtInVault)
                // Strategy contract
                const strategyAllPoolInUSD = await mvfStrategy.getAllPoolInUSD(false)
                const sharePerc = amtToWithdrawFromStrategy.mul(oneEther).div(strategyAllPoolInUSD)

                let totalWithdrawWETH = ethers.constants.Zero
                let WETHAmt, _WETHAmt

                // const AXSETHVault = new ethers.Contract(AXSETHVaultAddr, sushi_ABI, provider)
                const AXSETHVaultAmt = (await AXSETHVault.balanceOf(mvfStrategy.address)).mul(sharePerc).div(oneEther) // Calculate AXSETHVault LP
                // console.log(AXSETHVaultAmt.toString())
                // console.log((await AXSETHVault.balanceOf(mvfStrategy.address)).toString())
                // console.log(sharePerc.toString())
                const AXSETHAmt = (await AXSETHVault.getAllPool()).mul(AXSETHVaultAmt).div(await AXSETHVault.totalSupply()) // L1 contract
                // console.log(AXSETHAmt.toString())
                const AXSETH = new ethers.Contract(AXSETHAddr, pair_ABI, provider)
                const [AXSReserve, WETHReserveAXS] = await AXSETH.getReserves()
                const AXSAmt = AXSReserve.mul(AXSETHAmt).div(await AXSETH.totalSupply())
                // console.log(AXSAmt.toString())
                WETHAmt = WETHReserveAXS.mul(AXSETHAmt).div(await AXSETH.totalSupply())
                totalWithdrawWETH = totalWithdrawWETH.add(WETHAmt)
                _WETHAmt = (await sRouter.getAmountsOut(AXSAmt, [AXSAddr, WETHAddr]))[1]
                const _WETHAmtMinAXS = _WETHAmt.mul(995).div(1000)
                totalWithdrawWETH = totalWithdrawWETH.add(_WETHAmt)

                // const ILVETHVault = new ethers.Contract(ILVETHVaultAddr, ILVETH_ABI, provider)
                const ILVETHVaultAmt = (await ILVETHVault.balanceOf(mvfStrategy.address)).mul(sharePerc).div(oneEther)
                // console.log(ILVETHVaultAmt.toString())
                // console.log((await ILVETHVault.balanceOf(mvfStrategy.address)).toString())
                // console.log(sharePerc.toString())
                const ILVETH = new ethers.Contract(ILVETHAddr, pair_ABI, provider)
                const ILVETHPool = new ethers.Contract(ilvEthPoolAddr, IERC20_ABI, provider)
                const ILVETHAmt = ((await ILVETH.balanceOf(ILVETHVaultAddr)).add(await ILVETHPool.balanceOf(ILVETHVaultAddr))).mul(ILVETHVaultAmt).div(await ILVETHVault.totalSupply())
                // console.log(ILVETHAmt.toString())
                const [ILVReserve, WETHReserveILV] = await ILVETH.getReserves()
                const ILVAmt = ILVReserve.mul(ILVETHAmt).div(await ILVETH.totalSupply())
                // console.log(ILVAmt.toString())
                WETHAmt = WETHReserveILV.mul(ILVETHAmt).div(await ILVETH.totalSupply())
                totalWithdrawWETH = totalWithdrawWETH.add(WETHAmt)
                _WETHAmt = (await sRouter.getAmountsOut(ILVAmt, [ILVAddr, WETHAddr]))[1]
                // console.log(_WETHAmt.toString())
                const _WETHAmtMinILV = _WETHAmt.mul(995).div(1000)
                totalWithdrawWETH = totalWithdrawWETH.add(_WETHAmt)

                // const MANAETHVault = new ethers.Contract(MANAETHVaultAddr, sushi_ABI, provider)
                const MANAETHVaultAmt = (await MANAETHVault.balanceOf(mvfStrategy.address)).mul(sharePerc).div(oneEther)
                const MANAETHAmt = (await MANAETHVault.getAllPool()).mul(MANAETHVaultAmt).div(await MANAETHVault.totalSupply())
                const MANAETH = new ethers.Contract(MANAETHAddr, pair_ABI, provider)
                const [MANAReserve, WETHReserveMANA] = await MANAETH.getReserves()
                const MANAAmt = MANAReserve.mul(MANAETHAmt).div(await MANAETH.totalSupply())
                WETHAmt = WETHReserveMANA.mul(MANAETHAmt).div(await MANAETH.totalSupply())
                totalWithdrawWETH = totalWithdrawWETH.add(WETHAmt)
                _WETHAmt = (await sRouter.getAmountsOut(MANAAmt, [MANAAddr, WETHAddr]))[1]
                // console.log(_WETHAmt.toString())
                const _WETHAmtMinMANA = _WETHAmt.mul(995).div(1000)
                totalWithdrawWETH = totalWithdrawWETH.add(_WETHAmt)

                const WILD = new ethers.Contract(WILDAddr, IERC20_ABI, provider)
                const WILDAmt = (await WILD.balanceOf(mvfStrategy.address)).mul(sharePerc).div(oneEther)
                _WETHAmt = (await uRouter.getAmountsOut(WILDAmt, [WILDAddr, WETHAddr]))[1]
                // console.log(_WETHAmt.toString())
                const _WETHAmtMinWILD = _WETHAmt.mul(995).div(1000)
                totalWithdrawWETH = totalWithdrawWETH.add(_WETHAmt)

                const MVI = new ethers.Contract(MVIAddr, IERC20_ABI, provider)
                const MVIAmt = (await MVI.balanceOf(mvfStrategy.address)).mul(sharePerc).div(oneEther)
                _WETHAmt = (await uRouter.getAmountsOut(MVIAmt, [MVIAddr, WETHAddr]))[1]
                // console.log(_WETHAmt.toString())
                const _WETHAmtMinMVI = _WETHAmt.mul(995).div(1000)
                totalWithdrawWETH = totalWithdrawWETH.add(_WETHAmt)

                const withdrawAmtInStablecoin = (await sRouter.getAmountsOut(totalWithdrawWETH, [WETHAddr, stablecoinAddr]))[1]
                const withdrawAmtInStablecoinMin = withdrawAmtInStablecoin.mul(995).div(1000)

                // console.log(_WETHAmtMinAXS.toString())
                // console.log(_WETHAmtMinILV.toString())
                // console.log(_WETHAmtMinMANA.toString())
                // console.log(_WETHAmtMinWILD.toString())
                // console.log(_WETHAmtMinMVI.toString())
                // console.log(withdrawAmtInStablecoinMin.toString())
                
                amountsOutMin = [
                    withdrawAmtInStablecoinMin,
                    _WETHAmtMinAXS,
                    _WETHAmtMinILV,
                    _WETHAmtMinMANA,
                    _WETHAmtMinWILD,
                    _WETHAmtMinMVI
                ]

        //     } else {
        //         amountsOutMin = []
        //     }

        //     return amountsOutMin
        // }

        // const provider = new Web3.providers.HttpProvider(process.env.ALCHEMY_URL_MAINNET)
        // amountsOutMin = await getAmountsOutMin(((await mvfVault.balanceOf(client.address)).div(3)).toString(), USDTAddr, provider)
        // await mvfVault.connect(client).withdraw(await mvfVault.balanceOf(client.address), USDTAddr, amountsOutMin)
        await mvfVault.connect(client).withdraw((await mvfVault.balanceOf(client.address)).div(3), USDTAddr, amountsOutMin)
        // await mvfVault.connect(client2).withdraw(mvfVault.balanceOf(client2.address), USDTAddr, amountsOutMin)
        // await mvfVault.connect(client3).withdraw(mvfVault.balanceOf(client3.address), USDTAddr, amountsOutMin)
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client.address), 6)) // 9911.146548
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 9874.529643
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 9865.432779

        // amountsOutMin = [0, 0, 0, 0, 0, 0, 0]
        // await mvfVault.connect(client).withdraw((await mvfVault.balanceOf(client.address)).div(3), USDCAddr, amountsOutMin)
        // await mvfVault.connect(client2).withdraw(mvfVault.balanceOf(client2.address), USDCAddr, amountsOutMin)
        // await mvfVault.connect(client3).withdraw(mvfVault.balanceOf(client3.address), USDCAddr, amountsOutMin)
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client.address), 6)) // 9634.98707
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client2.address), 6)) // 9625.868098
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client3.address), 6)) // 9611.594077

        // amountsOutMin = [0, 0, 0, 0, 0, 0, 0]
        // await mvfVault.connect(client).withdraw((await mvfVault.balanceOf(client.address)).div(3), DAIAddr, amountsOutMin)
        // await mvfVault.connect(client2).withdraw(mvfVault.balanceOf(client2.address), DAIAddr, amountsOutMin)
        // await mvfVault.connect(client3).withdraw(mvfVault.balanceOf(client3.address), DAIAddr, amountsOutMin)
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client.address), 18)) // 9635.914208951351005035
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client2.address), 18)) // 9611.213456115804298787
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client3.address), 18)) // 9595.734018752353756785

        // console.log(ethers.utils.formatEther(await mvfVault.getAllPoolInUSD())) // 107526.128844966083246901
        // console.log(ethers.utils.formatEther(await mvfVault.getPricePerFullShare())) // 1.401326010129417604
        // console.log((await mvfStrategy.getCurrentCompositionPerc()).toString()); // 2002,1496,1995,1015,997,2492
        // console.log(ethers.utils.formatEther(await mvfStrategy.getAllPoolInUSD(false))) // 100389.356493772242606757
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 100685.25416636058063773

        // console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInUSD())) // 20102.480159336237411227
        // console.log(ethers.utils.formatEther(await SLPETHVault.getAllPoolInUSD())) // 15024.439884578584795285
        // console.log(ethers.utils.formatEther(await ILVETHVault.getAllPoolInUSD())) // 25301.933974160419517657
        // console.log(ethers.utils.formatEther(await GHSTETHVault.getAllPoolInUSD())) // 10192.736031588193473501
        // const WILDETH = new ethers.Contract(WILDETHAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await WILDETH.balanceOf(mvfStrategy.address))) // 23.422856351187235872
        // const MVI = new ethers.Contract(MVIAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await MVI.balanceOf(mvfStrategy.address))) // 96.161321671445937456

        // Test withdraw within token keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(mvfVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(mvfVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(mvfVault.address), 18))
        // amountsOutMin = [0, 0, 0, 0, 0, 0, 0]
        // tx = await mvfVault.connect(client).withdraw((await mvfVault.balanceOf(client.address)).div(5), USDTAddr, amountsOutMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // // 415776 515496 567793 2165431
        // // 414233 514555 566952 2164056
        // // 406077 504241 567351 2152604
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(mvfVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(mvfVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(mvfVault.address), 18))
    })

    // it("should work for Sushi L1 AXSETH vault contract", async () => {
    //     let tx, receipt
    //     const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

    //     // Deploy
    //     const SushiVault = await ethers.getContractFactory("Sushi", deployer)
    //     const sushiVault = await SushiVault.deploy()
    //     const sushiVaultArtifact = await artifacts.readArtifact("Sushi")
    //     const sushiVaultInterface = new ethers.utils.Interface(sushiVaultArtifact.abi)

    //     const SushiFactory = await ethers.getContractFactory("SushiFactory", deployer)
    //     const sushiFactory = await SushiFactory.deploy(sushiVault.address)
        
    //     const dataAXSETH = sushiVaultInterface.encodeFunctionData(
    //         "initialize",
    //         [
    //             "DAO L1 Sushi AXS-ETH", "daoSushiAXS", 231,
    //             treasury.address, community.address, strategist.address, admin.address,
    //         ]
    //     )
    //     await sushiFactory.createVault(dataAXSETH)
    //     const AXSETHVaultAddr = await sushiFactory.getVault(0)
    //     const AXSETHVault = await ethers.getContractAt("Sushi", AXSETHVaultAddr, deployer)
    //     await AXSETHVault.transferOwnership(multisig.address)

    //     // Unlock & transfer
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [AXSETHHolderAddr]})
    //     const unlockedAcc = await ethers.getSigner(AXSETHHolderAddr)
    //     const AXSETHContract = new ethers.Contract(AXSETHAddr, IERC20_ABI, unlockedAcc)
    //     await AXSETHContract.transfer(client.address, ethers.utils.parseEther("1"))
    //     await AXSETHContract.transfer(client2.address, ethers.utils.parseEther("1"))

    //     // Whitelist
    //     await AXSETHVault.connect(admin).setWhitelistAddress(client.address, true)

    //     // Deposit
    //     await AXSETHContract.connect(client).approve(AXSETHVault.address, ethers.constants.MaxUint256)
    //     tx = await AXSETHVault.connect(client).deposit(ethers.utils.parseEther("1"))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await AXSETHVault.balanceOf(client.address)))

    //     // Invest
    //     tx = await AXSETHVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())

    //     // Second deposit
    //     await AXSETHContract.connect(client2).approve(AXSETHVault.address, ethers.constants.MaxUint256)
    //     await AXSETHVault.connect(client2).deposit(ethers.utils.parseEther("1"))
    //     // console.log(ethers.utils.formatEther(await AXSETHVault.balanceOf(client2.address)))

    //     // Check fees (deposit fees)
    //     // console.log(ethers.utils.formatEther(await AXSETHContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await AXSETHContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await AXSETHContract.balanceOf(strategist.address)))

    //     // Second invest
    //     tx = await AXSETHVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInUSD())) // TODO: not correct

    //     // Yield
    //     // console.log(ethers.utils.formatEther(await AXSETHVault.getPricePerFullShare(false)))
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
    //     const binanceAcc = await ethers.getSigner(binanceAddr)
    //     const SUSHIContract = new ethers.Contract(SUSHIAddr, IERC20_ABI, binanceAcc)
    //     await SUSHIContract.transfer(AXSETHVault.address, ethers.utils.parseEther("1"))
    //     tx = await AXSETHVault.connect(admin).yield()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await AXSETHVault.getPricePerFullShare(false)))

    //     // Check fees (yield fees)
    //     // console.log(ethers.utils.formatEther(await admin.getBalance()))
    //     // console.log(ethers.utils.formatEther(await community.getBalance()))
    //     // console.log(ethers.utils.formatEther(await strategist.getBalance()))

    //     // Emergency withdrawal
    //     await AXSETHVault.connect(admin).emergencyWithdraw()
    //     await AXSETHVault.connect(admin).reinvest()

    //     // Getter function
    //     await network.provider.send("evm_mine")
    //     console.log(ethers.utils.formatEther(await AXSETHVault.getPendingRewards()))
    //     console.log(ethers.utils.formatEther(await AXSETHVault.getAllPool()))
    //     console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInETH()))
    //     console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInUSD()))
    //     console.log(ethers.utils.formatEther((await AXSETHVault.balanceOf(client.address))
    //         .mul(await AXSETHVault.getPricePerFullShare(true))
    //         .div(ethers.utils.parseEther("1"))
    //     ))

    //     // Withdraw
    //     tx = await AXSETHVault.connect(client).withdraw(AXSETHVault.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await AXSETHContract.balanceOf(client.address)))

    //     tx = await AXSETHVault.connect(client2).withdraw(AXSETHVault.balanceOf(client2.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await AXSETHContract.balanceOf(client2.address)))
    // })

    // it("should work for Sushi L1 SLPETH vault contract", async () => {
    //     let tx, receipt
    //     const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

    //     // Deploy
    //     const SushiVault = await ethers.getContractFactory("Sushi", deployer)
    //     const sushiVault = await SushiVault.deploy()
    //     const sushiVaultArtifact = await artifacts.readArtifact("Sushi")
    //     const sushiVaultInterface = new ethers.utils.Interface(sushiVaultArtifact.abi)

    //     const SushiFactory = await ethers.getContractFactory("SushiFactory", deployer)
    //     const sushiFactory = await SushiFactory.deploy(sushiVault.address)
        
    //     const dataSLPETH = sushiVaultInterface.encodeFunctionData(
    //         "initialize",
    //         [
    //             "DAO L1 Sushi SLP-ETH", "daoSushiSLP", 290,
    //             treasury.address, community.address, strategist.address, admin.address,
    //         ]
    //     )
    //     await sushiFactory.createVault(dataSLPETH)
    //     const SLPETHVaultAddr = await sushiFactory.getVault(0)
    //     const SLPETHVault = await ethers.getContractAt("Sushi", SLPETHVaultAddr, deployer)
    //     await SLPETHVault.transferOwnership(multisig.address)

    //     // Unlock & transfer
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [SLPETHHolderAddr]})
    //     const unlockedAcc = await ethers.getSigner(SLPETHHolderAddr)
    //     const SLPETHContract = new ethers.Contract(SLPETHAddr, IERC20_ABI, unlockedAcc)
    //     await SLPETHContract.transfer(client.address, ethers.utils.parseUnits("1", 11))
    //     await SLPETHContract.transfer(client2.address, ethers.utils.parseUnits("1", 11))

    //     // Whitelist
    //     await SLPETHVault.connect(admin).setWhitelistAddress(client.address, true)

    //     // Deposit
    //     await SLPETHContract.connect(client).approve(SLPETHVault.address, ethers.constants.MaxUint256)
    //     tx = await SLPETHVault.connect(client).deposit(ethers.utils.parseUnits("1", 11))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await SLPETHVault.balanceOf(client.address)))

    //     // Invest
    //     tx = await SLPETHVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())

    //     // Second deposit
    //     await SLPETHContract.connect(client2).approve(SLPETHVault.address, ethers.constants.MaxUint256)
    //     await SLPETHVault.connect(client2).deposit(ethers.utils.parseUnits("1", 11))
    //     // console.log(ethers.utils.formatEther(await SLPETHVault.balanceOf(client2.address)))

    //     // Check fees (deposit fees)
    //     // console.log(ethers.utils.formatEther(await SLPETHContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await SLPETHContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await SLPETHContract.balanceOf(strategist.address)))

    //     // Second invest
    //     tx = await SLPETHVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await SLPETHVault.getAllPoolInUSD()))

    //     // Yield
    //     // console.log(ethers.utils.formatEther(await SLPETHVault.getPricePerFullShare(false)))
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
    //     const binanceAcc = await ethers.getSigner(binanceAddr)
    //     const SUSHIContract = new ethers.Contract(SUSHIAddr, IERC20_ABI, binanceAcc)
    //     await SUSHIContract.transfer(SLPETHVault.address, ethers.utils.parseEther("1"))
    //     tx = await SLPETHVault.connect(admin).yield()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await SLPETHVault.getPricePerFullShare(false)))

    //     // Check fees (yield fees)
    //     // console.log(ethers.utils.formatEther(await admin.getBalance()))
    //     // console.log(ethers.utils.formatEther(await community.getBalance()))
    //     // console.log(ethers.utils.formatEther(await strategist.getBalance()))

    //     // Emergency withdrawal
    //     await SLPETHVault.connect(admin).emergencyWithdraw()
    //     await SLPETHVault.connect(admin).reinvest()

    //     // Getter function
    //     await network.provider.send("evm_mine")
    //     console.log(ethers.utils.formatEther(await SLPETHVault.getPendingRewards()))
    //     console.log(ethers.utils.formatEther(await SLPETHVault.getAllPool()))
    //     console.log(ethers.utils.formatEther(await SLPETHVault.getAllPoolInETH()))
    //     console.log(ethers.utils.formatEther(await SLPETHVault.getAllPoolInUSD()))
    //     console.log(ethers.utils.formatEther((await SLPETHVault.balanceOf(client.address))
    //         .mul(await SLPETHVault.getPricePerFullShare(true))
    //         .div(ethers.utils.parseEther("1"))
    //     ))

    //     // Withdraw
    //     tx = await SLPETHVault.connect(client).withdraw(SLPETHVault.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await SLPETHContract.balanceOf(client.address)))

    //     tx = await SLPETHVault.connect(client2).withdraw(SLPETHVault.balanceOf(client2.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await SLPETHContract.balanceOf(client2.address)))
    // })

    // it("should work for UniswapV3 L1 GHSTETH vault contract", async () => {
    //     let tx, receipt
    //     const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

    //     // Deploy
    //     const UniV3Vault = await ethers.getContractFactory("UniswapV3", deployer)
    //     const uniV3Vault = await UniV3Vault.deploy()
    //     const uniV3VaultArtifact = await artifacts.readArtifact("UniswapV3")
    //     const uniV3VaultInterface = new ethers.utils.Interface(uniV3VaultArtifact.abi)

    //     const UniV3Factory = await ethers.getContractFactory("UniV3Factory", deployer)
    //     const uniV3Factory = await UniV3Factory.deploy(uniV3Vault.address)
        
    //     const dataGHSTETH = uniV3VaultInterface.encodeFunctionData(
    //         "initialize",
    //         [
    //             "DAO L1 UniV3 GHST-ETH", "daoUniV3GHST", GHSTETHAddr,
    //             treasury.address, community.address, strategist.address, admin.address,
    //         ]
    //     )
    //     await uniV3Factory.createVault(dataGHSTETH)
    //     const GHSTETHVaultAddr = await uniV3Factory.getVault(0)
    //     const GHSTETHVault = await ethers.getContractAt("UniswapV3", GHSTETHVaultAddr, deployer)
    //     await GHSTETHVault.transferOwnership(multisig.address)

    //     // Swap to GHST & transfer
    //     const WETHContract = new ethers.Contract(WETHAddr, ["function deposit() external payable", "function approve(address, uint) external", "function transfer(address, uint) external", "function balanceOf(address) external view returns (uint)"], client)
    //     await WETHContract.deposit({value: ethers.utils.parseEther("4")})
    //     const uniRouterAddr = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    //     const uniRouter = new ethers.Contract(uniRouterAddr, ["function swapExactTokensForTokens(uint, uint, address[], address, uint) external"], client)
    //     const GHSTAddr = "0x3F382DbD960E3a9bbCeaE22651E88158d2791550"
    //     const GHSTContract = new ethers.Contract(GHSTAddr, IERC20_ABI, client)
    //     await WETHContract.approve(uniRouterAddr, ethers.constants.MaxUint256)
    //     await GHSTContract.approve(uniRouterAddr, ethers.constants.MaxUint256)
    //     await uniRouter.swapExactTokensForTokens(ethers.utils.parseEther("2"), 0, [WETHAddr, GHSTAddr], client.address, Math.floor(Date.now() / 1000))
    //     await WETHContract.transfer(client2.address, (await WETHContract.balanceOf(client.address)).div(2))
    //     await GHSTContract.transfer(client2.address, (await GHSTContract.balanceOf(client.address)).div(2))

    //     // Whitelist
    //     await GHSTETHVault.connect(admin).setWhitelistAddress(client.address, true)
    //     await GHSTETHVault.connect(admin).setWhitelistAddress(client2.address, true)

    //     // Deposit
    //     await GHSTContract.connect(client).approve(GHSTETHVault.address, ethers.constants.MaxUint256)
    //     await WETHContract.connect(client).approve(GHSTETHVault.address, ethers.constants.MaxUint256)
    //     tx = await GHSTETHVault.connect(client).deposit(GHSTContract.balanceOf(client.address), WETHContract.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await GHSTETHVault.balanceOf(client.address)))
    //     // console.log(ethers.utils.formatEther(await WETHContract.balanceOf(client.address)))
    //     // console.log(ethers.utils.formatEther(await GHSTContract.balanceOf(client.address)))

    //     // Second deposit
    //     await GHSTContract.connect(client2).approve(GHSTETHVault.address, ethers.constants.MaxUint256)
    //     await WETHContract.connect(client2).approve(GHSTETHVault.address, ethers.constants.MaxUint256)
    //     tx = await GHSTETHVault.connect(client2).deposit(GHSTContract.balanceOf(client2.address), WETHContract.balanceOf(client2.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await GHSTETHVault.balanceOf(client2.address)))

    //     // Check fees (deposit fees)
    //     // console.log(ethers.utils.formatEther(await GHSTContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await WETHContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await GHSTContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await WETHContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await GHSTContract.balanceOf(strategist.address)))
    //     // console.log(ethers.utils.formatEther(await WETHContract.balanceOf(strategist.address)))

    //     // Swapping (to get profit)
    //     const UniV3Swap = await ethers.getContractFactory("UniV3Swap", deployer)
    //     const uniV3Swap = await UniV3Swap.deploy()
    //     await WETHContract.connect(deployer).deposit({value: ethers.utils.parseEther("1")})
    //     await WETHContract.connect(deployer).approve(uniV3Swap.address, ethers.constants.MaxUint256)
    //     await GHSTContract.connect(deployer).approve(uniV3Swap.address, ethers.constants.MaxUint256)
    //     await uniV3Swap.connect(deployer).swap(WETHAddr, GHSTAddr, ethers.utils.parseEther("1"), 10000)
    //     await uniV3Swap.connect(deployer).swap(GHSTAddr, WETHAddr, GHSTContract.balanceOf(deployer.address), 10000)

    //     // Yield
    //     // console.log(ethers.utils.formatEther(await GHSTETHVault.getPricePerFullShare(false)))
    //     tx = await GHSTETHVault.connect(admin).yield()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await GHSTETHVault.getPricePerFullShare(false)))

    //     // Check fees (yield fees)
    //     // console.log(ethers.utils.formatEther(await admin.getBalance()))
    //     // console.log(ethers.utils.formatEther(await treasury.getBalance()))
    //     // console.log(ethers.utils.formatEther(await community.getBalance()))
    //     // console.log(ethers.utils.formatEther(await strategist.getBalance()))

    //     // Emergency withdrawal
    //     await GHSTETHVault.connect(admin).emergencyWithdraw()
    //     await GHSTETHVault.connect(admin).reinvest()

    //     // Getter function
    //     console.log(ethers.utils.formatEther((await GHSTETHVault.getPendingRewards())[0]))
    //     console.log(ethers.utils.formatEther((await GHSTETHVault.getPendingRewards())[1]))
    //     console.log(ethers.utils.formatEther((await GHSTETHVault.getAllPool())[0])) // 3943.627348641444441247
    //     console.log(ethers.utils.formatEther((await GHSTETHVault.getAllPool())[1])) // 1.90646103188632253
    //     console.log(ethers.utils.formatEther(await GHSTETHVault.getAllPoolInETH())) // 3.81292206377264506
    //     console.log(ethers.utils.formatEther(await GHSTETHVault.getAllPoolInUSD()))
    //     console.log(ethers.utils.formatEther((await GHSTETHVault.balanceOf(client.address))
    //         .mul(await GHSTETHVault.getPricePerFullShare(true))
    //         .div(ethers.utils.parseEther("1"))
    //     ))
        
    //     // Withdraw
    //     console.log("---withdraw---")
    //     tx = await GHSTETHVault.connect(client).withdraw(GHSTETHVault.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await GHSTETHVault.balanceOf(client.address)))
    //     console.log(ethers.utils.formatEther(await WETHContract.balanceOf(client.address)))
    //     console.log(ethers.utils.formatEther(await GHSTContract.balanceOf(client.address)))

    //     tx = await GHSTETHVault.connect(client2).withdraw(GHSTETHVault.balanceOf(client2.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await WETHContract.balanceOf(client2.address)))
    //     console.log(ethers.utils.formatEther(await GHSTContract.balanceOf(client2.address)))
    // })

    // it("should work", async () => {
    //     const [deployer, client, client2, client3] = await ethers.getSigners()

    //     const adminAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [adminAddr]})
    //     const admin = await ethers.getSigner(adminAddr)
    //     await deployer.sendTransaction({to: adminAddr, value: ethers.utils.parseEther("10")})

    //     const proxyAdminAddr = "0xfdCfa2B7F6318b09Ce1a6dc82008410659211B44"
    //     const proxyAdmin = new ethers.Contract(proxyAdminAddr, ["function upgrade(address, address) external"], admin)
    //     // const mvfVaultFac = await ethers.getContractFactory("MVFVault", deployer)
    //     // const mvfVaultImpl = await mvfVaultFac.deploy()
    //     const mvfVaultProxyAddr = "0x5b3ae8b672a753906b1592d44741f71fbd05ba8c"
    //     // await proxyAdmin.upgrade(mvfVaultProxyAddr, mvfVaultImpl.address)
    //     const mvfStrategyFac = await ethers.getContractFactory("MVFStrategy", deployer)
    //     const mvfStrategyImpl = await mvfStrategyFac.deploy()
    //     const mvfStrategyProxyAddr = "0xfa83CA66FDaCC4028DAB383de4adc8aB7DB21FF2"
    //     await proxyAdmin.upgrade(mvfStrategyProxyAddr, mvfStrategyImpl.address)
    //     const mvfVault = await ethers.getContractAt("MVFVault", mvfVaultProxyAddr, admin)

    //     // network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
    //     // const unlockedAcc = await ethers.getSigner(binanceAddr)
    //     // const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, unlockedAcc)
    //     // const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, unlockedAcc)
    //     // const DAIContract = new ethers.Contract(DAIAddr, IERC20_ABI, unlockedAcc)
    //     // await USDTContract.transfer(client.address, ethers.utils.parseUnits("10000", 6))
    //     // await USDCContract.transfer(client.address, ethers.utils.parseUnits("10000", 6))
    //     // await DAIContract.transfer(client.address, ethers.utils.parseUnits("10000", 18))

    //     // await USDTContract.connect(client).approve(mvfVault.address, ethers.constants.MaxUint256)
    //     // await USDCContract.connect(client).approve(mvfVault.address, ethers.constants.MaxUint256)
    //     // await DAIContract.connect(client).approve(mvfVault.address, ethers.constants.MaxUint256)
    //     // await mvfVault.connect(client).deposit(ethers.utils.parseUnits("10", 6), USDTAddr)
    //     // await mvfVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
    //     // await mvfVault.connect(client).deposit(ethers.utils.parseUnits("10000", 18), DAIAddr)

    //     await mvfVault.reimburse(0, USDCAddr, ethers.utils.parseUnits("1000", 6))

    //     const tx = await mvfVault.invest()
    //     const receipt = await tx.wait()
    //     console.log(receipt.gasUsed.toString())
    // })
})
