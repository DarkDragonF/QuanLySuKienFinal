require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Task = require('./models/Task');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/role_based_app";

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  await User.deleteMany({});
  await Event.deleteMany({});
  await Task.deleteMany({});

  const users = [
    { username: 'manager1', password: '123456', role: 'manager' },
    { username: 'leader1', password: '123456', role: 'leader', leaderId: 'leader-001' },
    { username: 'employee1', password: '123456', role: 'employee', employeeId: 'emp-001' },
    { username: 'employee2', password: '123456', role: 'employee', employeeId: 'emp-002' }
  ];

  const events = [
    {
      name: 'Đại hội thể thao',
      eventScale: 'large',
      location: 'Hà Nội',
      startDate: '2023-10-01',
      endDate: '2023-10-05',
      description: 'Sự kiện thể thao lớn nhất trong năm',
      subTasks: [
        {
          name: 'Tổ chức lễ khai mạc',
          status: 'in-progress',
          leaderId: 'leader-001',
          employeeTasks: []
        },
        {
          name: 'test',
          status: 'pending',
          leaderId: 'leader-001',
          // Seed sẵn một công việc con cho employee1
          employeeTasks: [
            { name: 'Dọn dẹp sân vận động', employeeId: 'emp-001', time: '08:00' },
            { name: 'Chuẩn bị nước uống', employeeId: 'emp-002', time: '09:00' }
          ]
        }
      ]
    }
  ];

  const tasks = [
    {
      title: 'Chuẩn bị slide trình bày',
      deadline: new Date('2023-10-01'),
      completed: false,
      assignedTo: null,
      notes: [{ content: 'Cần hoàn thành trước ngày khai mạc' }],
      subTasks: [{ name: 'Thiết kế slide', assignee: 'Nguyễn Văn A', time: '2h' }]
    },
    // Seed sẵn task cho employee1 từ công việc con phía trên
    {
      title: '[Sự kiện: Đại hội thể thao] test - Dọn dẹp sân vận động',
      deadline: new Date('2023-10-05'),
      completed: false,
      assignedTo: null, // sẽ cập nhật bên dưới
      notes: [],
      subTasks: []
    },
    // Seed sẵn task cho employee2 từ công việc con phía trên
    {
      title: '[Sự kiện: Đại hội thể thao] test - Chuẩn bị nước uống',
      deadline: new Date('2023-10-05'),
      completed: false,
      assignedTo: null, // sẽ cập nhật bên dưới
      notes: [],
      subTasks: []
    }
  ];

  // Gán assignedTo cho các task công việc con
  const employee1 = await User.findOne({ employeeId: 'emp-001' });
  const employee2 = await User.findOne({ employeeId: 'emp-002' });
  if (employee1) tasks[1].assignedTo = employee1._id;
  if (employee2) tasks[2].assignedTo = employee2._id;

  await User.insertMany(users);
  await Event.insertMany(events);
  await Task.insertMany(tasks);

  console.log("✅ Sample users inserted:");
  users.forEach(u => console.log(` - ${u.username} (${u.role})`));

  console.log("✅ Sample events inserted:");
  events.forEach(e => console.log(` - ${e.name} (${e.eventScale})`));

  console.log("✅ Sample tasks inserted:");
  tasks.forEach(t => console.log(` - ${t.title} (Deadline: ${t.deadline})`));

  await mongoose.disconnect();
};

run();