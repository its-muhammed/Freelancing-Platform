require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // ✅ Ensure dotenv is loaded

module.exports = {
    solidity: "0.8.0",
    networks: {
        polygon_amoy: {
            url: process.env.POLYGON_RPC_URL || "", // ✅ Ensure URL is correctly loaded
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [] // ✅ Ensure Private Key is correctly loaded
        }
    }
};
