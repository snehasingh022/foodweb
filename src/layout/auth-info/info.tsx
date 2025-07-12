import {
  UilAngleDown,
  UilSignout,
 } from '@iconscout/react-unicons';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { logOutAction } from '@/redux/authentication/actionCreator';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useAuth } from '@/authentication/AuthContext'

import PopOver from '@/components/popup';
import Heading from '@/components/heading';

const AuthInfo = React.memo((props:any) => {
  const router = useRouter();
  const dispatch = useDispatch();

  const { user } = useUser();
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    if (!user && !currentUser) {
      // @ts-ignore
      dispatch(logOutAction(() => router.push('/')));
      console.log('Logged Out!');
    }
  }, []);

  const handleLogout = async (e: any) => {
    try {
      await logout()
      // @ts-ignore
      dispatch(logOutAction(() => router.push('/')));
      console.log('Successfully Logged Out!');
    } catch (err) {
      console.log(err);
    }
  }

  // Get user email and role
  const userEmail = user?.email || currentUser?.email || 'admin@example.com';
  const userRole = currentUser?.role || 'Administrator';

  const userContent = (
    <div>
      <div className="min-w-[280px] sm:min-w-full">
        <figure className="flex items-center text-sm rounded-[8px] bg-section dark:bg-white/10 py-[20px] px-[25px] mb-[12px]">
          <Image className="rounded-full ltr:mr-4 rtl:ml-4" src={user?.picture ?? '/img/avatar/chat-auth.png'} alt="" width="50" height="50" />
          <figcaption>
            <Heading className="text-dark dark:text-white/[.87] mb-0.5 text-sm" as="h5">
              {user ? user.name: currentUser ? currentUser.displayName : 'Abdullah Bin Talha' }
            </Heading>
            <p className="mb-0 text-xs text-body dark:text-white/60">{userEmail}</p>
            <p className="mb-0 text-xs text-body dark:text-white/60">{userRole}</p>
          </figcaption>
        </figure>
        <ul className="mb-[10px]">
           
        </ul>
        <Link
          onClick={handleLogout}
          href={user ? '/api/auth/logout' : '#'}
          className="flex items-center justify-center text-sm font-medium bg-[#f4f5f7] dark:bg-[#32333f] h-[50px] text-light hover:text-primary dark:hover:text-white/60 dark:text-white/[.87] mx-[-12px] mb-[-15px] rounded-b-6"
        >
          <UilSignout className="w-4 h-4 ltr:mr-3 rtl:ml-3" /> Sign Out
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex items-center justify-end flex-auto gap-6 lg:gap-4">
      <div className="flex">
        <PopOver placement="bottomRight" content={userContent} action="click">
          <Link href="#" className="flex items-center overflow-x-auto text-light whitespace-nowrap">
            <Image src={user?.picture ?? '/img/avatar/matureman1.png'} alt="Avatar" width="32" height="32" className="rounded-full" />
            <span className="ms-2.5 lg:ms-1.5 me-1.5 text-body dark:text-white/60 text-sm font-medium md:hidden">
              {user ? user.name: currentUser ? currentUser.displayName : 'Abdullah Bin Talha' }
            </span>
            <span className="ms-0.5 lg:ms-0.5 me-1 text-body dark:text-white/60 text-xs font-medium md:hidden">
              {userEmail}
            </span>
            <UilAngleDown className="w-4 h-4 min-w-[16px]" />
          </Link>
        </PopOver>
      </div>
    </div>
  );
});

export default AuthInfo;
