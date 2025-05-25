import Image from 'next/image';
import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';

<<<<<<< HEAD
import backgroundImage from '../../public/img/logo.webp';
=======
import backgroundImage from '../../public/img/admin-bg-light.png';
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12

const AuthLayout = ({ children }: { children: React.ReactNode }) => {

  interface RootState {
    auth: {
      login: boolean; 
    };
  }

  const { isLoggedIn } = useSelector((state:RootState) => {
    return {
      isLoggedIn: state.auth.login,
    };
  });

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
        backgroundImage: `url(${backgroundImage.src})`,
      }}
<<<<<<< HEAD
      className="bg-top bg-no-repeat mt-24"
    >
      <div className="py-[120px] 2xl:py-[80px] px-[15px]">
        <div className="flex justify-center">
=======
      className="bg-top bg-no-repeat"
    >
      <div className="py-[120px] 2xl:py-[80px] px-[15px]">
        <div className="flex justify-center">
          <Image className="dark:hidden" src='/img/logo_dark.svg' alt="Logo Dark" width="140" height="32" />
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
          <Image className="hidden dark:block" src='/img/logo_white.svg' alt="Logo" width="140" height="32" />
        </div>
          {children}
      </div>
    </div>
  );
};

export default AuthLayout;
