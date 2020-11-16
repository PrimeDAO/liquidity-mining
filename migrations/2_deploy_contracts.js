const StakingRewards = artifacts.require("StakingRewards");

module.exports = function(deployer) {
  deployer.deploy(StakingRewards);
};
