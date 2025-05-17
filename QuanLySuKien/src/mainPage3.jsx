import React, { useState, useEffect } from "react";

// Đổi endpoint cho nhân sự từ /employees sang /quanly và sử dụng cổng 3000
const API_EMPLOYEES_URL = (typeof process !== "undefined" && process.env.REACT_APP_API_URL)
  ? `${process.env.REACT_APP_API_URL}/quanly`
  : "http://localhost:3000/api/quanly";

// Define initial tasks as an array with required properties
const initialTasks = [];

// Sub-tasks for each task
const subTasksMap = {};

function TaskBoardBootstrap3({ setActivePage, activePage, onLogout, username }) {
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

  const [employeesData, setEmployeesData] = useState([]);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    username: "",
    password: "",
    title: "",
    date: "",
    note: "",
    subTasks: []
  });
  const [newEmployeeSubTasks, setNewEmployeeSubTasks] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);

  // New pending state variables for backend operations:
  const [pendingAddTask, setPendingAddTask] = useState(null);
  const [pendingUpdateNote, setPendingUpdateNote] = useState(null);
  const [pendingDeleteEmployee, setPendingDeleteEmployee] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTasks, setFilteredTasks] = useState([]);

  // Get token from localStorage
  const token = localStorage.getItem("token");

  // Initial data load & periodic refresh using fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_EMPLOYEES_URL, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) {
          setTasksData([]);
          return;
        }
        const data = await res.json();
        setTasksData(Array.isArray(data) ? data : []);
      } catch (err) {
        setTasksData([]);
        console.error("Error fetching employees:", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [token]);

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

  const confirmStateUpdate = () => {
    setTasksData(prev =>
      prev.map(task =>
        task.id === stateModal.taskId ? { ...task, completed: !task.completed } : task
      )
    );
    setStateModal({ show: false, taskId: null });
  };

  const cancelStateUpdate = () => {
    setStateModal({ show: false, taskId: null });
  };

  // Modify confirmNoteUpdate: set pendingUpdateNote instead of using axios
  const confirmNoteUpdate = () => {
    setPendingUpdateNote({ id: noteModal.taskId, note: noteModal.note });
    setNoteModal({ show: false, taskId: null, note: "" });
  };

  // useEffect to PUT pendingUpdateNote using fetch
  useEffect(() => {
    if (pendingUpdateNote) {
      fetch(`${API_EMPLOYEES_URL}/${pendingUpdateNote.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ note: pendingUpdateNote.note })
      })
        .then(res => res.json())
        .then(updated => {
          setTasksData(prev =>
            prev.map(task =>
              task.id === pendingUpdateNote.id ? { ...task, note: pendingUpdateNote.note } : task
            )
          );
          setPendingUpdateNote(null);
        })
        .catch(err => {
          console.error("Error updating note:", err);
          setPendingUpdateNote(null);
        });
    }
  }, [pendingUpdateNote, token]);

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

  // Modify confirmAddTask: set pendingAddTask instead of using axios
  const confirmAddTask = () => {
    const taskToAdd = { ...newTask, subTasks: newTaskSubTasks };
    setPendingAddTask(taskToAdd);
    setNewTask({ title: "", date: "", completed: false, note: "", subTasks: [] });
    setNewTaskSubTasks([]);
    setShowAddTaskModal(false);
  };

  // useEffect to POST pendingAddTask using fetch
  useEffect(() => {
    if (pendingAddTask) {
      fetch(API_EMPLOYEES_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(pendingAddTask)
      })
        .then(res => res.json())
        .then(added => {
          setTasksData(prev => [...prev, added]);
          setPendingAddTask(null);
        })
        .catch(err => {
          alert("Lỗi khi thêm nhân viên");
          setPendingAddTask(null);
        });
    }
  }, [pendingAddTask, token]);

  const cancelAddTask = () => {
    setNewTask({ title: "", date: "", completed: false, note: "", subTasks: [] });
    setNewTaskSubTasks([]);
    setShowAddTaskModal(false);
  };

  const openAddSubTaskModal = (taskId) => {
    setCurrentTaskIdForSubTask(taskId);
    setShowAddSubTaskModal(true);
  };

  const confirmAddSubTask = () => {
    setTasksData(prev =>
      prev.map(task => {
        if (task.id === currentTaskIdForSubTask) {
          const existingSubs = task.subTasks ? task.subTasks : [];
          return { ...task, subTasks: [...existingSubs, newSubTask] };
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

  // Modify handleDeleteEmployee: set pendingDeleteEmployee instead of using axios
  const handleDeleteEmployee = (id) => {
    setPendingDeleteEmployee(id);
  };

  // useEffect to DELETE pendingDeleteEmployee using fetch
  useEffect(() => {
    if (pendingDeleteEmployee) {
      fetch(`${API_EMPLOYEES_URL}/${pendingDeleteEmployee}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then(() => {
          setTasksData(prev => prev.filter(task => task.id !== pendingDeleteEmployee));
          setPendingDeleteEmployee(null);
        })
        .catch(err => {
          alert("Lỗi khi xóa nhân viên");
          setPendingDeleteEmployee(null);
        });
    }
  }, [pendingDeleteEmployee, token]);

  // Lấy danh sách employee (chỉ role employee)
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(API_EMPLOYEES_URL, { headers });
        let employees = await res.json();
        // Chỉ hiển thị nhân sự có role là employee
        if (Array.isArray(employees)) {
          employees = employees.filter(emp => emp.role === "employee");
        }
        setEmployeesData(employees);
      } catch (err) {
        setEmployeesData([]);
      }
    };
    fetchEmployees();
  }, [showAddEmployeeModal, refreshFlag]);

  // Sinh employeeId tự động tiếp tục từ employee-001
  const getNextEmployeeId = () => {
    if (!Array.isArray(employeesData) || employeesData.length === 0) return "employee-001";
    const ids = employeesData
      .map(e => e.employeeId)
      .filter(id => /^employee-\d+$/.test(id))
      .map(id => parseInt(id.split("-")[1], 10));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const nextId = (maxId + 1).toString().padStart(3, "0");
    return `employee-${nextId}`;
  };

  // Thêm nhân sự mới (employee)
  const confirmAddEmployee = async () => {
    try {
      const employeeId = getNextEmployeeId();
      const employeeToAdd = {
        username: newEmployee.username,
        password: newEmployee.password,
        role: "employee",
        employeeId,
        title: newEmployee.title,
        date: newEmployee.date,
        note: newEmployee.note,
        subTasks: newEmployeeSubTasks
      };
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      // Sửa: leader chỉ được phép gọi POST /api/quanly nếu backend cho phép role leader
      // Nếu backend chỉ cho manager, sẽ bị 403. Để leader thêm được, cần sửa backend:
      // routes/userRoutes.js: router.post('/', auth, role(['manager', 'leader']), createUser);
      // Nếu chưa sửa backend, sẽ luôn bị 403.
      const res = await fetch(API_EMPLOYEES_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(employeeToAdd)
      });
      if (res.status === 403) {
        alert("Bạn không có quyền thêm nhân viên. Hãy yêu cầu admin cấp quyền cho leader.");
        setShowAddEmployeeModal(false);
        return;
      }
      const data = await res.json();
      setEmployeesData(prev => [...prev, data]);
      setNewEmployee({ username: "", password: "", title: "", date: "", note: "", subTasks: [] });
      setNewEmployeeSubTasks([]);
      setShowAddEmployeeModal(false);
    } catch (err) {
      alert("Lỗi khi thêm nhân sự");
    }
  };

  // Xóa nhân sự (employee)
  const handleDeleteEmployeeFromList = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân sự này?")) return;
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`${API_EMPLOYEES_URL}/${id}`, {
        method: "DELETE",
        headers
      });
      setEmployeesData(prev => prev.filter(emp => emp._id !== id));
    } catch (err) {
      alert("Lỗi khi xóa nhân sự");
    }
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
                placeholder="Tìm kiếm nhân viên..."
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
                <li><a className="dropdown-item text-danger" href="#" onClick={onLogout}>Đăng xuất</a></li>
              </ul>
            </div>
          </form>

          {/* Employee List */}
          <button className="btn btn-primary btn-sm ms-2" onClick={() => setShowAddEmployeeModal(true)}>
            Thêm nhân viên mới
          </button>
          <div className="border p-3 rounded bg-white">
            {(!Array.isArray(employeesData) || employeesData.length === 0) ? (
              <div className="alert alert-warning mb-0">Không có nhân viên nào hoặc bạn không có quyền truy cập.</div>
            ) : (
              <ul className="list-unstyled">
                {employeesData.map(emp => (
                  <li key={emp._id} className="mb-3 border-bottom pb-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{emp.username}</strong>
                        <span className="text-muted ms-2">(Employee ID: {emp.employeeId})</span>
                        <span className="text-muted ms-2">{emp.title ? `- ${emp.title}` : ""}</span>
                        <span className="text-muted ms-2">{emp.date ? `- ${emp.date}` : ""}</span>
                      </div>
                      <div>
                        <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeleteEmployeeFromList(emp._id)}>
                          Xóa nhân viên
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Task List */}

        

          {/* Employee Activity Log Section */}
          {eventsData.length > 0 && (
            <div className="mt-4 border p-3 rounded bg-white">
              <h5>Nhật ký hoạt động của nhân viên</h5>
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

      {/* Note Modal */}
      {noteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Thêm ghi chú nhân viên</h5>
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
            <h5>Thêm nhật ký nhân viên mới</h5>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tiêu đề"
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
                placeholder="Phòng ban"
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <textarea
                className="form-control"
                rows="3"
                placeholder="Ghi chú"
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
            <h5>Thêm nhân viên mới</h5>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tên nhân viên"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Ngày vào làm (DD/MM/YYYY)"
                value={newTask.date}
                onChange={(e) => setNewTask({ ...newTask, date: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <h6>Thông tin bổ sung:</h6>
              {newTaskSubTasks.map((sub, index) => (
                <div key={index} className="mb-2">
                  <input
                    type="text"
                    className="form-control mb-1"
                    placeholder="Họ Tên"
                    value={sub.name}
                    onChange={(e) => handleSubTaskChange(index, "name", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control mb-1"
                    placeholder="Mã Nhân Viên"
                    value={sub.assignee}
                    onChange={(e) => handleSubTaskChange(index, "assignee", e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ghi chú"
                    value={sub.time}
                    onChange={(e) => handleSubTaskChange(index, "time", e.target.value)}
                  />
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={addSubTaskRow}>
                Thêm thông tin bổ sung
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
            <h5>Thêm thông tin bổ sung</h5>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Loại thông tin"
                value={newSubTask.name}
                onChange={(e) => setNewSubTask({ ...newSubTask, name: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Giá trị"
                value={newSubTask.assignee}
                onChange={(e) => setNewSubTask({ ...newSubTask, assignee: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Ghi chú"
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

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Thêm nhân viên mới (Employee)</h5>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Tên đăng nhập"
                value={newEmployee.username}
                onChange={e => setNewEmployee({ ...newEmployee, username: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Mật khẩu"
                value={newEmployee.password}
                onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Họ tên"
                value={newEmployee.title}
                onChange={e => setNewEmployee({ ...newEmployee, title: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Ngày vào làm (DD/MM/YYYY)"
                value={newEmployee.date}
                onChange={e => setNewEmployee({ ...newEmployee, date: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Ghi chú"
                value={newEmployee.note}
                onChange={e => setNewEmployee({ ...newEmployee, note: e.target.value })}
              />
            </div>
            {/* Có thể bổ sung subTasks nếu muốn */}
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={() => setShowAddEmployeeModal(false)}>Hủy</button>
              <button className="btn btn-primary" onClick={confirmAddEmployee}>Thêm</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TaskBoardBootstrap3;
