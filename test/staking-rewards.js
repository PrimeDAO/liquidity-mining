/*global artifacts, web3, contract, before, it, context*/
/*eslint no-undef: "error"*/

const { expect } = require('chai');
const { constants, time, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const StakingRewards = artifacts.require('StakingRewards');
const ERC20 = artifacts.require('ERC20Mock');

const { toWei } = web3.utils;


contract('StakingRewards', (accounts) => {
    let incentives;
    let stakingRewards;
    let rewardToken;
    let stakingToken;

    let stakeAmount;
    let halfStake;
    let quarterStake
    let irregularStake;
    let irregularStake2;
    let tinyStake;
    let rewardAmount;
    let _initreward = (BigInt(925 * 100 * 1000000000000000000)).toString(); // "92500000000000003145728"
    let _starttime = 1600560000; // 2020-09-20 00:00:00 (UTC +00:00)
    let _durationDays = 7;
    let initTime;
    let _badReward;

    before('!! deploy setup', async () => {
        stakingRewards = await StakingRewards.new();
        rewardToken = await ERC20.new('Reward token', 'REWARD', 18);
        stakingToken = await ERC20.new('Staking token', 'STAKING', 18)
    });
    context('» contract is not initialized yet', () => {
        context('» parameters are valid', () => {
            before('!! fund contract', async () => {
                await rewardToken.transfer(stakingRewards.address, _initreward);
            });
            it('it initializes contract', async () => {
                await stakingRewards.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, _durationDays);
            });
        });
        context('» deploying account is owner', () => {
            it('returns correct owner', async () => {
                expect(accounts[0]).to.equal(await stakingRewards.owner());
            });
        });
        context('» periodFinish == 0 on deployment', () => {
            before('!! deploy contract', async () => {
                incentives = await StakingRewards.new();
            });
            it(' == 0', async () => {
                expect((await incentives.periodFinish()).toNumber()).to.equal(0);
            });
        });
        context('» reward token parameter is not valid', () => {
            before('!! deploy contract', async () => {
                incentives = await StakingRewards.new();
            });
            it('it reverts', async () => {
                await expectRevert(incentives.initialize(constants.ZERO_ADDRESS, stakingToken.address, _initreward, _starttime, _durationDays), 'StakingRewards: rewardToken cannot be null');
            });
        });
        context('» staking token parameter is not valid', () => {
            before('!! deploy contract', async () => {
                incentives = await StakingRewards.new();
            });
            it('it reverts', async () => {
                await expectRevert(incentives.initialize(rewardToken.address, constants.ZERO_ADDRESS, _initreward, _starttime, _durationDays), 'StakingRewards: stakingToken cannot be null');
            });
        });
        context('» _initreward parameter is not valid: 0', () => {
            before('!! deploy contract', async () => {
                incentives = await StakingRewards.new();
            });
            it('it reverts', async () => {
                await expectRevert(incentives.initialize(rewardToken.address, stakingToken.address, 0, _starttime, _durationDays), 'StakingRewards: initreward cannot be null');
            });
        });
        context('» _starttime parameter is not valid: 0', () => {
            before('!! deploy contract', async () => {
                incentives = await StakingRewards.new();
            });
            it('it reverts', async () => {
                await expectRevert(incentives.initialize(rewardToken.address, stakingToken.address, _initreward, 0, _durationDays), 'StakingRewards: starttime cannot be null');
            });
        });
        context('» _durationDays parameter is not valid: 0', () => {
            before('!! deploy contract', async () => {
                incentives = await StakingRewards.new();
            });
            it('it reverts', async () => {
                await expectRevert(incentives.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, 0), 'StakingRewards: duration cannot be null');
            });
        });
        context('» contract is not properly funded before initialization: 0 funding', async () => {
            before('!! deploy contract', async () => {
                incentives = await StakingRewards.new();
            });
            it('it reverts', async () => {
                await expectRevert(incentives.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, _durationDays), 'StakingRewards: wrong reward amount supplied');
            });
        });
        context('» contract is not properly funded before intialization: wrong amount', async () => {
            before('!! deploy contract', async () => {
                incentives = await StakingRewards.new();
                _badReward = (BigInt(924.9 * 100 * 1000000000000000000)).toString();
            });
            it('it reverts', async () => {
                await rewardToken.transfer(incentives.address, _badReward);
                await expectRevert(incentives.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, _durationDays), 'StakingRewards: wrong reward amount supplied');
            });
        });
    });
    context('» contract is already initialized', () => {
        // contract has already been initialized during setup
        it('it reverts', async () => {
            await expectRevert(stakingRewards.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, _durationDays), 'StakingRewards: contract already initialized');
        });
    });
    context('# stake', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                stakingRewards = await StakingRewards.new();
                rewardToken = await ERC20.new('Reward token', 'REWARD', 18);
                stakingToken = await ERC20.new('Staking token', 'STAKING', 18)
                stakeAmount = toWei('100');
            });
            context('» contract is not initialized', () => {
                before('!! deploy contract', async () => {
                    incentives = await StakingRewards.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        incentives.stake(stakeAmount),
                        'StakingRewards: contract not initialized'
                    );
                });
            });
            context('» stake parameter is not valid', () => {
                before('!! fund & initialize contract', async () => {
                    await rewardToken.transfer(stakingRewards.address, _initreward);
                    await stakingRewards.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, _durationDays);
                });
                it('it reverts', async () => {
                    await expectRevert(
                        stakingRewards.stake(toWei('0')),
                        'StakingRewards: cannot stake 0'
                    );
                });
            });
            context('» stake parameter is valid: stakes tokens', () => {
                before('!! fund accounts', async () => {
                    await stakingToken.transfer(accounts[1], stakeAmount);
                    await stakingToken.approve(stakingRewards.address, stakeAmount, { from: accounts[1] });
                    expect((await stakingToken.balanceOf(stakingRewards.address)).toString()).to.equal(toWei('0'));
                    expect((await stakingToken.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                });
                it('stakes', async () => {
                    let tx = await stakingRewards.stake(stakeAmount, { from: accounts[1] });
                    await expectEvent.inTransaction(tx.tx, stakingRewards, 'Staked'); //tx # , contract, event (as string)
                    expect((await stakingToken.balanceOf(stakingRewards.address)).toString()).to.equal(stakeAmount);
                    expect((await stakingToken.balanceOf(accounts[1])).toString()).to.equal(toWei('0'));
                });
            });
        });
    });
    context('# withdraw', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                stakingRewards = await StakingRewards.new();
                rewardToken = await ERC20.new('Reward token', 'REWARD', 18);
                stakingToken = await ERC20.new('Staking token', 'STAKING', 18)
                stakeAmount = toWei('100');
                halfStake = toWei('50');
            });
            context('» contract is not initialized', () => {
                before('!! deploy contract', async () => {
                    incentives = await StakingRewards.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        incentives.stake(stakeAmount),
                        'StakingRewards: contract not initialized'
                    );
                });
            });
            context('» withdraw parameter is not valid: too low', () => {
                before('!! fund & initialize contract', async () => {
                    await rewardToken.transfer(stakingRewards.address, _initreward);
                    await stakingRewards.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, _durationDays);
                });
                it('it reverts', async () => {
                    await expectRevert(
                        stakingRewards.withdraw(toWei('0')),
                        'StakingRewards: Cannot withdraw 0'
                    );
                });
            });
            context('» withdraw parameter is valid: withdraws entire stake', () => {
                before('!! fund accounts and stake', async () => {
                    await stakingToken.transfer(accounts[1], stakeAmount);
                    await stakingToken.approve(stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await stakingRewards.stake(stakeAmount, { from: accounts[1] });
                });
                it('withdraws', async () => {
                    expect((await stakingToken.balanceOf(stakingRewards.address)).toString()).to.equal(stakeAmount);
                    let tx = await stakingRewards.withdraw(stakeAmount, { from: accounts[1] });
                    await expectEvent.inTransaction(tx.tx, stakingRewards, 'Withdrawn');
                    expect((await stakingToken.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                    expect((await stakingToken.balanceOf(stakingRewards.address)).toString()).to.equal(toWei('0'));
                });
            });
            context('» withdraw parameter is valid: withdraws some of stake', () => {
                before('!! repopulate account and stake', async () => {
                    await stakingToken.approve(stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await stakingRewards.stake(stakeAmount, { from: accounts[1] });
                });
                it('withdraws', async () => {
                    let tx = await stakingRewards.withdraw(halfStake, { from: accounts[1] });
                    await expectEvent.inTransaction(tx.tx, stakingRewards, 'Withdrawn');
                    expect((await stakingToken.balanceOf(stakingRewards.address)).toString()).to.equal(halfStake);
                    expect((await stakingToken.balanceOf(accounts[1])).toString()).to.equal(halfStake);
                });
            });
        });
    });
    context('# getReward', () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                stakingRewards = await StakingRewards.new();
                rewardToken = await ERC20.new('Reward token', 'REWARD', 18);
                stakingToken = await ERC20.new('Staking token', 'STAKING', 18)
                stakeAmount = toWei('100');
                rewardAmount = toWei('100');
            });
            context('» contract is not initialized', () => {
                before('!! deploy contract', async () => {
                    incentives = await StakingRewards.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        incentives.getReward( { from: accounts[1] }),
                        'StakingRewards: contract not initialized'
                    );
                });
            });
            context('» getReward param valid: rewards 0', async () => {
                before('!! fund & initialize contract', async () => {
                    await rewardToken.transfer(stakingRewards.address, _initreward);
                    await stakingRewards.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, _durationDays);
                });
                it('rewards 0', async () => {
                    expect((await stakingRewards.earned(accounts[1])).toString()).to.equal(toWei('0'));
                    await stakingRewards.getReward( { from: accounts[1]} );
                    expect((await stakingRewards.earned(accounts[1])).toString()).to.equal(toWei('0'));
                });
            });
            context('» getReward param valid: rewards', async () => {
                before('!! fund accounts', async () => {
                    await stakingToken.transfer(accounts[1], stakeAmount);
                    await stakingToken.approve(stakingRewards.address, stakeAmount, { from: accounts[1] });
                    expect((await stakingToken.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                    expect((await rewardToken.balanceOf(stakingRewards.address)).toString()).to.equal(_initreward);
                    await rewardToken.approve(accounts[1], rewardAmount);
                });
                it('rewards after time period', async () => {
                    /* not staked - no reward earned */
                    expect((await stakingRewards.earned(accounts[1])).toString()).to.equal(toWei('0'));
                    /* stake */
                    await stakingRewards.stake(stakeAmount, { from: accounts[1] });
                    /* fast-forward 1 week */
                    await time.increase(time.duration.weeks(1));
                    let earned = BigInt(await stakingRewards.earned(accounts[1]));
                    let tx = await stakingRewards.getReward( { from: accounts[1] } );
                    await expectEvent.inTransaction(tx.tx, stakingRewards, 'RewardPaid');
                    let balance = BigInt(await rewardToken.balanceOf(accounts[1]));
                    expect(earned).to.equal(balance);
                });
            });
        });
    });
    context('# exit', async () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                stakingRewards = await StakingRewards.new();
                rewardToken = await ERC20.new('Reward token', 'REWARD', 18);
                stakingToken = await ERC20.new('Staking token', 'STAKING', 18)
                stakeAmount = toWei('100');
                halfStake = toWei('50');
                rewardAmount = toWei('100');
            });
            context('» contract is not initialized', () => {
                before('!! deploy contract', async () => {
                    incentives = await StakingRewards.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        incentives.exit(),
                        'StakingRewards: contract not initialized'
                    );
                });
            });
            context('» cannot exit with 0', async () => {
                before('!! fund & initialize contract', async () => {
                    await rewardToken.transfer(stakingRewards.address, _initreward);
                    await stakingRewards.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, _durationDays);
                });
                it('cannot exit with no funds', async () => {
                    await expectRevert(
                        stakingRewards.exit( {from: accounts[1] }),
                        'StakingRewards: Cannot withdraw 0.'
                    );
                });
            });
            context('» it exits successfully', () => {
                before('!! fund accounts and stake', async () => {
                    await stakingToken.transfer(accounts[1], stakeAmount);
                    await stakingToken.approve(stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await stakingRewards.stake(stakeAmount, { from: accounts[1] });
                });
                it('exits successfully where reward is 0', async () => {
                    let tx = await stakingRewards.exit( {from: accounts[1] });
                    await expectEvent.inTransaction(tx.tx, stakingRewards, 'Withdrawn');
                    expect((await stakingToken.balanceOf(stakingRewards.address)).toString()).to.equal(toWei('0'));
                    expect((await stakingToken.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                });
                it('exits successfully where reward is > 0', async () => {
                    await stakingToken.approve(stakingRewards.address, stakeAmount, { from: accounts[1] });
                    await rewardToken.transfer(stakingRewards.address, rewardAmount);
                    await rewardToken.approve(accounts[1], rewardAmount);

                    await stakingRewards.stake(stakeAmount, { from: accounts[1] });
                    await time.increase(time.duration.weeks(1));

                    let rewardEarned = BigInt(await stakingRewards.earned(accounts[1]));
                    let tx = await stakingRewards.exit( {from: accounts[1] });
                    await expectEvent.inTransaction(tx.tx, stakingRewards, 'Withdrawn');
                    await expectEvent.inTransaction(tx.tx, stakingRewards, 'RewardPaid');
                    let balance = BigInt(await rewardToken.balanceOf(accounts[1]));
                    expect(rewardEarned).to.equal(balance);
                    expect((await stakingToken.balanceOf(stakingRewards.address)).toString()).to.equal(toWei('0'));
                    expect((await stakingToken.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                });
            });
        });
    });
    context('# rescueTokens', async () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                stakingRewards = await StakingRewards.new();
                rewardToken = await ERC20.new('Reward token', 'REWARD', 18);
                stakingToken = await ERC20.new('Staking token', 'STAKING', 18)
                rescueToken = await ERC20.new('Rescue token', 'RESCUE', 18)
                stakeAmount = toWei('100');
                rewardAmount = toWei('100');
            });
            context('» contract is not initialized', () => {
                before('!! deploy contract', async () => {
                    incentives = await StakingRewards.new();
                });
                it('it reverts', async () => {
                    await expectRevert(
                        incentives.rescueTokens(rescueToken.address, stakeAmount, accounts[1]),
                        'StakingRewards: contract not initialized'
                    );
                });
            });
            context('» rescueTokens token parameter is not valid: governance', () => {
                before('!! fund & initialize contract', async () => {
                    await rewardToken.transfer(stakingRewards.address, _initreward);
                    await stakingRewards.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, _durationDays);
                });
                it('it reverts', async () => {
                    await expectRevert(
                        stakingRewards.rescueTokens(rescueToken.address, stakeAmount, accounts[1], { from: accounts[1]} ),
                        'StakingRewards: !governance'
                    );
                });
            });
            context('» rescueTokens token parameter is not valid: rewardToken', () => {
                it('it reverts', async () => {
                    await expectRevert(
                        stakingRewards.rescueTokens(rewardToken.address, stakeAmount, accounts[1]),
                        'StakingRewards: rewardToken'
                    );
                });
            });
            context('» rescueTokens token parameter is not valid: stakingToken', () => {
                it('it reverts', async () => {
                    await expectRevert(
                        stakingRewards.rescueTokens(stakingToken.address, stakeAmount, accounts[1]),
                        'StakingRewards: stakingToken'
                    );
                });
            });
            context('» rescueTokens valid: rescues tokens', () => {
                before('!! fund contracts', async () => {
                    await rescueToken.transfer(stakingRewards.address, stakeAmount);
                });
                it('rescues', async () => {
                    await stakingRewards.rescueTokens(rescueToken.address, stakeAmount, accounts[1]);
                    expect((await rescueToken.balanceOf(stakingRewards.address)).toString()).to.equal(toWei('0'));
                    expect((await rescueToken.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                });
            });
        });
    });
    context('# lastTimeRewardApplicable', async () => {
        context('» generics', () => {
            before('!! deploy setup', async () => {
                stakingRewards = await StakingRewards.new();
                rewardToken = await ERC20.new('Reward token', 'REWARD', 18);
                stakingToken = await ERC20.new('Staking token', 'STAKING', 18)
                stakeAmount = toWei('100');
                rewardAmount = toWei('100');
            });
            context('» lastTimeRewardApplicable returns smallest of timestamp & periodFinish', async () => {
                before('!! fund & initialize contract', async () => {
                    await rewardToken.transfer(stakingRewards.address, _initreward);
                    await stakingRewards.initialize(rewardToken.address, stakingToken.address, _initreward, _starttime, _durationDays);
                    initTime = await time.latest();
                });
                it('returns block.timestamp', async () => {
                    let ltra = (await stakingRewards.lastTimeRewardApplicable()).toNumber();
                    expect(ltra).to.equal(initTime.toNumber());
                });
            });
        });
    });
    context('# checkstart modifier', () => {
        context('» generics', () => {
            before('!! deploy setup & initialize contract', async () => {
                let _badStart = ((await time.latest()).toNumber()) + 100000;
                stakingRewards = await StakingRewards.new();
                rewardToken = await ERC20.new('Reward token', 'REWARD', 18);
                stakingToken = await ERC20.new('Staking token', 'STAKING', 18)
                await rewardToken.transfer(stakingRewards.address, _initreward);
                await stakingRewards.initialize(rewardToken.address, stakingToken.address, _initreward, _badStart, _durationDays);
            });
            context('» block.timestamp >= starttime: stake', async () => {
                before('!! fund accounts', async () => {
                    await stakingToken.transfer(accounts[1], stakeAmount);
                    await stakingToken.approve(stakingRewards.address, stakeAmount, { from: accounts[1] });
                    expect((await stakingToken.balanceOf(stakingRewards.address)).toString()).to.equal(toWei('0'));
                    expect((await stakingToken.balanceOf(accounts[1])).toString()).to.equal(stakeAmount);
                });
                it('reverts', async () => {
                    await expectRevert(
                        stakingRewards.stake(stakeAmount, { from: accounts[1] }),
                        'StakingRewards: not start'
                    );
                });
            });
            context('» block.timestamp >= starttime: withdraw', async () => {
                before('!! fund accounts and stake', async () => {
                    await stakingToken.transfer(accounts[1], stakeAmount);
                    await stakingToken.approve(stakingRewards.address, stakeAmount, { from: accounts[1] });
                });
                it('reverts', async () => {
                    await expectRevert(
                        stakingRewards.withdraw(stakeAmount, { from: accounts[1] }),
                        'StakingRewards: not start'
                    );
                });
            });
            context('» block.timestamp >= starttime: exit', async () => {
                it('reverts', async () => {
                    await expectRevert(
                        stakingRewards.exit({ from: accounts[1] }),
                        'StakingRewards: not start'
                    );
                });
            });
        });
    });
});
