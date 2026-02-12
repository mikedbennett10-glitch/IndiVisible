import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RequireHousehold } from '@/components/auth/RequireHousehold'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { HouseholdSetupPage } from '@/pages/auth/HouseholdSetupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ListsPage } from '@/pages/ListsPage'
import { TaskListPage } from '@/pages/TaskListPage'
import { TaskDetailPage } from '@/pages/TaskDetailPage'
import { CalendarPage } from '@/pages/CalendarPage'
import { ChatPage } from '@/pages/ChatPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/household-setup', element: <HouseholdSetupPage /> },
      {
        element: <RequireHousehold />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <DashboardPage /> },
              { path: '/lists', element: <ListsPage /> },
              { path: '/lists/:listId', element: <TaskListPage /> },
              { path: '/tasks/:taskId', element: <TaskDetailPage /> },
              { path: '/chat', element: <ChatPage /> },
              { path: '/calendar', element: <CalendarPage /> },
              { path: '/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])
