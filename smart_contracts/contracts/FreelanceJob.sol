// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

contract FreelanceJob {
    address public client;          // The client who deploys the contract
    address public freelancer;      // The freelancer assigned to the job
    uint256 public payment;         // In wei (POL converted from LKR), held as escrow
    uint256 public dueDate;         // Unix timestamp for deadline
    bool public jobAccepted;        // Tracks if freelancer accepted the job
    bool public workSubmitted;      // Tracks if work is submitted
    bool public workApproved;       // Tracks if work is approved
    string public proofOfWork;      // IPFS hash or URL for proof

    event JobAccepted(address indexed freelancer);
    event WorkSubmitted(string proof);
    event WorkApproved(uint256 payment);
    event FundsRefunded(address indexed client, uint256 amount);

    constructor(address _freelancer, uint256 _dueDate) payable {
        require(_freelancer != address(0), "Invalid freelancer address");
        require(_dueDate > block.timestamp, "Due date must be in future");
        require(msg.value > 0, "Payment must be greater than 0");
        client = msg.sender;        // Deployer (client) locks funds
        freelancer = _freelancer;   // Freelancer from bid
        payment = msg.value;        // Escrow amount in wei
        dueDate = _dueDate;         // Deadline in seconds
        jobAccepted = false;
        workSubmitted = false;
        workApproved = false;
    }

    function acceptJob() external {
        require(msg.sender == freelancer, "Only freelancer can accept");
        require(block.timestamp < dueDate, "Job expired");
        require(!jobAccepted, "Job already accepted");
        jobAccepted = true;
        emit JobAccepted(freelancer);
    }

    function submitWork(string memory _proof) external {
        require(msg.sender == freelancer, "Only freelancer can submit");
        require(jobAccepted, "Job not yet accepted");
        require(!workSubmitted, "Work already submitted");
        require(block.timestamp < dueDate, "Deadline passed");
        workSubmitted = true;
        proofOfWork = _proof;
        emit WorkSubmitted(_proof);
    }

    function approveWork() external {
        require(msg.sender == client, "Only client can approve");
        require(workSubmitted, "Work not submitted yet");
        require(!workApproved, "Work already approved");
        workApproved = true;
        emit WorkApproved(payment);
        payable(freelancer).transfer(payment); // Release funds to freelancer
    }

    function refundIfExpired() external {
        require(msg.sender == client, "Only client can refund");
        require(block.timestamp >= dueDate, "Job not expired yet");
        require(!workSubmitted, "Work was submitted");
        emit FundsRefunded(client, payment);
        payable(client).transfer(payment); // Refund client
    }

    function cancelJob() external {
        require(msg.sender == client, "Only client can cancel");
        require(!workSubmitted, "Work already submitted");
        require(!workApproved, "Work already approved");
        emit FundsRefunded(client, payment);
        payable(client).transfer(payment); // Refund client
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}