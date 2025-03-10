const { ethers } = require("ethers");
const axios = require("axios");

// Load ABI and Bytecode (you can copy these from frontend or recompile)
const freelanceJobABI = require("../../frontend/src/contracts/FreelanceJobABI").freelanceJobABI;
const freelanceJobBytecode = require("../../frontend/src/contracts/FreelanceJobBytecode").default;

// Polygon Amoy RPC and wallet private key (from .env)
require("dotenv").config();
const provider = new ethers.JsonRpcProvider(process.env.AMOY_RPC_URL); // e.g., "https://rpc-amoy.polygon.technology/"
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const getPolFromLkr = async (lkrAmount) => {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=lkr"
    );
    const lkrPerPol = response.data["matic-network"].lkr;
    console.log(`1 POL = ${lkrPerPol} LKR`);
    return lkrAmount / lkrPerPol;
  } catch (error) {
    console.error("Error fetching POL/LKR rate, using fallback:", error);
    return lkrAmount / 200; // Fallback: 1 POL = 200 LKR
  }
};

const deployFreelanceJobContract = async (freelancerAddress, lkrAmount, bidId) => {
  try {
    console.log(`Deploying contract for bid ${bidId} with freelancer ${freelancerAddress}`);

    const balance = await provider.getBalance(wallet.address);
    console.log("Deployer balance:", ethers.formatEther(balance), "POL");

    const polAmount = await getPolFromLkr(lkrAmount);
    const amountInWei = ethers.parseEther(polAmount.toFixed(18));
    const dueDate = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    const validatedFreelancer = ethers.getAddress(freelancerAddress);

    console.log("Deployment parameters:", {
      freelancer: validatedFreelancer,
      dueDate,
      amountInPol: polAmount,
      amountInWei: amountInWei.toString(),
    });

    const factory = new ethers.ContractFactory(freelanceJobABI, freelanceJobBytecode, wallet);
    const contract = await factory.deploy(validatedFreelancer, dueDate, { value: amountInWei });
    const txReceipt = await contract.waitForDeployment();
    const contractAddress = contract.target;

    console.log(`Contract deployed at: ${contractAddress}, tx hash: ${txReceipt.hash}`);
    return contractAddress;
  } catch (error) {
    console.error(`Error deploying contract for bid ${bidId}:`, error);
    throw error;
  }
};

module.exports = { deployFreelanceJobContract };