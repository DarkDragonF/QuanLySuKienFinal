const User = require('../models/User');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  if (user.password !== password) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
      leaderId: user.leaderId || null,
      employeeId: user.employeeId || null
    },
    process.env.JWT_SECRET
  );
  // Trả về role, leaderId, employeeId cho FE
  res.json({
    token,
    role: user.role,
    leaderId: user.leaderId || null,
    employeeId: user.employeeId || null
  });
};

module.exports = { login };