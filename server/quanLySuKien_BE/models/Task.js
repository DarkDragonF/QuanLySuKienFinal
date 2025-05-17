const mongoose = require('mongoose');

// Task cho employee nhận từ leader (công việc con của subtask sự kiện)
const TaskSchema = new mongoose.Schema({
  title: String, // Ví dụ: [Sự kiện: ...] Tên subtask - Tên công việc con
  deadline: String, // Lưu dạng string để đồng bộ với FE
  completed: { type: Boolean, default: false },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // employee _id
  notes: [{ content: String, createdAt: { type: Date, default: Date.now } }],
  subTasks: [{ name: String, assignee: String, time: String }]
});

module.exports = mongoose.model('Task', TaskSchema);