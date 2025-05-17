import React, { useState, useEffect } from "react";

function TaskBoardBootstrap1({ onLogout, username }) {
  const [tasksData, setTasksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stateModal, setStateModal] = useState({ show: false, taskId: null });
  const [noteModal, setNoteModal] = useState({ show: false, taskId: null, note: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [employeeSubTasks, setEmployeeSubTasks] = useState([]);

  const API_BASE = (typeof process !== "undefined" && process.env.REACT_APP_API_URL)
    ? process.env.REACT_APP_API_URL
    : "http://localhost:3000/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:3000/api/tasks/assigned", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Không thể tải công việc");
        const data = await res.json();
        setTasksData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchTasks();

    async function fetchEmployeeSubTasks() {
      const token = localStorage.getItem("token");
      let employeeId = null;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        employeeId = payload.employeeId || localStorage.getItem("employeeId");
      } catch {}
      if (!employeeId) return;
      const res = await fetch("http://localhost:3000/api/events", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;
      const events = await res.json();
      const result = [];
      events.forEach(ev => {
        (ev.subTasks || []).forEach(sub => {
          if (Array.isArray(sub.employeeTasks)) {
            sub.employeeTasks.forEach(empTask => {
              if (empTask.employeeId === employeeId) {
                result.push({
                  eventName: ev.name,
                  subTaskName: sub.name,
                  name: empTask.name,
                  deadline: empTask.deadline
                });
              }
            });
          }
        });
      });
      setEmployeeSubTasks(result);
    }
    fetchEmployeeSubTasks();
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

  const confirmStateUpdate = async () => {
    const task = tasksData.find(t => t._id === stateModal.taskId);
    if (!task) return;
    try {
      const res = await fetch(`${API_BASE}/tasks/${task._id}/completed`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !task.completed })
      });
      if (!res.ok) throw new Error("Lỗi cập nhật trạng thái");
      const updated = await res.json();
      setTasksData(prev =>
        prev.map(t =>
          t._id === task._id ? { ...t, completed: updated.completed } : t
        )
      );
      setFilteredTasks(prev =>
        prev.map(t =>
          t._id === task._id ? { ...t, completed: updated.completed } : t
        )
      );
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
    setStateModal({ show: false, taskId: null });
  };

  const cancelStateUpdate = () => setStateModal({ show: false, taskId: null });

  const confirmNoteUpdate = async () => {
    const task = tasksData.find(t => t._id === noteModal.taskId);
    if (!task) return;
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ taskId: task._id, content: noteModal.note })
      });
      if (!res.ok) throw new Error("Lỗi thêm ghi chú");
      const note = await res.json();
      setTasksData(prev =>
        prev.map(t =>
          t._id === task._id
            ? { ...t, notes: [...(t.notes || []), note] }
            : t
        )
      );
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
    setNoteModal({ show: false, taskId: null, note: "" });
  };

  const cancelNoteUpdate = () => setNoteModal({ show: false, taskId: null, note: "" });

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <>
      <div className="d-flex vh-100">
        <div className="bg-success text-white p-3 rounded" style={{ width: '250px' }}>
          <h5>Quản lý công việc Cá Nhân</h5>
        </div>

        <div className="flex-grow-1 p-3 bg-light overflow-auto">
          <form
            className="d-flex justify-content-between align-items-center mb-3"
            onSubmit={handleSearch}
          >
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm công việc..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button className="btn btn-secondary ms-2" type="submit">Tìm</button>
            </div>
            <div className="dropdown">
              <button className="btn btn-primary dropdown-toggle" data-bs-toggle="dropdown">
                {username ? <strong>{username}</strong> : "Tài khoản"}
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="#">Quản lý tài khoản</a></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>Đăng xuất</button>
                </li>
              </ul>
            </div>
          </form>

          <div className="table-responsive">
            {loading ? (
              <div>Đang tải dữ liệu...</div>
            ) : error ? (
              <div className="text-danger">Lỗi: {error}</div>
            ) : (
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Trạng Thái</th>
                    <th>Tên Nhiệm Vụ</th>
                    <th>Hạn</th>
                    <th>Ghi chú</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!task.completed}
                          disabled={stateModal.show}
                          onChange={() => setStateModal({ show: true, taskId: task._id })}
                          title="Đánh dấu hoàn thành"
                        />
                        {task.completed ? "✅" : "❌"}
                      </td>
                      <td>{task.title}</td>
                      <td>{task.deadline ? new Date(task.deadline).toLocaleDateString() : ""}</td>
                      <td>
                        {(task.notes && task.notes.length > 0)
                          ? task.notes.map((n, i) => <div key={i}>- {n.content}</div>)
                          : <span>Không có ghi chú</span>}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-success me-2"
                          onClick={() => setStateModal({ show: true, taskId: task._id })}
                        >
                          Cập nhật trạng thái
                        </button>
                        <button className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => setNoteModal({ show: true, taskId: task._id, note: "" })}>
                          Thêm ghi chú
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {stateModal.show && (
        <div className="modal fade show" tabIndex="-1" style={{
          display: "block",
          background: "rgba(0,0,0,0.5)"
        }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Xác nhận cập nhật trạng thái</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={cancelStateUpdate}></button>
              </div>
              <div className="modal-body">
                <p>Bạn có chắc muốn cập nhật trạng thái công việc không?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={cancelStateUpdate}>Hủy</button>
                <button className="btn btn-primary" onClick={confirmStateUpdate}>Xác nhận</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {noteModal.show && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h5>Thêm ghi chú</h5>
            <textarea
              className="form-control mb-3"
              rows="3"
              placeholder="Nhập ghi chú..."
              value={noteModal.note}
              onChange={(e) => setNoteModal({ ...noteModal, note: e.target.value })}
            ></textarea>
            <div className="d-flex justify-content-end">
              <button className="btn btn-secondary me-2" onClick={cancelNoteUpdate}>Hủy</button>
              <button className="btn btn-primary" onClick={confirmNoteUpdate}>Xác nhận</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TaskBoardBootstrap1;
