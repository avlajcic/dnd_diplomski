let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let schema = new Schema({
    username: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
});

module.exports = mongoose.model('User', schema);