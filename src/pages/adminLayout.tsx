import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  const topMenu = useSelector((state: RootState) => state.ChangeLayoutMode.topMenu);
  const collapsed = useSelector((state: RootState) => state.ChangeLayoutMode.menuCollapse);
  const isLoggedIn = useSelector((state: RootState) => state.auth.login);
  const rtl = useSelector((state: RootState) => state.ChangeLayoutMode.rtlData);
  const mainContent = useSelector((state: RootState) => state.ChangeLayoutMode.mode);

  const { currentUser, isAdmin, userRoles } = useAuth();
  const [isNavigating, setIsNavigating] = useState(false);

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
    // Debug logging
    console.log('AdminLayout Debug:', {
      currentUser,
      isAdmin,
      userRoles,
      isNavigating,
      pathname: router.pathname
    });

    // Prevent multiple rapid redirects
    if (isNavigating) {
      console.log('Navigation blocked - already navigating');
      return;
    }

    // If no current user from Firebase, redirect to login
    if (!currentUser) {
      console.log('No current user - redirecting to login');
      if (!router.pathname.startsWith('/login') && !router.pathname.startsWith('/register') && !router.pathname.startsWith('/forgot-password')) {
        setIsNavigating(true);
        router.push('/');
      }
      return;
    }

    // Get user roles
    const userRolesList = currentUser?.roles || userRoles || [];
    const userPrimaryRole = currentUser?.role || "";

    console.log('User roles debug:', {
      userRolesList,
      userPrimaryRole,
      currentUserRoles: currentUser?.roles,
      userRolesFromContext: userRoles
    });

    // Check if user has valid role
    const hasValidRole = isAdmin || 
      userRolesList.includes('helpdesk') || 
      userRolesList.includes('tours') || 
      userRolesList.includes('tours+media') ||
      userRolesList.includes('partner') ||
      userRolesList.includes('admin') ||
      userPrimaryRole === 'helpdesk' ||
      userPrimaryRole === 'tours' ||
      userPrimaryRole === 'tours+media' ||
      userPrimaryRole === 'partner' ||
      userPrimaryRole === 'admin';

    console.log('Role validation:', {
      hasValidRole,
      isAdmin,
      userRolesList,
      userPrimaryRole
    });

    // If user has no recognized role, redirect to login
    if (!hasValidRole) {
      console.log('No valid role - redirecting to login');
      setIsNavigating(true);
      router.push('/');
      return;
    }
    
    // Role-based access control
    if (currentUser) {
      
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
        '/admin/media',
        
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

      const partnerPaths = [
        '/admin',
        '/admin/tours',
        '/admin/cruises',
        '/admin/custom-tours',
        '/admin/bookings',
        '/admin/payments'
      ];

      // Check current path access
      const currentPath = router.pathname;
      let hasAccess = false;
      let redirectPath = '/admin';

      if (isAdmin || userRolesList.includes('admin') || userPrimaryRole === 'admin') {
        hasAccess = true; // Admin has access to everything
        console.log('Admin access granted');
      } else if (userRolesList.includes('helpdesk') || userPrimaryRole === 'helpdesk') {
        hasAccess = helpdeskPaths.some(path => 
          currentPath === path || currentPath.startsWith(`${path}/`)
        );
        redirectPath = '/admin/support/tickets';
        console.log('Helpdesk access check:', hasAccess);
      } else if (userRolesList.includes('tours+media') || userPrimaryRole === 'tours+media') {
        hasAccess = toursMediaPaths.some(path => 
          currentPath === path || currentPath.startsWith(`${path}/`)
        );
        redirectPath = '/admin/tours';
        console.log('Tours+Media access check:', hasAccess);
      } else if (userRolesList.includes('tours') || userPrimaryRole === 'tours') {
        hasAccess = toursPaths.some(path => 
          currentPath === path || currentPath.startsWith(`${path}/`)
        );
        redirectPath = '/admin/tours';
        console.log('Tours access check:', hasAccess);
      } else if (userRolesList.includes('partner') || userPrimaryRole === 'partner') {
        hasAccess = partnerPaths.some(path => 
          currentPath === path || currentPath.startsWith(`${path}/`)
        );
        redirectPath = '/admin/tours';
        console.log('Partner access check:', hasAccess);
      }

      console.log('Access control result:', {
        currentPath,
        hasAccess,
        redirectPath,
        userRole: userPrimaryRole
      });

      // If no access, redirect to appropriate section
      if (!hasAccess) {
        console.log('No access - redirecting to:', redirectPath);
        setIsNavigating(true);
        router.push(redirectPath);
      }
    }
  }, [router, currentUser, isAdmin, userRoles, isNavigating]);

  // Reset navigation state when pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [router.pathname]);
  
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