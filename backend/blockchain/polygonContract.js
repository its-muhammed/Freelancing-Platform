require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load compiled contract ABI
const contractPath = path.join(__dirname, "../../smart_contracts/FreeWorkEscrow.json"); 
const contractABI = JSON.parse(fs.readFileSync(contractPath, "utf-8"));

// Polygon Amoy Network Details
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract Configuration
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

async function getContractDetails() {
    try {
        const balance = await provider.getBalance(wallet.address);
        console.log("Connected Wallet Balance:", ethers.formatEther(balance), "POL");
        console.log("Contract Address:", contractAddress);
    } catch (error) {
        console.error("Error fetching contract details:", error);
    }
}

module.exports = { contract, getContractDetails };
