var request = require('request')
  , settings = require('../lib/settings');

var base_url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?CMC_PRO_API_KEY=';


function get_ticker(coin, cb) {
  var req_url = base_url + settings.coinmarketcap.api_key + '&symbol=' + coin;
  request({ uri: req_url, json: true }, function (error, response, body) {
    if (body.length < 1) {
      return cb('Pair not found ' + coin + '-' + exchange, null)
    } else {
      return cb (null, body.data[coin]);
    }
  })
}

module.exports = {
  get_data: function(coin, cb) {
    get_ticker(coin, function(err, body) {
      return cb(err, body);
    });
  }
};