<p align="center">
<img src="https://i.ibb.co/KjxwNmh/2020-11-16-14-18-35.jpg" width="500" height="300" />
</p>

<h1 align="center">PrimeDAO Liquidity Mining</h1>

> 🤖 Smart contracts for [Prime’s First Liquidity Mining Program](https://medium.com/primedao/primes-first-liquidity-mining-program-b8e4abb6c63)

In order to bootstrap liquidity for the PRIME token, PrimeDAO will initiate a liquidity mining program — alternatively known as yield farming — for a Balancer pool. The program will start on November 20th, 2020 and last 1 month.

Over this period, 500,000 PRIME (approximately 16,666 PRIME/day) will be distributed to participants who stake BPRIME in this contract.

`StakingRewards.sol` contract is a fork of the [StakingRewards contract](https://github.com/Synthetixio/synthetix/blob/develop/contracts/StakingRewards.sol) developed by [Synthetix](https://github.com/Synthetixio/synthetix) with few adjustments made to best suit PrimeDAO's needs. The key differences are:

- The `notifyRewardAmount` function is called only on contract initialization. Since the rewards scheme runs for only a month with a fixed reward rate, there is no need to top up the reward over time. The function has thus also been made `internal` to reduce the overall attack surface of the contract.
- The contract no longer inherits from `RewardDistributionRecipient`, as this is no longer needed due to the changes with `notifyRewardAmount`.


## Setting up

Install dependencies

```bash
npm i
```

## Testing

Run tests with

```bash
npm run test
```

## Contributing to PrimeDAO
If you wish to contribute to PrimeDAO, check out our [Contributor Onboarding documentation](https://docs.primedao.io/primedao/call-for-contributors).

## License
```
Copyright 2020 Prime Foundation

Licensed under the GNU General Public License v3.0.
You may obtain a copy of this license at:

  https://www.gnu.org/licenses/gpl-3.0.en.html

```
