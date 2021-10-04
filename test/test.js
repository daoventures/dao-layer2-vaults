const { ethers, artifacts, network, upgrades } = require("hardhat")
const IERC20_ABI = require("../abis/IERC20_ABI.json")

const binanceAddr = "0x28C6c06298d514Db089934071355E5743bf21d60"

const WETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const WBTCAddr = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
const USDTAddr = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDCAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAIAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"

const WBTCETHAddr = "0xCEfF51756c56CeFFCA006cD410B03FFC46dd3a58"
const USDCETHAddr = "0x397FF1542f962076d0BFE58eA045FfA2d347ACa0"

const WBTCETHHolderAddr = "0xcbf9dcd8df9b116230ea572e0be36a98e1064c9d"
const USDCETHHolderAddr = "0x7ac049b7d78bc930e463709ec5e77855a5dca4c4"

describe("DAO Technical Analysis", () => {
    it("should work for DAO L2 TA contract", async () => {
        let tx, receipt
        const [deployer, client, client2, client3, treasury, community, strategist, biconomy, multisig] = await ethers.getSigners()

        const adminAddr = "0x3f68A3c1023d736D8Be867CA49Cb18c543373B99"
        await network.provider.request({method: "hardhat_impersonateAccount", params: [adminAddr]})
        const admin = await ethers.getSigner(adminAddr)
        await client.sendTransaction({to: admin.address, value: ethers.utils.parseEther("10")})

        // // Get Sushi factory contract
        // const sushiFactory = await ethers.getContractAt("SushiFactory", "0x1D5c8FA8aa068726b84f6b45992C8f0f225A4ff3", deployer)
        // const sushiVaultArtifact = await artifacts.readArtifact("Sushi")
        // const sushiVaultInterface = new ethers.utils.Interface(sushiVaultArtifact.abi)

        // // Deploy WBTC-ETH vault
        // const dataWBTCETH = sushiVaultInterface.encodeFunctionData(
        //     "initialize",
        //     [
        //         "DAO L1 Sushi WBTC-ETH", "daoSushiWBTC", 21,
        //         treasury.address, community.address, strategist.address, admin.address,
        //     ]
        // )
        // await sushiFactory.createVault(dataWBTCETH)
        // const WBTCETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        const WBTCETHVaultAddr = "0x0B9C62D3365F6fa56Dd8249975D4aCd75fA9774F"
        const WBTCETHVault = await ethers.getContractAt("Sushi", WBTCETHVaultAddr, deployer)

        // // Deploy USDC-ETH vault
        // const dataUSDCETH = sushiVaultInterface.encodeFunctionData(
        //     "initialize",
        //     [
        //         "DAO L1 Sushi USDC-ETH", "daoSushiUSDC", 1,
        //         treasury.address, community.address, strategist.address, admin.address,
        //     ]
        // )
        // await sushiFactory.createVault(dataUSDCETH)
        // const USDCETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        const USDCETHVaultAddr = "0x4Fe35F3e3728942715378a3D5684f86b693328a3"
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
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 200615
        await taVault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        await taVault.connect(client).deposit(ethers.utils.parseUnits("10000", 18), DAIAddr)
        // console.log(ethers.utils.formatEther(await taVault.balanceOf(client.address))) // 0.0

        // Invest
        tx = await taVault.connect(admin).invest()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 862581
        // console.log(ethers.utils.formatEther(await taVault.getAllPoolInETH())) // 9.400373381261705374
        // console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 29557.127953875909671123
        // console.log(ethers.utils.formatEther(
        //     (await taVault.balanceOf(client.address))
        //     .mul(await taVault.getPricePerFullShare())
        //     .div(ethers.utils.parseEther("1")) // 29557.1279538759096675
        // )) // User share in USD
        // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 0.995189493396495275
        // console.log(ethers.utils.formatEther(await taVault.balanceOf(client.address))) // 29700.0
        // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 27027.0

        // Check fees
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(treasury.address), 6)) // 120.0
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(community.address), 6)) // 120.0
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(strategist.address), 6)) // 60.0
        // console.log(ethers.utils.formatEther(await taVault.fees())) // 0.0

        // Check Stablecoins keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(taVault.address), 6)) // 891.0
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(taVault.address), 6)) // 891.0
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(taVault.address), 18)) // 891.0

        // Second invest
        await USDTContract.connect(client2).approve(taVault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client3).approve(taVault.address, ethers.constants.MaxUint256)
        tx = await taVault.connect(client2).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 183515
        await taVault.connect(client3).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        tx = await taVault.connect(admin).invest()
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 654059
        // console.log(ethers.utils.formatEther(await taVault.balanceOf(client2.address))) // 9947.854218408355728891
        // console.log(ethers.utils.formatEther(await taVault.balanceOf(client3.address))) // 9947.854218408355728891
        // console.log(ethers.utils.formatEther(await taVault.getAllPoolInETH())) // 15.661712734846312317
        // console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 49244.952269172881603345
        // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 0.992927691151126884
        // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 45647.572324

        // Check farm vault pool
        // console.log(ethers.utils.formatEther(await WBTCETHVault.getAllPoolInUSD())) // 45392.524593172881604646
        // console.log(ethers.utils.formatEther(await USDCETHVault.getAllPoolInUSD())) // 0.0

        // Assume profit
        network.provider.request({method: "hardhat_impersonateAccount", params: [WBTCETHHolderAddr]})
        const unlockedAcc = await ethers.getSigner(WBTCETHHolderAddr)
        const WBTCETHContract = new ethers.Contract(WBTCETHAddr, IERC20_ABI, unlockedAcc)
        await WBTCETHContract.transfer(WBTCETHVaultAddr, ethers.utils.parseUnits("1", 10))

        // Collect profit
        const currentWatermark = await taStrategy.watermark()
        const currentPool = await taStrategy.getAllPoolInUSD()
        // console.log(ethers.utils.formatEther(currentPool.sub(currentWatermark))) // 323.213900113422386047
        // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 1.004587200595925458
        tx = await taVault.connect(admin).collectProfitAndUpdateWatermark() 
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString()) // 150095
        // console.log(ethers.utils.formatEther(await taVault.fees())) // 64.642780022684477209
        // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 45970.786224113422386047
        // console.log(ethers.utils.formatEther(await taStrategy.getAllPoolInUSD())) // 45970.786224113422386047
        // console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 49758.571120090737908838
        // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 1.003283805966427682

        // Test reimburse
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(taVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(taVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(taVault.address), 18))
        // await taVault.connect(admin).reimburse(USDTAddr, ethers.utils.parseUnits("1000", 6))
        // await taVault.connect(admin).reimburse(USDCAddr, ethers.utils.parseUnits("1000", 6))
        // await taVault.connect(admin).reimburse(DAIAddr, ethers.utils.parseUnits("1000", 18))
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(taVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(taVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(taVault.address), 18))
        // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 42970.786224113422386047

        // Test emergency withdraw
        // await taVault.connect(admin).emergencyWithdraw()
        // console.log(ethers.utils.formatEther(await WBTCETHVault.getAllPoolInUSD())) // 0.0
        // console.log(ethers.utils.formatEther(await USDCETHVault.getAllPoolInUSD())) // 0.0
        // const WETHContract = new ethers.Contract(WETHAddr, IERC20_ABI, deployer)
        // console.log(ethers.utils.formatEther(await WETHContract.balanceOf(taVault.address))) // 15.669826602259295335
        // console.log(ethers.utils.formatEther(await WETHContract.balanceOf(taStrategy.address))) // 0.0

        // await taVault.connect(admin).reinvest()
        // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 45837.846871726958492802
        // console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 49455.255420010409665919
        // console.log(ethers.utils.formatEther(await taStrategy.getAllPoolInUSD())) // 45632.136797212981861994
        // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 0.995745963113083014

        // Withdraw
        console.log("-----withdraw-----")
        const router = new ethers.Contract("0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", ["function getAmountsOut(uint, address[] memory) external view returns (uint[] memory)"], deployer)
        const ETHPriceInUSDTMin = ((await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [WETHAddr, USDTAddr]))[1]).mul(95).div(100)
        const WBTCPriceInETHMin = ((await router.getAmountsOut(ethers.utils.parseUnits("1", 8), [WBTCAddr, WETHAddr]))[1]).mul(95).div(100)
        const USDCPriceInETHMin = ((await router.getAmountsOut(ethers.utils.parseUnits("1", 6), [USDCAddr, WETHAddr]))[1]).mul(95).div(100)
        const tokenPriceMin = [ETHPriceInUSDTMin, WBTCPriceInETHMin, USDCPriceInETHMin]
        await taVault.connect(client).withdraw((await taVault.balanceOf(client.address)).div(3), USDTAddr, tokenPriceMin)
        await taVault.connect(client2).withdraw(taVault.balanceOf(client2.address), USDTAddr, tokenPriceMin)
        await taVault.connect(client3).withdraw(taVault.balanceOf(client3.address), USDTAddr, tokenPriceMin)
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client.address), 6)) // 9880.041115
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 9960.582594
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 9958.794169

        // await taVault.connect(client).withdraw((await taVault.balanceOf(client.address)).div(3), USDCAddr)
        // await taVault.connect(client2).withdraw(taVault.balanceOf(client2.address), USDCAddr)
        // await taVault.connect(client3).withdraw(taVault.balanceOf(client3.address), USDCAddr)
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client.address), 6)) // 9892.603639
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client2.address), 6)) // 9932.154573
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(client3.address), 6)) // 9930.813366

        // await taVault.connect(client).withdraw((await taVault.balanceOf(client.address)).div(3), DAIAddr)
        // await taVault.connect(client2).withdraw(taVault.balanceOf(client2.address), DAIAddr)
        // await taVault.connect(client3).withdraw(taVault.balanceOf(client3.address), DAIAddr)
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client.address), 18)) // 9874.263061243190019758
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client2.address), 18)) // 9914.286645146000722542
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(client3.address), 18)) // 9912.257331309285483505

        // console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 19769.235125979954469072
        // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 0.998446218483836084
        // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 17425.287775807584638142
        // console.log(ethers.utils.formatEther(await taStrategy.getAllPoolInUSD())) // 17423.684769182526665147
        // console.log(ethers.utils.formatEther(await WBTCETHVault.getAllPoolInUSD())) // 17423.684769182526666624
        // console.log(ethers.utils.formatEther(await USDCETHVault.getAllPoolInUSD())) // 0.0

        // Switch mode
        const WBTCPriceInUSDCMin = ((await router.getAmountsOut(ethers.utils.parseUnits("1", 8), 
            [WBTCAddr, WETHAddr, USDCAddr]))[2]).mul(95).div(100)
        const USDCPriceInWBTCMin = ((await router.getAmountsOut(ethers.utils.parseUnits("1", 6), 
            [USDCAddr, WETHAddr, WBTCAddr]))[2]).mul(95).div(100)
        const _tokenPriceMin = [WBTCPriceInUSDCMin, USDCPriceInWBTCMin]
        await taVault.switchMode(_tokenPriceMin)
        // console.log(ethers.utils.formatEther(await taVault.getAllPoolInUSD())) // 19666.567354513814575266
        // console.log(ethers.utils.formatEther(await taVault.getPricePerFullShare())) // 0.993260977500697705
        // console.log(ethers.utils.formatEther(await taStrategy.watermark())) // 17425.287775807584638142
        // console.log(ethers.utils.formatEther(await taStrategy.getAllPoolInUSD())) // 17321.016997716386771341
        // console.log(ethers.utils.formatEther(await WBTCETHVault.getAllPoolInUSD())) // 0.0
        // console.log(ethers.utils.formatEther(await USDCETHVault.getAllPoolInUSD())) // 17321.016997716386772756

        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 9960.582594
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 9958.794169
        await taVault.connect(client2).deposit(USDTContract.balanceOf(client2.address), USDTAddr)
        await USDTContract.connect(client3).approve(taVault.address, ethers.constants.MaxUint256)
        await taVault.connect(client3).deposit(USDTContract.balanceOf(client3.address), USDTAddr)
        await taVault.connect(admin).invest()

        await taVault.switchMode(_tokenPriceMin)

        await taVault.connect(client2).withdraw(taVault.balanceOf(client2.address), USDTAddr, tokenPriceMin)
        await taVault.connect(client3).withdraw(taVault.balanceOf(client3.address), USDTAddr, tokenPriceMin)
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client2.address), 6)) // 9754.991008
        console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(client3.address), 6)) // 9750.718494

        // Test withdraw within token keep in vault
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(taVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(taVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(taVault.address), 18))
        // tx = await taVault.connect(client).withdraw((await taVault.balanceOf(client.address)).div(35), USDTAddr, tokenPriceMin)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        // // 208220 306840 358037 494129
        // // 206677 305358 356114 455294
        // // 198521 294503 355431 481292
        // console.log(ethers.utils.formatUnits(await USDTContract.balanceOf(taVault.address), 6))
        // console.log(ethers.utils.formatUnits(await USDCContract.balanceOf(taVault.address), 6))
        // console.log(ethers.utils.formatUnits(await DAIContract.balanceOf(taVault.address), 18))
    })
})
