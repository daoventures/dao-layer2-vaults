// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
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

    function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts);
}


interface IDaoL1Vault is IERC20Upgradeable {
    function deposit(uint amount) external;
    function withdraw(uint share) external;
    function getAllPoolInUSD() external view returns (uint);
    function getAllPoolInBNB() external view returns (uint);
    function depositFee() external view returns (uint);
    function isWhitelisted(address) external view returns (bool);
}

interface IChainlink {
    function latestAnswer() external view returns (int256);
}

contract DaoSafuStrategy is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20Upgradeable public constant CAKE  = IERC20Upgradeable(0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82);
    IERC20Upgradeable public constant WBNB = IERC20Upgradeable(0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c);
    IERC20Upgradeable public constant WETH = IERC20Upgradeable(0x2170Ed0880ac9A755fd29B2688956BD959F933F8);
    IERC20Upgradeable public constant BUSD = IERC20Upgradeable(0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56);
    IERC20Upgradeable public constant BTCB = IERC20Upgradeable(0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c);

    IERC20Upgradeable public constant BTCBWETH = IERC20Upgradeable(0xD171B26E4484402de70e3Ea256bE5A2630d7e88D);
    IERC20Upgradeable public constant BTCBBNB = IERC20Upgradeable(0x61EB789d75A95CAa3fF50ed7E47b96c132fEc082);
    IERC20Upgradeable public constant CAKEBNB = IERC20Upgradeable(0x0eD7e52944161450477ee417DE9Cd3a859b14fD0);
    IERC20Upgradeable public constant BTCBBUSD = IERC20Upgradeable(0xF45cd219aEF8618A92BAa7aD848364a158a24F33);

    IRouter public constant PnckRouter = IRouter(0x10ED43C718714eb63d5aA57B78B54704E256024E);

    IDaoL1Vault public BTCBWETHVault;
    IDaoL1Vault public BTCBBNBVault;
    IDaoL1Vault public CAKEBNBVault;
    IDaoL1Vault public BTCBBUSDVault;
    

    uint constant BTCBETHTargetPerc = 5000;
    uint constant BTCBBNBTargetPerc = 2000;
    uint constant CAKEBNBTargetPerc = 2000;
    uint constant BTCBBUSDTargetPerc = 1000;

    address public vault;
    uint public watermark; // In USD (18 decimals)
    uint public profitFeePerc;

    event TargetComposition (uint BTCBETHTargetPool, uint BTCBBNBTargetPool, uint CAKEBNBPool, uint BTCBBUSDTargetPool);
    event CurrentComposition (uint BTCBETHTargetPool, uint BTCBBNBTargetPool, uint CAKEBNBCurrentPool, uint BTCBBUSDCurrentPool);
    event InvestBTCBETH(uint BNBAmt, uint BTCBWETHAmt);
    event InvestBTCBBNB(uint BNBAmt, uint BTCBBNBAmt);
    event InvestCAKEBNB(uint BNBAmt, uint CAKEBNBAmt);
    event InvestBTCBBUSD(uint BNBAmt, uint BTCBBUSDAmt);
    event Withdraw(uint amount, uint BNBAmt);
    event WithdrawBTCBETH(uint lpTokenAmt, uint BNBAmt);
    event WithdrawBTCBBNB(uint lpTokenAmt, uint BNBAmt);
    event WithdrawCAKEBNB(uint lpTokenAmt, uint BNBAmt);
    event WithdrawBTCBBUSD(uint lpTokenAmt, uint BNBAmt);
    event CollectProfitAndUpdateWatermark(uint currentWatermark, uint lastWatermark, uint fee);
    event AdjustWatermark(uint currentWatermark, uint lastWatermark);
    event Reimburse(uint BNBAmt);
    event EmergencyWithdraw(uint BNBAmt);

    modifier onlyVault {
        require(msg.sender == vault, "Only vault");
        _;
    }

    function initialize(IDaoL1Vault _BTCBWETHVault, IDaoL1Vault _BTCBBNBVault, IDaoL1Vault _CAKEBNBVault, 
        IDaoL1Vault _BTCBBUSDVault) external initializer {
        __Ownable_init();

        BTCBWETHVault = _BTCBWETHVault;
        BTCBBNBVault = _BTCBBNBVault;
        CAKEBNBVault = _CAKEBNBVault;
        BTCBBUSDVault = _BTCBBUSDVault;

        profitFeePerc = 2000;

        CAKE.safeApprove(address(PnckRouter), type(uint).max);
        WBNB.safeApprove(address(PnckRouter), type(uint).max);
        WETH.safeApprove(address(PnckRouter), type(uint).max);
        BUSD.safeApprove(address(PnckRouter), type(uint).max);
        BTCB.safeApprove(address(PnckRouter), type(uint).max);

        BTCBWETH.safeApprove(address(BTCBWETHVault), type(uint).max);
        BTCBBNB.safeApprove(address(BTCBBNBVault), type(uint).max);
        CAKEBNB.safeApprove(address(CAKEBNBVault), type(uint).max);
        BTCBBUSD.safeApprove(address(BTCBBUSDVault), type(uint).max);

        BTCBWETH.safeApprove(address(PnckRouter), type(uint).max);
        BTCBBNB.safeApprove(address(PnckRouter), type(uint).max);
        CAKEBNB.safeApprove(address(PnckRouter), type(uint).max);
        BTCBBUSD.safeApprove(address(PnckRouter), type(uint).max);

    }

    function invest(uint WBNBAmt, uint[] calldata minAmounts) external onlyVault {
        WBNB.safeTransferFrom(vault, address(this), WBNBAmt);
        WBNBAmt = WBNB.balanceOf(address(this));
        
        uint[] memory pools = getEachPool();
        uint pool = pools[0] + pools[1] + pools[2] + pools[3] + WBNBAmt;
        uint BTCBETHTargetPool = pool * 5000 / 10000; // 50%
        uint BTCBBNBTargetPool = pool * 2000 / 10000; // 20%
        uint CAKEBNBTargetPool = BTCBBNBTargetPool; // 20%
        uint BTCBBUSDTargetPool = pool * 1000 / 10000; // 10%

        // Rebalancing invest
        if (
            BTCBETHTargetPool > pools[0] &&
            BTCBBNBTargetPool > pools[1] &&
            CAKEBNBTargetPool > pools[2] &&
            BTCBBUSDTargetPool > pools[3]
        ) {
            _investBTCBETH(BTCBETHTargetPool - pools[0], minAmounts[3], minAmounts[4]);
            _investBTCBBNB((BTCBBNBTargetPool - pools[1]), minAmounts[5]);
            _investCAKEBNB((CAKEBNBTargetPool - pools[2]), minAmounts[6]);
            _investBTCBBUSD((BTCBBUSDTargetPool - pools[3]), minAmounts[7], minAmounts[8]);
        } else {
            uint furthest;
            uint farmIndex;
            uint diff;

            if (BTCBETHTargetPool > pools[0]) {
                diff = BTCBETHTargetPool - pools[0];
                furthest = diff;
                farmIndex = 0;
            }
            if (BTCBBNBTargetPool > pools[1]) {
                diff = BTCBBNBTargetPool - pools[1];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 1;
                }
            }
            if (CAKEBNBTargetPool > pools[2]) {
                diff = CAKEBNBTargetPool - pools[2];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 2;
                }
            }
            if (BTCBBUSDTargetPool > pools[3]) {
                diff = BTCBBUSDTargetPool - pools[3];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 3;
                }
            }

            if (farmIndex == 0) _investBTCBETH(WBNBAmt, minAmounts[3], minAmounts[4]);
            else if (farmIndex == 1) _investBTCBBNB(WBNBAmt, minAmounts[5]);
            else if (farmIndex == 2) _investCAKEBNB(WBNBAmt, minAmounts[6]);
            else _investBTCBBUSD(WBNBAmt, minAmounts[7], minAmounts[8]);
        }

        emit TargetComposition(BTCBETHTargetPool, BTCBBNBTargetPool, CAKEBNBTargetPool, BTCBBUSDTargetPool);
        emit CurrentComposition(pools[0], pools[1], pools[2], pools[3]);
    }


    function _investBTCBETH(uint _wbnbAmt, uint BTCBMin, uint WETHMin) private {
        uint _amt = _wbnbAmt/2;

        _swap(address(WBNB), address(WETH), _amt, WETHMin);
        _swap(address(WBNB), address(BTCB), _amt, BTCBMin);

        uint _wethAmt = WETH.balanceOf(address(this));
        uint _BTCBAmt = BTCB.balanceOf(address(this));
        
        uint lpTokens = _addLiquidity(address(WETH), address(BTCB), _wethAmt, _BTCBAmt);

        BTCBWETHVault.deposit(lpTokens);

        emit InvestBTCBETH(_wbnbAmt, lpTokens);
    }

    function _investBTCBBNB(uint _wbnbAmt, uint BTCBMin) private {
        uint _amt = _wbnbAmt / 2 ;
        _swap(address(WBNB), address(BTCB), _amt, BTCBMin);

        uint _BTCBAmt = BTCB.balanceOf(address(this));
        uint lpTokens = _addLiquidity(address(WBNB), address(BTCB), _amt, _BTCBAmt);

        BTCBBNBVault.deposit(lpTokens);

        emit InvestBTCBBNB(_wbnbAmt, lpTokens);
    }

    function _investCAKEBNB(uint _wbnbAmt, uint cakeMin) private {
        uint _amt = _wbnbAmt / 2 ;
        _swap(address(WBNB), address(CAKE), _amt, cakeMin);

        uint _CAKEAmt = CAKE.balanceOf(address(this));
        uint lpTokens = _addLiquidity(address(WBNB), address(CAKE), _amt, _CAKEAmt);

        CAKEBNBVault.deposit(lpTokens);

        emit InvestCAKEBNB(_wbnbAmt, lpTokens);
    }

    function _investBTCBBUSD(uint _wbnbAmt, uint BTCBMin, uint BUSDMin) private {
        uint _amt = _wbnbAmt / 2 ;

        _swap(address(WBNB), address(BTCB), _amt, BTCBMin);
        _swap(address(WBNB), address(BUSD), _amt, BUSDMin);

        uint _BTCBAmt = BTCB.balanceOf(address(this));
        uint _BUSDAmt = BUSD.balanceOf(address(this));

        uint lpTokens = _addLiquidity(address(BTCB), address(BUSD), _BTCBAmt, _BUSDAmt);

        BTCBBUSDVault.deposit(lpTokens);

        emit InvestBTCBBUSD(_wbnbAmt, lpTokens);
    }

    function withdraw(uint amount, uint[] calldata amountOutMin) external onlyVault returns (uint WBNBAmt) {
        uint sharePerc = amount * 1e18 / getAllPoolInUSD();
        
        uint WBNBAmtBefore = WBNB.balanceOf(address(this));
        _withdrawBTCBETH(sharePerc, amountOutMin[1], amountOutMin[2]); //(, btcPriceInBNB, ETHPriceInBNB)
        _withdrawBTCBBNB(sharePerc, amountOutMin[3]); //(, btcPriceInBNB)
        _withdrawCAKEBNB(sharePerc, amountOutMin[4]); //(, cakePriceInBNB)
        _withdrawBTCBBUSD(sharePerc, amountOutMin[5], amountOutMin[6]); //(,btcPriceInBNB, busdPriceInBNB)
        WBNBAmt = WBNB.balanceOf(address(this)) - WBNBAmtBefore;
        WBNB.safeTransfer(vault, WBNBAmt);

        emit Withdraw(amount, WBNBAmt);
    }

    
    function _withdrawBTCBETH(uint _sharePerc, uint minBNB_btcb, uint minBNB_eth) private {
        BTCBWETHVault.withdraw(BTCBWETHVault.balanceOf(address(this)) * _sharePerc / 1e18 );
    
        uint _amt = BTCBWETH.balanceOf(address(this));

        (uint _amtBTCB, uint _amtWETH) = _removeLiquidity(address(BTCB), address(WETH), _amt);

        uint _wBNBAmt = _swap(address(BTCB), address(WBNB), _amtBTCB, minBNB_btcb);

        _wBNBAmt += _swap(address(WETH), address(WBNB), _amtWETH, minBNB_eth);

        emit WithdrawBTCBETH(_amt, _wBNBAmt);
    }


    function _withdrawBTCBBNB(uint _sharePerc, uint minBNB_btc) private {
        BTCBBNBVault.withdraw(BTCBBNBVault.balanceOf(address(this)) * _sharePerc / 1e18 );
        uint _amt = BTCBBNB.balanceOf(address(this));

        (uint _amtBTCB, uint _amtBNB) = _removeLiquidity(address(BTCB), address(WBNB), _amt);

        _amtBNB += _swap(address(BTCB), address(WBNB), _amtBTCB, minBNB_btc);

        emit WithdrawBTCBBNB(_amt, _amtBNB);
    }

    function _withdrawCAKEBNB(uint _sharePerc, uint minBNB_cake) private {
        CAKEBNBVault.withdraw(CAKEBNBVault.balanceOf(address(this)) * _sharePerc / 1e18 );
        uint _amt = CAKEBNB.balanceOf(address(this));
        (uint _amtCake, uint _amtBNB) = _removeLiquidity(address(CAKE), address(WBNB), _amt);

        _amtBNB += _swap(address(CAKE), address(WBNB), _amtCake, minBNB_cake);

        emit WithdrawCAKEBNB(_amt, _amtBNB);
    }

    // function _withdrawBTCBBUSD(uint _amount, uint _allPool) private {
    function _withdrawBTCBBUSD(uint _sharePerc, uint minBNB_btcb, uint minBNB_busd) private {
        BTCBBUSDVault.withdraw(BTCBBUSDVault.balanceOf(address(this)) * _sharePerc / 1e18);
        uint _amt = BTCBBUSD.balanceOf(address(this));

        (uint _amtBTCB, uint _amtBUSD) = _removeLiquidity(address(BTCB), address(BUSD), _amt);

        uint _wBNBAmt = _swap(address(BTCB), address(WBNB), _amtBTCB, minBNB_btcb);

        _wBNBAmt += _swap(address(BUSD), address(WBNB), _amtBUSD, minBNB_busd);

        emit WithdrawBTCBBUSD(_amt, _wBNBAmt);
    }

    function collectProfitAndUpdateWatermark() external onlyVault returns (uint fee) {
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

    function _swap(address _tokenA, address _tokenB, uint _amt, uint _minAmount) private returns (uint) {
        address[] memory path = new address[](2);

        path[0] = _tokenA;
        path[1] = _tokenB;


        return (PnckRouter.swapExactTokensForTokens(_amt , _minAmount, path, address(this), block.timestamp))[1];
    }

    function _addLiquidity(address _tokenA, address _tokenB, uint _amtA, uint _amtB) private returns (uint liquidity) {
        (,,liquidity) = PnckRouter.addLiquidity(_tokenA, _tokenB, _amtA, _amtB, 0, 0, address(this), block.timestamp);
    }

    function _removeLiquidity(address _tokenA, address _tokenB, uint _amt) private returns (uint _amtA, uint _amtB) {
        (_amtA, _amtB) = PnckRouter.removeLiquidity(_tokenA, _tokenB, _amt, 0, 0, address(this), block.timestamp);
    }

    /// @param amount Amount to reimburse to vault contract in ETH
    function reimburse(uint farmIndex, uint amount, uint[] memory minAmounts) external onlyVault returns (uint WBNBAmt) {
        if (farmIndex == 0) _withdrawBTCBETH(amount * 1e18 / getBTCBETHPool(), minAmounts[3], minAmounts[4]); 
        else if (farmIndex == 1) _withdrawBTCBBNB(amount * 1e18 / getBTCBBNBPool(), minAmounts[5]);
        else if (farmIndex == 2) _withdrawCAKEBNB(amount * 1e18 / getCAKEBNBPool(), minAmounts[6]);
        else if (farmIndex == 3) _withdrawBTCBBUSD(amount * 1e18 / getBTCBBUSDPool(), minAmounts[7], minAmounts[8]);
        WBNBAmt = WBNB.balanceOf(address(this));
        WBNB.safeTransfer(vault, WBNBAmt);
        emit Reimburse(WBNBAmt);
    }

    function setVault(address _vault) external onlyOwner {
        require(vault == address(0), "Vault set");
        vault = _vault;
    }

    function setProfitFeePerc(uint _profitFeePerc) external onlyVault {
        profitFeePerc = _profitFeePerc;
    }

    function emergencyWithdraw() external onlyVault {
        // 1e18 == 100% of share
        _withdrawBTCBETH(1e18, 0, 0); 
        _withdrawBTCBBNB(1e18, 0);
        _withdrawCAKEBNB(1e18, 0);
        _withdrawBTCBBUSD(1e18, 0, 0);
        uint WBNBAmt = WBNB.balanceOf(address(this));
        WBNB.safeTransfer(vault, WBNBAmt);
        watermark = 0;
        emit EmergencyWithdraw(WBNBAmt);
    }

    function getBTCBETHPool() private view  returns (uint) {
        uint amt = BTCBWETHVault.getAllPoolInBNB();
        return amt == 0 ? 0 : amt * BTCBWETHVault.balanceOf(address(this)) / BTCBWETHVault.totalSupply(); //to exclude L1 deposits from other addresses
    }

    function getBTCBBNBPool() private view returns (uint) {
        uint amt = BTCBBNBVault.getAllPoolInBNB();
        return amt == 0 ? 0 : amt * BTCBBNBVault.balanceOf(address(this)) / BTCBBNBVault.totalSupply();
    }

    function getCAKEBNBPool() private view returns (uint) {
        uint amt = CAKEBNBVault.getAllPoolInBNB();
        return amt == 0 ? 0 : amt * CAKEBNBVault.balanceOf(address(this)) / CAKEBNBVault.totalSupply();
    }

    function getBTCBBUSDPool() private view returns (uint) {
        uint amt = BTCBBUSDVault.getAllPoolInBNB();
        return amt == 0 ? 0 : amt * BTCBBUSDVault.balanceOf(address(this)) / BTCBBUSDVault.totalSupply();
    }

    function getEachPool() private view returns (uint[] memory pools) {
        pools = new uint[](4);
        pools[0] = getBTCBETHPool();
        pools[1] = getBTCBBNBPool();
        pools[2] = getCAKEBNBPool();
        pools[3] = getBTCBBUSDPool();
    }

    function getAllPool() public view returns (uint) {
        uint[] memory pools = getEachPool();
        return pools[0] + pools[1] + pools[2] + pools[3];
    }

    function getAllPoolInUSD() public view returns (uint) {
        uint BNBPriceInUSD = uint(IChainlink(0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE).latestAnswer()); // 8 decimals
        require(BNBPriceInUSD > 0, "ChainLink error");
        return getAllPool() * BNBPriceInUSD / 1e8;
    }

    function getCurrentCompositionPerc() external view returns (uint[] memory percentages) {
        uint[] memory pools = getEachPool();
        uint allPool = pools[0] + pools[1] + pools[2] + pools[3];
        percentages = new uint[](4);
        percentages[0] = pools[0] * 10000 / allPool;
        percentages[1] = pools[1] * 10000 / allPool;
        percentages[2] = pools[2] * 10000 / allPool;
        percentages[3] = pools[3] * 10000 / allPool;
    }

    function postUpgrade() external {
        BTCBBNBVault = IDaoL1Vault(0xDB05ab97d695F6d881130aEed5B5C66186144bd8);
        BTCBBNB.safeApprove(address(BTCBBNBVault), type(uint).max);
    }

}
