const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { ethers } = require("hardhat");
const { expect } = require("chai");

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

describe("Test Swapper contract", function () {

  let owner;
  let tokenA;
  let tokenB;
  let tokenC;
  let swapper;
  let AMOUNT_1000;
  let AMOUNT_1200;
  let AMOUNT_100;
  let AMOUNT_900;
  let AMOUNT_1100;

  before(async () => {

    [owner, user] = await ethers.getSigners();
    AMOUNT_50 = ethers.utils.parseUnits('50', 18);
    AMOUNT_100 = ethers.utils.parseUnits('100', 18);
    AMOUNT_150 = ethers.utils.parseUnits('150', 18);
    AMOUNT_900 = ethers.utils.parseUnits('900', 18);
    AMOUNT_1000 = ethers.utils.parseUnits('1000', 18);
    AMOUNT_1100 = ethers.utils.parseUnits('1100', 18);
    AMOUNT_1200 = ethers.utils.parseUnits('1200', 18);

    const TokenERC20 = await ethers.getContractFactory("TokenERC20");
    
    tokenA = await TokenERC20.deploy('MyTokenA', 'MTA');
    await tokenA.deployed();
  
    tokenB = await TokenERC20.deploy('MyTokenB', 'MTB');
    await tokenA.deployed();
  
    const Swapper = await ethers.getContractFactory("Swapper");
    
    swapper = await Swapper.deploy('MyTokenC', 'MTC');
    await swapper.deployed();
  })

  it("Mint 1000 tokens type A", async function () {
    await expect(tokenA.mint(owner.address, AMOUNT_1000))
      .to.emit(tokenA, 'Transfer')
      .withArgs(ADDRESS_ZERO, owner.address, AMOUNT_1000);
  });

  it("Mint 1200 tokens type B", async function () {
    await expect(tokenB.mint(user.address, AMOUNT_1200))
    .to.emit(tokenB, 'Transfer')
    .withArgs(ADDRESS_ZERO, user.address, AMOUNT_1200);
  });

  it("Check total supply token A", async function () {
    expect(await tokenA.totalSupply()).to.equal(AMOUNT_1000);
  });

  it("Check total supply token B", async function () {
    expect(await tokenB.totalSupply()).to.equal(AMOUNT_1200);
  });

  it("Increase allowance of token A for Swapper contract", async function () {
    await expect(tokenA.approve(swapper.address, AMOUNT_1000))
      .to.emit(tokenA, 'Approval')
      .withArgs(owner.address, swapper.address, AMOUNT_1000);
  });

  it("Increase allowance of token B for Swapper contract", async function () {
    await expect(tokenB.connect(user).approve(swapper.address, AMOUNT_1200))
      .to.emit(tokenB, 'Approval')
      .withArgs(user.address, swapper.address, AMOUNT_1200);
  });

  it("Get token C address", async function () {
    const addressTokenC = await swapper.getAddressTokenC();
    expect(ethers.utils.isAddress(addressTokenC)).to.be.true;
  });

  it("Swap token A for token C (owner)", async function () {
    const addressTokenC = await swapper.getAddressTokenC();
    await expect(swapper.swap(tokenA.address, AMOUNT_100))
      .to.emit(swapper, 'Swap')
      .withArgs(tokenA.address, AMOUNT_100, addressTokenC, AMOUNT_100);
  });

  it("Check balance token A of owner", async function () {
    expect(await tokenA.balanceOf(owner.address)).to.equal(AMOUNT_900);
  });

  it("Check balance token A of swapper contract", async function () {
    expect(await tokenA.balanceOf(swapper.address)).to.equal(AMOUNT_100);
  });

  it("Check balance token C of owner", async function () {
    const addressTokenC = await swapper.getAddressTokenC();
    tokenC = await ethers.getContractAt("TokenERC20", addressTokenC);
    expect(await tokenC.balanceOf(owner.address)).to.equal(AMOUNT_100);
  });

  it("Set a new token C price: 2", async function () {
    const newPrice = 2;
    await expect(swapper.setPriceTokenC(newPrice))
      .to.emit(swapper, 'NewPriceToken')
      .withArgs(newPrice);
  });

  it("Check the new token C price", async function () {
    const newPrice = 2;
    expect(await swapper.getPriceTokenC()).to.equal(newPrice);
  });

  it("Swap token B for token C (user)", async function () {
    const addressTokenC = await swapper.getAddressTokenC();
    await expect(swapper.connect(user).swap(tokenB.address, AMOUNT_100))
      .to.emit(swapper, 'Swap')
      .withArgs(tokenB.address, AMOUNT_100, addressTokenC, AMOUNT_50);
  });

  it("Check balance token B of user", async function () {
    expect(await tokenB.balanceOf(user.address)).to.equal(AMOUNT_1100);
  });

  it("Check balance token B of swapper contract", async function () {
    expect(await tokenB.balanceOf(swapper.address)).to.equal(AMOUNT_100);
  });

  it("Check balance token C of user", async function () {
    expect(await tokenC.balanceOf(user.address)).to.equal(AMOUNT_50);
  });

  it("Check total supply token C", async function () {
    expect(await tokenC.totalSupply()).to.equal(AMOUNT_150);
  });

  it("User increases allowance of token C for Swapper contract", async function () {
    await expect(tokenC.connect(user).approve(swapper.address, AMOUNT_50))
      .to.emit(tokenC, 'Approval')
      .withArgs(user.address, swapper.address, AMOUNT_50);
  });

  it("Unswap token B for token C (user)", async function () {
    const addressTokenC = await swapper.getAddressTokenC();
    await expect(swapper.connect(user).unswap(tokenB.address, AMOUNT_100))
      .to.emit(swapper, 'Swap')
      .withArgs(addressTokenC, AMOUNT_50, tokenB.address, AMOUNT_100);
  });

  it("Set a new token C price: 1", async function () {
    const newPrice = 1;
    await expect(swapper.setPriceTokenC(newPrice))
      .to.emit(swapper, 'NewPriceToken')
      .withArgs(newPrice);
  });

  it("Owner increases allowance of token C for Swapper contract", async function () {
    await expect(tokenC.connect(owner).approve(swapper.address, AMOUNT_100))
      .to.emit(tokenC, 'Approval')
      .withArgs(owner.address, swapper.address, AMOUNT_100);
  });

  it("Unswap token A for token C (owner)", async function () {
    const addressTokenC = await swapper.getAddressTokenC();
    await expect(swapper.connect(owner).unswap(tokenA.address, AMOUNT_100))
      .to.emit(swapper, 'Swap')
      .withArgs(addressTokenC, AMOUNT_100, tokenA.address, AMOUNT_100);
  });

  it("Check total supply token C is zero", async function () {
    expect(await tokenC.totalSupply()).to.equal(0);
  });

  it("Check total supply token A is initial supply", async function () {
    expect(await tokenA.totalSupply()).to.equal(AMOUNT_1000);
  });

  it("Check total supply token B is initial supply", async function () {
    expect(await tokenB.totalSupply()).to.equal(AMOUNT_1200);
  });

});