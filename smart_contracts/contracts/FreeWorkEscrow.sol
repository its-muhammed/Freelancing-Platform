pragma solidity ^0.8.0;

contract FreeWorkEscrow {
    address public employer;
    address public freelancer;
    uint256 public taskAmount;
    bool public taskCompleted;
    bool public fundsReleased;

    constructor(address _freelancer) payable {
        employer = msg.sender;
        freelancer = _freelancer;
        taskAmount = msg.value;
        taskCompleted = false;
        fundsReleased = false;
    }

    function markTaskCompleted() public {
        require(msg.sender == freelancer, "Only the freelancer can mark the task as completed.");
        taskCompleted = true;
    }

    function releasePayment() public {
        require(msg.sender == employer, "Only the employer can release payment.");
        require(taskCompleted, "Task must be marked as completed before releasing funds.");
        require(!fundsReleased, "Funds have already been released.");

        fundsReleased = true;
        payable(freelancer).transfer(taskAmount);
    }

    function refundEmployer() public {
        require(msg.sender == employer, "Only the employer can request a refund.");
        require(!taskCompleted, "Cannot refund after task completion.");
        require(!fundsReleased, "Funds have already been released.");

        fundsReleased = true;
        payable(employer).transfer(taskAmount);
    }
}
