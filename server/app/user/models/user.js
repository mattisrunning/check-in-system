var mongoose = require('mongoose');

var schema = mongoose.Schema({
    name: String,
    studentId: {type:Number, index: { unique: true}, dropDups: true},
    email: {type:String, index: { unique: true}, dropDups: true},
    isAdmin: Boolean,
    password: String,
    phone: Number,
    address: String,
    birthdate: Date,
    graduationDate: Date,
    isIntlStudent: Boolean,
    profilePic: String,
    position: String,
    employmentStart: Date,
    employmentEnd: Date,
    hasParkingPass: Boolean,
    officeKeys: [String],
    dateActivated:Date,
    dateDeactivated:Date
});

module.exports = mongoose.model("user", schema);
