const Task = require('../models/Task');
const Event = require('../models/Event');
const User = require('../models/User');

// Lấy tất cả task (cho leader/manager)
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
};

// Lấy task được giao cho user (employee)
const getAssignedTasks = async (req, res) => {
  try {
    // Sửa: lấy theo _id của user (token chứa userId)
    const tasks = await Task.find({ assignedTo: req.user.userId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching assigned tasks', error: err.message });
  }
};

// Tạo task mới
const createTask = async (req, res) => {
  try {
    const task = new Task(req.body);
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

// Xóa task
const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete task', error: err.message });
  }
};

// Cập nhật task (ví dụ: note, completed, ...), PATCH để partial update
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update task', error: err.message });
  }
};

// Đánh dấu hoàn thành
const markComplete = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { completed: true }, { new: true });
    res.json({ completed: task.completed });
  } catch (err) {
    res.status(500).json({ message: 'Failed to mark complete', error: err.message });
  }
};

// Cập nhật trạng thái completed (employee cập nhật)
const updateTaskCompleted = async (req, res) => {
  try {
    const { completed } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { completed: !!completed },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });

    // Đồng bộ trạng thái với Event.subTasks.employeeTasks nếu là task công việc con của leader giao
    // Tìm event chứa subTask có employeeTask trùng tên và employeeId
    if (task.title && task.assignedTo) {
      // Parse title: [Sự kiện: {eventName}] {subTaskName} - {employeeTaskName}
      const match = /^\[Sự kiện: (.+?)\] (.+?) - (.+)$/.exec(task.title);
      if (match) {
        const [, eventName, subTaskName, employeeTaskName] = match;
        // Lấy employeeId từ User
        const user = await User.findById(task.assignedTo);
        const employeeId = user && user.employeeId;
        if (employeeId) {
          const event = await Event.findOne({ name: eventName });
          if (event && Array.isArray(event.subTasks)) {
            for (const sub of event.subTasks) {
              if (sub.name === subTaskName && Array.isArray(sub.employeeTasks)) {
                // Tìm employeeTask theo tên và employeeId
                const empTask = sub.employeeTasks.find(
                  et => et.name === employeeTaskName && et.employeeId === employeeId
                );
                if (empTask) {
                  empTask.completed = !!completed;
                  await event.save();
                  break;
                }
              }
            }
          }
        }
      }
    }

    res.json({ completed: task.completed });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update completed', error: err.message });
  }
};

// Thêm note
const addNote = async (req, res) => {
  try {
    const { taskId, content } = req.body;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const note = { content, createdAt: new Date() };
    task.notes.push(note);
    await task.save();
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add note', error: err.message });
  }
};

// Thêm subTask
const addSubTask = async (req, res) => {
  try {
    const { name, assignee, time } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    const subTask = { name, assignee, time };
    task.subTasks.push(subTask);
    await task.save();
    res.json(subTask);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add subtask', error: err.message });
  }
};

// Xóa subTask theo index
const deleteSubTask = async (req, res) => {
  try {
    const { id, subIndex } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.subTasks.length <= subIndex) return res.status(400).json({ message: "Invalid subtask index" });
    task.subTasks.splice(subIndex, 1);
    await task.save();
    res.json({ message: "Subtask deleted" });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete subtask', error: err.message });
  }
};

module.exports = {
  getAllTasks,
  getAssignedTasks,
  createTask,
  deleteTask,
  updateTask,
  markComplete,
  updateTaskCompleted,
  addNote,
  addSubTask,
  deleteSubTask
};
