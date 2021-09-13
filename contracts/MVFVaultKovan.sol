// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../libs/BaseRelayRecipient.sol";

interface IRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts);
}

interface IChainlink {
    function latestAnswer() external view returns (int256);
}

interface IStrategy {
    function invest(uint amount) external;
    function withdraw(uint sharePerc) external;
    function collectProfitAndUpdateWatermark() external returns (uint);
    function adjustWatermark(uint amount, bool signs) external; 
    function reimburse(uint farmIndex, uint sharePerc) external returns (uint);
    function emergencyWithdraw() external;
    function setProfitFeePerc(uint profitFeePerc) external;
    function watermark() external view returns (uint);
    function getAllPool(bool includeVestedILV) external view returns (uint);
}

contract MVFVaultKovan is Initializable, ERC20Upgradeable, OwnableUpgradeable, 
        ReentrancyGuardUpgradeable, PausableUpgradeable, BaseRelayRecipient {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20Upgradeable constant USDT = IERC20Upgradeable(0x07de306FF27a2B630B1141956844eB1552B956B5);
    IERC20Upgradeable constant USDC = IERC20Upgradeable(0xb7a4F3E9097C08dA09517b5aB877F7a917224ede);
    IERC20Upgradeable constant DAI = IERC20Upgradeable(0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa);
    IERC20Upgradeable constant WETH = IERC20Upgradeable(0xd0A1E359811322d97991E03f863a0C30C2cF029C);

    IRouter constant sushiRouter = IRouter(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F);
    IStrategy public strategy;
    uint[] public percKeepInVault;
    uint public fees;

    uint[] public networkFeeTier2;
    uint public customNetworkFeeTier;
    uint[] public networkFeePerc;
    uint public customNetworkFeePerc;

    // Temporarily variable for LP token distribution only
    address[] addresses;
    mapping(address => uint) public depositAmt; // Amount in USD (18 decimals)
    uint totalDepositAmt;

    address public treasuryWallet;
    address public communityWallet;
    address public strategist;
    address public admin;

    event Deposit(address caller, uint depositAmt);
    event Withdraw(address caller, uint withdrawAmt, address tokenWithdraw, uint sharesBurn);
    event Invest(uint amount);
    event DistributeLPToken(address receiver, uint shareMint);
    event TransferredOutFees(uint fees);
    event Reimburse(uint farmIndex, address token, uint amount);
    event Reinvest(uint amount);
    event SetNetworkFeeTier2(uint[] oldNetworkFeeTier2, uint[] newNetworkFeeTier2);
    event SetCustomNetworkFeeTier(uint oldCustomNetworkFeeTier, uint newCustomNetworkFeeTier);
    event SetNetworkFeePerc(uint[] oldNetworkFeePerc, uint[] newNetworkFeePerc);
    event SetCustomNetworkFeePerc(uint oldCustomNetworkFeePerc, uint newCustomNetworkFeePerc);
    event SetProfitFeePerc(uint profitFeePerc);

    modifier onlyOwnerOrAdmin {
        require(msg.sender == owner() || msg.sender == address(admin), "Only owner or admin");
        _;
    }

    function initialize(
        string calldata name, string calldata ticker,
        address _treasuryWallet, address _communityWallet, address _admin, address _strategist,
        address _biconomy, address _strategy
    ) external initializer {
        __ERC20_init(name, ticker);
        __Ownable_init();

        strategy = IStrategy(_strategy);

        treasuryWallet = _treasuryWallet;
        communityWallet = _communityWallet;
        admin = _admin;
        strategist = _strategist;
        trustedForwarder = _biconomy;

        networkFeeTier2 = [50000*1e18+1, 100000*1e18];
        customNetworkFeeTier = 1000000*1e18;
        networkFeePerc = [100, 75, 50];
        customNetworkFeePerc = 25;

        percKeepInVault = [200, 200, 200]; // USDT, USDC, DAI

        USDT.safeApprove(address(sushiRouter), type(uint).max);
        USDC.safeApprove(address(sushiRouter), type(uint).max);
        DAI.safeApprove(address(sushiRouter), type(uint).max);
        WETH.safeApprove(address(sushiRouter), type(uint).max);
        WETH.safeApprove(address(strategy), type(uint).max);
    }

    function deposit(uint amount, IERC20Upgradeable token) external nonReentrant whenNotPaused {
        require(msg.sender == tx.origin || isTrustedForwarder(msg.sender), "Only EOA or Biconomy");
        require(amount > 0, "Amount must > 0");

        address msgSender = _msgSender();
        token.safeTransferFrom(msgSender, address(this), amount);
        if (token == USDT || token == USDC) amount = amount * 1e12;
        uint amtDeposit = amount;

        uint _networkFeePerc;
        if (amount < networkFeeTier2[0]) _networkFeePerc = networkFeePerc[0]; // Tier 1
        else if (amount <= networkFeeTier2[1]) _networkFeePerc = networkFeePerc[1]; // Tier 2
        else if (amount < customNetworkFeeTier) _networkFeePerc = networkFeePerc[2]; // Tier 3
        else _networkFeePerc = customNetworkFeePerc; // Custom Tier
        uint fee = amount * _networkFeePerc / 10000;
        fees = fees + fee;
        amount = amount - fee;

        if (depositAmt[msgSender] == 0) {
            addresses.push(msgSender);
            depositAmt[msgSender] = amount;
        } else depositAmt[msgSender] = depositAmt[msgSender] + amount;
        totalDepositAmt = totalDepositAmt + amount;

        emit Deposit(msgSender, amtDeposit);
    }

    function withdraw(uint share, IERC20Upgradeable token) external nonReentrant {
        require(msg.sender == tx.origin, "Only EOA");
        require(share > 0, "Shares must > 0");
        require(share <= balanceOf(msg.sender), "Not enough share to withdraw");

        // uint _totalSupply = totalSupply();
        // uint withdrawAmt = getAllPoolInUSD(false) * share / _totalSupply;
        // _burn(msg.sender, share);
        // strategy.adjustWatermark(withdrawAmt, false);

        // uint tokenAmtInVault = token.balanceOf(address(this));
        // if (token == USDT || token == USDC) tokenAmtInVault = tokenAmtInVault * 1e12;
        // if (withdrawAmt <= tokenAmtInVault) {
        //     if (token == USDT || token == USDC) withdrawAmt = withdrawAmt / 1e12;
        //     token.safeTransfer(msg.sender, withdrawAmt);
        // } else {
        //     if (!paused()) {
        //         strategy.withdraw(withdrawAmt);
        //         withdrawAmt = (sushiRouter.swapExactTokensForTokens(
        //             WETH.balanceOf(address(this)), 0, getPath(address(WETH), address(token)), msg.sender, block.timestamp
        //         ))[1];
        //     } else {
        //         withdrawAmt = (sushiRouter.swapExactTokensForTokens(
        //             WETH.balanceOf(address(this)) * share / _totalSupply, 0, getPath(address(WETH), address(token)), msg.sender, block.timestamp
        //         ))[1];
        //     }
        // }

        uint withdrawAmt = share;
        token.safeTransfer(msg.sender, share);

        emit Withdraw(msg.sender, withdrawAmt, address(token), share);
    }

    function invest() public whenNotPaused {
        // require(
        //     msg.sender == admin ||
        //     msg.sender == owner() ||
        //     msg.sender == address(this), "Only authorized caller"
        // );

        // if (strategy.watermark() > 0) collectProfitAndUpdateWatermark();
        // (uint USDTAmt, uint USDCAmt, uint DAIAmt) = transferOutFees();

        // (uint WETHAmt, uint tokenAmtToInvest) = swapTokenToWETH(USDTAmt, USDCAmt, DAIAmt);
        // strategy.invest(WETHAmt);
        // strategy.adjustWatermark(tokenAmtToInvest, true);
        distributeLPToken();

        // emit Invest(WETHAmt);
    }

    function collectProfitAndUpdateWatermark() public whenNotPaused {
        require(
            msg.sender == address(this) ||
            msg.sender == admin ||
            msg.sender == owner(), "Only authorized caller"
        );
        uint fee = strategy.collectProfitAndUpdateWatermark();
        if (fee > 0) fees = fees + fee;
    }

    function distributeLPToken() private {
        uint pool = getAllPoolInUSD(true);
        // if (totalSupply() != 0) pool = getAllPoolInUSD(true) - totalDepositAmt;
        address[] memory _addresses = addresses;
        for (uint i; i < _addresses.length; i ++) {
            address depositAcc = _addresses[i];
            uint _depositAmt = depositAmt[depositAcc];
            uint _totalSupply = totalSupply();
            uint share = _totalSupply == 0 ? _depositAmt : _depositAmt * _totalSupply / pool;
            _mint(depositAcc, share);
            pool = pool + _depositAmt;
            depositAmt[depositAcc] = 0;
            emit DistributeLPToken(depositAcc, share);
        }
        delete addresses;
        totalDepositAmt = 0;
    }

    function transferOutFees() public returns (uint USDTAmt, uint USDCAmt, uint DAIAmt) {
        require(
            msg.sender == address(this) ||
            msg.sender == admin ||
            msg.sender == owner(), "Only authorized caller"
        );

        USDTAmt = USDT.balanceOf(address(this));
        USDCAmt = USDC.balanceOf(address(this));
        DAIAmt = DAI.balanceOf(address(this));

        uint _fees = fees;
        if (_fees != 0) {
            IERC20Upgradeable token;
            if (USDTAmt * 1e12 > _fees) {
                token = USDT;
                _fees = _fees / 1e12;
                USDTAmt = USDTAmt - _fees;
            } else if (USDCAmt * 1e12 > _fees) {
                token = USDC;
                _fees = _fees / 1e12;
                USDCAmt = USDCAmt - _fees;
            } else if (DAIAmt > _fees) {
                token = DAI;
                DAIAmt = DAIAmt - _fees;
            } else return (USDTAmt, USDCAmt, DAIAmt);

            uint _fee = _fees * 2 / 5; // 40%
            token.safeTransfer(treasuryWallet, _fee); // 40%
            token.safeTransfer(communityWallet, _fee); // 40%
            token.safeTransfer(strategist, _fees - _fee - _fee); // 20%

            fees = 0;
            emit TransferredOutFees(_fees); // Decimal follow _token
        }
    }

    function swapTokenToWETH(uint USDTAmt, uint USDCAmt, uint DAIAmt) private returns (uint WETHAmt, uint tokenAmtToInvest) {
        uint[] memory _percKeepInVault = percKeepInVault;
        uint pool = getAllPoolInUSD(false);

        uint USDTAmtKeepInVault = calcTokenKeepInVault(_percKeepInVault[0], pool) / 1e12;
        if (USDTAmt > USDTAmtKeepInVault + 1e6) {
            USDTAmt = USDTAmt - USDTAmtKeepInVault;
            WETHAmt = sushiSwap(address(USDT), address(WETH), USDTAmt);
            tokenAmtToInvest = USDTAmt * 1e12;
        }

        uint USDCAmtKeepInVault = calcTokenKeepInVault(_percKeepInVault[1], pool) / 1e12;
        if (USDCAmt > USDCAmtKeepInVault + 1e6) {
            USDCAmt = USDCAmt - USDCAmtKeepInVault;
            uint _WETHAmt = sushiSwap(address(USDC), address(WETH), USDCAmt);
            WETHAmt = WETHAmt + _WETHAmt;
            tokenAmtToInvest = tokenAmtToInvest + USDCAmt * 1e12;
        }

        uint DAIAmtKeepInVault = calcTokenKeepInVault(_percKeepInVault[2], pool);
        if (DAIAmt > DAIAmtKeepInVault + 1e18) {
            DAIAmt = DAIAmt - DAIAmtKeepInVault;
            uint _WETHAmt = sushiSwap(address(DAI), address(WETH), DAIAmt);
            WETHAmt = WETHAmt + _WETHAmt;
            tokenAmtToInvest = tokenAmtToInvest + DAIAmt;
        }
    }

    function calcTokenKeepInVault(uint _percKeepInVault, uint pool) private pure returns (uint) {
        return pool * _percKeepInVault / 10000;
    }

    /// @param amount Amount to reimburse (decimal follow token)
    function reimburse(uint farmIndex, address token, uint amount) external onlyOwnerOrAdmin {
        strategy.adjustWatermark(amount, false);
        uint WETHAmt;
        WETHAmt = (sushiRouter.getAmountsOut(amount, getPath(token, address(WETH))))[1];
        WETHAmt = strategy.reimburse(farmIndex, WETHAmt);
        sushiSwap(address(WETH), token, WETHAmt);
        emit Reimburse(farmIndex, token, amount);
    }

    function emergencyWithdraw() external onlyOwnerOrAdmin whenNotPaused {
        _pause();
        strategy.emergencyWithdraw();
    }

    function reinvest() external onlyOwnerOrAdmin whenPaused {
        _unpause();

        uint WETHAmt = WETH.balanceOf(address(this));
        strategy.invest(WETHAmt);
        uint ETHPriceInUSD = uint(IChainlink(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419).latestAnswer());
        strategy.adjustWatermark(WETHAmt * ETHPriceInUSD / 1e8, true);

        emit Reinvest(WETHAmt);
    }

    function sushiSwap(address from, address to, uint amount) private returns (uint) {
        return (sushiRouter.swapExactTokensForTokens(
            amount, 0, getPath(from, to), address(this), block.timestamp
        ))[1];
    }

    function setNetworkFeeTier2(uint[] calldata _networkFeeTier2) external onlyOwner {
        require(_networkFeeTier2[0] != 0, "Minimun amount cannot be 0");
        require(_networkFeeTier2[1] > _networkFeeTier2[0], "Maximun amount must greater than minimun amount");
        /**
         * Network fees have three tier, but it is sufficient to have minimun and maximun amount of tier 2
         * Tier 1: deposit amount < minimun amount of tier 2
         * Tier 2: minimun amount of tier 2 <= deposit amount <= maximun amount of tier 2
         * Tier 3: amount > maximun amount of tier 2
         */
        uint[] memory oldNetworkFeeTier2 = networkFeeTier2; // For event purpose
        networkFeeTier2 = _networkFeeTier2;
        emit SetNetworkFeeTier2(oldNetworkFeeTier2, _networkFeeTier2);
    }

    function setCustomNetworkFeeTier(uint _customNetworkFeeTier) external onlyOwner {
        require(_customNetworkFeeTier > networkFeeTier2[1], "Must > tier 2");
        uint oldCustomNetworkFeeTier = customNetworkFeeTier; // For event purpose
        customNetworkFeeTier = _customNetworkFeeTier;
        emit SetCustomNetworkFeeTier(oldCustomNetworkFeeTier, _customNetworkFeeTier);
    }

    function setNetworkFeePerc(uint[] calldata _networkFeePerc) external onlyOwner {
        require(_networkFeePerc[0] < 3001 && _networkFeePerc[1] < 3001 && _networkFeePerc[2] < 3001,
            "Not allow > 30%");
        /**
         * _networkFeePerc content a array of 3 element, representing network fee of tier 1, tier 2 and tier 3
         * For example networkFeePerc is [100, 75, 50],
         * which mean network fee for Tier 1 = 1%, Tier 2 = 0.75% and Tier 3 = 0.5% (_DENOMINATOR = 10000)
         */
        uint[] memory oldNetworkFeePerc = networkFeePerc; // For event purpose
        networkFeePerc = _networkFeePerc;
        emit SetNetworkFeePerc(oldNetworkFeePerc, _networkFeePerc);
    }

    function setCustomNetworkFeePerc(uint _percentage) external onlyOwner {
        require(_percentage < networkFeePerc[2], "Not allow > tier 2");
        uint oldCustomNetworkFeePerc = customNetworkFeePerc; // For event purpose
        customNetworkFeePerc = _percentage;
        emit SetCustomNetworkFeePerc(oldCustomNetworkFeePerc, _percentage);
    }

    function setProfitFeePerc(uint profitFeePerc) external onlyOwner {
        require(profitFeePerc < 3001, "Profit fee cannot > 30%");
        strategy.setProfitFeePerc(profitFeePerc);
        emit SetProfitFeePerc(profitFeePerc);
    }

    function _msgSender() internal override(ContextUpgradeable, BaseRelayRecipient) view returns (address) {
        return BaseRelayRecipient._msgSender();
    }
    
    function versionRecipient() external pure override returns (string memory) {
        return "1";
    }

    function getPath(address tokenA, address tokenB) private pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
    }

    /// @return TVL in ETH
    function getAllPool(bool includeVestedILV) external view returns (uint) {
        uint WETHAmt; // Stablecoins amount keep in vault convert to WETH

        uint USDTAmt = USDT.balanceOf(address(this));
        if (USDTAmt > 1e6) {
            WETHAmt = (sushiRouter.getAmountsOut(USDTAmt, getPath(address(USDT), address(WETH))))[1];
        }
        uint USDCAmt = USDC.balanceOf(address(this));
        if (USDCAmt > 1e6) {
            uint _WETHAmt = (sushiRouter.getAmountsOut(USDCAmt, getPath(address(USDC), address(WETH))))[1];
            WETHAmt = WETHAmt + _WETHAmt;
        }
        uint DAIAmt = DAI.balanceOf(address(this));
        if (DAIAmt > 1e18) {
            uint _WETHAmt = (sushiRouter.getAmountsOut(DAIAmt, getPath(address(DAI), address(WETH))))[1];
            WETHAmt = WETHAmt + _WETHAmt;
        }
        uint feesInETH;
        if (fees > 1e18) {
            // Assume fees pay in USDT
            feesInETH = (sushiRouter.getAmountsOut(fees, getPath(address(USDT), address(WETH))))[1];
        }

        return strategy.getAllPool(includeVestedILV) + WETHAmt - feesInETH;
    }

    function getAllPoolInUSD(bool includeVestedILV) private view returns (uint) {
        // uint ETHPriceInUSD = uint(IChainlink(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419).latestAnswer());
        // // ETHPriceInUSD amount in 8 decimals

        // if (paused()) return WETH.balanceOf(address(this)) * ETHPriceInUSD / 1e8;
        // uint strategyPoolInUSD = strategy.getAllPool(includeVestedILV) * ETHPriceInUSD / 1e8;

        uint tokenKeepInVault = USDT.balanceOf(address(this)) * 1e12 +
            USDC.balanceOf(address(this)) * 1e12 + DAI.balanceOf(address(this));
        
        // return strategyPoolInUSD + tokenKeepInVault - fees;
        return tokenKeepInVault - fees;
    }

    function getAllPoolInUSD() external view returns (uint) {
        return getAllPoolInUSD(true);
    }

    /// @notice Can be use for calculate both user shares & APR    
    function getPricePerFullShare() external view returns (uint) {
        return getAllPoolInUSD(true) * 1e18 / totalSupply();
    }
}
