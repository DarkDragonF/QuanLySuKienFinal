const express = require('express');
const {
  getAllTasks,
  getAssignedTasks,
  createTask,
  deleteTask,
  updateTask,
  markComplete,
  addNote,
  addSubTask,
  deleteSubTask,
  updateTaskCompleted
} = require('../controllers/taskController');
const auth = require('../middleware/auth');
const router = express.Router();

// Lấy tất cả task (cho leader/manager)
router.get('/', auth, getAllTasks);
// Lấy task được giao cho user (employee)
router.get('/assigned', auth, getAssignedTasks);
// Tạo mới
router.post('/', auth, createTask);
// Xóa task
router.delete('/:id', auth, deleteTask);
// Cập nhật task
router.put('/:id', auth, updateTask);
// Đánh dấu hoàn thành
router.put('/complete/:id', auth, markComplete);
// Thêm route đúng cho employee cập nhật trạng thái hoàn thành
router.put('/:id/completed', auth, updateTaskCompleted);
// Thêm note
router.post('/notes', auth, addNote);
// Thêm subtask
router.post('/:id/subtasks', auth, addSubTask);
// Xóa subtask theo index
router.delete('/:id/subtasks/:subIndex', auth, deleteSubTask);

module.exports = router;