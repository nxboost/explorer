var request = require('request');

var base_url = 'https://api.crex24.com/v2/public/';
  
function get_summary(coin, exchange, cb) {
    var summary = {};
    request({ uri: base_url + 'tickers?instrument=HLM-BTC', json: true }, function (error, response, body) {
        if (error) {
            return cb(error, null);
        } else {
            summary['bid'] = body[0]['bid'].toFixed(8);
            summary['ask'] = body[0]['ask'].toFixed(8);
            summary['volume'] = body[0]['volumeInBtc'];
            summary['high'] = body[0]['high'].toFixed(8);
            summary['low'] = body[0]['low'].toFixed(8);
            summary['last'] = body[0]['last'].toFixed(8);
            summary['change'] = body[0]['percentChange'];
            return cb(null, summary);
        }
    });
}

function get_trades(coin, exchange, cb) {
    var req_url = base_url + 'recentTrades?instrument=HLM-BTC';
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (error) {
            return cb(error, null);
        } else {
            var tTrades = body;
            var trades = [];
            for (var i = 0; i < tTrades.length; i++) {
                var Trade = {
                    ordertype: tTrades[i].side,
                    amount: (tTrades[i].volume).toFixed(8),
                    price: (tTrades[i].price).toFixed(8),
                    total: (tTrades[i].price * tTrades[i].volume).toFixed(8),
                    timestamp: tTrades[i].timestamp
                }
                trades.push(Trade);
            }
            return cb(null, trades);
        }
    });
}

function get_orders(coin, exchange, cb) {
  var req_url = base_url + 'orderBook?instrument=HLM-BTC';
  request({uri: req_url, json: true}, function (error, response, body) {
    if (body.error) {
      return cb(body.error, []);
    } else {
            var orders = body;
            var buys = [];
            var sells = [];
            if (orders.buyLevels.length > 0){
                for (var i = 0; i < orders.buyLevels.length; i++) {
                    var order = {
                        amount: orders.buyLevels[i].volume.toFixed(8),
                        price: orders.buyLevels[i].price.toFixed(8),
                        total: (orders.buyLevels[i].volume * orders.buyLevels[i].price).toFixed(8)
                    }
                    buys.push(order);
                }
                } else {}
            if (orders.sellLevels.length > 0) {
                for (var i = 0; i < orders.sellLevels.length; i++) {
                    var order = {
                        amount: orders.sellLevels[i].volume.toFixed(8),
                        price: orders.sellLevels[i].price.toFixed(8),
                        total: (orders.sellLevels[i].volume * orders.sellLevels[i].price).toFixed(8)
                    }
                    sells.push(order);
                }
            } else {
            }
      return cb(null,  buys, sells);
    }
  });
}

function get_chartdata(coin, exchange, cb) { 
  var req_url = base_url + 'ohlcv?instrument=' + coin + '-' + exchange + '&granularity=1d&limit=50';
  request({uri: req_url, json: true}, function (error, response, chartdata) {
    if (error) {
      return cb(error, []);
    } else {
        var processed = [];
        for (var i = 0; i < chartdata.length; i++) {
          processed.push([+ new Date(chartdata[i].timestamp), chartdata[i].open, chartdata[i].high, chartdata[i].low, chartdata[i].close]);
          if (i === chartdata.length - 1) {
            return cb(null, processed);
          }
        }
    }
  });
}

module.exports = {
  get_data: function(coin, exchange, cb) {
    var error = null;
    get_chartdata(coin, exchange, function (err, chartdata){
      if (err) {
        chartdata = [];
        error = err;
      }
      get_orders(coin, exchange, function (err, buys, sells){
          if (err) { error = err; }
        get_trades(coin, exchange, function (err, trades){
          if (err) { error = err; }
          get_summary(coin, exchange, function (err, stats){
            if (err) { error = err; }
            return cb(error, {buys: buys, sells: sells, chartdata: chartdata, trades: trades, stats: stats});
          });
        });
      });
    });
  }
};