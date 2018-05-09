var mongoose = require('mongoose');

var model = mongoose.model('user', new mongoose.Schema({
	firstname: {type: String, unique: true}
	, lastname: {type: String, unique: true}
	, cardtype: {type: String, unique: true}
	, cardnumber: {type: String, unique: true}
	, expirationdate: {type: String, unique: true}
	, seccode: {type: String}
	, salt: {type: String}
}));

exports.getModel = function() {
	return model;
}
