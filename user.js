var mongoose = require('mongoose');

var model = mongoose.model('user', new mongoose.Schema({
	member: {type: String}
	, leader: {type: String}
	, choice: {type: String}
	, password: {type: String}
	, verifyPassword: {type: String}
	, salt: {type: String}
	, username: {type: String, unique: true}
}));

exports.getModel = function() {
	return model;
}
