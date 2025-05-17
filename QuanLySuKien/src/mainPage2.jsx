import React, { useState, useEffect } from "react";

// khởi tạo mẫu ban đầu
const initialTasks = [

];

const subTasksMap = {
  1: [
    { name: "Chuẩn bị slide trình bày", assignee: "Nguyễn Văn A", time: "10:00 AM" },
    { name: "Đặt phòng hội thảo", assignee: "Trần Thị B", time: "11:00 AM" }
  ],
  2: [
    { name: "Soạn thảo hợp đồng", assignee: "Lê Thị C", time: "09:00 AM" },
    { name: "Chuẩn bị tài liệu trình bày", assignee: "Phạm Văn D", time: "09:30 AM" }
  ],
  3: [
    { name: "Thông báo tới nhân viên", assignee: "Nguyễn Thị E", time: "08:00 AM" },
    { name: "Chuẩn bị tài liệu đào tạo", assignee: "Đỗ Văn F", time: "08:30 AM" }
  ],
  4: [
    { name: "Thu thập dữ liệu thị trường", assignee: "Trần Văn G", time: "02:00 PM" },
    { name: "Phân tích đối thủ cạnh tranh", assignee: "Ngô Thị H", time: "03:00 PM" }
  ],
  5: [
    { name: "Tổng hợp doanh thu", assignee: "Phan Văn I", time: "01:00 PM" },
    { name: "Viết báo cáo", assignee: "Lưu Thị K", time: "02:30 PM" }
  ]
};

// API endpoint
const API_URL = (typeof process !== 'undefined' && process.env.REACT_APP_API_URL)
	? process.env.REACT_APP_API_URL
	: "http://localhost:3000/api";

// Helper: extract username from email (e.g. "nta@gmail.com" => "nta")
function usernameFromEmail(email) {
  if (!email) return "";
  return email.split("@")[0];
}

// Hàm giao tiếp backend
async function fetchTasks() {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_URL}/tasks`, { headers });
  return res.json();
}

async function addTask(task) {
  // Tự động gán assignedTo cho các subTasks nếu tên trùng username của employee
  // Lấy danh sách user từ backend (chỉ lấy các employee)
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  let employees = [];
  try {
    const res = await fetch(`${API_URL.replace('/api', '')}/api/quanly`, { headers });
    if (res.ok) {
      employees = await res.json();
    }
  } catch {}
  // Tạo map username -> userId cho employee
  const userMap = {};
  if (Array.isArray(employees)) {
    employees.forEach(u => {
      if (u.role === "employee" && u.email) {
        userMap[usernameFromEmail(u.email)] = u._id || u.id;
      }
    });
  }
  // Gán assignedTo cho subTasks nếu tên trùng username
  let subTasks = Array.isArray(task.subTasks) ? task.subTasks.map(sub => {
    const uname = usernameFromEmail(sub.assignee);
    const userId = userMap[uname];
    return userId
      ? { ...sub, assignedTo: userId }
      : sub;
  }) : [];

  // Nếu task có assignedTo (ví dụ leader muốn giao cả task cho ai đó), giữ nguyên
  // Nếu không, chỉ subTasks có assignedTo
  const taskToSend = { ...task, subTasks };

  const res = await fetch(`${API_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(taskToSend)
  });
  return res.json();
}

async function updateTask(taskId, updates) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
  const res = await fetch(`${API_URL}/tasks/${taskId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(updates)
  });
  return res.json();
}

async function deleteTask(taskId) {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  await fetch(`${API_URL}/tasks/${taskId}`, { method: "DELETE", headers });
}

async function addSubTask(taskId, subTask) {
  // Nếu backend cần xác thực, truyền token vào headers
  return subTask;
}

async function deleteSubTask(taskId, subTaskIndex) {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  await fetch(`${API_URL}/tasks/${taskId}/subtasks/${subTaskIndex}`, { method: "DELETE", headers });
}

async function addSubSubTask(eventId, subTaskName, subSubTask) {
  const token = localStorage.getItem("token");
  if (subSubTask.name && subSubTask.employeeId) {
    await fetch(
      `${API_URL}/events/${eventId}/subtask/${encodeURIComponent(subTaskName)}/add-employee-task`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          name: subSubTask.name,
          employeeId: subSubTask.employeeId,
          deadline: subSubTask.deadline // truyền deadline cho BE
        })
      }
    );
  }
}

// Thêm hàm fetch lại subtask leader khi có cập nhật trạng thái employee
const reloadLeaderSubTasks = (user, setLeaderSubTasks) => {
  if (user && user.role === "leader" && user.leaderId) {
    const token = localStorage.getItem("token");
    fetch(`${API_URL}/events/leader/${user.leaderId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => res.json())
      .then(data => setLeaderSubTasks(Array.isArray(data) ? data : []));
  }
};

function TaskBoardBootstrap2({ setActivePage, activePage, user, onLogout, username }) {
  const [tasksData, setTasksData] = useState(initialTasks);
  const [stateModal, setStateModal] = useState({ show: false, taskId: null });
  const [noteModal, setNoteModal] = useState({ show: false, taskId: null, note: "" });
  const [expandedSubTasks, setExpandedSubTasks] = useState({});
  const [eventsData, setEventsData] = useState([]);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    location: "",
    description: ""
  });
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", date: "", completed: false, note: "", subTasks: [] });
  const [newTaskSubTasks, setNewTaskSubTasks] = useState([]);
  const [showAddSubTaskModal, setShowAddSubTaskModal] = useState(false);
  const [currentTaskIdForSubTask, setCurrentTaskIdForSubTask] = useState(null);
  const [newSubTask, setNewSubTask] = useState({ name: "", assignee: "", time: "" });
  const [error, setError] = useState(null);
  const [leaderSubTasks, setLeaderSubTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [showAddSubSubTaskModal, setShowAddSubSubTaskModal] = useState(false);
  const [currentEventIdForSubSubTask, setCurrentEventIdForSubSubTask] = useState(null);
  const [currentSubTaskNameForSubSubTask, setCurrentSubTaskNameForSubSubTask] = useState("");
  const [newSubSubTask, setNewSubSubTask] = useState({ name: "", employeeId: "", deadline: "" });

  // Lấy danh sách công việc từ backend khi load trang
  useEffect(() => {
    fetchTasks()
      .then(data => {
        if (Array.isArray(data)) {
          setTasksData(data);
          setError(null);
        } else {
          setTasksData([]);
          setError(data?.message || "Không thể tải công việc");
        }
      })
      .catch(err => {
        setError("Không thể tải công việc");
        setTasksData([]);
      });
  }, []);

  useEffect(() => {
    setFilteredTasks(tasksData);
  }, [tasksData]);

  const handleSearch = (e) => {
    e && e.preventDefault && e.preventDefault();
    if (!searchTerm.trim()) {
      setFilteredTasks(tasksData);
      return;
    }
    setFilteredTasks(
      tasksData.filter(
        t =>
          (t.title || "")
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase())
      )
    );
  };

  // Lấy subtask được giao cho leader (nếu là leader)
  useEffect(() => {
    if (user && user.role === "leader" && user.leaderId) {
      const token = localStorage.getItem("token");
      fetch(`${API_URL}/events/leader/${user.leaderId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(res => res.json())
        .then(data => setLeaderSubTasks(Array.isArray(data) ? data : []))
        .catch(() => setLeaderSubTasks([]));
    }
  }, [user]);

  // Khi mount, lắng nghe sự thay đổi trạng thái task của employee để reload subtask leader
  useEffect(() => {
    // Lắng nghe sự kiện cập nhật trạng thái task của employee (nếu có)
    // Giả sử có event hoặc polling, ở đây dùng polling đơn giản mỗi 5s
    if (user && user.role === "leader" && user.leaderId) {
      const interval = setInterval(() => {
        reloadLeaderSubTasks(user, setLeaderSubTasks);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const confirmStateUpdate = async () => {
    const task = tasksData.find(t => t._id === stateModal.taskId);
    if (task) {
      await updateTask(task._id, { completed: !task.completed });
      setTasksData(prev =>
        prev.map(t =>
          t._id === task._id ? { ...t, completed: !t.completed } : t
        )
      );
    }
    setStateModal({ show: false, taskId: null });
  };

  const cancelStateUpdate = () => {
    setStateModal({ show: false, taskId: null });
  };

  const confirmNoteUpdate = async () => {
    const task = tasksData.find(t => t._id === noteModal.taskId);
    if (!task) return;
    await updateTask(noteModal.taskId, { note: noteModal.note });
    setTasksData(prev =>
      prev.map(task =>
        task._id === noteModal.taskId ? { ...task, note: noteModal.note } : task
      )
    );
    setNoteModal({ show: false, taskId: null, note: "" });
  };

  const cancelNoteUpdate = () => {
    setNoteModal({ show: false, taskId: null, note: "" });
  };

  const toggleSubTask = (taskId, subTaskIndex) => {
    const key = `${taskId}-${subTaskIndex}`;
    setExpandedSubTasks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const openAddEventModal = () => {
    setShowAddEventModal(true);
  };

  const confirmAddEvent = () => {
    const eventToAdd = {
      ...newEvent,
      id: Date.now()
    };
    setEventsData(prev => [...prev, eventToAdd]);
    setNewEvent({ name: "", date: "", location: "", description: "" });
    setShowAddEventModal(false);
  };

  const cancelAddEvent = () => {
    setNewEvent({ name: "", date: "", location: "", description: "" });
    setShowAddEventModal(false);
  };

  const openAddTaskModal = () => {
    setShowAddTaskModal(true);
  };

  const addSubTaskRow = () => {
    setNewTaskSubTasks(prev => [...prev, { name: "", assignee: "", time: "" }]);
  };

  const handleSubTaskChange = (index, field, value) => {
    setNewTaskSubTasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const confirmAddTask = async () => {
    const taskToAdd = { ...newTask, subTasks: newTaskSubTasks };
    const savedTask = await addTask(taskToAdd);
    setTasksData(prev => [...prev, savedTask]);
    setNewTask({ title: "", date: "", completed: false, note: "", subTasks: [] });
    setNewTaskSubTasks([]);
    setShowAddTaskModal(false);
  };

  const cancelAddTask = () => {
    setNewTask({ title: "", date: "", completed: false, note: "", subTasks: [] });
    setNewTaskSubTasks([]);
    setShowAddTaskModal(false);
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
    setTasksData(prev => prev.filter(task => task._id !== taskId));
  };

  const openAddSubTaskModal = (taskId) => {
    setCurrentTaskIdForSubTask(taskId);
    setShowAddSubTaskModal(true);
  };

  const confirmAddSubTask = async () => {
    const savedSubTask = await addSubTask(currentTaskIdForSubTask, newSubTask);
    setTasksData(prev =>
      prev.map(task => {
        if (task._id === currentTaskIdForSubTask) {
          const existingSubs = task.subTasks ? task.subTasks : [];
          return { ...task, subTasks: [...existingSubs, savedSubTask] };
        }
        return task;
      })
    );
    setNewSubTask({ name: "", assignee: "", time: "" });
    setCurrentTaskIdForSubTask(null);
    setShowAddSubTaskModal(false);
  };

  const cancelAddSubTask = () => {
    setNewSubTask({ name: "", assignee: "", time: "" });
    setCurrentTaskIdForSubTask(null);
    setShowAddSubTaskModal(false);
  };

  const handleDeleteSubTask = async (taskId, subTaskIndex) => {
    await deleteSubTask(taskId, subTaskIndex);
    setTasksData(prev =>
      prev.map(task => {
        if (task._id === taskId) {
          const newSubs = [...(task.subTasks || [])];
          newSubs.splice(subTaskIndex, 1);
          return { ...task, subTasks: newSubs };
        }
        return task;
      })
    );
  };

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1050;
        }
        .modal-content {
          background: #fff;
          padding: 20px;
          border-radius: 8px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .sidebar-item {
          border: 2px solid transparent;
          border-radius: 5px;
          margin: 5px 0;
          padding: 10px 16px;
          transition: background 0.25s, border 0.25s, color 0.25s, box-shadow 0.25s;
          font-weight: 500;
          font-size: 1.1rem;
        }
        .sidebar-item.selected, .sidebar-item:active {
          border: 2px solid #fff;
          background: linear-gradient(90deg, #43e97b 0%, #38f9d7 100%);
          color: #222;
          box-shadow: 0 2px 12px rgba(67,233,123,0.15);
        }
        .sidebar-item:hover {
          background: rgba(255,255,255,0.2);
          color: #fff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(67,233,123,0.10);
        }
        .fade-page {
          animation: fadeInPage 0.5s;
        }
        @keyframes fadeInPage {
          from { opacity: 0; transform: translateY(20px);}
          to { opacity: 1; transform: translateY(0);}
        }
      `}</style>

      <div className="d-flex vh-100">
        {/* Sidebar */}
        <div className="bg-success text-white p-3 rounded" style={{ width: '250px' }}>
          <h5
            className={`sidebar-item${activePage === "tasks" ? " selected" : ""}`}
            onClick={() => setActivePage && setActivePage("tasks")}
          >
            Quản lý công việc
          </h5>
          <h5
            className={`sidebar-item${activePage === "employees" ? " selected" : ""}`}
            onClick={() => setActivePage && setActivePage("employees")}
          >
            Quản lý nhân sự
          </h5>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-3 bg-light overflow-auto fade-page">
          <form
            className="d-flex justify-content-between align-items-center mb-3"
            onSubmit={handleSearch}
          >
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Tìm kiếm công việc..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button
                className="btn btn-secondary ms-2 me-3"
                style={{ padding: "10px 20px", borderRadius: "5px" }}
                type="submit"
              >
                Tìm
              </button>
            </div>
            <div className="dropdown">
              <button
                className="btn btn-primary dropdown-toggle d-flex align-items-center rounded-pill"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  src="https://cdn-icons-png.flaticon.com/512/149/149071.png"
                  alt="avatar"
                  width="32"
                  height="32"
                  className="rounded-circle me-2"
                />
                <strong>{username || "Tài khoản"}</strong>
              </button>
              <ul className="dropdown-menu dropdown-menu-end mt-2 shadow">
                <li className="px-3 pt-2 pb-1 text-muted small">Quản lý tài khoản</li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item" href="#">Quản lý tài khoản</a></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={onLogout}>Đăng xuất</button>
                </li>
              </ul>
            </div>
          </form>

          {/* Hiển thị các subtask được giao cho leader */}
          {user && user.role === "leader" && leaderSubTasks.length > 0 && (
            <div className="mt-4 border p-3 rounded bg-white">
              <h5>Công việc sự kiện được giao cho bạn (theo mã quản lý)</h5>
              {leaderSubTasks.map(ev => (
                <div key={ev.eventId} className="mb-3">
                  <div className="fw-bold mb-1">{ev.eventName}</div>
                  <ul className="list-group list-group-flush">
                    {/* Loại bỏ subtask trùng lặp theo name + leaderId */}
                    {Array.isArray(ev.subTasks) && ev.subTasks
                      .filter(
                        (sub, idx, arr) =>
                          typeof sub.leaderId === "string" &&
                          sub.leaderId.trim() !== "" &&
                          sub.leaderId === user.leaderId &&
                          arr.findIndex(s => s.name === sub.name && s.leaderId === sub.leaderId) === idx
                      )
                      .map((sub, idx) => (
                        <li key={sub.name + idx} className="list-group-item">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold">{sub.name}</span>
                            <div className="d-flex align-items-center gap-2">
                              <span className={`badge ${sub.status === "done" ? "bg-success" : "bg-warning text-dark"} me-2`}>
                                {sub.status === "done" ? "Đã xong" : "Chưa xong"}
                              </span>
                              <input
                                type="checkbox"
                                checked={sub.status === "done"}
                                onChange={async (e) => {
                                  // Gọi API cập nhật trạng thái subtask
                                  try {
                                    const token = localStorage.getItem("token");
                                    await fetch(
                                      `${API_URL}/events/leader/${user.leaderId}/subtask-status`,
                                      {
                                        method: "PUT",
                                        headers: {
                                          "Content-Type": "application/json",
                                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                                        },
                                        body: JSON.stringify({
                                          eventId: ev.eventId,
                                          subTaskName: sub.name,
                                          status: e.target.checked ? "done" : "pending",
                                        }),
                                      }
                                    );
                                    reloadLeaderSubTasks(user, setLeaderSubTasks);
                                  } catch {}
                                }}
                                title="Đánh dấu hoàn thành"
                              />
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => {
                                  setCurrentEventIdForSubSubTask(ev.eventId);
                                  setCurrentSubTaskNameForSubSubTask(sub.name);
                                  setNewSubSubTask({ name: "", employeeId: "", deadline: "" });
                                  setShowAddSubSubTaskModal(true);
                                }}
                              >
                                Thêm công việc con
                              </button>
                            </div>
                          </div>
                          {/* Hiển thị công việc con mới được tạo từ leader */}
                          {Array.isArray(sub.employeeTasks) && sub.employeeTasks.length > 0 && (
                            <div className="mt-2 mb-1 ps-4">
                              <div
                                style={{
                                  borderLeft: "4px solid #0d6efd",
                                  background: "#eaf4ff",
                                  borderRadius: "6px",
                                  padding: "10px 14px",
                                  marginLeft: "8px"
                                }}
                              >
                                <div className="mb-1 fw-bold text-primary" style={{ fontSize: "0.98em" }}>
                                  Công việc con được giao cho nhân viên:
                                </div>
                                <ul className="mb-0 ps-3" style={{ listStyle: "circle" }}>
                                  {sub.employeeTasks.map((empTask, empIdx) => (
                                    <li
                                      key={empTask.name + empIdx}
                                      className="py-1"
                                      style={{
                                        fontSize: "0.97em",
                                        marginBottom: "2px"
                                      }}
                                    >
                                      <span className="fw-semibold text-dark">{empTask.name}</span>
                                      {empTask.deadline && (
                                        <span className="ms-2 text-muted small">({empTask.deadline})</span>
                                      )}
                                      {empTask.employeeId && (
                                        <span className="ms-2 badge bg-info text-dark">Mã NV: {empTask.employeeId}</span>
                                      )}
                                      {/* Hiển thị trạng thái hoàn thành của employee */}
                                      <span className={`ms-2 badge ${empTask.completed ? "bg-success" : "bg-secondary"}`}>
                                        {empTask.completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Events Section */}
          {eventsData.length > 0 && (
            <div className="mt-4 border p-3 rounded bg-white">
              <h5>Danh sách sự kiện</h5>
              <ul className="list-unstyled">
                {eventsData.map(event => (
                  <li key={event.id} className="mb-2">
                    <strong>{event.name}</strong> - {event.date} - {event.location}
                    <p className="mb-1">{event.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* State Modal */}
      {stateModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Xác nhận cập nhật trạng thái</h5>
            <p>Bạn có chắc muốn cập nhật trạng thái công việc không?</p>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={cancelStateUpdate}>Hủy</button>
              <button className="btn btn-primary" onClick={confirmStateUpdate}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Note Modal (optional) */}
      {noteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Thêm ghi chú</h5>
            <textarea
              className="form-control mb-3"
              rows="3"
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
              placeholder="Nhập ghi chú..."
            />
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={cancelNoteUpdate}>Hủy</button>
              <button className="btn btn-primary" onClick={confirmNoteUpdate}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Thêm sự kiện mới</h5>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tên sự kiện"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Ngày (DD/MM/YYYY)"
                value={newEvent.date}
                onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Địa điểm"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <textarea
                className="form-control"
                rows="3"
                placeholder="Mô tả sự kiện"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              ></textarea>
            </div>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={cancelAddEvent}>Hủy</button>
              <button className="btn btn-primary" onClick={confirmAddEvent}>Thêm</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Thêm công việc mới</h5>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tiêu đề công việc"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Ngày (DD/MM/YYYY)"
                value={newTask.date}
                onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <h6>Các công việc con:</h6>
              {newTaskSubTasks.map((sub, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    className="form-control mb-1"
                    placeholder="Tên công việc con"
                    value={sub.name}
                    onChange={(e) => handleSubTaskChange(index, "name", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control mb-1"
                    placeholder="Tên nhân viên"
                    value={sub.assignee}
                    onChange={(e) => handleSubTaskChange(index, "assignee", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Thời gian (vd: 10:00 AM)"
                    value={sub.time}
                    onChange={(e) => handleSubTaskChange(index, "time", e.target.value)}
                  />
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={addSubTaskRow}>
                Thêm công việc con
              </button>
            </div>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={cancelAddTask}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={confirmAddTask}>
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add SubTask Modal */}
      {showAddSubTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Thêm công việc con</h5>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tên công việc con"
                value={newSubTask.name}
                onChange={(e) => setNewSubTask({ ...newSubTask, name: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tên nhân viên"
                value={newSubTask.assignee}
                onChange={(e) => setNewSubTask({ ...newSubTask, assignee: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Thời gian (vd: 10:00 AM)"
                value={newSubTask.time}
                onChange={(e) => setNewSubTask({ ...newSubTask, time: e.target.value })}
              />
            </div>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={cancelAddSubTask}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={confirmAddSubTask}>
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Sub-SubTask Modal */}
      {showAddSubSubTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Thêm công việc con cho nhân viên</h5>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tên công việc con"
                value={newSubSubTask.name}
                onChange={e => setNewSubSubTask({ ...newSubSubTask, name: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Mã nhân viên (employeeId)"
                value={newSubSubTask.employeeId}
                onChange={e => setNewSubSubTask({ ...newSubSubTask, employeeId: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Hạn (deadline, ví dụ: 2024-06-30)"
                value={newSubSubTask.deadline}
                onChange={e => setNewSubSubTask({ ...newSubSubTask, deadline: e.target.value })}
              />
            </div>
            <div className="d-flex justify-content-end">
              <button
                className="btn btn-secondary me-2"
                onClick={() => {
                  setShowAddSubSubTaskModal(false);
                  setNewSubSubTask({ name: "", employeeId: "", deadline: "" });
                }}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  await addSubSubTask(
                    currentEventIdForSubSubTask,
                    currentSubTaskNameForSubSubTask,
                    newSubSubTask
                  );
                  setShowAddSubSubTaskModal(false);
                  setNewSubSubTask({ name: "", employeeId: "", deadline: "" });
                  // Reload lại danh sách subtask leader
                  if (user && user.role === "leader" && user.leaderId) {
                    const token = localStorage.getItem("token");
                    fetch(`${API_URL}/events/leader/${user.leaderId}`, {
                      headers: token ? { Authorization: `Bearer ${token}` } : {},
                    })
                      .then(res => res.json())
                      .then(data => setLeaderSubTasks(Array.isArray(data) ? data : []));
                  }
                }}
              >
                Thêm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TaskBoardBootstrap2;
