const { ethers, artifacts, network } = require("hardhat")
const IERC20_ABI = require("../abis/IERC20_ABI.json")

const USDTAddr = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDCAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAIAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const WETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const ILVAddr = "0x767FE9EDC9E0dF98E07454847909b5E959D7ca0E"
const SUSHIAddr = "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2"

const AXSETHAddr = "0x0C365789DbBb94A29F8720dc465554c587e897dB"
const SLPETHAddr = "0x8597fa0773888107E2867D36dd87Fe5bAFeAb328"
const ILVETHAddr = "0x6a091a3406E0073C3CD6340122143009aDac0EDa"
const GHSTETHAddr = "0xFbA31F01058DB09573a383F26a088f23774d4E5d"
const REVVETHAddr = "0xc926990039045611eb1DE520C1E249Fd0d20a8eA"
const MVIAddr = "0x72e364F2ABdC788b7E918bc238B21f109Cd634D7"

const sushiFarmAddr = "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd"
const illuviumAddr = "0x8B4d8443a0229349A9892D4F7CbE89eF5f843F72"

const binanceAddr = "0x28C6c06298d514Db089934071355E5743bf21d60"
const AXSETHHolderAddr = "0x14b993eeD8E8Ff78195c7fDa865Ce6431ecaAEbA"
const SLPETHHolderAddr = "0x68e845717eA2ae0Ca63E7B2c9f6052FE7397e96E"

describe("Metaverse-Farmer", () => {
    it("should work", async () => {
        let tx, receipt
        const [deployer, client, client2, client3, treasury, community, strategist, biconomy, admin, multisig] = await ethers.getSigners()

        // Deploy Sushi
        const SushiVault = await ethers.getContractFactory("Sushi", deployer)
        const sushiVault = await SushiVault.deploy()
        const sushiVaultArtifact = await artifacts.readArtifact("Sushi")
        const sushiVaultInterface = new ethers.utils.Interface(sushiVaultArtifact.abi)

        const SushiFactory = await ethers.getContractFactory("SushiFactory", deployer)
        const sushiFactory = await SushiFactory.deploy(sushiVault.address)
        await sushiFactory.transferOwnership(multisig.address)
        
        // Deploy AXS-ETH
        const dataAXSETH = sushiVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Sushi AXS-ETH", "daoSushiAXS", 231,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await sushiFactory.connect(multisig).createVault(dataAXSETH)
        const AXSETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        const AXSETHVault = await ethers.getContractAt("Sushi", AXSETHVaultAddr, deployer)

        // Deploy SLP-ETH
        const dataSLPETH = sushiVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Sushi SLP-ETH", "daoSushiSLP", 290,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await sushiFactory.connect(multisig).createVault(dataSLPETH)
        const SLPETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        const SLPETHVault = await ethers.getContractAt("Sushi", SLPETHVaultAddr, deployer)
        
        // Deploy ILV-ETH
        const ILVETHVaultFac = await ethers.getContractFactory("ILVETHVault", deployer)
        const ILVETHVault = await ILVETHVaultFac.deploy()
        await ILVETHVault.initialize("DAO L1 Sushi ILV-ETH", "daoSushiILV", treasury.address, community.address, strategist.address, admin.address)
        await ILVETHVault.transferOwnership(multisig.address)

        // Deploy Uniswap V3
        const UniV3Vault = await ethers.getContractFactory("UniswapV3", deployer)
        const uniV3Vault = await UniV3Vault.deploy()
        const uniV3VaultArtifact = await artifacts.readArtifact("UniswapV3")
        const uniV3VaultInterface = new ethers.utils.Interface(uniV3VaultArtifact.abi)

        const UniV3Factory = await ethers.getContractFactory("UniV3Factory", deployer)
        const uniV3Factory = await UniV3Factory.deploy(uniV3Vault.address)
        await uniV3Factory.transferOwnership(multisig.address)

        // Deploy GHST-ETH
        const dataGHSTETH = uniV3VaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 UniV3 GHST-ETH", "daoUniV3GHST", GHSTETHAddr,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        await uniV3Factory.connect(multisig).createVault(dataGHSTETH)
        const GHSTETHVaultAddr = await uniV3Factory.getVault((await uniV3Factory.getVaultLength()).sub(1))
        const GHSTETHVault = await ethers.getContractAt("UniswapV3", GHSTETHVaultAddr, deployer)
        
        // Main contract
        const MVFStrategyFactory = await ethers.getContractFactory("MVFStrategy")
        const mvfStrategy = await MVFStrategyFactory.deploy()
        await mvfStrategy.initialize(AXSETHVaultAddr, SLPETHVault.address, ILVETHVault.address, GHSTETHVault.address)
        const MVFVaultFactory = await ethers.getContractFactory("MVFVault")
        const mvfVault = await MVFVaultFactory.deploy()
        await mvfVault.initialize(
            "DAO L2 Metaverse-Farmer", "daoMVF",
            treasury.address, community.address, admin.address, strategist.address,
            biconomy.address, mvfStrategy.address
        )
        await mvfStrategy.setVault(mvfVault.address)
        await mvfVault.transferOwnership(multisig.address)
        await mvfStrategy.transferOwnership(multisig.address)
        
        // Set whitelist
        await AXSETHVault.connect(admin).setWhitelistAddress(mvfStrategy.address, true)
        await SLPETHVault.connect(admin).setWhitelistAddress(mvfStrategy.address, true)
        await ILVETHVault.connect(admin).setWhitelistAddress(mvfStrategy.address, true)
        await GHSTETHVault.connect(admin).setWhitelistAddress(mvfStrategy.address, true)

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

        // Deposit
        await USDTContract.connect(client).approve(mvfVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client).approve(mvfVault.address, ethers.constants.MaxUint256)
        await DAIContract.connect(client).approve(mvfVault.address, ethers.constants.MaxUint256)
        tx = await mvfVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        await mvfVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        await mvfVault.connect(client).deposit(ethers.utils.parseUnits("10000", 18), DAIAddr)
        // console.log(ethers.utils.formatEther(await mvfVault.balanceOf(client.address)))

        // Invest
        tx = await mvfVault.connect(admin).invest()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // console.log(ethers.utils.formatEther(await mvfVault.getAllPool(true)))
        // console.log(ethers.utils.formatEther(await mvfVault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(
        //     (await mvfVault.balanceOf(client.address))
        //     .mul(await mvfVault.getPricePerFullShare())
        //     .div(ethers.utils.parseEther("1"))
        // )) // User share in USD
        // console.log(ethers.utils.formatEther(await mvfVault.getPricePerFullShare())) // LP token price
        // console.log((await mvfStrategy.getCurrentCompositionPerc()).toString());
        // console.log(ethers.utils.formatEther(await mvfVault.balanceOf(client.address)))
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark()))

        // Check Stablecoins keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(mvfVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(mvfVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(mvfVault.address), 18))

        // Second invest
        await USDTContract.connect(client2).approve(mvfVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client3).approve(mvfVault.address, ethers.constants.MaxUint256)
        await mvfVault.connect(client2).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        await mvfVault.connect(client3).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        tx = await mvfVault.connect(admin).invest()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // console.log(ethers.utils.formatEther(await mvfVault.balanceOf(client2.address)))
        // console.log(ethers.utils.formatEther(await mvfVault.balanceOf(client3.address)))

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await AXSETHVault.getAllPoolInUSD())) // 10000
        // console.log(ethers.utils.formatEther(await SLPETHVault.getAllPoolInUSD())) // 7500
        // console.log(ethers.utils.formatEther(await ILVETHVault.getAllPoolInUSD())) // 10000
        // console.log(ethers.utils.formatEther(await GHSTETHVault.getAllPoolInUSD())) // 5000

        // Assume profit
        const MVIUnlockedAddr = "0x6b9dfc960299166df15ab8a85f054c69e2be2353"
        await network.provider.request({method: "hardhat_impersonateAccount", params: [MVIUnlockedAddr]})
        const MVIUnlockedAcc = await ethers.getSigner(MVIUnlockedAddr)
        const MVIContract = new ethers.Contract(MVIAddr, IERC20_ABI, MVIUnlockedAcc)
        await MVIContract.transfer(mvfStrategy.address, ethers.utils.parseEther("10"))

        // Collect profit
        tx = await mvfVault.connect(admin).collectProfitAndUpdateWatermark()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // console.log(ethers.utils.formatEther(await mvfVault.fees()))
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark()))
        // console.log(ethers.utils.formatEther(await mvfVault.getAllPoolInUSD()))

        // Transfer out fees
        await mvfVault.connect(admin).transferOutFees()
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(treasury.address), 6)) // 204.130064
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(community.address), 6)) // 204.130064
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(strategist.address), 6)) // 102.065034
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 28759.3006489687525804
        // console.log(ethers.utils.formatEther(await mvfVault.fees())) // 0.0

        // Test reimburse
        // await mvfVault.connect(admin).reimburse(5, USDTAddr, ethers.utils.parseUnits("1000", 6))
        // await mvfVault.connect(admin).reimburse(5, USDCAddr, ethers.utils.parseUnits("1000", 6))
        // await mvfVault.connect(admin).reimburse(5, DAIAddr, ethers.utils.parseUnits("1000", 18))
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(mvfVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(mvfVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(mvfVault.address), 18))

        // Test emergency withdraw
        // await mvfVault.connect(admin).emergencyWithdraw()
        // await mvfVault.connect(admin).reinvest()
        // console.log(ethers.utils.formatEther(await mvfStrategy.watermark())) // 38234.1494749687525804

        // Withdraw
        console.log("-----withdraw-----")
        const portionShare = (await mvfVault.balanceOf(client.address)).div("3")
        await mvfVault.connect(client).withdraw(portionShare, USDTAddr)
        // await mvfVault.connect(client).withdraw(portionShare, USDCAddr)
        // await mvfVault.connect(client).withdraw(portionShare, DAIAddr)
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client.address), 6)) // 10010.287234 10020.323855
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client.address), 6)) // 
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client.address), 18)) // 

        await mvfVault.connect(client2).withdraw(mvfVault.balanceOf(client2.address), USDTAddr)
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 10017.97404 10026.73855
        
        tx = await mvfVault.connect(client3).withdraw(mvfVault.balanceOf(client3.address), USDCAddr)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client3.address), 6)) // 9984.832298 10019.126379
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
    //     // console.log(ethers.utils.formatEther(await SLPETHVault.getAllPoolInUSD())) // TODO: not correct

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
})