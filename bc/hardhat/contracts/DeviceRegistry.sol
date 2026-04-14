// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DeviceRegistry {
    address public owner;

    mapping(bytes32 => bool) private authorizedDevice; // deviceIdHash -> authorized?

    event DeviceRegistered(bytes32 indexed deviceIdHash, uint256 timestamp);
    event DeviceRevoked(bytes32 indexed deviceIdHash, uint256 timestamp);

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerDevice(bytes32 deviceIdHash) external onlyOwner {
        authorizedDevice[deviceIdHash] = true;
        emit DeviceRegistered(deviceIdHash, block.timestamp);
    }

    function revokeDevice(bytes32 deviceIdHash) external onlyOwner {
        authorizedDevice[deviceIdHash] = false;
        emit DeviceRevoked(deviceIdHash, block.timestamp);
    }

    function isAuthorized(bytes32 deviceIdHash) external view returns (bool) {
        return authorizedDevice[deviceIdHash];
    }
}