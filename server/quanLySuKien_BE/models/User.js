const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['employee', 'leader', 'manager'], required: true },
  leaderId: { type: String, unique: true, sparse: true }, // chỉ leader mới có
  employeeId: { type: String, unique: true, sparse: true } // chỉ employee mới có
});

module.exports = mongoose.model('User', UserSchema);