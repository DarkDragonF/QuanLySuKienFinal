const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    // Trả về đầy đủ thông tin user, loại bỏ password
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err.message });
  }
};

const createUser = async (req, res) => {
  try {
    // Nhận đầy đủ thông tin user từ FE
    const user = new User(req.body);
    await user.save();
    // Trả về user không có password
    const { password, ...userData } = user.toObject();
    res.json(userData);
  } catch (err) {
    res.status(500).json({ message: 'Error creating user', error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Error updating user', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting user', error: err.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };