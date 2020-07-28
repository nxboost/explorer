var mongoose = require('mongoose')
  , lib = require('../lib/explorer')
  , db = require('../lib/database')
  , settings = require('../lib/settings')
  , request = require('request');

var COUNT = 5000; //number of blocks to index

function exit() {
  mongoose.disconnect();
  process.exit(0);
}

var dbString = 'mongodb://' + settings.dbsettings.user;
dbString = dbString + ':' + settings.dbsettings.password;
dbString = dbString + '@' + settings.dbsettings.address;
dbString = dbString + ':' + settings.dbsettings.port;
dbString = dbString + '/' + settings.dbsettings.database;

mongoose.connect(dbString, { useNewUrlParser: true }, function(err) {
  if (err) {
    console.log('Unable to connect to database: %s', dbString);
    console.log('Aborting');
    exit();
  } else {
    request({uri: 'http://127.0.0.1:' + settings.port + '/api/getpeerinfo', json: true}, function (error, response, body) {
      lib.syncLoop(body.length, function (loop) {
        var i = loop.iteration();
        var addressarr = body[i].addr.split(':');
        var address = addressarr.slice(0,addressarr.length-1).join(':');
	address = address.replace("[","");
	address = address.replace("]","");
	//console.log('output addr = ' + body[i].addr + ' | parsed address = ' + address);
	//var address = body[i].addr.split(':')[0];
        db.find_peer(address, function(peer) {
          if (peer) {
            // peer already exists
            peer.protocol = body[i].version;
            peer.version = body[i].subver.replace('/', '').replace('/', '');
            peer.save();
            loop.next();
          } else {
              if (body[i].version !== 0) {
                request({uri: 'http://api.ipstack.com/' + address + '?access_key=' + settings.ipstackapi_key + '&output=json', json: true}, function (error, response, geo) {
                    db.create_peer({
                        address: address,
                        protocol: body[i].version,
                        version: body[i].subver.replace('/', '').replace('/', ''),
                        country: geo.country_name
                    }, function(){
                        loop.next();
                    });
                });
              }
          }
        });
      }, function() {
        exit();
      });
    });
  }
});
