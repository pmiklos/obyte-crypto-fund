![build status](https://github.com/pmiklos/obyte-crypto-fund/actions/workflows/build.yml/badge.svg)
# Decentralized Cryptocurrency Fund

A collection of Obyte Autonomous Agents that manage baskets of assets issued on the Obyte distributed ledger.
Thanks to the [Counterstake](https://counterstake.org) cross-chain bridge, assets from other chains can be imported to
Obyte and added to the fund creating a true cross-chain decentralized cryptocurrency fund.

The Fund agents are abstract base agents meaning after deployment various funds can be derived from it with different parameters.
For example one can set up a fund that tracks a basket of BTC and ETH while others may track MATIC and BNB.

Anyone can purchase shares by sending one or more managed assets to the fund.
The shares issued by the fund is proportionate to the contributed assets and the assets held by the fund.
The circulating supply of shares represent the total value held by the fund and can be traded on secondary exchanges.
Shareholders can always redeem the underlying assets from the fund, in exchange for the shares, in the same ratio the managed assets are allocated in the fund. 

Important to note that the fund is managed by the community as whole with no particular fund manager.
Anyone can add and remove assets from the fund whenever they feel doing so.

## Testing

Install project dependencies
```bash
yarn
```

Run all tests
```bash
yarn test:all
```

## Types of Funds

### Fixed Allocation Fund

The Fixed Allocation Fund operates with a predetermined asset allocation that remains constant after deployment.
New shares can only be issued when a contribution is made in the assets managed by the fund and in a proportion that aligns with the established allocation.

This approach offers a significant advantage, as the fund does not need to rely on external sources such as price oracles, which can be subject to manipulation.
The issuance of new shares can be calculated without the need to convert assets to a common value such as USD.

It is important to note that shares can only be obtained through a multi-asset contribution in the exact ratio of the established allocation.
This may present a challenge for some, as they would need to acquire all assets in the proper proportion.

For the success of this type of fund, it requires active participation from the community, who can issue shares for resale on secondary markets through contributing to the fund.
This may be driven by the desire to take advantage of arbitrage opportunities or even earn a fee for selling shares.

## Usage

### Deploying fixed allocation funds

Once the abstract base agent is deployed, a concrete agent can be configured with the following parameters:
```json
["autonomous agent", {
	"base_aa": "YSOBOFK4AVXHYV2GC7MVZMOYCNKP52TX",
	"params": {
		"portfolio": [{
			"asset": "fSwaCprr3OSNHXTLDtOK3lflKEKvQi7ypWQSh1FfK1E=",
			"percentage": 0.95
		}, {
			"asset": "3aw7r8dm0C/TG3w2CQGyCc8ukbMpeHJ/SXgbej/WXz8=",
			"percentage": 0.05
		}]
	}
}]
```

The `portfolio` refers to the collection of assets that are being managed.
It is imperative that the `percentage` values assigned to each asset in the portfolio total to 1, to ensure correct operation of the fund.

It is important to note that custom assets can be created with varying decimal places, which can significantly impact the percentage allocation.
For example, 1000 units of an asset could be represented as 10.00, 1.000, or even 0.1000 depending on the number of decimal places used.

As an illustration, consider a fund with two assets, Bitcoin (BTC) and Ethereum (ETH), that seeks to represent their current market capitalization.
Assuming a max supply of 21,000,000 BTC and 122,000,000 ETH, the fund is set up to hold these assets in that ratio.
However, the number of decimal places used for BTC and ETH may differ, such as 8 decimal places for BTC and 6 decimal places for ETH, resulting in 21,000,000.00000000 BTC and 122,000,000.000000 ETH.

Given that asset amounts are expressed in their minor units, this translates to a max supply of 2,100,000,000,000,000 for BTC and 122,000,000,000,000 for ETH.
To maintain the ratio in the fund, the respective percentages would be calculated as follows:

* 2,100,000,000,000,000 / (2,100,000,000,000,000 + 122,000,000,000,000) = 0.9450945095 for BTC
* 122,000,000,000,000,000 / (2,100,000,000,000,000 + 122,000,000,000,000) = 0.0549054905 for ETH

### Deploying dynamic allocation funds

Once the abstract base agent is deployed, a concrete agent can be configured with the following parameters:
```json
["autonomous agent", {
	"base_aa": "FB25TWXCDEKSZMCIZ3HIFORPV5ZHD4CC",
	"params": {
		"portfolio": [{
			"asset": "fSwaCprr3OSNHXTLDtOK3lflKEKvQi7ypWQSh1FfK1E=",
			"decimals": 8,
			"feed": "BTC_USD"
		}, {
			"asset": "3aw7r8dm0C/TG3w2CQGyCc8ukbMpeHJ/SXgbej/WXz8=",
			"decimals": 6,
			"feed": "ETH_USD"
		}],
		"oracle": "BAYMZX2FORMWKJ7QWP54HP37GJGL2OAG"
	}
}]
```

The `portfolio` describes the basket of assets under management. Note, that the number of assets must match the max number of assets declared by the base agent.
Each portfolio entry defines the Obyte asset hash and the name of the data fee the `oracle` publishes exchange rate information.

Each price feed must be quoted in the same currency otherwise calculating the investment and portfolio values would make no sense.
In the example above, both BTC and ETH are quoted in USD and so the portfolio value is expressed in USD as well.