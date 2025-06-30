import {
  UilClipboardAlt,
  UilCreateDashboard,
  UilUsersAlt,
  UilEllipsisV,
  UilMoneyBill,
  UilTagAlt,
  UilUsersAlt as UilTeam,
  UilPlaneDeparture,
  UilShip,
  UilCreateDashboard as UilCustomTours,
  UilHeadphones as UilHelpdesk,
  UilComment,
  UilNewspaper,
  UilTag,
  UilApps,
  UilImageV,
  UilPalette,
  UilMegaphone,
} from '@iconscout/react-unicons';
import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../authentication/AuthContext';

import { changeMenuMode, changeDirectionMode, changeLayoutMode } from '../redux/themeLayout/actionCreator';

function MenuItems() {

    const path = '/admin';
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    
    const [userRoles, setUserRoles] = useState<string[]>([]);
    
    useEffect(() => {
      if (currentUser?.roles) {
        setUserRoles(currentUser.roles);
      }
    }, [currentUser]);

    // Check user permissions
    const isAdmin = userRoles.includes('admin');
    const isHelpdesk = userRoles.includes('helpdesk');
    const isTours = userRoles.includes('tours');
    const isToursMedia = userRoles.includes('tours+media');

    interface RootState {
      ChangeLayoutMode: {
        topMenu: string;
      }
    }

    const { topMenu } = useSelector((state:RootState) => {
      return {
        topMenu: state.ChangeLayoutMode.topMenu,
      };
    });

    const router = useRouter();
    const { pathname } = router;
    const pathArray = pathname && pathname !== '/' ? pathname.split(path) : [];
    const mainPath = pathArray.length > 1 ? pathArray[1] : '';
    const mainPathSplit = mainPath.split('/');

    const [openKeys, setOpenKeys] = React.useState(
      !topMenu ? [`${mainPathSplit.length > 2 ? mainPathSplit[1] : 'dashboard'}`] : [],
    );
    const [openItems, setOpenItems] = React.useState(
      !topMenu ? [ `${ mainPathSplit.length === 1 ? 'demo-1' : mainPathSplit.length === 2 ? mainPathSplit[1] : mainPathSplit[2] }`, ] : []
    );

    useEffect(() => {
      if (pathname === path) {
        setOpenKeys(['dashboard']); 
        setOpenItems(['demo-1']); 
      }
    }, [pathname]);

    const onOpenChange = (keys:string[]) => {
      setOpenKeys(keys[keys.length - 1] !== 'recharts' && keys.length > 0 ? [keys[keys.length - 1]] : keys);
    };

    const onClick = (item:any) => {
      setOpenItems([item.key])
      if (item.keyPath.length === 1) setOpenKeys([]);
    };

    const dispatch = useDispatch();

    const changeNavbar = (topMode:boolean) => {
        const html:HTMLElement | null = document.querySelector('html');
        if (html) {
          if (topMode) {
            html.classList.add('hexadash-topmenu');
          } else {
            html.classList.remove('hexadash-topmenu');
          }
        }
        //@ts-ignore
        dispatch(changeMenuMode(topMode));
    };

    const changeLayoutDirection = (rtlMode:boolean) => {
        if (rtlMode) {
          const html:HTMLElement | null = document.querySelector('html');
          
          if (html) {
            html.setAttribute('dir', 'rtl');
          }
        } else {
          const html:HTMLElement | null = document.querySelector('html');

          if(html) {
            html.setAttribute('dir', 'ltr');
          }
        }
        //@ts-ignore
        dispatch(changeDirectionMode(rtlMode));
    };
    
    const changeLayout = (mode:string) => {
      //@ts-ignore
        dispatch(changeLayoutMode(mode));
    };

    const darkmodeActivated = () => {
      document.body.classList.add('dark');
    };
  
    const darkmodeDiactivated = () => {
      document.body.classList.remove('dark');
    };

    function getItem( label:React.ReactNode, key:string, icon:any, children:any) {
        return {
            label,
            key,
            icon,
            children,
        };
    }

    // Base menu items that everyone can see
    const baseItems = [
        getItem(
          <Link href={`${path}`}>
            {t('Dashboard')}
          </Link>,
          'dashboard-main',
          !topMenu && <UilCreateDashboard />,
          null,
        ),
    ];

    // Admin-only items (full access)
    const adminItems = [
        getItem(
          !topMenu && (
            <p className="flex text-[12px] font-medium uppercase text-theme-gray mt-[20px] dark:text-white/60 pe-[15px]">
              {t('Main Menu')}
            </p>
          ),
          'main-menu-title',
          null,
          null,
        ),
        ...baseItems,
        getItem(
          <Link href={`${path}/users`}>
            {t('Users')}
          </Link>,
          'users',
          !topMenu && <UilUsersAlt />,
          null,
        ),
        getItem(
          <Link href={`${path}/bookings`}>
            {t('Bookings')}
          </Link>,
          'bookings',
          !topMenu && <UilClipboardAlt />,
          null,
        ),
        getItem(
          <Link href={`${path}/payments`}>
            {t('Payments')}
          </Link>,
          'payments',
          !topMenu && <UilMoneyBill />,
          null,
        ),
        getItem(
          <Link href={`${path}/coupons`}>
            {t('Coupons')}
          </Link>,
          'coupons',
          !topMenu && <UilTagAlt />,
          null,
        ),
        getItem(
          <Link href={`${path}/team`}>
            {t('Team')}
          </Link>,
          'team',
          !topMenu && <UilTeam />,
          null,
        ),
    ];

    // Tours-related items
    const toursItems = [
        getItem(
          !topMenu && (
            <p className="flex text-[12px] font-medium uppercase text-theme-gray mt-[20px] dark:text-white/60 pe-[15px]">
              {t('Tours')}
            </p>
          ),
          'tours-title',
          null,
          null,
        ),
        getItem(
          <Link href={`${path}/tours`}>
            {t('Tours')}
          </Link>,
          'tours',
          !topMenu && <UilPlaneDeparture />,
          null,
        ),
        getItem(
          <Link href={`${path}/cruises`}>
            {t('Cruises')}
          </Link>,
          'cruises',
          !topMenu && <UilShip />,
          null,
        ),
        getItem(
          <Link href={`${path}/custom-tours`}>
            {t('Custom Tours')}
          </Link>,
          'custom-tours',
          !topMenu && <UilCustomTours />,
          null,
        ),
    ];

    // Support items
    const supportItems = [
        getItem(
          !topMenu && (
            <p className="flex text-[12px] font-medium uppercase text-theme-gray mt-[20px] dark:text-white/60 pe-[15px]">
              {t('Support')}
            </p>
          ),
          'support-title',
          null,
          null,
        ),
        getItem(
          <Link href={`${path}/helpdesk`}>
            {t('Helpdesk')}
          </Link>,
          'helpdesk',
          !topMenu && <UilHelpdesk />,
          null,
        ),
        getItem(
          <Link href={`${path}/queries`}>
            {t('Queries')}
          </Link>,
          'queries',
          !topMenu && <UilComment />,
          null,
        ),
    ];

    // Media items
    const mediaItems = [
        getItem(
          !topMenu && (
            <p className="flex text-[12px] font-medium uppercase text-theme-gray mt-[20px] dark:text-white/60 pe-[15px]">
              {t('Media')}
            </p>
          ),
          'media-title',
          null,
          null,
        ),
        getItem(
          <Link href={`${path}/homeslider`}>
            {t('Homeslider')}
          </Link>,
          'homeslider',
          !topMenu && <UilPalette />,
          null,
        ),
        getItem(
          <Link href={`${path}/media/advertisement`}>
            {t('Advertisements')}
          </Link>,
          'advertisements',
          !topMenu && <UilMegaphone />,
          null,
        ),
        getItem(
          <Link href={`${path}/blogs`}>
            {t('Blogs')}
          </Link>,
          'blogs',
          !topMenu && <UilNewspaper />,
          null,
        ),
        getItem(
          <Link href={`${path}/tags`}>
            {t('Tags')}
          </Link>,
          'tags',
          !topMenu && <UilTag />,
          null,
        ),
        getItem(
          <Link href={`${path}/categories`}>
            {t('Categories')}
          </Link>,
          'categories',
          !topMenu && <UilApps />,
          null,
        ),
        getItem(
          <Link href={`${path}/media`}>
            {t('Media')}
          </Link>,
          'media',
          !topMenu && <UilImageV />,
          null,
        ),
    ];

    // Build menu items based on user roles
    let items: any[] = [];

    if (isAdmin) {
        // Admin gets everything
        items = [
            ...adminItems,
            ...toursItems,
            ...supportItems,
            ...mediaItems
        ];
    } else if (isHelpdesk) {
        // Helpdesk gets dashboard and support only
        items = [
            ...baseItems,
            ...supportItems
        ];
    } else if (isToursMedia) {
        // Tours+Media gets dashboard, tours, and media
        items = [
            ...baseItems,
            ...toursItems,
            ...mediaItems
        ];
    } else if (isTours) {
        // Tours gets dashboard and tours only
        items = [
            ...baseItems,
            ...toursItems
        ];
    } else {
        // Default fallback - just dashboard
        items = baseItems;
    }

    return (
        <Menu
            onClick={onClick}
            onOpenChange={onOpenChange}
            mode={!topMenu || window.innerWidth <= 991 ? 'inline' : 'horizontal'}
            defaultSelectedKeys={openKeys}
            defaultOpenKeys={openItems}
            overflowedIndicator={<UilEllipsisV />}
            openKeys={openKeys}
            selectedKeys={openItems}
            items={items}
            style={{ height: 'auto' }}
            className="border-none sidebar-menu"
        />
    );
}

export default MenuItems;