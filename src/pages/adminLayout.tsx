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

  const { currentUser, isAdmin } = useAuth();

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
    }
    
    // If the user is logged in but has no recognized role (neither admin nor helpdesk), redirect to login page
    if (isLoggedIn && currentUser && !isAdmin && currentUser.role !== 'helpdesk') {
      router.push('/');
    }
    
    // If user is helpdesk but trying to access admin-only pages, redirect to helpdesk area
    if (isLoggedIn && currentUser && currentUser.role === 'helpdesk') {
      // List of paths that are admin-only (not including /admin/helpdesk, /admin/support, etc.)
      const adminOnlyPaths = [
        '/admin/users', 
        '/admin/bookings', 
        '/admin/payments', 
        '/admin/coupons',
        '/admin/team',
        '/admin/tours',
        '/admin/cruises',
        '/admin/custom-tours',
        '/admin/blogs',
        '/admin/tags',
        '/admin/categories',
        '/admin/media',
        '/admin/graphics'
      ];
      
      // Check if current path starts with any admin-only path
      const isAdminOnlyPath = adminOnlyPaths.some(path => 
        router.pathname === path || router.pathname.startsWith(`${path}/`)
      );
      
      if (isAdminOnlyPath) {
        router.push('/admin/support/tickets');
      }
    }
  }, [router, isLoggedIn, currentUser, isAdmin]);
  
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
