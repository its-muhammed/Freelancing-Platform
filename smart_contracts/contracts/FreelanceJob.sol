```
pragma solidity ^0.8.19;

// Smart contract for managing a freelance task with escrow
contract FreelanceTask {
    address public employer;        // Address of the employer who initiates the contract
    address public worker;          // Address of the worker assigned to the task
    uint256 public escrowAmount;    // Funds (in wei) held in escrow for payment
    uint256 public deadline;        // Unix timestamp for task completion deadline
    bool public taskAccepted;       // Flag to check if worker accepted the task
    bool public taskDelivered;      // Flag to check if task has been delivered
    bool public taskVerified;       // Flag to check if task is verified by employer
    string public deliveryProof;    // IPFS hash or URL for task proof

    // Events to track task progress
    event JobAccepted(address indexed freelancer);
    event WorkSubmitted(string proof);
    event WorkApproved(uint256 payment);
    event FundsRefunded(address indexed client, uint256 amount);

    // Constructor to initialize task details
    constructor(address _worker, uint256 _deadline) payable {
        require(_worker != address(0), "Worker address cannot be zero"); // Ensure valid worker address
        require(_deadline > block.timestamp, "Deadline must be in the future"); // Ensure deadline is valid
        require(msg.value > 0, "Escrow must have funds"); // Ensure payment is provided
        employer = msg.sender;      // Set employer as contract deployer
        worker = _worker;           // Set worker from input
        escrowAmount = msg.value;   // Store escrow funds
        deadline = _deadline;       // Set task deadline
        taskAccepted = false;       // Initialize task as not accepted
        taskDelivered = false;      // Initialize task as not delivered
        taskVerified = false;       // Initialize task as not verified
    }

    // Worker accepts the task
    function acceptJob() external {
        require(msg.sender == worker, "Only worker can accept task"); // Restrict to assigned worker
        require(block.timestamp < deadline, "Task deadline has passed"); // Check if task is still active
        require(!taskAccepted, "Task already accepted"); // Prevent re-acceptance
        taskAccepted = true;        // Mark task as accepted
        emit JobAccepted(worker);   // Emit acceptance event
    }

    // Worker submits task proof
    function submitWork(string memory _proof) external {
        require(msg.sender == worker, "Only worker can submit"); // Restrict to worker
        require(taskAccepted, "Task not accepted yet"); // Ensure task is accepted
        require(!taskDelivered, "Task already submitted"); // Prevent re-submission
        require(block.timestamp < deadline, "Deadline has passed"); // Check deadline
        taskDelivered = true;       // Mark task as delivered
        deliveryProof = _proof;     // Store proof of work
        emit WorkSubmitted(_proof); // Emit submission event
    }

    // Employer verifies and approves task
    function approveWork() external {
        require(msg.sender == employer, "Only employer can approve"); // Restrict to employer
        require(taskDelivered, "Task not submitted yet"); // Ensure task is delivered
        require(!taskVerified, "Task already approved"); // Prevent re-approval
        taskVerified = true;        // Mark task as verified
        emit WorkApproved(escrowAmount); // Emit approval event
        payable(worker).transfer(escrowAmount); // Release funds to worker
    }

    // Refund employer if task is expired
    function refundIfExpired() external {
        require(msg.sender == employer, "Only employer can refund"); // Restrict to employer
        require(block.timestamp >= deadline, "Task not yet expired"); // Check if deadline passed
        require(!taskDelivered, "Task was submitted"); // Ensure no submission
        emit FundsRefunded(employer, escrowAmount); // Emit refund event
        payable(employer).transfer(escrowAmount); // Refund employer
    }

    // Employer cancels task before submission
    function cancelJob() external {
        require(msg.sender == employer, "Only employer can cancel"); // Restrict to employer
        require(!taskDelivered, "Task already submitted"); // Ensure no submission
        require(!taskVerified, "Task already approved"); // Ensure not approved
        emit FundsRefunded(employer, escrowAmount); // Emit refund event
        payable(employer).transfer(escrowAmount); // Refund employer
    }

    // View function to check contract balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance; // Return current escrow balance
    }
}
```