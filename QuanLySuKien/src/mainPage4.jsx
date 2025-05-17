import React, { useState, useEffect } from "react";

const initialEmployees = [
  { id: 1, title: "Nguyễn Văn A", date: "22/04/2024", completed: false, note: "" },
  { id: 2, title: "Trần Thị B", date: "23/04/2024", completed: false, note: "" },
  { id: 3, title: "Lê Thị C", date: "25/04/2024", completed: false, note: "" },
  { id: 4, title: "Phạm Văn D", date: "01/05/2024", completed: true, note: "" },
  { id: 5, title: "Đỗ Văn F", date: "15/04/2024", completed: true, note: "" }
];

// Replace API endpoints with environment variable based base URL
const API_BASE = (typeof process !== "undefined" && process.env.REACT_APP_API_URL)
	? process.env.REACT_APP_API_URL
	: "http://localhost:3000/api";
const API_EVENTS = `${API_BASE}/events`;
const API_EMPLOYEES = `${API_BASE}/quanly`;

function TaskBoardBootstrap4({ onLogout, username }) {
  const [eventsData, setEventsData] = useState([]);
  const [detailEventId, setDetailEventId] = useState(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    eventScale: "",
    eventLocation: "",
    startDate: "",
    endDate: "",
    description: ""
  });
  const [newEventSubTasks, setNewEventSubTasks] = useState([]);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showEventInfo, setShowEventInfo] = useState(false);

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
  const [expandedEmployeeSubTasks, setExpandedEmployeeSubTasks] = useState({});

  const toggleEmployeeSubTask = (empId, subIndex) => {
    const key = `${empId}-${subIndex}`;
    setExpandedEmployeeSubTasks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [currentSection, setCurrentSection] = useState("");

  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showSubTaskDetailModal, setShowSubTaskDetailModal] = useState(false);
  const [selectedSubTask, setSelectedSubTask] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  useEffect(() => {
    setFilteredEvents(eventsData);
  }, [eventsData]);
  useEffect(() => {
    setFilteredEmployees(employeesData);
  }, [employeesData]);

  const handleSearch = (e) => {
    e && e.preventDefault && e.preventDefault();
    if (currentSection === "event") {
      if (!searchTerm.trim()) {
        setFilteredEvents(eventsData);
        return;
      }
      setFilteredEvents(
        eventsData.filter(ev =>
          (ev.name || "")
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase())
        )
      );
    } else if (currentSection === "employee") {
      if (!searchTerm.trim()) {
        setFilteredEmployees(employeesData);
        return;
      }
      setFilteredEmployees(
        employeesData.filter(emp =>
          (emp.title || emp.name || "")
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase())
        )
      );
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resEvents = await fetch(API_EVENTS, { headers });
        const events = await resEvents.json();
        setEventsData(Array.isArray(events) ? events : []);
        const resEmployees = await fetch(API_EMPLOYEES, { headers });
        let employees = await resEmployees.json();
        // Chỉ hiển thị nhân sự có role là leader
        if (Array.isArray(employees)) {
          employees = employees.filter(emp => emp.role === "leader");
        }
        setEmployeesData(employees);
      } catch (err) {
        setEventsData([]);
        setEmployeesData([]);
        console.error(err);
      }
    };
    fetchData();
  }, [refreshFlag]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(API_EMPLOYEES, { headers });
        let employees = await res.json();
        // Chỉ hiển thị nhân sự có role là leader
        if (Array.isArray(employees)) {
          employees = employees.filter(emp => emp.role === "leader");
        }
        setEmployeesData(employees);
      } catch (err) {
        setEmployeesData([]);
      }
    };
    fetchEmployees();
  }, [showAddEmployeeModal, refreshFlag]);

  const getNextLeaderId = () => {
    if (!Array.isArray(employeesData) || employeesData.length === 0) return "leader-001";
    const ids = employeesData
      .map(e => e.leaderId)
      .filter(id => /^leader-\d+$/.test(id))
      .map(id => parseInt(id.split("-")[1], 10));
    const maxId = ids.length > 0 ? Math.max(...ids) : 0;
    const nextId = (maxId + 1).toString().padStart(3, "0");
    return `leader-${nextId}`;
  };

  const openAddEventModal = () => {
    setShowAddEventModal(true);
  };

  const addSubEventTaskRow = () => {
    setNewEventSubTasks(prev => [
      ...prev,
      { name: "", status: "pending", leaderId: "", deadline: "" }
    ]);
  };

  const handleSubEventTaskChange = (index, field, value) => {
    setNewEventSubTasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const toggleSubEventTaskStatus = (index) => {
    setNewEventSubTasks(prev => {
      const updated = [...prev];
      updated[index].status = updated[index].status === "pending" ? "done" : "pending";
      return updated;
    });
  };

  const removeSubEventTask = (index) => {
    setNewEventSubTasks(prev => prev.filter((_, i) => i !== index));
  };

  const confirmAddEvent = async () => {
    try {
      const eventToAdd = { ...newEvent, subTasks: newEventSubTasks };
      const token = localStorage.getItem("token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      const res = await fetch(API_EVENTS, {
        method: "POST",
        headers,
        body: JSON.stringify(eventToAdd)
      });
      const data = await res.json();
      setEventsData(prev => [...prev, data]);
      setNewEvent({ name: "", eventScale: "", eventLocation: "", startDate: "", endDate: "", description: "" });
      setNewEventSubTasks([]);
      setShowAddEventModal(false);
      setNotificationMessage("đã tạo công việc thành công, vui lòng nhấn tra cứu để xem!");
    } catch (err) {
      console.error("Error adding event", err);
    }
  };

  const cancelAddEvent = () => {
    setNewEvent({ name: "", eventScale: "", eventLocation: "", startDate: "", endDate: "", description: "" });
    setNewEventSubTasks([]);
    setShowAddEventModal(false);
  };

  const openAddEmployeeModal = () => {
    setShowAddEmployeeModal(true);
  };

  const addEmployeeSubTaskRow = () => {
    setNewEmployeeSubTasks(prev => [...prev, { name: "", assignee: "", time: "" }]);
  };

  const handleEmployeeSubTaskChange = (index, field, value) => {
    setNewEmployeeSubTasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const confirmAddEmployee = async () => {
    try {
      const leaderId = getNextLeaderId();
      const employeeToAdd = {
        username: newEmployee.username,
        password: newEmployee.password,
        role: "leader",
        leaderId,
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
      const res = await fetch(API_EMPLOYEES, {
        method: "POST",
        headers,
        body: JSON.stringify(employeeToAdd)
      });
      const data = await res.json();
      setEmployeesData(prev => [...prev, data]);
      setNewEmployee({ username: "", password: "", title: "", date: "", note: "", subTasks: [] });
      setNewEmployeeSubTasks([]);
      setShowAddEmployeeModal(false);
    } catch (err) {
      alert("Lỗi khi thêm nhân sự");
    }
  };

  const cancelAddEmployee = () => {
    setNewEmployee({ username: "", password: "", title: "", date: "", note: "", subTasks: [] });
    setNewEmployeeSubTasks([]);
    setShowAddEmployeeModal(false);
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa nhân sự này?")) return;
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await fetch(`${API_EMPLOYEES}/${id}`, {
        method: "DELETE",
        headers
      });
      setEmployeesData(prev => prev.filter(emp => emp._id !== id));
    } catch (err) {
      alert("Lỗi khi xóa nhân sự");
    }
  };

  const handleManagerSubTaskStatus = async (eventId, subTaskName, leaderId, checked) => {
    try {
      const token = localStorage.getItem("token");
      await fetch(
        `${API_EVENTS}/leader/${leaderId}/subtask-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            eventId,
            subTaskName,
            status: checked ? "done" : "pending",
          }),
        }
      );
      setRefreshFlag(f => f + 1);
    } catch {}
  };

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex; justify-content: center; align-items: center;
          z-index: 1050;
        }
        .modal-content {
          background: #fff; padding: 20px; border-radius: 8px;
          max-width: 400px; width: 100%;
          max-height: 80vh; overflow-y: auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .sidebar-item {
          border: 2px solid transparent; border-radius: 5px;
          margin: 5px 0; padding: 5px 10px;
          transition: all 0.3s ease;
        }
        .sidebar-item:hover {
          border: 2px solid #fff;
          background-color: rgba(255,255,255,0.2);
          cursor: pointer;
        }
        .sidebar-item.selected {
          border: 2px solid #fff;
          background-color: rgba(255,255,255,0.2);
        }
      `}</style>

      <div className="d-flex vh-100">
        {/* Sidebar */}
        <div className="bg-success text-white p-3 rounded" style={{ width: '250px' }}>
          <h5 className="sidebar-item" onClick={() => setCurrentSection(currentSection === "employee" ? "" : "employee")}>
            Quản lý nhân sự
          </h5>
          <h5 className="sidebar-item" onClick={() => setCurrentSection(currentSection === "event" ? "" : "event")}>
            Tra cứu sự kiện
          </h5>
          <h5 className="sidebar-item" onClick={openAddEventModal}>Thêm Sự Kiện</h5>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-3 bg-light overflow-auto">
          {/* Search Area */}
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
                placeholder={currentSection === "employee" ? "Tìm kiếm nhân sự..." : "Tìm kiếm sự kiện..."}
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
            {/* Dropdown for account management */}
            <div className="dropdown">
              <button className="btn btn-primary dropdown-toggle d-flex align-items-center rounded-pill" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" alt="avatar" width="32" height="32" className="rounded-circle me-2" />
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

          {/* Conditional section rendering */}
          {currentSection === "" ? (
            <div className="border p-3 rounded bg-white">
              <h5 className="text-center">Chào mừng đạo diễn</h5>
            </div>
          ) : currentSection === "employee" ? (
            <>
              {/* Employee List */}
              <button className="btn btn-primary btn-sm ms-2" onClick={openAddEmployeeModal}>
                Thêm nhân sự mới
              </button>
              <div className="border p-3 rounded bg-white mt-3">
                {(!Array.isArray(employeesData) || employeesData.length === 0) ? (
                  <div className="alert alert-warning mb-0">Không có nhân sự nào hoặc bạn không có quyền truy cập.</div>
                ) : (
                  <ul className="list-unstyled">
                    {employeesData.map(emp => (
                      <li key={emp._id} className="mb-3 border-bottom pb-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{emp.username}</strong>
                            <span className="text-muted ms-2">(Leader ID: {emp.leaderId})</span>
                            <span className="text-muted ms-2">{emp.title ? `- ${emp.title}` : ""}</span>
                            <span className="text-muted ms-2">{emp.date ? `- ${emp.date}` : ""}</span>
                          </div>
                          <div>
                            <button className="btn btn-danger btn-sm me-2" onClick={() => handleDeleteEmployee(emp._id)}>
                              Xóa nhân sự
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : currentSection === "event" && (
            <>
              {/* Display saved events */}
              <div className="mt-3">
                {!Array.isArray(filteredEvents) || filteredEvents.length === 0 ? (
                  <div>Không có sự kiện</div>
                ) : (
                  filteredEvents.map(ev => (
                    <div key={ev.id} className="card mb-2">
                      <div className="card-body">
                        <h6 className="card-title">{ev.name}</h6>
                        <p className="card-text">Ngày: {ev.startDate} - {ev.endDate}</p>
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() => {
                            setSelectedEvent(ev);
                            setShowEventDetailModal(true);
                          }}
                        >
                          Xem chi tiết thông tin
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <h5>Tạo Sự Kiện</h5>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Tiêu đề" value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} />
            </div>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Ngày bắt đầu (DD/MM/YYYY)" value={newEvent.startDate}
                onChange={(e) => setNewEvent({ ...newEvent, startDate: e.target.value })} />
            </div>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Ngày kết thúc (DD/MM/YYYY)" value={newEvent.endDate}
                onChange={(e) => setNewEvent({ ...newEvent, endDate: e.target.value })} />
            </div>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Quy mô sự kiện" value={newEvent.eventScale}
                onChange={(e) => setNewEvent({ ...newEvent, eventScale: e.target.value })} />
            </div>
            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Địa điểm tổ chức" value={newEvent.eventLocation}
                onChange={(e) => setNewEvent({ ...newEvent, eventLocation: e.target.value })} />
            </div>
            <div className="mb-3">
              <textarea className="form-control" rows="3" placeholder="Ghi chú" value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}></textarea>
            </div>
            {/* Nested form for event sub tasks */}
            <div className="mb-3">
              <h6>Công việc sự kiện</h6>
              {newEventSubTasks.map((sub, index) => (
                <div key={index} className="mb-2 d-flex align-items-center gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tên công việc"
                    value={sub.name}
                    onChange={e => handleSubEventTaskChange(index, "name", e.target.value)}
                    style={{ minWidth: 120 }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Mã quản lý (leaderId)"
                    value={sub.leaderId || ""}
                    onChange={e => handleSubEventTaskChange(index, "leaderId", e.target.value)}
                    style={{ minWidth: 120 }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Hạn (deadline, ví dụ: 2024-07-01)"
                    value={sub.deadline || ""}
                    onChange={e => handleSubEventTaskChange(index, "deadline", e.target.value)}
                    style={{ minWidth: 120 }}
                  />
                  <button type="button" className="btn btn-sm btn-warning"
                    onClick={() => toggleSubEventTaskStatus(index)}>
                    {sub.status === "pending" ? "Chưa xong" : "Đã xong"}
                  </button>
                  <button type="button" className="btn btn-sm btn-danger"
                    onClick={() => removeSubEventTask(index)}>
                    Xóa
                  </button>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm" onClick={addSubEventTaskRow}>+</button>
            </div>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={cancelAddEvent}>Hủy</button>
              <button className="btn btn-primary" onClick={confirmAddEvent}>Lưu</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Thêm nhân sự mới (Leader)</h5>
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
              <button className="btn btn-secondary me-2" onClick={cancelAddEmployee}>Hủy</button>
              <button className="btn btn-primary" onClick={confirmAddEmployee}>Thêm</button>
            </div>
          </div>
        </div>
      )}

      {/* Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ position: "relative", maxWidth: 600 }}>
            {/* New close icon button */}
            <button 
              style={{ position: "absolute", top: "10px", right: "10px" }}
              className="btn btn-danger btn-sm"
              onClick={() => {
                setShowEventDetailModal(false);
                setSelectedEvent(null);
              }}
            >
              X
            </button>
            <h5 className="mb-3 text-center">Thông tin chi tiết sự kiện</h5>
            <form>
              <div className="mb-3 row">
                <label className="col-sm-4 col-form-label"><strong>Tiêu đề</strong></label>
                <div className="col-sm-8">
                  <input type="text" className="form-control" value={selectedEvent.name} readOnly />
                </div>
              </div>
              <div className="mb-3 row">
                <label className="col-sm-4 col-form-label"><strong>Ngày bắt đầu</strong></label>
                <div className="col-sm-8">
                  <input type="text" className="form-control" value={selectedEvent.startDate} readOnly />
                </div>
              </div>
              <div className="mb-3 row">
                <label className="col-sm-4 col-form-label"><strong>Ngày kết thúc</strong></label>
                <div className="col-sm-8">
                  <input type="text" className="form-control" value={selectedEvent.endDate} readOnly />
                </div>
              </div>
              <div className="mb-3 row">
                <label className="col-sm-4 col-form-label"><strong>Quy mô sự kiện</strong></label>
                <div className="col-sm-8">
                  <input type="text" className="form-control" value={selectedEvent.eventScale} readOnly />
                </div>
              </div>
              <div className="mb-3 row">
                <label className="col-sm-4 col-form-label"><strong>Địa điểm tổ chức</strong></label>
                <div className="col-sm-8">
                  <input type="text" className="form-control" value={selectedEvent.eventLocation} readOnly />
                </div>
              </div>
              {selectedEvent.subTasks && selectedEvent.subTasks.length > 0 && (
                <div className="mb-3">
                  <h6 className="mb-2">Công việc sự kiện</h6>
                  <table className="table table-bordered table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th style={{width: "30%"}}>Tên công việc</th>
                        <th style={{width: "20%"}}>Mã quản lý</th>
                        <th style={{width: "20%"}}>Trạng thái</th>
                        <th style={{width: "20%"}}>Đánh dấu</th>
                        <th style={{width: "10%"}}>Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEvent.subTasks.map((sub, idx) => (
                        <React.Fragment key={idx}>
                          <tr>
                            <td>{sub.name}</td>
                            <td>{sub.leaderId || <span className="text-muted">-</span>}</td>
                            <td>
                              <span className={`badge ${sub.status === "done" ? "bg-success" : "bg-warning text-dark"}`}>
                                {sub.status === "done" ? "Đã xong" : "Chưa xong"}
                              </span>
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={sub.status === "done"}
                                onChange={e =>
                                  handleManagerSubTaskStatus(
                                    selectedEvent._id,
                                    sub.name,
                                    sub.leaderId,
                                    e.target.checked
                                  )
                                }
                                title="Đánh dấu hoàn thành"
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-info btn-sm"
                                onClick={() => {
                                  setSelectedSubTask(sub);
                                  setShowSubTaskDetailModal(true);
                                }}
                              >
                                Xem chi tiết
                              </button>
                            </td>
                          </tr>
                          {/* Hiển thị công việc con của subtask này nếu có */}
                          {Array.isArray(sub.employeeTasks) && sub.employeeTasks.length > 0 && (
                            <tr>
                              <td colSpan={5} style={{ background: "#f8fafd", borderLeft: "4px solid #0d6efd" }}>
                                <div className="fw-bold text-primary mb-1" style={{ fontSize: "0.98em" }}>
                                  Công việc con được leader giao cho nhân viên:
                                </div>
                                <ul className="mb-0 ps-3" style={{ listStyle: "circle" }}>
                                  {sub.employeeTasks.map((empTask, empIdx) => (
                                    <li key={empTask.name + empIdx} style={{ fontSize: "0.97em", marginBottom: "2px" }}>
                                      <span className="fw-semibold text-dark">{empTask.name}</span>
                                      {empTask.time && (
                                        <span className="ms-2 text-muted small">({empTask.time})</span>
                                      )}
                                      {empTask.employeeId && (
                                        <span className="ms-2 badge bg-info text-dark">Mã NV: {empTask.employeeId}</span>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </form>
            <div className="d-flex justify-content-end mt-3">
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowEventDetailModal(false); setSelectedEvent(null); }}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Task Detail Modal */}
      {showSubTaskDetailModal && selectedSubTask && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ position: "relative" }}>
            {/* New close icon button */}
            <button 
              style={{ position: "absolute", top: "10px", right: "10px" }}
              className="btn btn-danger btn-sm"
              onClick={() => {
                setShowSubTaskDetailModal(false);
                setSelectedSubTask(null);
              }}
            >
              X
            </button>
            <h5>Chi tiết công việc</h5>
            <div className="subtask-details">

            </div>
            <div className="d-flex justify-content-end mt-3">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowSubTaskDetailModal(false);
                  setSelectedSubTask(null);
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TaskBoardBootstrap4;