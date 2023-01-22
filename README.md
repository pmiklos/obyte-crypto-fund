![build status](https://github.com/pmiklos/obyte-crypto-fund/actions/workflows/build.yml/badge.svg)
# Decentralized Cryptocurrency Fund

A collection of Obyte Autonomous Agents that manage baskets of assets issued on the Obyte distributed ledger.
Thanks to the [Counterstake](https://counterstake.org) cross-chain bridge, assets from other chains can be imported to
Obyte and added to the fund creating a true cross-chain decentralized cryptocurrency fund.

The Fund agents are abstract base agents meaning after deployment various funds can be derived from it with different parameters.
For example one can set up a fund that tracks a basket of BTC and ETH while others may track MATIC and BNB.

An investor can purchase shares by sending one or more managed assets to the fund.
The circulating supply of shares represent the total value held by the fund and can be traded on secondary exchanges.
Investors can always redeem the underlying assets from the fund in the same value of their shares and in the same proportion the managed assets are allocated in the fund. 

Important to note that the fund is managed by the community as whole. There is no fund manager with privileged role.
Investors can add and remove assets from the fund whenever they feel doing so.

## Testing

Install project dependencies
```bash
yarn
```

Run all tests
```bash
yarn test:all
```

## Usage

### Creating new agents

Once the abstract base agent is deployed, a concrete agent can be configured with the following parameters:
```json
["autonomous agent", {
	"base_aa": "FB25TWXCDEKSZMCIZ3HIFORPV5ZHD4CC",
	"params": {
		"portfolio": [{
			"asset": "fSwaCprr3OSNHXTLDtOK3lflKEKvQi7ypWQSh1FfK1E=",
			"feed": "BTC_USD"
		}, {
			"asset": "3aw7r8dm0C/TG3w2CQGyCc8ukbMpeHJ/SXgbej/WXz8=",
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