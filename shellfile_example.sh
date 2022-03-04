export DAI_USDC_WHALE=0x8639D7A9521AeDF18e5DC6a14c1c5CC1bfbE3BA0
export INFURA_API_KEY=YOUR_INFURA_API_KEY

ganache-cli \
--fork https://mainnet.infura.io/v3/$INFURA_API_KEY \
--unlock $DAI_USDC_WHALE \
--networkId 999