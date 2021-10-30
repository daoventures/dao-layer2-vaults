// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);
}

interface ICurve {
    function add_liquidity(
        uint[5] memory amounts, uint _min_mint_amount, bool _use_underlying
    ) external returns (uint);

    function remove_liquidity_one_coin(uint _token_amount, int128 i, uint _min_amount) external returns (uint);
    function get_virtual_price() external view returns (uint);
}

interface IDaoL1Vault is IERC20Upgradeable {
    function deposit(uint amount) external;
    function withdraw(uint share) external returns (uint);
    function getAllPoolInUSD() external view returns (uint);
}

contract DeXStableStrategy is Initializable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20Upgradeable constant WBTC = IERC20Upgradeable(0x50b7545627a5162F82A992c33b87aDc75187B218);
    IERC20Upgradeable constant WETH = IERC20Upgradeable(0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB);
    IERC20Upgradeable constant USDC = IERC20Upgradeable(0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664);

    IERC20Upgradeable constant WBTCUSDC = IERC20Upgradeable(0x62475f52aDd016A06B398aA3b2C2f2E540d36859);
    IERC20Upgradeable constant WETHUSDC = IERC20Upgradeable(0x199fb78019A08af2Cb6a078409D0C8233Eba8a0c);
    IERC20Upgradeable constant crvUSDBTCETH = IERC20Upgradeable(0x1daB6560494B04473A0BE3E7D83CF3Fdf3a51828);

    IRouter constant router = IRouter(0x60aE616a2155Ee3d9A68541Ba4544862310933d4);
    ICurve constant curve = ICurve(0x7f90122BF0700F9E7e1F688fe926940E8839F353); // atricrypto

    IDaoL1Vault public WBTCUSDCVault;
    IDaoL1Vault public WETHUSDCVault;
    IDaoL1Vault public crvUSDBTCETHVault;

    address public vault;
    uint public watermark; // In USD (18 decimals)
    uint public profitFeePerc;

    event TargetComposition (uint JOEUSDCTargetPool, uint PNGUSDTTargetPool, uint LYDDAITargetPool);
    event CurrentComposition (uint JOEUSDCCCurrentPool, uint PNGUSDTCurrentPool, uint LYDDAICurrentPool);
    event InvestWBTCUSDC(uint USDCAmt, uint WBTCUSDCAmt);
    event InvestWETHUSDC(uint USDCAmt, uint WETHUSDCAmt);
    event InvestCrvUSDBTCETH(uint USDCAmt, uint crvUSDBTCETHAmt);
    event Withdraw(uint amount, uint USDAmt);
    event WithdrawWBTCUSDC(uint lpTokenAmt, uint USDCAmt);
    event WithdrawWETHUSDC(uint lpTokenAmt, uint USDCAmt);
    event WithdrawCrvUSDBTCETH(uint lpTokenAmt, uint USDCAmt);
    event CollectProfitAndUpdateWatermark(uint currentWatermark, uint lastWatermark, uint fee);
    event AdjustWatermark(uint currentWatermark, uint lastWatermark);
    event Reimburse(uint USDAmt);
    event EmergencyWithdraw(uint USDAmt);

    modifier onlyVault {
        require(msg.sender == vault, "Only vault");
        _;
    }

    function initialize(
        address _WBTCUSDCVault, address _WETHUSDCVault, address _crvUSDBTCETHVault
    ) external initializer {

        WBTCUSDCVault = IDaoL1Vault(_WBTCUSDCVault);
        WETHUSDCVault = IDaoL1Vault(_WETHUSDCVault);
        crvUSDBTCETHVault = IDaoL1Vault(_crvUSDBTCETHVault);

        profitFeePerc = 2000;

        USDC.safeApprove(address(router), type(uint).max);
        USDC.safeApprove(address(curve), type(uint).max);
        WBTC.safeApprove(address(router), type(uint).max);
        WETH.safeApprove(address(router), type(uint).max);

        WBTCUSDC.safeApprove(address(WBTCUSDCVault), type(uint).max);
        WBTCUSDC.safeApprove(address(router), type(uint).max);
        WETHUSDC.safeApprove(address(WETHUSDCVault), type(uint).max);
        WETHUSDC.safeApprove(address(router), type(uint).max);
        crvUSDBTCETH.safeApprove(address(crvUSDBTCETHVault), type(uint).max);
        crvUSDBTCETH.safeApprove(address(curve), type(uint).max);
    }

    function invest(uint USDCAmt, uint[] calldata amountsOutMin) external onlyVault {
        USDC.safeTransferFrom(vault, address(this), USDCAmt);

        uint[] memory pools = getEachPool();
        uint pool = pools[0] + pools[1] + pools[2] + USDCAmt;
        uint WBTCUSDCTargetPool = pool * 2500 / 10000;
        uint WETHUSDCTargetPool = pool * 2500 / 10000;
        uint crvUSDBTCETHTargetPool = pool * 5000 / 10000;

        // Rebalancing invest
        if (
            WBTCUSDCTargetPool > pools[0] &&
            WETHUSDCTargetPool > pools[1] &&
            crvUSDBTCETHTargetPool > pools[2]
        ) {
            investWBTCUSDC(WBTCUSDCTargetPool - pools[0], amountsOutMin[0]);
            investWBTCUSDC(WETHUSDCTargetPool - pools[1], amountsOutMin[1]);
            investCrvUSDBTCETH(crvUSDBTCETHTargetPool - pools[2]);
        } else {
            uint furthest;
            uint farmIndex;
            uint diff;

            if (WBTCUSDCTargetPool > pools[0]) {
                diff = WBTCUSDCTargetPool - pools[0];
                furthest = diff;
                farmIndex = 0;
            }
            if (WETHUSDCTargetPool > pools[1]) {
                diff = WETHUSDCTargetPool - pools[1];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 1;
                }
            }
            if (crvUSDBTCETHTargetPool > pools[2]) {
                diff = crvUSDBTCETHTargetPool - pools[2];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 2;
                }
            }

            if (farmIndex == 0) investWBTCUSDC(USDCAmt, amountsOutMin[0]);
            else if (farmIndex == 1) investWBTCUSDC(USDCAmt, amountsOutMin[1]);
            else investCrvUSDBTCETH(USDCAmt);
        }

        emit TargetComposition(WBTCUSDCTargetPool, WETHUSDCTargetPool, crvUSDBTCETHTargetPool);
        emit CurrentComposition(pools[0], pools[1], pools[2]);
    }

    function investWBTCUSDC(uint USDCAmt, uint amountOutMin) private {
        uint halfUSDC = USDCAmt / 2;
        uint WBTCAmt = router.swapExactTokensForTokens(
            halfUSDC, amountOutMin, getPath(address(USDC), address(WBTC)), address(this), block.timestamp
        )[1];

        (,,uint WBTCUSDCAmt) = router.addLiquidity(
            address(WBTC), address(USDC), WBTCAmt, halfUSDC, 0, 0, address(this), block.timestamp
        );

        WBTCUSDCVault.deposit(WBTCUSDCAmt);
        emit InvestWBTCUSDC(USDCAmt, WBTCUSDCAmt);
    }

    function investWETHUSDC(uint USDCAmt, uint amountOutMin) private {
        uint halfUSDC = USDCAmt / 2;
        uint WETHAmt = router.swapExactTokensForTokens(
            halfUSDC, amountOutMin, getPath(address(USDC), address(WETH)), address(this), block.timestamp
        )[1];

        (,,uint WETHUSDCAmt) = router.addLiquidity(
            address(WETH), address(USDC), WETHAmt, halfUSDC, 0, 0, address(this), block.timestamp
        );

        WETHUSDCVault.deposit(WETHUSDCAmt);
        emit InvestWETHUSDC(USDCAmt, WETHUSDCAmt);
    }

    function investCrvUSDBTCETH(uint USDCAmt) private {
        uint estimatedMintAmt = USDCAmt * 1e18 / curve.get_virtual_price();
        uint crvUSDBTCETHAmt = curve.add_liquidity([0, USDCAmt, 0, 0, 0], estimatedMintAmt, true);

        crvUSDBTCETHVault.deposit(crvUSDBTCETHAmt);
        emit InvestCrvUSDBTCETH(USDCAmt, crvUSDBTCETHAmt);
    }

    /// @param amount Amount to withdraw in USD
    function withdraw(uint amount, uint[] calldata amountsOutMin) external onlyVault returns (uint USDCAmt) {
        uint sharePerc = amount * 1e18 / getAllPoolInUSD();

        uint USDCAmtBefore = USDC.balanceOf(address(this));
        withdrawWBTCUSDC(sharePerc, amountsOutMin[0]);
        withdrawWETHUSDC(sharePerc, amountsOutMin[1]);
        withdrawCrvUSDBTCETH(sharePerc);

        USDCAmt = USDC.balanceOf(address(this)) - USDCAmtBefore;
        USDC.safeTransfer(vault, USDCAmt);
        emit Withdraw(amount, USDCAmt);
    }

    function withdrawWBTCUSDC(uint sharePerc, uint amountOutMin) private {
        uint WBTCUSDCAmt = WBTCUSDCVault.withdraw(WBTCUSDCVault.balanceOf(address(this)) * sharePerc / 1e18);
        (uint WBTCAmt, uint USDCAmt) = router.removeLiquidity(
            address(WBTC), address(USDC), WBTCUSDCAmt, 0, 0, address(this), block.timestamp
        );
        USDCAmt += router.swapExactTokensForTokens(
            WBTCAmt, amountOutMin, getPath(address(WBTC), address(USDC)), address(this), block.timestamp
        )[1];

        emit WithdrawWBTCUSDC(WBTCUSDCAmt, USDCAmt);
    }

    function withdrawWETHUSDC(uint sharePerc, uint amountOutMin) private {
        uint WETHUSDCAmt = WETHUSDCVault.withdraw(WETHUSDCVault.balanceOf(address(this)) * sharePerc / 1e18);
        (uint WETHAmt, uint USDCAmt) = router.removeLiquidity(
            address(WETH), address(USDC), WETHUSDCAmt, 0, 0, address(this), block.timestamp
        );
        USDCAmt += router.swapExactTokensForTokens(
            WETHAmt, amountOutMin, getPath(address(WETH), address(USDC)), address(this), block.timestamp
        )[1];

        emit WithdrawWETHUSDC(WETHUSDCAmt, USDCAmt);
    }

    function withdrawCrvUSDBTCETH(uint sharePerc) private {
        uint crvUSDBTCETHAmt = crvUSDBTCETHVault.withdraw(crvUSDBTCETHVault.balanceOf(address(this)) * sharePerc / 1e18);
        uint USDCAmt = curve.remove_liquidity_one_coin(crvUSDBTCETHAmt, 1, 0);

        emit WithdrawCrvUSDBTCETH(crvUSDBTCETHAmt, USDCAmt);
    }

    function collectProfitAndUpdateWatermark() public onlyVault returns (uint fee) {
        uint currentWatermark = getAllPoolInUSD();
        uint lastWatermark = watermark;
        if (currentWatermark > lastWatermark) {
            uint profit = currentWatermark - lastWatermark;
            fee = profit * profitFeePerc / 10000;
            watermark = currentWatermark;
        }

        emit CollectProfitAndUpdateWatermark(currentWatermark, lastWatermark, fee);
    }

    /// @param signs True for positive, false for negative
    function adjustWatermark(uint amount, bool signs) external onlyVault {
        uint lastWatermark = watermark;
        watermark = signs == true ? watermark + amount : watermark - amount;

        emit AdjustWatermark(watermark, lastWatermark);
    }

    /// @param amount Amount to reimburse to vault contract in USDC
    function reimburse(uint farmIndex, uint amount, uint tokenPriceMin) external onlyVault returns (uint USDCAmt) {
        if (farmIndex == 0) withdrawWBTCUSDC(amount * 1e18 / getWBTCUSDCPool(), tokenPriceMin);
        else if (farmIndex == 1) withdrawWETHUSDC(amount * 1e18 / getWETHUSDCPool(), tokenPriceMin);
        else if (farmIndex == 2) withdrawCrvUSDBTCETH(amount * 1e18 / getCrvUSDBTCETHPool());

        USDCAmt = USDC.balanceOf(address(this));
        USDC.safeTransfer(vault, USDCAmt);

        emit Reimburse(USDCAmt);
    }

    function emergencyWithdraw() external onlyVault {
        // 1e18 == 100% of share
        withdrawWBTCUSDC(1e18, 0);
        withdrawWETHUSDC(1e18, 0);
        withdrawCrvUSDBTCETH(1e18);

        uint USDCAmt = USDC.balanceOf(address(this));
        USDC.safeTransfer(vault, USDCAmt);
        watermark = 0;

        emit EmergencyWithdraw(USDCAmt);
    }

    function setVault(address _vault) external {
        require(vault == address(0), "Vault set");
        vault = _vault;
    }

    function setProfitFeePerc(uint _profitFeePerc) external onlyVault {
        profitFeePerc = _profitFeePerc;
    }

    function getPath(address tokenA, address tokenB) private pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
    }

    function getWBTCUSDCPool() private view returns (uint) {
        uint WETHUSDCVaultPool = WETHUSDCVault.getAllPoolInUSD();
        if (WETHUSDCVaultPool == 0) return 0;
        return WETHUSDCVaultPool * WETHUSDCVault.balanceOf(address(this)) / WETHUSDCVault.totalSupply();
    }

    function getWETHUSDCPool() private view returns (uint) {
        uint WETHUSDCVaultPool = WETHUSDCVault.getAllPoolInUSD();
        if (WETHUSDCVaultPool == 0) return 0;
        return WETHUSDCVaultPool * WETHUSDCVault.balanceOf(address(this)) / WETHUSDCVault.totalSupply();
    }

    function getCrvUSDBTCETHPool() private view returns (uint) {
        uint crvUSDBTCETHVaultPool = crvUSDBTCETHVault.getAllPoolInUSD();
        if (crvUSDBTCETHVaultPool == 0) return 0;
        return crvUSDBTCETHVaultPool * crvUSDBTCETHVault.balanceOf(address(this)) / crvUSDBTCETHVault.totalSupply();
    }

    function getEachPool() private view returns (uint[] memory pools) {
        pools = new uint[](3);
        pools[0] = getWETHUSDCPool();
        pools[1] = getWETHUSDCPool();
        pools[2] = getCrvUSDBTCETHPool();
    }

    function getAllPoolInUSD() public view returns (uint) {
        uint[] memory pools = getEachPool();
        return pools[0] + pools[1] + pools[2];
    }

    function getCurrentCompositionPerc() external view returns (uint[] memory percentages) {
        uint[] memory pools = getEachPool();
        uint allPool = pools[0] + pools[1] + pools[2];

        percentages = new uint[](3);
        percentages[0] = pools[0] * 10000 / allPool;
        percentages[1] = pools[1] * 10000 / allPool;
        percentages[2] = pools[2] * 10000 / allPool;
    }
}