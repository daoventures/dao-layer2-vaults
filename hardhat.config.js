require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("dotenv").config()

module.exports = {
    networks: {
        hardhat: {
            forking: {
                url: process.env.ALCHEMY_URL_MAINNET,
                blockNumber: 13473000,
            },
        },
        mainnet: {
            url: process.env.ALCHEMY_URL_MAINNET,
            gasPrice: 46000000000,
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
                version: "0.8.9",
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
}