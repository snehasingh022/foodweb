import React, { useEffect } from 'react';
import { Layout } from 'antd';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import Footer from '@/layout/footer';
import Sidebar from '@/layout/sidebar';
import HeaderTop from '@/layout/header';
import { useAuth } from '@/authentication/AuthContext';

const { Content } = Layout;

import config from '@/config/config';
const { theme } = config;

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  
  interface RootState {
    ChangeLayoutMode: {
      topMenu: boolean; 
      menuCollapse: boolean; 
      rtlData: boolean; 
      mode: string; 
    };
    auth: {
      login: boolean;
    };
  }

  const { topMenu, collapsed, isLoggedIn, rtl, mainContent } = useSelector((state:RootState) => {
    return {
      topMenu: state.ChangeLayoutMode.topMenu,
      collapsed: state.ChangeLayoutMode.menuCollapse,
      isLoggedIn: state.auth.login,
      rtl: state.ChangeLayoutMode.rtlData,
      mainContent: state.ChangeLayoutMode.mode,
    };
  });

  const { currentUser, isAdmin, userRoles } = useAuth();

  if(mainContent === 'darkMode') {
    document.body.classList.add('dark');
    document.body.classList.add('dark');
  }

  if (rtl) {
    const htmlElement: HTMLElement | null = document.querySelector('html');

    if (htmlElement) {
      htmlElement.setAttribute('dir', 'rtl');
    }
  }

  const router = useRouter();

  useEffect(() => {
    // If the user is not logged in and trying to access a restricted page, redirect to the login page
    if (!isLoggedIn && !router.pathname.startsWith('/login') && !router.pathname.startsWith('/register') && !router.pathname.startsWith('/forgot-password')) {
      router.push('/');
      return;
    }
    
    // If no current user, exit early
    if (!currentUser) {
      return;
    }

    // Get user roles
    const userRolesList = currentUser?.roles || userRoles || [];
    const userPrimaryRole = currentUser?.role || "";

    // Check if user has valid role
    const hasValidRole = isAdmin || 
      userRolesList.includes('helpdesk') || 
      userRolesList.includes('tours') || 
      userRolesList.includes('tours+media') ||
      userPrimaryRole === 'helpdesk' ||
      userPrimaryRole === 'tours' ||
      userPrimaryRole === 'tours+media';

    // If user has no recognized role, redirect to login
    if (!hasValidRole) {
      router.push('/');
      return;
    }
    
    // Role-based access control
    if (isLoggedIn && currentUser) {
      
      // Define role-specific allowed paths
      const adminPaths = [
        '/admin',
        '/admin/users', 
        '/admin/bookings', 
        '/admin/payments', 
        '/admin/coupons',
        '/admin/team',
        '/admin/tours',
        '/admin/cruises',
        '/admin/custom-tours',
        '/admin/support',
        '/admin/helpdesk',
        '/admin/queries',
        '/admin/homeslider',
        '/admin/blogs',
        '/admin/tags',
        '/admin/categories',
        '/admin/media'
      ];

      const helpdeskPaths = [
        '/admin',
        '/admin/support',
        '/admin/helpdesk',
        '/admin/queries'
      ];

      const toursPaths = [
        '/admin',
        '/admin/tours',
        '/admin/cruises',
        '/admin/custom-tours'
      ];

      const toursMediaPaths = [
        '/admin',
        '/admin/tours',
        '/admin/cruises',
        '/admin/custom-tours',
        '/admin/homeslider',
        '/admin/blogs',
        '/admin/tags',
        '/admin/categories',
        '/admin/media'
      ];

      // Check current path access
      const currentPath = router.pathname;
      let hasAccess = false;
      let redirectPath = '/admin';

      if (isAdmin || userRolesList.includes('admin') || userPrimaryRole === 'admin') {
        hasAccess = true; // Admin has access to everything
      } else if (userRolesList.includes('helpdesk') || userPrimaryRole === 'helpdesk') {
        hasAccess = helpdeskPaths.some(path => 
          currentPath === path || currentPath.startsWith(`${path}/`)
        );
        redirectPath = '/admin/support/tickets';
      } else if (userRolesList.includes('tours+media') || userPrimaryRole === 'tours+media') {
        hasAccess = toursMediaPaths.some(path => 
          currentPath === path || currentPath.startsWith(`${path}/`)
        );
        redirectPath = '/admin/tours';
      } else if (userRolesList.includes('tours') || userPrimaryRole === 'tours') {
        hasAccess = toursPaths.some(path => 
          currentPath === path || currentPath.startsWith(`${path}/`)
        );
        redirectPath = '/admin/tours';
      }

      // If no access, redirect to appropriate section
      if (!hasAccess) {
        router.push(redirectPath);
      }
    }
  }, [router, isLoggedIn, currentUser, isAdmin, userRoles]);
  
  return (
    <ThemeProvider theme={theme}>
      <HeaderTop />

      <div className='flex flex-row gap-5 mt-[72px]'>
        <Sidebar />

        <Layout className={`max-w-full duration-[300ms] ${!topMenu ? `xl:ps-0 ease-[ease] ${collapsed ? 'ps-[80px]' : 'ps-[280px] delay-[150ms]'}` : ''}`}>

          <Content>
            {children}
            
            <Footer />
          </Content>
        </Layout>
      </div>
    </ThemeProvider>
  );
};

export default AdminLayout;