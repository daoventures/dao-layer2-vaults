require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require('@openzeppelin/hardhat-upgrades');
require("dotenv").config()

const { ethers } = require("ethers")

module.exports = {
    networks: {
        hardhat: {
            forking: {
                url: process.env.ALCHEMY_URL_MAINNET,
                blockNumber: 13230000,

                // url: process.env.ALCHEMY_URL_KOVAN,
                // blockNumber: 26380000, // Kovan
            },
        },
        mainnet: {
            url: process.env.ALCHEMY_URL_MAINNET,
            gasPrice: 51000000000,
            gasMultiplier: 1.2,
            accounts: [`0x${process.env.PRIVATE_KEY}`],
        },
        kovan: {
            url: process.env.ALCHEMY_URL_KOVAN,
            accounts: [`0x${process.env.PRIVATE_KEY}`],
        },
    },
    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY,
    },
    solidity: {
        compilers: [
            {
                version: "0.8.7",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                }
            },
        ]
    },
    mocha: {
        timeout: 300000
    }
};