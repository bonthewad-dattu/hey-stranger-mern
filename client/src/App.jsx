import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Notifications from './pages/Notifications.jsx';
import Inbox from './pages/Inbox.jsx';
import Articles from './pages/Articles.jsx';
import Products from './pages/Products.jsx';
import SavedPosts from './pages/SavedPosts.jsx';
import Memories from './pages/Memories.jsx';
import Settings from './pages/Settings.jsx';
import Themes from './pages/Themes.jsx';
import Design from './pages/Design.jsx';
import Languages from './pages/Languages.jsx';
import Countries from './pages/Countries.jsx';
import Currencies from './pages/Currencies.jsx';
import Genders from './pages/Genders.jsx';
import Users from './pages/Users.jsx';
import UserGroups from './pages/UserGroups.jsx';
import People from './pages/People.jsx';
import PagesExplore from './pages/PagesExplore.jsx';
import Groups from './pages/Groups.jsx';
import Events from './pages/Events.jsx';
import Watch from './pages/Watch.jsx';
import Blogs from './pages/Blogs.jsx';
import Marketplace from './pages/Marketplace.jsx';
import Offers from './pages/Offers.jsx';
import Profile from './pages/Profile.jsx';
import UserPublicProfile from './pages/UserPublicProfile.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="articles" element={<Articles />} />
        <Route path="products" element={<Products />} />
        <Route path="saved" element={<SavedPosts />} />
        <Route path="memories" element={<Memories />} />
        <Route path="profile" element={<Profile />} />
        <Route path="user/:username" element={<UserPublicProfile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="themes" element={<Themes />} />
        <Route path="design" element={<Design />} />
        <Route path="languages" element={<Languages />} />
        <Route path="countries" element={<Countries />} />
        <Route path="currencies" element={<Currencies />} />
        <Route path="genders" element={<Genders />} />
        <Route path="users" element={<Users />} />
        <Route path="user-groups" element={<UserGroups />} />
        <Route path="explore/people" element={<People />} />
        <Route path="explore/pages" element={<PagesExplore />} />
        <Route path="explore/groups" element={<Groups />} />
        <Route path="explore/events" element={<Events />} />
        <Route path="explore/watch" element={<Watch />} />
        <Route path="explore/blogs" element={<Blogs />} />
        <Route path="explore/marketplace" element={<Marketplace />} />
        <Route path="explore/offers" element={<Offers />} />
      </Route>

      {/* Fallback: redirect unknown routes to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
