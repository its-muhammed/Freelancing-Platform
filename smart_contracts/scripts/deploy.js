const hre = require("hardhat");
const axios = require("axios");

async function getPolFromLkr(lkrAmount) {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=lkr"
    );
    const lkrPerPol = response.data["matic-network"].lkr;
    console.log(`1 POL = ${lkrPerPol} LKR`);
    const polAmount = lkrAmount / lkrPerPol;
    console.log(`${lkrAmount} LKR = ${polAmount} POL`);
    return polAmount;
  } catch (error) {
    console.error("Error fetching POL/LKR rate, using fallback:", error);
    const fallbackLkrPerPol = 200; // Fallback: 1 POL = 200 LKR
    const polAmount = lkrAmount / fallbackLkrPerPol;
    console.log(`Fallback: ${lkrAmount} LKR = ${polAmount} POL`);
    return polAmount;
  }
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with client wallet:", deployer.address);

  const clientAddress = deployer.address; // For Hardhat demo; replace with actual client if needed
  const balance = await hre.ethers.provider.getBalance(clientAddress);
  console.log("Client balance:", hre.ethers.formatEther(balance), "POL");

  // Fetch pending bids
  console.log("Fetching pending bids for client:", clientAddress);
  const response = await axios.get(`http://localhost:5000/api/bids/client/${clientAddress}`);
  const bids = response.data.filter(bid => bid.status === "Pending");

  if (bids.length === 0) {
    console.log("No pending bids found for client:", clientAddress);
    return;
  }

  console.log(`Found ${bids.length} pending bids to process.`);

  const FreelanceJob = await hre.ethers.getContractFactory("FreelanceJob");

  for (const bid of bids) {
    try {
      console.log(`Processing bid ${bid._id} from freelancer ${bid.freelancerId} for ${bid.amount} LKR`);

      // Convert LKR to POL
      const polAmount = await getPolFromLkr(bid.amount);
      const amountInWei = hre.ethers.parseEther(polAmount.toFixed(18));

      const freelancerAddress = hre.ethers.getAddress(bid.freelancerId);
      const dueDate = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 7 days

      console.log("Deploying with:", {
        freelancer: freelancerAddress,
        dueDate,
        amountInPol: polAmount,
        amountInWei: amountInWei.toString(),
      });

      const job = await FreelanceJob.deploy(freelancerAddress, dueDate, {
        value: amountInWei,
      });
      await job.waitForDeployment();
      const contractAddress = job.target;

      console.log(`Contract for bid ${bid._id} deployed to: ${contractAddress}`);

      await axios.post("http://localhost:5000/api/bids/update", {
        bidId: bid._id,
        status: "Contract Sent",
        contractAddress,
      });

      console.log(`Bid ${bid._id} updated to "Contract Sent" with contract address ${contractAddress}`);
    } catch (error) {
      console.error(`Error processing bid ${bid._id}:`, error.message);
    }
  }

  console.log("All pending bids processed.");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});