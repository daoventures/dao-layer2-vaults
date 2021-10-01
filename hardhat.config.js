require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@nomiclabs/hardhat-solhint");
require("dotenv").config();
require("solidity-coverage");
require('@openzeppelin/hardhat-upgrades');

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: process.env.ALCHEMY_URL_MAINNET, //process.env.BSC_TESTNET_URL,//process.env.ALCHEMY_URL_MAINNET,
        blockNumber: 11197779//10984219//13055980,
      },
    },

    mainnet: {
      url: process.env.ALCHEMY_URL_MAINNET,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },

    bscTestnet: {
      url: process.env.BSC_TESTNET_URL,
      accounts: [`0x${process.env.PRIVATE_KEY}`],
    },
    // kovan: {
    //   url: process.env.ALCHEMY_URL_KOVAN,
    //   accounts: [`0x${process.env.PRIVATE_KEY}`],
    // },
    // rinkeby: {
    //   url: process.env.ALCHEMY_URL_RINKEBY,
    //   accounts: [`0x${process.env.PRIVATE_KEY}`],
    // },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  solidity: {
    version: "0.8.7",//"0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 500,
      },
    },
  },
  mocha: {
    timeout: 700000000
  },
};
