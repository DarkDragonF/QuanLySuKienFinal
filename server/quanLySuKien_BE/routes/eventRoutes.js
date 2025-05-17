const express = require('express');
const { getEvents, createEvent, getEventById } = require('../controllers/eventController');
const auth = require('../middleware/auth');
const role = require('../middleware/roles');
const router = express.Router();

// Sửa: Cho phép mọi user đã đăng nhập lấy danh sách event
router.get('/', auth, getEvents);
router.post('/', auth, role(['manager']), createEvent);
router.get('/:id', auth, getEventById);

// Route cho leader lấy các subtask của mình
router.get('/leader/:leaderId', auth, role(['leader']), async (req, res) => {
  const leaderId = req.params.leaderId;
  const events = await require('../models/Event').find({ "subTasks.leaderId": leaderId });
  const Task = require('../models/Task');
  const result = [];
  for (const ev of events) {
    const matchedSubs = (ev.subTasks || []).filter(
      sub =>
        typeof sub.leaderId === "string" &&
        sub.leaderId.trim() !== "" &&
        sub.leaderId === leaderId
    );
    if (matchedSubs.length > 0) {
      // Cập nhật trạng thái completed cho từng employeeTask dựa trên Task thực tế của employee
      for (const sub of matchedSubs) {
        if (Array.isArray(sub.employeeTasks) && sub.employeeTasks.length > 0) {
          for (const empTask of sub.employeeTasks) {
            // Tìm task của employee tương ứng
            const taskDoc = await Task.findOne({
              title: `[Sự kiện: ${ev.name}] ${sub.name} - ${empTask.name}`,
              assignedTo: { $exists: true },
            });
            empTask.completed = taskDoc ? !!taskDoc.completed : false;
          }
        }
      }
      result.push({
        eventId: ev._id,
        eventName: ev.name,
        subTasks: matchedSubs.map(sub => ({
          name: sub.name,
          status: sub.status,
          leaderId: sub.leaderId,
          employeeTasks: Array.isArray(sub.employeeTasks)
            ? sub.employeeTasks.map(et => ({
                name: et.name,
                employeeId: et.employeeId,
                deadline: et.deadline,
                completed: et.completed || false
              }))
            : []
        }))
      });
    }
  }
  res.json(result);
});

router.put('/leader/:leaderId/subtask-status', auth, role(['leader', 'manager']), async (req, res) => {
  const { eventId, subTaskName, status } = req.body;
  const Event = require('../models/Event');
  const event = await Event.findById(eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });
  let updated = false;
  event.subTasks.forEach(sub => {
    if (sub.name === subTaskName && sub.leaderId === req.params.leaderId) {
      sub.status = status;
      updated = true;
    }
  });
  if (updated) {
    await event.save();
    return res.json({ success: true });
  }
  res.status(404).json({ message: "Subtask not found" });
});

// Thêm route cho leader giao công việc con cho employee (lưu vào Event)
router.post(
  '/:eventId/subtask/:subTaskName/add-employee-task',
  auth,
  role(['leader']),
  async (req, res) => {
    const { eventId, subTaskName } = req.params;
    const { name, employeeId, deadline } = req.body;
    const Event = require('../models/Event');
    const Task = require('../models/Task');
    const User = require('../models/User');
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const decodedSubTaskName = decodeURIComponent(subTaskName);
    // Sửa: so sánh tên subtask không phân biệt hoa thường, loại bỏ khoảng trắng thừa và ký tự unicode
    const normalize = str => (str || "").trim().toLowerCase().normalize("NFC").replace(/\s+/g, " ");
    // Tìm subtask theo tên đã normalize
    const subTask = event.subTasks.find(
      s =>
        typeof s.name === "string" &&
        normalize(s.name) === normalize(decodedSubTaskName)
    );
    if (!subTask) {
      return res.status(404).json({
        message: "Subtask not found",
        debug: {
          subTaskName,
          decodedSubTaskName,
          availableSubTasks: event.subTasks.map(s => ({ name: s.name, leaderId: s.leaderId }))
        }
      });
    }
    // Đảm bảo employeeTasks là mảng
    if (!Array.isArray(subTask.employeeTasks)) subTask.employeeTasks = [];
    subTask.employeeTasks.push({ name, employeeId, deadline });
    await event.save();

    // Nếu có employeeId, tạo task cho employee
    if (employeeId) {
      const employeeUser = await User.findOne({ employeeId, role: "employee" });
      if (employeeUser) {
        await Task.create({
          title: `[Sự kiện: ${event.name}] ${subTask.name} - ${name}`,
          deadline: deadline ? new Date(deadline) : (event.endDate ? new Date(event.endDate) : undefined),
          completed: false,
          assignedTo: employeeUser._id,
          notes: [],
          subTasks: [],
        });
      }
    }

    res.json({ success: true, employeeTask: { name, employeeId, deadline } });
  }
);

module.exports = router;