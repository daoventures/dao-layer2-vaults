// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IStrategy {
    function invest(uint amount, uint[] calldata amountOutMin) external;
    function withdraw(uint sharePerc, uint[] calldata amountOutMin) external;
    function collectProfitAndUpdateWatermark() external returns (uint);
    function adjustWatermark(uint amount, bool signs) external; 
    function reimburse(uint farmIndex, uint sharePerc, uint amountOutMin) external returns (uint);
    function profitFeePerc() external view returns (uint);
    function setProfitFeePerc(uint profitFeePerc) external;
    function watermark() external view returns (uint);
    function getAllPoolInUSD() external view returns (uint);
}

contract vanguardXVault is Initializable, ERC20Upgradeable, OwnableUpgradeable, 
        ReentrancyGuardUpgradeable, PausableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20Upgradeable constant USDC = IERC20Upgradeable(0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664);

    IStrategy public strategy;
    uint public fees;

    address public treasuryWallet;
    address public communityWallet;
    address public strategist;
    address public admin;

    event Deposit(address caller, uint amtDeposit);
    event Withdraw(address caller, uint amtWithdraw, uint shareBurned);
    event Invest(uint amount);
    event TransferredOutFees(uint fees);
    event Reimburse(uint farmIndex, uint amount);
    event SetProfitFeePerc(uint oldProfitFeePerc, uint profitFeePerc);
    event SetAddresses(
        address oldTreasuryWallet, address newTreasuryWallet,
        address oldCommunityWallet, address newCommunityWallet,
        address oldAdmin, address newAdmin
    );
    
    modifier onlyOwnerOrAdmin {
        require(msg.sender == owner() || msg.sender == address(admin), "Only owner or admin");
        _;
    }

    function initialize(
        string calldata name, string calldata ticker,
        address _treasuryWallet, address _communityWallet, address _strategist, address _admin,
        address _strategy
    ) external initializer {
        __ERC20_init(name, ticker);
        __Ownable_init();

        strategy = IStrategy(_strategy);

        treasuryWallet = _treasuryWallet;
        communityWallet = _communityWallet;
        strategist = _strategist;
        admin = _admin;

        USDC.safeApprove(address(strategy), type(uint).max);
    }

    function deposit(uint amount, IERC20Upgradeable token) external nonReentrant whenNotPaused {
        require(msg.sender == tx.origin, "Only EOA");
        require(amount > 0, "Amount must > 0");
        require(token == USDC, "Invalid token deposit");

        if (strategy.watermark() > 0) collectProfitAndUpdateWatermark();

        uint pool = getAllPoolInUSD();
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        amount *= 1e12;

        strategy.adjustWatermark(amount, true);

        uint _totalSupply = totalSupply();
        uint share = _totalSupply == 0 ? amount : amount * _totalSupply / pool;
        _mint(msg.sender, share);

        emit Deposit(msg.sender, amount);
    }

    function withdraw(uint share, IERC20Upgradeable token, uint[] calldata amountsOutMin) external nonReentrant {
        require(msg.sender == tx.origin, "Only EOA");
        require(share > 0 || share <= balanceOf(msg.sender), "Invalid share amount");
        require(token == USDC, "Invalid token withdraw");

        uint _totalSupply = totalSupply();
        uint withdrawAmt = getAllPoolInUSD() * share / _totalSupply;
        _burn(msg.sender, share);

        strategy.adjustWatermark(withdrawAmt, false);
        strategy.withdraw(withdrawAmt, amountsOutMin);
        USDC.safeTransfer(msg.sender, USDC.balanceOf(address(this)));

        emit Withdraw(msg.sender, withdrawAmt, share);
    }

    function invest(uint[] calldata amountsOutMin) public whenNotPaused {
        require(msg.sender == admin || msg.sender == owner(), "Not authorized");
        
        collectProfitAndUpdateWatermark();
        transferOutFees();
        uint USDCAmt = USDC.balanceOf(address(this));
        strategy.invest(USDCAmt, amountsOutMin);

        emit Invest(USDCAmt);
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

    function transferOutFees() public {
        require(
            msg.sender == address(this) ||
            msg.sender == admin ||
            msg.sender == owner(), "Only authorized caller"
        );

        uint USDCAmt = USDC.balanceOf(address(this));
        uint _fees = fees /= 1e12;
        if (USDCAmt > _fees) {
            uint _fee = _fees * 4 / 10;
            USDC.safeTransfer(treasuryWallet, _fee);
            USDC.safeTransfer(communityWallet, _fee);
            USDC.safeTransfer(strategist, _fees - _fee - _fee);

            fees = 0;
            emit TransferredOutFees(_fees);
        }
    }

    function reimburse(uint farmIndex, uint amount, uint amountOutMin) external onlyOwnerOrAdmin {
        amount *= 1e12;
        uint USDCAmt = strategy.reimburse(farmIndex, amount, amountOutMin);
        strategy.adjustWatermark(amount, false);

        emit Reimburse(farmIndex, USDCAmt);
    }

    function setAddresses(address _treasuryWallet, address _communityWallet, address _admin) external onlyOwner {
        address oldTreasuryWallet = treasuryWallet;
        address oldCommunityWallet = communityWallet;
        address oldAdmin = admin;

        treasuryWallet = _treasuryWallet;
        communityWallet = _communityWallet;
        admin = _admin;

        emit SetAddresses(oldTreasuryWallet, _treasuryWallet, oldCommunityWallet, _communityWallet, oldAdmin, _admin);
    }

    function getAllPoolInUSD() public view returns (uint) {
        return strategy.getAllPoolInUSD() + USDC.balanceOf(address(this)) * 1e12 - fees;
    }

    /// @notice Can be use for calculate both user shares & APR    
    function getPricePerFullShare() external view returns (uint) {
        return getAllPoolInUSD() * 1e18 / totalSupply();
    }
}