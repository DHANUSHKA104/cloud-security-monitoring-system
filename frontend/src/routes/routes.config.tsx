import React from 'react';
import { RouteObject, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layout/MainLayout';
import { AuthLayout } from '@/layout/AuthLayout';
import { DashboardLayout } from '@/layout/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import {
  Dashboard,
  Login,
  SignUp,
  Profile,
  Users,
  Incidents,
  IncidentDetails,
  NotFound,
} from '@/pages';
import { ROUTES } from '@/constants/routes.constants';

export const routesConfig: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      // Public Auth routes
      {
        element: (
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        ),
        children: [
          {
            path: ROUTES.LOGIN,
            element: <Login />,
          },
          {
            path: ROUTES.SIGNUP,
            element: <SignUp />,
          },
        ],
      },
      // Protected App routes
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: ROUTES.DASHBOARD,
            element: <Dashboard />,
          },
          {
            path: ROUTES.INCIDENTS,
            element: <Incidents />,
          },
          {
            path: '/incidents/:id',
            element: <IncidentDetails />,
          },
          {
            path: ROUTES.PROFILE,
            element: <Profile />,
          },
          {
            path: ROUTES.USERS,
            element: (
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Users />
              </ProtectedRoute>
            ),
          },
          {
            path: '/user-management',
            element: <Navigate to={ROUTES.USERS} replace />,
          },
        ],
      },
      // 404 Catch-all
      {
        path: ROUTES.NOT_FOUND,
        element: <NotFound />,
      },
    ],
  },
];
