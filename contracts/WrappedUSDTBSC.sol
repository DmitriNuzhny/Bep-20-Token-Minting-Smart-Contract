// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IBEP20} from "./IBEP20.sol";

/**
 * Wrapped/Mirrored token for USDT on BSC.
 * - Deposit: user transfers USDT to this contract, receives 1:1 wrapped tokens (wUSDT).
 * - Withdraw: user burns wrapped tokens, contract sends back USDT 1:1.
 * - Transfer: standard ERC20 transfers for wUSDT.
 *
 * Notes:
 * - This is not an upgradeable proxy; it's a wrapper with mirrored supply.
 * - The contract must hold enough underlying USDT liquidity for withdrawals.
 */
contract WrappedUSDTBSC is ERC20, Ownable, ReentrancyGuard {
    IBEP20 public immutable underlying; // USDT on BSC mainnet
    uint256 public immutable expiryTimestamp; // unix time when token expires (180 days from deploy)

    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

    constructor(address underlyingToken)
        ERC20(
            string.concat("Wrapped ", _readName(underlyingToken)),
            string.concat("w", _readSymbol(underlyingToken))
        )
        Ownable(msg.sender)
    {
        require(underlyingToken != address(0), "underlying=0");
        underlying = IBEP20(underlyingToken);
        // 180 days expiry
        expiryTimestamp = block.timestamp + 180 days;
    }

    function decimals() public view override returns (uint8) {
        // mirror underlying decimals (USDT is 18 on BSC? Actually USDT on BSC uses 18). We read dynamically
        return underlying.decimals();
    }

    // Read-only helpers to build token name/symbol at construction
    function _readName(address token) internal view returns (string memory) {
        try IBEP20(token).name() returns (string memory n) { return n; } catch { return "Token"; }
    }
    function _readSymbol(address token) internal view returns (string memory) {
        try IBEP20(token).symbol() returns (string memory s) { return s; } catch { return "TKN"; }
    }

    // User must approve `amount` of underlying to this contract before calling
    function deposit(uint256 amount) external nonReentrant {
        require(block.timestamp <= expiryTimestamp, "expired: deposit disabled");
        require(amount > 0, "amount=0");
        bool ok = underlying.transferFrom(msg.sender, address(this), amount);
        require(ok, "transferFrom failed");
        _mint(msg.sender, amount);
        emit Deposited(msg.sender, amount);
    }

    // Allows a USDT holder to deposit and mint to a different recipient
    function depositFor(address recipient, uint256 amount) external nonReentrant {
        require(block.timestamp <= expiryTimestamp, "expired: deposit disabled");
        require(recipient != address(0), "recipient=0");
        require(amount > 0, "amount=0");
        bool ok = underlying.transferFrom(msg.sender, address(this), amount);
        require(ok, "transferFrom failed");
        _mint(recipient, amount);
        emit Deposited(recipient, amount);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(amount > 0, "amount=0");
        _burn(msg.sender, amount);
        bool ok = underlying.transfer(msg.sender, amount);
        require(ok, "transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    // Owner can recover any tokens accidentally sent (except the underlying backing)
    function sweep(address token, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "to=0");
        require(token != address(underlying), "no sweep underlying");
        bool ok = IBEP20(token).transfer(to, amount);
        require(ok, "sweep failed");
    }

    // After expiry: disable transfers and new mints; allow burns (withdrawals) only
    function _update(address from, address to, uint256 value) internal override {
        if (block.timestamp > expiryTimestamp) {
            // Allow only burns after expiry (to == address(0))
            require(to == address(0), "expired: transfers/mints disabled");
        }
        super._update(from, to, value);
    }
}


