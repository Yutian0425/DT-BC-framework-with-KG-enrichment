// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AccessControlDT {
    address public owner;

    // roles: 1=Owner, 2=Engineer, 3=Tenant (demo)
    mapping(address => uint8) public roleOf;

    // permission: user -> roomIdHash -> dataTypeHash -> allowed
    mapping(address => mapping(bytes32 => mapping(bytes32 => bool))) private canRead;

    event RoleGranted(address indexed user, uint8 role, uint256 timestamp);
    event PermissionGranted(address indexed user, bytes32 indexed roomIdHash, bytes32 indexed dataTypeHash, uint256 timestamp);
    event PermissionRevoked(address indexed user, bytes32 indexed roomIdHash, bytes32 indexed dataTypeHash, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function grantRole(address user, uint8 role) external onlyOwner {
        roleOf[user] = role;
        emit RoleGranted(user, role, block.timestamp);
    }

    function grantRead(address user, bytes32 roomIdHash, bytes32 dataTypeHash) external onlyOwner {
        canRead[user][roomIdHash][dataTypeHash] = true;
        emit PermissionGranted(user, roomIdHash, dataTypeHash, block.timestamp);
    }

    function revokeRead(address user, bytes32 roomIdHash, bytes32 dataTypeHash) external onlyOwner {
        canRead[user][roomIdHash][dataTypeHash] = false;
        emit PermissionRevoked(user, roomIdHash, dataTypeHash, block.timestamp);
    }

    function checkRead(address user, bytes32 roomIdHash, bytes32 dataTypeHash) external view returns (bool) {
        return canRead[user][roomIdHash][dataTypeHash];
    }
}