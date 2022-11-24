// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./TokenERC20.sol";

/**
 *  @title Multitoken Swapping
 *  @author Jesús Leal
 *  @notice The user should be able to swap either of the two tokens for a single token of their choice.
 *          For example, you can swap token A or token B for token C. Swaps should also be possible in the
 *          reverse direction. Token C can be exchanged for token A or token B. The exchange rate is 1:1 by
 *          default. Input side ERC20 tokens (A and B) do not need to swappable for each other. No method is
 *          needed to swap A <=> B.
 *          A || B <==> C
 */
contract Swapper is Pausable, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeERC20 for TokenERC20;

    // ********************
    // Variables
    // ********************
    uint256 swapPrice = 1; // Initialized default value

    // ********************
    // Variables for contracts
    // ********************
    TokenERC20 internal immutable contractTokenC;

    // ********************
    // Events
    // ********************
    /**
     * @notice Emitted when price is updated
     * @param newPrice New price amount
     */
    event NewPriceToken(uint256 newPrice);
    /**
     * @notice Emitted when a swap is completed
     * @param tokenIn Address input token
     * @param amountIn Amount input token
     * @param tokenOut Address output token
     * @param amountOut Amount output token
     */
    event Swap(
        address indexed tokenIn,
        uint256 amountIn,
        address indexed tokenOut,
        uint256 amountOut
    );

    /** ***************************************************************************************************
     * @notice Constructor (Container creation)
     * @dev A new token is created when run the constructor function. This token will be swapped (or unswapped)
     * for any other token that is given as input, based on the price defined by swapPrice variable (The exchange
     * rate is 1:1 by default)
     * @param name_ Name for token created in this function
     * @param symbol_ Symbol for token created in this function
     **************************************************************************************************** */
    constructor(string memory name_, string memory symbol_) {
        require(bytes(name_).length > 0, "Token name is empty");
        require(bytes(symbol_).length > 0, "Token symbol is empty");

        contractTokenC = new TokenERC20(name_, symbol_);
    }

    /**
     * @notice Convert an amount of input token_ to an equivalent amount of the output token
     *
     * @param tokenIn_ address of token to swap
     * @param amountIn_ amount of token to swap/receive
     */
    function swap(address tokenIn_, uint256 amountIn_)
        external
        nonReentrant
        whenNotPaused
    {
        _validateAddressNotEmpty(tokenIn_);
        _validateAmountNotZero(amountIn_);

        IERC20 contractTokenIn_ = IERC20(tokenIn_);
        require(
            amountIn_ <= contractTokenIn_.balanceOf(msg.sender),
            "Insufficient balance"
        );
        require(
            amountIn_ <= contractTokenIn_.allowance(msg.sender, address(this)),
            "Insufficient allowance"
        );
        contractTokenIn_.safeTransferFrom(msg.sender, address(this), amountIn_);

        uint256 amountOut_ = _calculateAmount(amountIn_, swapPrice);
        contractTokenC.mint(msg.sender, amountOut_);

        emit Swap(tokenIn_, amountIn_, address(contractTokenC), amountOut_);
    }

    /**
     * @notice Convert an amount of output token to an equivalent amount of the input token_
     *
     * @param tokenOut_ address of token to receive
     * @param amountOut_ amount of token to swap/receive
     */
    function unswap(address tokenOut_, uint256 amountOut_)
        external
        nonReentrant
        whenNotPaused
    {
        _validateAddressNotEmpty(tokenOut_);
        _validateAmountNotZero(amountOut_);

        address addressThis_ = address(this);
        address msgSender_ = msg.sender;
        uint256 amountIn_ = _calculateAmount(amountOut_, swapPrice);

        require(
            amountIn_ <= contractTokenC.balanceOf(msgSender_),
            "Insufficient balance"
        );
        require(
            amountIn_ <= contractTokenC.allowance(msgSender_, addressThis_),
            "Insufficient allowance"
        );

        IERC20 contractTokenOut_ = IERC20(tokenOut_);

        contractTokenC.safeTransferFrom(msgSender_, addressThis_, amountIn_);
        contractTokenC.burn(amountIn_);

        contractTokenOut_.safeTransfer(msgSender_, amountOut_);

        emit Swap(address(contractTokenC), amountIn_, tokenOut_, amountOut_);
    }

    /**
     * @notice Set a new price for tokenC
     *
     * @param newSwapPrice_ New price amout used for swapping
     */
    function setPriceTokenC(uint256 newSwapPrice_)
        external
        nonReentrant
        whenNotPaused
        onlyOwner
    {
        require(newSwapPrice_ > 0, "New price is zero");
        swapPrice = newSwapPrice_;
        emit NewPriceToken(swapPrice);
    }

    /**
     * @notice Pause the contract (only allowed to the DEFAULT_ADMIN_ROLE)
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract (only allowed to the DEFAULT_ADMIN_ROLE)
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Get the current price for TokenC
     *
     * @return Current price
     */
    function getPriceTokenC() external view returns (uint256) {
        return swapPrice;
    }

    /**
     * @notice Get the token C contract address
     *
     * @return Contract address
     */
    function getAddressTokenC() external view returns (address) {
        return address(contractTokenC);
    }

    /**
     * @notice Validate an address is not zero
     */
    function _validateAddressNotEmpty(address inputAddress_) internal pure {
        require(inputAddress_ != address(0), "Input address is empty");
    }

    /**
     * @notice Validate an amount is not zero
     */
    function _validateAmountNotZero(uint256 amount_) internal pure {
        require(amount_ != 0, "Input amount is zero");
    }

    /**
     * @notice Calculate amount for swapping based on token C current price
     */
    function _calculateAmount(uint256 amount_, uint256 price_)
        internal
        pure
        returns (uint256)
    {
        return (amount_ / price_);
    }
}
