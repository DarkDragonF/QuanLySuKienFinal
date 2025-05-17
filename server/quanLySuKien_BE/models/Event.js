const mongoose = require('mongoose');

const EmployeeTaskSchema = new mongoose.Schema({
  name: String,
  employeeId: String,
  deadline: String,
  completed: { type: Boolean, default: false } // Thêm trường completed
}, { _id: false });

const SubTaskSchema = new mongoose.Schema({
  name: String,
  status: String,
  leaderId: String, // mã quản lý
  deadline: String, // Thêm deadline cho nhiệm vụ lớn
  employeeTasks: [EmployeeTaskSchema] // các công việc con giao cho employee
});

const EventSchema = new mongoose.Schema({
  name: String,
  eventScale: String,
  location: String, // Đổi từ eventLocation sang location cho đồng bộ FE
  startDate: String,
  endDate: String,
  description: String,
  subTasks: [SubTaskSchema]
});

module.exports = mongoose.model('Event', EventSchema);