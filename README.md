# Challenge - Multitoken Swapping

### **Contracts created**:
- `Swapper.sol`
- `TokenERC20.sol`

---
### **MUMBAI deployment address**
---

`TokenA` (TokenERC20.sol): *0xd70e89800bf481644914E677865990FF30Ffc9eD*

`TokenB` (TokenERC20.sol): *0xbb29E734cc28C6433e53767b43D87386FA3d3140*

`TokenC` (TokenERC20.sol): *0xD4ce82Fd648647DaD3AC8D89b5efA515f390C887*

`Swapper` (Swapper.sol)  : *0x19bB169e2EA6792EA926B74dFb2D8a77CDD9B458*

Explorer: [https://mumbai.polygonscan.com/](https://mumbai.polygonscan.com/)

---
### Call Sequence

1. Deploy *tokenA* and *tokenB* contracts (both using `TokenERC20.sol`).
2. Deploy *swapper* contract (`Swapper.sol`). Take into account that *tokenC* contract is created by *swapper* contract at this step.
3. Mint enough tokens from *tokenA* and *tokenB* contracts (amount greater o equal than 100): `tokenA.mint(receiver address, amount)`
4. Approve *tokenA* and *tokenB* allowance for *swapper* contract (amount greater o equal than 100): `tokenA.approve(swapper.address, amount)`
5. Swap token A for token C: `swapper.swap(tokenA.address, 100)` // 1:1 - You receive 100 tokens C in exchange for 100 token A
6. Set a new price for token C as 2: `swapper.setPriceTokenC(2)` // Swap 2 tokens A or B x 1 token C
7. Swap token B for token C: `swapper.swap(tokenB.address, 100)` // 2:1 - You receive 50 tokens C in exchange for 100 token B
8. Approve token C allowance for *swapper* contract (amount greater o equal than 50): 
    ```shell
    const addressTokenC = await swapper.getAddressTokenC();
    tokenC = await ethers.getContractAt("TokenERC20", addressTokenC);
    tokenC.approve(swapper.address, 50)
    ```
9. Unswap token B for token C: `swapper.unswap(tokenB.address, 100)` // 2:1 - You obtain 100 tokens B in exchange for 50 tokens C
10. Set a new price for token C as 1: `swapper.setPriceTokenC(1)` // Swap 1 token A or B x 1 token C
11. Approve token c allowance for *swapper* contract (amount greater o equal than 100): `tokenC.approve(swapper.address, 100)`
12. Unswap token A for token C: `swapper.unswap(tokenA.address, 100)` // 1:1 - You obtain 100 tokens A in exchange for 100 tokens C
13. At this step, the total supply for token C must be zero.

All these steps have been tested using the script `test/test-swapper.js` (It can be used as reference).

Commands:
- `npm run test`
- `npx hardhat test`


