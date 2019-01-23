var mongoose = require('mongoose')
  , Schema = mongoose.Schema;
 
var BunchSchema = new Schema({
  bunch_id: { type: String, unique: true, index: true},
  addresses: { type: Array, default: [] },
}, {id: false});

module.exports = mongoose.model('Bunch', BunchSchema);
