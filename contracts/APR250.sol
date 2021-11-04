// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";

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

interface IDaoL1Vault is IERC20Upgradeable {
    function deposit(uint amount) external;
    function withdraw(uint share) external returns (uint);
    function getAllPoolInUSD() external view returns (uint);
    function getAllPoolInAVAX() external view returns (uint);
}

interface IPair is IERC20Upgradeable {
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface IChainlink {
    function latestAnswer() external view returns (int256);
}

contract APR250Strategy is Initializable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for IPair;

    IERC20Upgradeable constant WAVAX = IERC20Upgradeable(0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7);
    IERC20Upgradeable constant JOE = IERC20Upgradeable(0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd);
    IERC20Upgradeable constant PNG = IERC20Upgradeable(0x60781C2586D68229fde47564546784ab3fACA982);
    IERC20Upgradeable constant LYD = IERC20Upgradeable(0x4C9B4E1AC6F24CdE3660D5E4Ef1eBF77C710C084);

    IRouter constant joeRouter = IRouter(0x60aE616a2155Ee3d9A68541Ba4544862310933d4);
    IRouter constant pngRouter = IRouter(0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106);
    IRouter constant lydRouter = IRouter(0xA52aBE4676dbfd04Df42eF7755F01A3c41f28D27);

    IPair public joePair;
    IPair public pngPair;
    IPair public lydPair;

    IERC20Upgradeable joeToken0;
    IERC20Upgradeable joeToken1;
    IERC20Upgradeable pngToken0;
    IERC20Upgradeable pngToken1;
    IERC20Upgradeable lydToken0;
    IERC20Upgradeable lydToken1;

    IDaoL1Vault public joePairVault;
    IDaoL1Vault public pngPairVault;
    IDaoL1Vault public lydPairVault;
    uint[] public composition;

    address public vault;
    uint public watermark; // In USD (18 decimals)
    uint public profitFeePerc;

    event TargetComposition (uint joePairTargetPool, uint pngPairTargetPool, uint lydPairTargetPool);
    event CurrentComposition (uint joePairCCurrentPool, uint pngPairCurrentPool, uint lydPairCurrentPool);
    event InvestJoePair(uint WAVAXAmt, uint joePairAmt);
    event InvestPngPair(uint WAVAXAmt, uint pngPairAmt);
    event InvestLydPair(uint WAVAXAmt, uint lydPairAmt);
    event Withdraw(uint amount, uint WAVAXAmt);
    event WithdrawJoePair(uint lpTokenAmt, uint WAVAXAmt);
    event WithdrawPngPair(uint lpTokenAmt, uint WAVAXAmt);
    event WithdrawLydPair(uint lpTokenAmt, uint WAVAXAmt);
    event CollectProfitAndUpdateWatermark(uint currentWatermark, uint lastWatermark, uint fee);
    event AdjustWatermark(uint currentWatermark, uint lastWatermark);
    event Reimburse(uint WAVAXAmt);
    event EmergencyWithdraw(uint WAVAXAmt);

    modifier onlyVault {
        require(msg.sender == vault, "Only vault");
        _;
    }

    function initialize(
        IPair _joePair, IPair _pngPair, IPair _lydPair,
        IDaoL1Vault _joePairVault, IDaoL1Vault _pngPairVault, IDaoL1Vault _lydPairVault
    ) external initializer {

        joePair = _joePair;
        pngPair = _pngPair;
        lydPair = _lydPair;
        // console.log(address(lydPair));

        joeToken0 = IERC20Upgradeable(joePair.token0());
        joeToken1 = IERC20Upgradeable(joePair.token1());
        pngToken0 = IERC20Upgradeable(pngPair.token0());
        pngToken1 = IERC20Upgradeable(pngPair.token1());
        lydToken0 = IERC20Upgradeable(lydPair.token0());
        lydToken1 = IERC20Upgradeable(lydPair.token1());

        joePairVault = _joePairVault;
        pngPairVault = _pngPairVault;
        lydPairVault = _lydPairVault;
        composition = [2000, 4000, 4000];

        profitFeePerc = 2000;

        WAVAX.safeApprove(address(joeRouter), type(uint).max);
        WAVAX.safeApprove(address(pngRouter), type(uint).max);
        WAVAX.safeApprove(address(lydRouter), type(uint).max);
        JOE.safeApprove(address(joeRouter), type(uint).max);
        PNG.safeApprove(address(pngRouter), type(uint).max);
        LYD.safeApprove(address(lydRouter), type(uint).max);

        joePair.safeApprove(address(joePairVault), type(uint).max);
        joePair.safeApprove(address(joeRouter), type(uint).max);
        pngPair.safeApprove(address(pngPairVault), type(uint).max);
        pngPair.safeApprove(address(pngRouter), type(uint).max);
        lydPair.safeApprove(address(lydPairVault), type(uint).max);
        lydPair.safeApprove(address(lydRouter), type(uint).max);
    }

    function invest(uint WAVAXAmt, uint[] calldata amountsOutMin) external onlyVault {
        WAVAX.safeTransferFrom(vault, address(this), WAVAXAmt);

        uint[] memory pools = getEachPoolInAVAX();
        // console.log("checkpoint2");
        uint pool = pools[0] + pools[1] + pools[2] + WAVAXAmt;
        uint joePairTargetPool = pool * composition[0] / 10000;
        uint pngPairTargetPool = pool * composition[1] / 10000;
        uint lydPairTargetPool = pool * composition[2] / 10000;

        // Rebalancing invest
        if (
            joePairTargetPool > pools[0] &&
            pngPairTargetPool > pools[1] &&
            lydPairTargetPool > pools[2]
        ) {
            // console.log("checkpoint3");
            investJoePair(joePairTargetPool - pools[0], amountsOutMin);
            // console.log("checkpoint4");
            investPngPair(pngPairTargetPool - pools[1], amountsOutMin);
            // console.log("checkpoint5");
            investLydPair(lydPairTargetPool - pools[2], amountsOutMin);
            // console.log("checkpoint6");
        } else {
            uint furthest;
            uint farmIndex;
            uint diff;

            if (joePairTargetPool > pools[0]) {
                diff = joePairTargetPool - pools[0];
                furthest = diff;
                farmIndex = 0;
            }
            if (pngPairTargetPool > pools[1]) {
                diff = pngPairTargetPool - pools[1];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 1;
                }
            }
            if (lydPairTargetPool > pools[2]) {
                diff = lydPairTargetPool - pools[2];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 2;
                }
            }

            if (farmIndex == 0) investJoePair(WAVAXAmt, amountsOutMin);
            else if (farmIndex == 1) investPngPair(WAVAXAmt, amountsOutMin);
            else investLydPair(WAVAXAmt, amountsOutMin);
        }

        emit TargetComposition(joePairTargetPool, pngPairTargetPool, lydPairTargetPool);
        emit CurrentComposition(pools[0], pools[1], pools[2]);
    }

    function investJoePair(uint WAVAXAmt, uint[] calldata amountOutMin) private {
        uint halfWAVAXAmt = WAVAXAmt / 2;

        uint joeToken0Amt;
        uint joeToken1Amt;
        if (joeToken0 == WAVAX) {
            joeToken1Amt = swap(address(WAVAX), address(joeToken1), halfWAVAXAmt, amountOutMin[3]);
            joeToken0Amt = halfWAVAXAmt;
        } else if (joeToken1 == WAVAX) {
            joeToken0Amt = swap(address(WAVAX), address(joeToken0), halfWAVAXAmt, amountOutMin[3]);
            joeToken1Amt = halfWAVAXAmt;
        } else {
            joeToken0Amt = swap(address(WAVAX), address(joeToken0), halfWAVAXAmt, amountOutMin[3]);
            joeToken1Amt = swap(address(WAVAX), address(joeToken1), halfWAVAXAmt, amountOutMin[4]);
        }

        if (joeToken0.allowance(address(this), address(joeRouter)) == 0) joeToken0.safeApprove(address(joeRouter), type(uint).max);
        if (joeToken1.allowance(address(this), address(joeRouter)) == 0) joeToken1.safeApprove(address(joeRouter), type(uint).max);

        (,,uint joePairAmt) = joeRouter.addLiquidity(
            address(joeToken0), address(joeToken1), joeToken0Amt, joeToken1Amt, 0, 0, address(this), block.timestamp
        );

        joePairVault.deposit(joePairAmt);

        emit InvestJoePair(WAVAXAmt, joePairAmt);
    }

    function investPngPair(uint WAVAXAmt, uint[] calldata amountOutMin) private {
        uint halfWAVAXAmt = WAVAXAmt / 2;
        // console.log(halfWAVAXAmt); // 76.361248844151419773

        uint pngToken0Amt;
        uint pngToken1Amt;
        if (pngToken0 == WAVAX) {
            pngToken1Amt = swap(address(WAVAX), address(pngToken1), halfWAVAXAmt, amountOutMin[5]);
            pngToken0Amt = halfWAVAXAmt;
        } else if (pngToken1 == WAVAX) {
            pngToken0Amt = swap(address(WAVAX), address(pngToken0), halfWAVAXAmt, amountOutMin[5]);
            pngToken1Amt = halfWAVAXAmt;
        } else {
            pngToken0Amt = swap(address(WAVAX), address(pngToken0), halfWAVAXAmt, amountOutMin[5]);
            pngToken1Amt = swap(address(WAVAX), address(pngToken1), halfWAVAXAmt, amountOutMin[6]);
        }
        // console.log(pngToken1Amt); // 0.675877528

        if (pngToken0.allowance(address(this), address(pngRouter)) == 0) pngToken0.safeApprove(address(pngRouter), type(uint).max);
        if (pngToken1.allowance(address(this), address(pngRouter)) == 0) pngToken1.safeApprove(address(pngRouter), type(uint).max);
        // For withdrawal
        if (pngToken0.allowance(address(this), address(joeRouter)) == 0) pngToken0.safeApprove(address(joeRouter), type(uint).max);
        if (pngToken1.allowance(address(this), address(joeRouter)) == 0) pngToken1.safeApprove(address(joeRouter), type(uint).max);

        (,,uint pngPairAmt) = pngRouter.addLiquidity(
            address(pngToken0), address(pngToken1), pngToken0Amt, pngToken1Amt, 0, 0, address(this), block.timestamp
        );

        pngPairVault.deposit(pngPairAmt);

        emit InvestPngPair(WAVAXAmt, pngPairAmt);
    }

    function investLydPair(uint WAVAXAmt, uint[] calldata amountOutMin) private {
        uint halfWAVAXAmt = WAVAXAmt / 2;

        uint lydToken0Amt;
        uint lydToken1Amt;
        if (lydToken0 == WAVAX) {
            lydToken1Amt = swap(address(WAVAX), address(lydToken1), halfWAVAXAmt, amountOutMin[7]);
            lydToken0Amt = halfWAVAXAmt;
        } else if (lydToken1 == WAVAX) {
            lydToken0Amt = swap(address(WAVAX), address(lydToken0), halfWAVAXAmt, amountOutMin[7]);
            lydToken1Amt = halfWAVAXAmt;
        } else {
            lydToken0Amt = swap(address(WAVAX), address(lydToken0), halfWAVAXAmt, amountOutMin[7]);
            lydToken1Amt = swap(address(WAVAX), address(lydToken1), halfWAVAXAmt, amountOutMin[8]);
        }

        if (lydToken0.allowance(address(this), address(lydRouter)) == 0) lydToken0.safeApprove(address(lydRouter), type(uint).max);
        if (lydToken1.allowance(address(this), address(lydRouter)) == 0) lydToken1.safeApprove(address(lydRouter), type(uint).max);
        // For withdrawal
        if (lydToken0.allowance(address(this), address(joeRouter)) == 0) lydToken0.safeApprove(address(joeRouter), type(uint).max);
        if (lydToken1.allowance(address(this), address(joeRouter)) == 0) lydToken1.safeApprove(address(joeRouter), type(uint).max);

        (,,uint lydPairAmt) = lydRouter.addLiquidity(
            address(lydToken0), address(lydToken1), lydToken0Amt, lydToken1Amt, 0, 0, address(this), block.timestamp
        );

        // console.log(address(lydPairVault));
        // console.log("checkpoint5.1");
        lydPairVault.deposit(lydPairAmt);
        // console.log("checkpoint5.2");

        emit InvestLydPair(WAVAXAmt, lydPairAmt);
    }

    /// @param amount Amount to withdraw in USD
    function withdraw(uint amount, uint[] calldata amountsOutMin) external onlyVault returns (uint WAVAXAmt) {
        uint sharePerc = amount * 1e18 / getAllPoolInUSD();

        uint WAVAXAmtBefore = WAVAX.balanceOf(address(this));
        withdrawJoePair(sharePerc, amountsOutMin);
        withdrawPngPair(sharePerc, amountsOutMin);
        withdrawLydPair(sharePerc, amountsOutMin);
        WAVAXAmt = WAVAX.balanceOf(address(this)) - WAVAXAmtBefore;

        WAVAX.safeTransfer(vault, WAVAXAmt);

        emit Withdraw(amount, WAVAXAmt);
    }

    function withdrawJoePair(uint sharePerc, uint[] calldata amountOutMin) private {
        uint joePairAmt = joePairVault.withdraw(joePairVault.balanceOf(address(this)) * sharePerc / 1e18);

        (uint joeToken0Amt, uint joeToken1Amt) = joeRouter.removeLiquidity(
            address(joeToken0), address(joeToken1), joePairAmt, 0, 0, address(this), block.timestamp
        );

        uint WAVAXAmt;
        if (joeToken0 == WAVAX) {
            WAVAXAmt = joeToken0Amt;
            WAVAXAmt += swap(address(joeToken1), address(WAVAX), joeToken1Amt, amountOutMin[1]);
        } else if (joeToken1 == WAVAX) {
            WAVAXAmt = joeToken1Amt;
            WAVAXAmt += swap(address(joeToken0), address(WAVAX), joeToken0Amt, amountOutMin[1]);
        } else {
            WAVAXAmt = swap(address(joeToken0), address(WAVAX), joeToken0Amt, amountOutMin[1]);
            WAVAXAmt += swap(address(joeToken1), address(WAVAX), joeToken1Amt, amountOutMin[2]);
        }

        emit WithdrawJoePair(joePairAmt, WAVAXAmt);
    }

    function withdrawPngPair(uint sharePerc, uint[] calldata amountOutMin) private {
        uint pngPairAmt = pngPairVault.withdraw(pngPairVault.balanceOf(address(this)) * sharePerc / 1e18);

        (uint pngToken0Amt, uint pngToken1Amt) = pngRouter.removeLiquidity(
            address(pngToken0), address(pngToken1), pngPairAmt, 0, 0, address(this), block.timestamp
        );

        uint WAVAXAmt;
        if (pngToken0 == WAVAX) {
            WAVAXAmt = pngToken0Amt;
            WAVAXAmt += swap(address(pngToken1), address(WAVAX), pngToken1Amt, amountOutMin[3]);
        } else if (pngToken1 == WAVAX) {
            WAVAXAmt = pngToken1Amt;
            WAVAXAmt += swap(address(pngToken0), address(WAVAX), pngToken0Amt, amountOutMin[3]);
        } else {
            WAVAXAmt = swap(address(pngToken0), address(WAVAX), pngToken0Amt, amountOutMin[3]);
            WAVAXAmt += swap(address(pngToken1), address(WAVAX), pngToken1Amt, amountOutMin[4]);
        }

        emit WithdrawPngPair(pngPairAmt, WAVAXAmt);
    }

    function withdrawLydPair(uint sharePerc, uint[] calldata amountOutMin) private {
        uint lydPairAmt = lydPairVault.withdraw(lydPairVault.balanceOf(address(this)) * sharePerc / 1e18);

        (uint lydToken0Amt, uint lydToken1Amt) = lydRouter.removeLiquidity(
            address(lydToken0), address(lydToken1), lydPairAmt, 0, 0, address(this), block.timestamp
        );

        uint WAVAXAmt;
        if (lydToken0 == WAVAX) {
            WAVAXAmt = lydToken0Amt;
            WAVAXAmt += swap(address(lydToken1), address(WAVAX), lydToken1Amt, amountOutMin[5]);
        } else if (lydToken1 == WAVAX) {
            WAVAXAmt = lydToken1Amt;
            WAVAXAmt += swap(address(lydToken0), address(WAVAX), lydToken0Amt, amountOutMin[5]);
        } else {
            WAVAXAmt = swap(address(lydToken0), address(WAVAX), lydToken0Amt, amountOutMin[5]);
            WAVAXAmt += swap(address(lydToken1), address(WAVAX), lydToken1Amt, amountOutMin[6]);
        }

        emit WithdrawLydPair(lydPairAmt, WAVAXAmt);
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

    /// @param amount Amount to reimburse to vault contract in AVAX
    function reimburse(uint farmIndex, uint amount, uint[] calldata amountOutMin) external onlyVault returns (uint WAVAXAmt) {
        if (farmIndex == 0) withdrawJoePair(amount * 1e18 / getJoePairPoolInAVAX(), amountOutMin);
        else if (farmIndex == 1) withdrawPngPair(amount * 1e18 / getPngPairPoolInAVAX(), amountOutMin);
        else if (farmIndex == 2) withdrawLydPair(amount * 1e18 / getLydPairPoolInAVAX(), amountOutMin);

        WAVAXAmt = WAVAX.balanceOf(address(this));
        WAVAX.safeTransfer(vault, WAVAXAmt);

        emit Reimburse(WAVAXAmt);
    }

    function swap(address from, address to, uint amount, uint amountOutMin) private returns (uint amountOut) {
        IRouter _router;
        if (to == address(PNG)) _router = pngRouter;
        else if (to == address(LYD)) _router = lydRouter;
        else _router = joeRouter;
        
        return _router.swapExactTokensForTokens(
            amount, amountOutMin, getPath(from, to), address(this), block.timestamp
        )[1];
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

    function getJoePairPoolInAVAX() private view returns (uint) {
        uint joePairVaultPoolInAVAX = joePairVault.getAllPoolInAVAX();

        if (joePairVaultPoolInAVAX == 0) return 0;
        return joePairVaultPoolInAVAX * joePairVault.balanceOf(address(this)) / joePairVault.totalSupply();
    }

    function getPngPairPoolInAVAX() private view returns (uint) {
        uint pngPairVaultPoolInAVAX = pngPairVault.getAllPoolInAVAX();

        if (pngPairVaultPoolInAVAX == 0) return 0;
        return pngPairVaultPoolInAVAX * pngPairVault.balanceOf(address(this)) / pngPairVault.totalSupply();
    }

    function getLydPairPoolInAVAX() private view returns (uint) {
        uint lydPairVaultPoolInAVAX = lydPairVault.getAllPoolInAVAX();

        if (lydPairVaultPoolInAVAX == 0) return 0;
        return lydPairVaultPoolInAVAX * lydPairVault.balanceOf(address(this)) / lydPairVault.totalSupply();
    }

    function getEachPoolInAVAX() private view returns (uint[] memory pools) {
        pools = new uint[](3);
        pools[0] = getJoePairPoolInAVAX();
        pools[1] = getPngPairPoolInAVAX();
        pools[2] = getLydPairPoolInAVAX();
    }

    /// @notice This function return only farms TVL in AVAX
    function getAllPoolInAVAX() public view returns (uint) {
        uint[] memory pools = getEachPoolInAVAX();
        // console.log(pools[0]);
        // console.log(pools[1]);
        // console.log(pools[2]);

        return pools[0] + pools[1] + pools[2];
    }

    function getAllPoolInUSD() public view returns (uint) {
        uint AVAXPriceInUSD = uint(IChainlink(0x0A77230d17318075983913bC2145DB16C7366156).latestAnswer()); // 8 decimals
        require(AVAXPriceInUSD > 0, "ChainLink error");

        return getAllPoolInAVAX() * AVAXPriceInUSD / 1e8;
    }

    function getCurrentCompositionPerc() external view returns (uint[] memory percentages) {
        uint[] memory pools = getEachPoolInAVAX();
        uint allPool = pools[0] + pools[1] + pools[2];

        percentages = new uint[](3);
        percentages[0] = pools[0] * 10000 / allPool;
        percentages[1] = pools[1] * 10000 / allPool;
        percentages[2] = pools[2] * 10000 / allPool;
    }
}