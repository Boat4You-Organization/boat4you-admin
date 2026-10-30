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
const BoatsMedia = lazy(() => import('@/views/BoatsMedia'));
const Extras = lazy(() => import('@/views/Extras'));
const Invoices = lazy(() => import('@/views/Invoices'));
const Offers = lazy(() => import('@/views/Offers'));
const Users = lazy(() => import('@/views/Users'));
const ContactCenter = lazy(() => import('@/views/ContactCenter'));
const Login = lazy(() => import('@/views/Login'));
const MyProfile = lazy(() => import('@/views/MyProfile'));
const SignUp = lazy(() => import('@/views/SignUp'));

const CONTACT_CENTER_PATHS = [
  '/contact-center',
  '/contact-center/c/:id',
  '/contact-center/live',
  '/contact-center/contacts',
  '/contact-center/contacts/:id',
  '/contact-center/stats',
];

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
        {/* Contact Center (P2) replaces the /chat inbox. SYSTEM_ADMIN only, same as the backend (/admin/cc and
            /admin/chat @PreAuthorize): transcripts carry visitor IPs, e-mails and security evidence. */}
        <Route path="/chat" element={<Navigate to="/contact-center" replace />} />
        {CONTACT_CENTER_PATHS.map(path => (
          <Route
            key={path}
            path={path}
            element={
              <AppRoute variant="protected" accessLevel={[UserRoleName.SYSTEM_ADMIN]} component={<ContactCenter />} />
            }
          />
        ))}
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
        {/* SYSTEM_ADMIN only, like the backend /admin/yachts/** media and image-hygiene endpoints. */}
        <Route
          path="/boats/media"
          element={
            <AppRoute variant="protected" accessLevel={[UserRoleName.SYSTEM_ADMIN]} component={<BoatsMedia />} />
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
