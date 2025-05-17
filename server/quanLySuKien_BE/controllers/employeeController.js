const Employee = require('../models/Employee');
const bcrypt = require('bcrypt');

// Lấy danh sách nhân sự
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find({}, '-password');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Thêm nhân sự mới
exports.createEmployee = async (req, res) => {
  try {
    const { username, password, role, employeeId, leaderId } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    // Kiểm tra trùng username
    const existed = await Employee.findOne({ username });
    if (existed) {
      return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newEmp = new Employee({
      username,
      password: hashedPassword,
      role,
      employeeId: role === 'employee' ? employeeId : undefined,
      leaderId: role === 'leader' ? leaderId : undefined,
    });
    await newEmp.save();
    const { password: _, ...empData } = newEmp.toObject();
    res.status(201).json(empData);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Sửa thông tin nhân sự
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { password, role, employeeId, leaderId } = req.body;
    const updateData = {};
    if (role) updateData.role = role;
    // Xử lý logic cho employeeId/leaderId theo role
    if (role === 'employee') {
      updateData.employeeId = employeeId;
      updateData.leaderId = undefined;
    } else if (role === 'leader') {
      updateData.leaderId = leaderId;
      updateData.employeeId = undefined;
    } else {
      updateData.employeeId = undefined;
      updateData.leaderId = undefined;
    }
    // Nếu có password mới thì hash lại
    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, 10);
    }
    const updated = await Employee.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).select('-password');
    if (!updated) return res.status(404).json({ error: 'Không tìm thấy nhân sự' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};

// Xóa nhân sự
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Employee.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Không tìm thấy nhân sự' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server' });
  }
};
