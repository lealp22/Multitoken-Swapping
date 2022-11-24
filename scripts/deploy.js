// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const fs = require("fs");

console.log("==================");
console.log('Deploying Network: ', hre.network.name);
console.log("==================");

async function main() {

  const TokenERC20 = await hre.ethers.getContractFactory("TokenERC20");
  const tokenA = await TokenERC20.deploy('MyTokenA', 'MTA');

  await tokenA.deployed();
  console.log("TokenA deployed to:", tokenA.address);

  const tokenB = await TokenERC20.deploy('MyTokenB', 'MTB');

  await tokenA.deployed();
  console.log("TokenB deployed to:", tokenB.address);

  const Swapper = await hre.ethers.getContractFactory("Swapper");
  swapper = await Swapper.deploy('MyTokenC', 'MTC');

  await swapper.deployed();
  console.log("Swapper deployed to:", swapper.address);

  /* this code writes the contract addresses to a local */
  /* file named config.js that we can use in the app */
  fs.writeFileSync('./config.js', `
  export const addressTokenA = "${tokenA.address}"
  export const addressTokenB = "${tokenB.address}"
  export const addressSwapper = "${swapper.address}"
  export const addressOwner = "${swapper.signer.address}"
  export const networkName = "${hre.network.name}"
  `)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
