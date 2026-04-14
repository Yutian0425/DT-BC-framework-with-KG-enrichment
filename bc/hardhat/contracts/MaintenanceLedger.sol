// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MaintenanceLedger {
    event WorkOrderCreated(
        uint256 indexed id,
        bytes32 indexed roomIdHash,
        bytes32 indexed deviceIdHash,
        bytes32 eventTypeHash,
        bytes32 evidenceHash,
        uint256 timestamp
    );

    uint256 public nextId = 1;

    function createWorkOrder(
        bytes32 roomIdHash,
        bytes32 deviceIdHash,
        bytes32 eventTypeHash,
        bytes32 evidenceHash
    ) external returns (uint256 id) {
        id = nextId++;
        emit WorkOrderCreated(
          id,
          roomIdHash,
          deviceIdHash,
          eventTypeHash,
          evidenceHash,
          block.timestamp
        );
    }
}