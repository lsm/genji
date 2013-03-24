module.exports = process.env.GENJI_COV ?
  require('./lib-cov/genji') : require('./lib/genji');