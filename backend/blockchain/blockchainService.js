const { ethers } = require("ethers");
const axios = require("axios");
const Bid = require("../models/Bid"); // Import Bid model to fetch taskId
const Task = require("../models/Task"); // Import Task model to validate dueDate
const freelanceJobABI = require("../../frontend/src/contracts/FreelanceJobABI").freelanceJobABI;
const freelanceJobBytecode = require("../../frontend/src/contracts/FreelanceJobBytecode").default;
require("dotenv").config();

const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const getPolFromLkr = async (lkrAmount) => {
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=lkr");
    const lkrPerPol = response.data["matic-network"].lkr;
    console.log(`1 POL = ${lkrPerPol} LKR`);
    return lkrAmount / lkrPerPol;
  } catch (error) {
    console.error("Error fetching POL/LKR rate, using fallback:", error);
    return lkrAmount / 200; // Fallback: 1 POL = 200 LKR
  }
};

const deployFreelanceJobContract = async (freelancerAddress, lkrAmount, bidId, dueDate) => {
  try {
    console.log(`Deploying contract for bid ${bidId} with freelancer ${freelancerAddress}`);

    const balance = await provider.getBalance(wallet.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "POL");

    const polAmount = await getPolFromLkr(lkrAmount);
    const amountInWei = ethers.parseEther(polAmount.toFixed(18));

    // Validate dueDate against task deadline
    const bid = await Bid.findById(bidId).populate("taskId");
    if (!bid) throw new Error(`Bid ${bidId} not found`);
    const task = bid.taskId;
    const taskDueDate = Math.floor(new Date(task.deadline).getTime() / 1000);
    if (dueDate !== taskDueDate) {
      throw new Error(`Due date ${dueDate} does not match task deadline ${taskDueDate}`);
    }

    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (dueDate <= currentTimestamp) {
      throw new Error(`Due date ${dueDate} must be in the future (current: ${currentTimestamp})`);
    }

    if (balance.lt(amountInWei)) {
      throw new Error(`Insufficient funds: ${ethers.formatEther(balance)} POL < ${ethers.formatEther(amountInWei)} POL`);
    }

    const factory = new ethers.ContractFactory(freelanceJobABI, freelanceJobBytecode, wallet);
    const contract = await factory.deploy(freelancerAddress, dueDate, { value: amountInWei });
    const txReceipt = await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log(`Contract deployed at: ${contractAddress}, tx hash: ${txReceipt.hash}`);

    // Update bid status in backend
    await axios.post("http://localhost:5000/api/bids/update", {
      bidId,
      status: "Accepted",
      contractAddress,
    });

    return contractAddress;
  } catch (error) {
    console.error(`Error deploying contract for bid ${bidId}:`, error);
    throw error;
  }
};

module.exports = { deployFreelanceJobContract };
