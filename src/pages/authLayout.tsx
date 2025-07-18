import Image from 'next/image';
import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

import backgroundImage from '../../public/img/logo.webp';

const AuthLayout = ({ children }: { children: React.ReactNode }) => {

  interface RootState {
    auth: {
      login: boolean; 
    };
  }

  const isLoggedIn = useSelector((state:RootState) => state.auth.login);

  const router = useRouter();

  useEffect(() => {
    // If the user is logged in and trying to access a authentication page, redirect to the admin page
    if (isLoggedIn && (router.pathname==('/') || router.pathname.startsWith('/login') || router.pathname.startsWith('/register') || router.pathname.startsWith('/forgot-password'))) {
      router.push('/admin');
    }
  }, [router]);

  return (
    <div
      style={{
        backgroundImage: `url()`,
      }}
      className="bg-top bg-no-repeat mt-24"
    >
      <div className="py-[120px] 2xl:py-[80px] px-[15px]">
        <div className="flex justify-center">
          <Image className="hidden dark:block" src='/img/logo_white.svg' alt="Logo" width="140" height="32" />
        </div>
          {children}
      </div>
    </div>
  );
};

export default AuthLayout;
