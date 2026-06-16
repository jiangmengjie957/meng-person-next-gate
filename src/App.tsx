import { Routes, Route } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import RootPage from './pages/Root'
import HomePage from './pages/Home'
import ChatPage from './pages/Chat'
import TodoListPage from './pages/TodoList'
import PageLayout from './layouts/PageLayout'

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {},
      }}
    >
      <Routes>
        <Route path="/" element={<RootPage />} />
        <Route element={<PageLayout />}>
          <Route path="/home" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/todoList" element={<TodoListPage />} />
        </Route>
      </Routes>
    </ConfigProvider>
  )
}

export default App
