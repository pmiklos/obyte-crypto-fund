![build status](https://github.com/pmiklos/obyte-crypto-fund/actions/workflows/build.yml/badge.svg)
# Decentralized Cryptocurrency Fund

The Decentralized Crypto Fund is a collection of [Obyte Autonomous Agents](https://obyte.org/platform/autonomous-agents) that manage portfolios of assets on the Obyte distributed ledger.
These funds are able to incorporate assets from other chains, thanks to the [Counterstake](https://counterstake.org) cross-chain bridge,
making them truly cross-chain decentralized cryptocurrency funds.

These autonomous agents are abstract templates and so users are not supposed to interact with them directly. The community
need to deploy individually configured instances to track various baskets of assets, such as BTC and ETH or MATIC and BNB.
The funds work similarly, anyone can purchase shares in the fund by contributing one or more of the managed assets.
The number of shares issued is proportional to the value of the assets contributed and the assets held in the fund.

The circulating supply of shares represents the total value of the fund and can be traded on secondary exchanges.
Shareholders have the option to redeem their shares for the underlying assets in the same ratio as the assets are allocated in the fund.

It is important to note that the fund is managed by the community as a whole and does not have a specific fund manager.
Members of the community have the ability to add and remove assets from the fund at their discretion.

See also:
* [obyte-crypto-fund-ui](https://github.com/pmiklos/obyte-crypto-fund-ui) - a user interface for Decentralized Cryptocurrency Fund

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
