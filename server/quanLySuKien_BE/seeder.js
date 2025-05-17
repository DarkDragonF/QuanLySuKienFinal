require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Task = require('./models/Task');
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/role_based_app";

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  await User.deleteMany({});

  const users = [
    { username: 'manager1', password: '123456', role: 'manager' },
    { username: 'leader1', password: '123456', role: 'leader', leaderId: 'leader-001' },
    { username: 'employee1', password: '123456', role: 'employee', employeeId: 'employee-001' }
  ];

 const event = [
  {
    name: 'Hội chợ sách quốc tế',
    eventScale: 'medium',
    location: 'TP. Hồ Chí Minh',
    startDate: '2023-09-15',
    endDate: '2023-09-20',
    description: 'Quy tụ các nhà xuất bản từ nhiều quốc gia',
    subTasks: [
      { name: 'Lên danh sách nhà xuất bản', status: 'completed',  employeeTasks: [] },
      { name: 'Chuẩn bị gian hàng', status: 'in-progress',  employeeTasks: [] }
    ]
  },
  {
    name: 'Lễ hội âm nhạc mùa hè',
    eventScale: 'large',
    location: 'Đà Nẵng',
    startDate: '2023-06-10',
    endDate: '2023-06-12',
    description: 'Lễ hội âm nhạc hoành tráng tại bãi biển',
    subTasks: [
      { name: 'Liên hệ nghệ sĩ', status: 'in-progress',  employeeTasks: [] },
      { name: 'Thiết lập sân khấu', status: 'pending',  employeeTasks: [] }
    ]
  },
  {
    name: 'Ngày hội việc làm sinh viên',
    eventScale: 'small',
    location: 'Cần Thơ',
    startDate: '2023-11-01',
    endDate: '2023-11-01',
    description: 'Cơ hội kết nối doanh nghiệp và sinh viên',
    subTasks: [
      { name: 'Mời doanh nghiệp', status: 'completed', employeeTasks: [] },
      { name: 'In ấn tờ rơi', status: 'in-progress',  employeeTasks: [] }
    ]
  },
  {
    name: 'Triển lãm công nghệ 4.0',
    eventScale: 'large',
    location: 'Hà Nội',
    startDate: '2023-12-05',
    endDate: '2023-12-07',
    description: 'Trình diễn các công nghệ tiên tiến nhất',
    subTasks: [
      { name: 'Chuẩn bị thiết bị trình diễn', status: 'pending', employeeTasks: [] }
    ]
  },
  {
    name: 'Cuộc thi lập trình Hackathon',
    eventScale: 'medium',
    location: 'TP. Hồ Chí Minh',
    startDate: '2023-08-20',
    endDate: '2023-08-22',
    description: 'Cuộc thi dành cho lập trình viên trẻ',
    subTasks: [
      { name: 'Tìm nhà tài trợ', status: 'in-progress',  employeeTasks: [] }
    ]
  },
  {
    name: 'Hội thảo chuyên đề giáo dục',
    eventScale: 'small',
    location: 'Huế',
    startDate: '2023-07-10',
    endDate: '2023-07-11',
    description: 'Thảo luận về các phương pháp giáo dục mới',
    subTasks: [
      { name: 'Mời diễn giả', status: 'completed',  employeeTasks: [] },
      { name: 'Chuẩn bị tài liệu', status: 'pending',  employeeTasks: [] }
    ]
  },
  {
    name: 'Lễ hội ẩm thực Việt',
    eventScale: 'large',
    location: 'Hội An',
    startDate: '2023-09-05',
    endDate: '2023-09-10',
    description: 'Tôn vinh văn hóa ẩm thực ba miền',
    subTasks: [
      { name: 'Chuẩn bị gian hàng ẩm thực', status: 'in-progress',  employeeTasks: [] }
    ]
  },
  {
    name: 'Ngày hội văn hóa dân gian',
    eventScale: 'medium',
    location: 'Nghệ An',
    startDate: '2023-10-20',
    endDate: '2023-10-22',
    description: 'Giới thiệu các trò chơi và nghệ thuật dân gian',
    subTasks: [
      { name: 'Tổ chức thi kéo co', status: 'pending', employeeTasks: [] }
    ]
  },
  {
    name: 'Giải chạy vì cộng đồng',
    eventScale: 'small',
    location: 'Bình Dương',
    startDate: '2023-11-15',
    endDate: '2023-11-15',
    description: 'Gây quỹ cho trẻ em có hoàn cảnh khó khăn',
    subTasks: [
      { name: 'Thiết kế áo giải chạy', status: 'in-progress',  employeeTasks: [] }
    ]
  },
  {
    name: 'Hội nghị doanh nhân trẻ',
    eventScale: 'medium',
    location: 'Đà Lạt',
    startDate: '2023-12-01',
    endDate: '2023-12-03',
    description: 'Kết nối và giao lưu giữa các doanh nhân trẻ',
    subTasks: [
      { name: 'Đặt khách sạn cho đại biểu', status: 'completed', employeeTasks: [] },
      { name: 'Chuẩn bị quà lưu niệm', status: 'in-progress', employeeTasks: [] }
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

  await Event.insertMany(event);
  await User.insertMany(users);
  await Task.insertMany(tasks);
  console.log("✅ Sample events inserted:");
  event.forEach(e => console.log(` - ${e.name} (${e.eventScale})`));

  console.log("✅ Sample users inserted:");
  users.forEach(u => console.log(` - ${u.username} (${u.role})`));

  await mongoose.disconnect();
};

run();