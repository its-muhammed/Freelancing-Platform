require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contract with the account:", deployer.address);

    const FreeWorkEscrow = await ethers.getContractFactory("FreeWorkEscrow");
    const contract = await FreeWorkEscrow.deploy("0x193c6Fe9CEbE5CF4A0CA35E4a43c78cd422aCC8E", { value: ethers.parseEther("0.1") });

    await contract.waitForDeployment();
    console.log("Contract deployed at:", contract.target);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
