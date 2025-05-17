const Event = require('../models/Event');
const Task = require('../models/Task');
const User = require('../models/User');

const getEvents = async (req, res) => {
  const events = await Event.find();
  res.json(events);
};

const createEvent = async (req, res) => {
  // Khi tạo event, mỗi subTask sẽ có leaderId, deadline
  const event = new Event(req.body);
  await event.save();

  // Tạo task cho leader tương ứng với từng nhiệm vụ lớn
  if (Array.isArray(event.subTasks)) {
    for (const sub of event.subTasks) {
      if (sub.leaderId && sub.leaderId.trim() !== "") {
        const leader = await User.findOne({ leaderId: sub.leaderId, role: "leader" });
        if (leader) {
          await Task.create({
            title: `[Sự kiện: ${event.name}] ${sub.name}`,
            deadline: sub.deadline || event.endDate ? new Date(sub.deadline || event.endDate) : undefined,
            completed: false,
            assignedTo: leader._id,
            notes: [],
            subTasks: [],
          });
        }
      }
    }
  }

  res.json(event);
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event', error: err.message });
  }
};

module.exports = { getEvents, createEvent, getEventById };