const LiquidityExamples = artifacts.require("LiquidityExamples");
const IERC20 = artifacts.require("IERC20");
const IERC721 = artifacts.require("IERC721");
const BN = web3.utils.BN;

contract("checks balances of DAI_USDC_WHALE", accounts => {

    it("checks stablecoin balances of DAI_USDC_WHALE", async () => {
        const DAI_USDC_WHALE = "0x8639D7A9521AeDF18e5DC6a14c1c5CC1bfbE3BA0";
        const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
        const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

        const DAI_Contract = await IERC20.at(DAI);
        const USDC_Contract = await IERC20.at(USDC);

        const DAI_Balance = await DAI_Contract.balanceOf(DAI_USDC_WHALE);
        console.log("DAI balance of whale", DAI_Balance.toString());

        const USDC_Balance = await USDC_Contract.balanceOf(DAI_USDC_WHALE);
        console.log("USDC balance of whale", USDC_Balance.toString());

        assert((DAI_Balance).gt(new BN(0)));
        assert((USDC_Balance).gt(new BN(0)));
    })
})

contract("LiquidityExample", accounts => {

    let DAI_USDC_WHALE, DAI, USDC, nonfungiblePositionManagerAddress;
    let DAI_Contract, USDC_Contract, liquidityExamples;
    let tokenID, amount0Deposited;

    before(async () => {
        DAI_USDC_WHALE = "0x8639D7A9521AeDF18e5DC6a14c1c5CC1bfbE3BA0";
        DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
        USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
        nonfungiblePositionManagerAddress = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

        DAI_Contract = await IERC20.at(DAI);
        USDC_Contract = await IERC20.at(USDC);

        const ethValue = web3.utils.toWei("1", "ether");
        await web3.eth.sendTransaction({ from: accounts[0], to: DAI_USDC_WHALE, value: ethValue });

        const ethBalance = await web3.eth.getBalance(DAI_USDC_WHALE);
        console.log("eth balance of DAI_USDC_WHALE after transfer from accounts[0] =", ethBalance.toString());

        liquidityExamples = await LiquidityExamples.new(nonfungiblePositionManagerAddress, "Test", "TT", { from: DAI_USDC_WHALE });
        console.log("LiquidityExample.address -", liquidityExamples.address);
    })

    it("approves LiquidityExamples contract to spend DAI, USDC on behalf of DAI_USDC_WHALE", async () => {
        const DAI_Balance = await DAI_Contract.balanceOf(DAI_USDC_WHALE);
        // console.log("DAI balance of DAI_USDC_WHALE =", DAI_Balance.toString());

        const USDC_Balance = (await USDC_Contract.balanceOf(DAI_USDC_WHALE));
        // console.log("USDC balance of DAI_USDC_WHALE =", USDC_Balance.toString());

        await DAI_Contract.approve(liquidityExamples.address, DAI_Balance, { from: DAI_USDC_WHALE });
        await USDC_Contract.approve(liquidityExamples.address, USDC_Balance, { from: DAI_USDC_WHALE });

        const DAI_allowance = await DAI_Contract.allowance(DAI_USDC_WHALE, liquidityExamples.address, { from: DAI_USDC_WHALE });
        const USDC_allowance = await USDC_Contract.allowance(DAI_USDC_WHALE, liquidityExamples.address, { from: DAI_USDC_WHALE });

        // console.log("DAI allowance to LiquidityExamples =", DAI_allowance.toString());
        // console.log("USDC allowance to LiquidityExamples =", USDC_allowance.toString());

        assert(DAI_allowance.eq(DAI_Balance));
        assert(USDC_allowance.eq(USDC_Balance));
    })

    it("checks that mintNewPosition creates an entry in the deposits mapping", async () => {
        const transaction = await liquidityExamples.mintNewPosition({ from: DAI_USDC_WHALE });
        //console.log(transaction.logs);

        for (let i = 0; i < transaction.logs.length; i++) {
            if (transaction.logs[i].event === "deposited") {
                // console.log("tokenID", transaction.logs[i].args[1].toString());
                tokenID = transaction.logs[i].args[1].toString();
            }

            if (transaction.logs[i].event === "amount0added") {
                //console.log("amount0/DAI deposited", transaction.logs[i].args[0].toString());
                amount0Deposited = transaction.logs[i].args[0];
            }
        }

        let depositStruct = await liquidityExamples.deposits(tokenID);

        // console.log("associated liquidity =", depositStruct.liquidity.toString());
        // console.log("owner =", depositStruct.owner);
        // console.log("token0Address =", depositStruct.token0);
        // console.log("token1Address =", depositStruct.token1);
        // console.log("minted Amount =", depositStruct.mintedAmount.toString());

        assert.equal(depositStruct.owner, DAI_USDC_WHALE);
        assert.equal(depositStruct.token0, DAI);
        assert.equal(depositStruct.token1, USDC);

        assert((depositStruct.liquidity).gt(new BN(0)));
        assert((depositStruct.mintedAmount).gt(new BN(0)));
    })

    it("checks that minted TT tokens equals twice the number of DAI/token0 tokens", async () => {
        const testToken = await IERC20.at(liquidityExamples.address);
        const DAI_USDC_WHALE_balance = (await testToken.balanceOf(DAI_USDC_WHALE));

        // console.log("Test token balance of DAI_USDC_WHALE =", DAI_USDC_WHALE_balance.toString());
        // console.log("amount0Deposited =", amount0Deposited.toString());

        const diff = (DAI_USDC_WHALE_balance.sub(amount0Deposited.mul(new BN(2))));
        const diffInDecimals = diff.div(new BN(10).pow(new BN(18)));

        assert(diffInDecimals.eq(new BN(0)));
    })

    it("checks that the LiquidtyExamples contract no longer has the token(DAI, USDC) balances after mintNewPosition is called", async () => {
        const DAI_Balance = await DAI_Contract.balanceOf(liquidityExamples.address);
        const USDC_Balance = await USDC_Contract.balanceOf(liquidityExamples.address);

        assert(DAI_Balance.eq(new BN(0)));
        assert(USDC_Balance.eq(new BN(0)));
    })

    it("on calling retrievesNFT the owner of the token is changed to DAI_USDC_WHALE", async () => {
        const NFTContract = await IERC721.at(nonfungiblePositionManagerAddress);
        const originalOwner = await NFTContract.ownerOf(tokenID);

        await liquidityExamples.retrieveNFT(tokenID, { from: DAI_USDC_WHALE });
        const newOwner = await NFTContract.ownerOf(tokenID);

        assert(originalOwner, liquidityExamples.address);
        assert(newOwner, DAI_USDC_WHALE);
    })

    it("retrieving NFT burns the Test tokens owned by DAI_USDC_WHALE", async () => {
        const DAI_USDC_WHALE_balance = await liquidityExamples.balanceOf(DAI_USDC_WHALE);
        assert(DAI_USDC_WHALE_balance.eq(new BN(0)));
    })


    it("retrieving NFT deletes Deposit struct(with tokenID as the key) from deposits mapping", async () => {
        let depositStruct = await liquidityExamples.deposits(tokenID);
        assert.equal(depositStruct.owner, "0x0000000000000000000000000000000000000000");
        assert.equal(depositStruct.token0, "0x0000000000000000000000000000000000000000");
        assert.equal(depositStruct.token1, "0x0000000000000000000000000000000000000000");

        assert((depositStruct.liquidity).eq(new BN(0)));
        assert((depositStruct.mintedAmount).eq(new BN(0)));
    })
})