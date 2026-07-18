import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AppRoute from '@/components/Auth/AppRoute';
import Loader from '@/components/Loader';
import { UserRoleName } from '@/models/user.model';
import Error404 from '@/views/Error404';

const ResetPassword = lazy(() => import('@/views/ResetPassword'));
const ForgotPassword = lazy(() => import('@/views/ForgotPassword'));
const Agencies = lazy(() => import('@/views/Agencies'));
const Bookings = lazy(() => import('@/views/Bookings'));
const Dashboard = lazy(() => import('@/views/Dashboard'));
const SingleBooking = lazy(() => import('@/views/Bookings/SingleBooking'));
const CustomBoats = lazy(() => import('@/views/CustomBoats'));
const Extras = lazy(() => import('@/views/Extras'));
const Invoices = lazy(() => import('@/views/Invoices'));
const Offers = lazy(() => import('@/views/Offers'));
const Users = lazy(() => import('@/views/Users'));
const Chat = lazy(() => import('@/views/Chat'));
const Login = lazy(() => import('@/views/Login'));
const MyProfile = lazy(() => import('@/views/MyProfile'));
const SignUp = lazy(() => import('@/views/SignUp'));

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<Dashboard />}
            />
          }
        />
        <Route
          path="/offers"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<Offers />}
            />
          }
        />
        <Route
          path="/chat"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<Chat />}
            />
          }
        />
        <Route path="/login" element={<AppRoute variant="anonymous" component={<Login />} />} />
        <Route path="/signup" element={<AppRoute variant="anonymous" component={<SignUp />} />} />
        <Route path="/reset-password" element={<AppRoute variant="anonymous" component={<ResetPassword />} />} />
        <Route path="/forgot-password" element={<AppRoute variant="anonymous" component={<ForgotPassword />} />} />
        <Route
          path="/my-profile"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<MyProfile />}
            />
          }
        />
        <Route
          path="/custom-boats/*"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<CustomBoats />}
            />
          }
        />
        <Route
          path="/bookings"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<Bookings />}
            />
          }
        />
        <Route
          path="/bookings/:orderNo"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<SingleBooking />}
            />
          }
        />
        <Route
          path="/invoices/*"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<Invoices />}
            />
          }
        />
        <Route
          path="/extras/*"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<Extras />}
            />
          }
        />
        <Route
          path="/agencies/*"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<Agencies />}
            />
          }
        />
        <Route
          path="/users/*"
          element={
            <AppRoute
              variant="protected"
              accessLevel={[UserRoleName.MANAGER, UserRoleName.SYSTEM_ADMIN]}
              component={<Users />}
            />
          }
        />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
