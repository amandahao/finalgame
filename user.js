var mongoose = require('mongoose');

var model = mongoose.model('user', new mongoose.Schema({
	password: {type: String}
	, verifyPassword: {type: String}
	, salt: {type: String}
	, username: {type: String, unique: true}
	, avatar: {type: String}
}));

exports.getModel = function() {
	return model;
}
