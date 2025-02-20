require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load contract ABI
const contractPath = path.join(__dirname, "../../smart_contracts/FreeWorkEscrow.json"); 
const contractABI = JSON.parse(fs.readFileSync(contractPath, "utf-8"));

// Polygon Network Details
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Contract Configuration
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

// Deploy Contract (Only run when deploying)
async function deployContract(freelancerAddress, taskAmount) {
    const factory = new ethers.ContractFactory(contractABI.abi, contractABI.bytecode, wallet);
    const contractInstance = await factory.deploy(freelancerAddress, { value: ethers.parseEther(taskAmount) });
    await contractInstance.waitForDeployment();
    console.log("Contract deployed at:", contractInstance.target);
    return contractInstance.target;
}

// Mark Task as Completed
async function markTaskCompleted() {
    const tx = await contract.markTaskCompleted();
    await tx.wait();
    console.log("Task marked as completed.");
}

// Release Payment
async function releasePayment() {
    const tx = await contract.releasePayment();
    await tx.wait();
    console.log("Payment released to freelancer.");
}

// Refund Employer
async function refundEmployer() {
    const tx = await contract.refundEmployer();
    await tx.wait();
    console.log("Funds refunded to employer.");
}

module.exports = { deployContract, markTaskCompleted, releasePayment, refundEmployer };
