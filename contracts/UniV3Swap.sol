//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract UniV3Swap {
    ISwapRouter constant router  = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    function swap(address tokenIn, address tokenOut, uint amount, uint24 poolFee) external {
        IERC20Upgradeable(tokenIn).approve(address(router), amount);
        IERC20Upgradeable(tokenIn).transferFrom(msg.sender, address(this), amount);

        ISwapRouter.ExactInputSingleParams memory param = ISwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn, 
            tokenOut: tokenOut, 
            fee: poolFee,
            recipient: msg.sender,
            deadline: block.timestamp,
            amountIn: amount,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        router.exactInputSingle(param);
    }
}