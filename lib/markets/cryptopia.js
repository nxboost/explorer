var request = require('request');
 
var base_url = 'https://bitstorage.finance/api';
function get_summary(coin, exchange, cryptopia_id, cb) {
    var summary = {};
    var j=0;
    request({ uri: base_url + '/ticker', json: true }, function (error, response, body) {
        if (error) {
            return cb(error, null);
        } else while (true)
           if (body[j].pairs === 'NXB_BTC') {
            summary['bid'] = body[j]['bid'].toFixed(8);
            summary['ask'] = body[j]['ask'].toFixed(8);
            summary['volume'] = body[j]['24H_volume'];
            summary['high'] = body[j]['high'].toFixed(8);
            summary['low'] = body[j]['low'].toFixed(8);
            summary['last'] = body[j]['last_price'].toFixed(8);
            summary['change'] = body[j]['change'];
            return cb(null, summary);
        } else {
            j = j +1;
        }
    });
        
}
function get_trades(coin, exchange, crytopia_id, cb) {
    var req_url = base_url + '/transactions?market=NXB&currency=BTC&limit=100';
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body.transactions.market === 'NXB') {
            var tTrades = body.transactions.data;
            var trades = [];
            for (var i = 0; i < tTrades.length; i++) {
                var Trade = {
                    //orderpair: tTrades[i].Label,
                    ordertype: tTrades[i].maker_type,
                    amount: parseFloat(tTrades[i].btc).toFixed(8),
                    price: parseFloat(tTrades[i].price).toFixed(8),
                    //  total: parseFloat(tTrades[i].Total).toFixed(8)
                    // Necessary because API will return 0.00 for small volume transactions
                    total: parseFloat(tTrades[i].amount).toFixed(8),
                    timestamp: tTrades[i].timestamp
                }
                trades.push(Trade);
            }
            return cb(null, trades);
        } else {
            return cb(body.Message, null);
        }
    });
}

function get_orders(coin, exchange, cryptopia_id, cb) {
    var req_url = base_url + '/order-book?market=NXB&currency=BTC';
    request({ uri: req_url, json: true }, function (error, response, body) {
        if (body['order-book'].market === 'NXB') {
            var orders = body['order-book'];
            var buys = [];
            var sells = [];
            if (orders.bid.length > 0){
                for (var i = 0; i < orders.bid.length; i++) {
                    var order = {
                        amount: parseFloat(orders.bid[i].order_amount).toFixed(8),
                        price: parseFloat(orders.bid[i].price).toFixed(8),
                        //  total: parseFloat(orders.Buy[i].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: parseFloat(orders.bid[i].order_value).toFixed(8)
                    }
                    buys.push(order);
                }
                } else {}
                if (orders.ask.length > 0) {
                for (var x = 0; x < orders.ask.length; x++) {
                    var order = {
                        amount: parseFloat(orders.ask[x].order_amount).toFixed(8),
                        price: parseFloat(orders.ask[x].price).toFixed(8),
                        //    total: parseFloat(orders.Sell[x].Total).toFixed(8)
                        // Necessary because API will return 0.00 for small volume transactions
                        total: parseFloat(orders.ask[x].order_value).toFixed(8)
                    }
                    sells.push(order);
                }
            } else {
            }
            return cb(null, buys, sells);
            } else {
            return cb(body.Message, [], [])
        }
    });
}


module.exports = {
    get_data: function (coin, exchange, cryptopia_id, cb) {
        var error = null;
        get_orders(coin, exchange, cryptopia_id, function (err, buys, sells) {
            if (err) { error = err; }
            get_trades(coin, exchange, cryptopia_id, function (err, trades) {
                if (err) { error = err; }
                get_summary(coin, exchange, cryptopia_id, function (err, stats) {
                    if (err) { error = err; }
                    return cb(error, { buys: buys, sells: sells, chartdata: [], trades: trades, stats: stats });
                });
            });
        });
    }
};
