import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import { useState } from "react"
import LoginForm from "./loginForm"
import AccManagement from './accountManagement'
import TaskBoardBootstrap1 from './mainPage'
import TaskBoardBootstrap2 from './mainPage2'
import TaskBoardBootstrap3 from './mainPage3'
import TaskBoardBootstrap4 from './mainPage4'

function App() {
  const [user, setUser] = useState(null)
  const [activePage, setActivePage] = useState("tasks") // "tasks" or "employees"

  // onLogin callback receives user data from backend ("quanlysukien_BE")
  const handleLogin = (userData) => {
    localStorage.setItem("token", userData.token)
    // Lưu cả role, leaderId, employeeId vào state user
    setUser({
      ...userData,
      role: userData.role,
      leaderId: userData.leaderId || null,
      employeeId: userData.employeeId || null
    })
  }

  // Đăng xuất toàn hệ thống
  const handleLogout = () => {
    localStorage.removeItem("token")
    setUser(null)
    window.location.reload()
  }

  if(!user) {
    return <LoginForm onLogin={handleLogin} />
  }

  let UIComponent
  switch(user.role) {
    case "manager":
      UIComponent = <TaskBoardBootstrap4 onLogout={handleLogout} />
      break
    case "leader":
      UIComponent = (
        activePage === "tasks"
          ? <TaskBoardBootstrap2 setActivePage={setActivePage} activePage={activePage} user={user} onLogout={handleLogout} />
          : <TaskBoardBootstrap3 setActivePage={setActivePage} activePage={activePage} onLogout={handleLogout} />
      )
      break
    case "employee":
      UIComponent = <TaskBoardBootstrap1 onLogout={handleLogout} />
      break
    default:
      UIComponent = <LoginForm onLogin={handleLogin} />
      break
  }

  return (
    <>
      <style>{`
        .mainpage-hover-anim {
          transition: box-shadow 0.3s, transform 0.3s;
        }
        .mainpage-hover-anim:hover {
          box-shadow: 0 8px 32px rgba(67,233,123,0.18), 0 1.5px 8px rgba(56,249,215,0.12);
          z-index: 2;
        }
      `}</style>
      <div className="mainpage-hover-anim">
        {UIComponent}
      </div>
    </>
  )
}

export default App
