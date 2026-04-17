// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingContract {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    struct VoteRecord {
        string voterHash;
        uint256 candidateId;
        uint256 timestamp;
        uint256 blockNumber;
    }

    mapping(uint256 => Candidate) public candidates;
    mapping(string => bool) public hasVoted;
    mapping(string => uint256) public voteTimestamp;
    uint256 public candidatesCount;
    
    // Voting period control
    address public admin;
    uint256 public votingStart;
    uint256 public votingEnd;
    bool public votingActive;
    bool public resultsPublished;
    
    // Enhanced tracking
    uint256 public totalVoters;
    VoteRecord[] public voteRecords;

    event VoteCast(
        string indexed voterHash,
        uint256 indexed candidateId,
        uint256 timestamp
    );
    
    event VotingStarted(uint256 startTime, uint256 endTime);
    event VotingEnded(uint256 endTime);
    event VoterRecorded(string indexed voterHash, uint256 timestamp, uint256 blockNumber);
    event ResultsPublished(uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier votingOpen() {
        require(votingActive, "Voting is not active");
        require(block.timestamp >= votingStart, "Voting has not started yet");
        require(block.timestamp <= votingEnd, "Voting has ended");
        _;
    }

    constructor(string[] memory _candidateNames) {
        admin = msg.sender;
        votingActive = false; // Voting starts disabled
        resultsPublished = false; // Results start unpublished
        
        for (uint256 i = 0; i < _candidateNames.length; i++) {
            candidatesCount++;
            candidates[candidatesCount] = Candidate(
                candidatesCount,
                _candidateNames[i],
                0
            );
        }
    }

    function startVoting(uint256 durationInSeconds) public onlyAdmin {
        require(!votingActive, "Voting is already active");
        votingStart = block.timestamp;
        votingEnd = block.timestamp + durationInSeconds;
        votingActive = true;
        
        emit VotingStarted(votingStart, votingEnd);
    }

    function endVoting() public onlyAdmin {
        require(votingActive, "Voting is not active");
        votingActive = false;
        
        emit VotingEnded(block.timestamp);
    }

    function extendVoting(uint256 additionalSeconds) public onlyAdmin {
        require(votingActive, "Voting is not active");
        votingEnd += additionalSeconds;
    }

    function castVote(string memory _voterHash, uint256 _candidateId) public votingOpen {
        require(!hasVoted[_voterHash], "Already voted");
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate");

        // Mark as voted
        hasVoted[_voterHash] = true;
        
        // Record vote timestamp (Enhancement #3)
        voteTimestamp[_voterHash] = block.timestamp;
        
        // Increment total voters (Enhancement #1)
        totalVoters++;
        
        // Store detailed vote record (Enhancement #4)
        voteRecords.push(VoteRecord({
            voterHash: _voterHash,
            candidateId: _candidateId,
            timestamp: block.timestamp,
            blockNumber: block.number
        }));
        
        // Increment candidate vote count
        candidates[_candidateId].voteCount++;

        emit VoteCast(_voterHash, _candidateId, block.timestamp);
        emit VoterRecorded(_voterHash, block.timestamp, block.number);
    }
    
    function getVotingStatus() public view returns (bool active, uint256 start, uint256 end, uint256 currentTime) {
        return (votingActive, votingStart, votingEnd, block.timestamp);
    }
    
    function getTotalVoteRecords() public view returns (uint256) {
        return voteRecords.length;
    }
    
    function getVoteRecord(uint256 index) public view returns (string memory voterHash, uint256 candidateId, uint256 timestamp, uint256 blockNumber) {
        require(index < voteRecords.length, "Index out of bounds");
        VoteRecord memory record = voteRecords[index];
        return (record.voterHash, record.candidateId, record.timestamp, record.blockNumber);
    }
    
    function getVoterTimestamp(string memory _voterHash) public view returns (uint256) {
        require(hasVoted[_voterHash], "Voter has not voted");
        return voteTimestamp[_voterHash];
    }
    
    function publishResults() public onlyAdmin {
        require(!votingActive, "Cannot publish results while voting is active");
        require(!resultsPublished, "Results already published");
        resultsPublished = true;
        
        emit ResultsPublished(block.timestamp);
    }
    
    function unpublishResults() public onlyAdmin {
        require(resultsPublished, "Results are not published");
        resultsPublished = false;
    }
}