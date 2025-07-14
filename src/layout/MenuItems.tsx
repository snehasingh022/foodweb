import {
  UilClipboardAlt,
  UilCreateDashboard,
  UilUsersAlt,
  UilEllipsisV,
  UilMoneyBill,
  UilSetting,
  UilTagAlt,
  UilUsersAlt as UilTeam,
  UilPlaneDeparture,
  UilShip,
  UilCreateDashboard as UilCustomTours,
  UilCircle,
  UilHeadphones as UilHelpdesk,
  UilComment,
  UilNewspaper,
  UilTag,
  UilApps,
  UilImageV,
  UilPalette,
  UilMegaphone,
  UilStar,
} from '@iconscout/react-unicons';
import React, { useState, useEffect, useMemo } from 'react';
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
    const isPartner = userRoles.includes('partner');

    interface RootState {
      ChangeLayoutMode: {
        topMenu: string;
      }
    }

    const topMenu = useSelector((state: RootState) => state.ChangeLayoutMode.topMenu);

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
            {t('Referrals')}
          </Link>,
          'referral',
          !topMenu && <UilUsersAlt />,
          null,
        ),
        getItem(
          <Link href={`${path}/bookings`}>
            {t('Sales')}
          </Link>,
          'sales',
          !topMenu && <UilClipboardAlt />,
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
          <Link href={`${path}/payments`}>
            {t('Payouts')}
          </Link>,
          'payouts',
          !topMenu && <UilMoneyBill />,
          null,
        ),
        getItem(
          <Link href={`${path}/coupons`}>
            {t('Affiliates')}
          </Link>,
          'affiliates',
          !topMenu && <UilTagAlt />,
          null,
        ),
         getItem(
          <Link href={`${path}/pages/settings`}>
            {t('Settings')}
          </Link>,
          'settings',
          !topMenu && (
            <Link className="menuItem-icon" href={`${path}/pages/settings`}>
              <UilSetting />
            </Link>
          ),
          null,
        ),
        getItem(
          <Link href={`${path}/pages/faq`}>
            {t('Faqs')}
          </Link>,
          'faq',
          !topMenu && (
            <Link className="menuItem-icon" href={`${path}/pages/faq`}>
              <UilCircle />
            </Link>
          ),
          null,
        ),
    ];

    
    // Build menu items based on user roles
    let items: any[] = [];

    if (isAdmin || isPartner) {
        // Admin gets everything
        items = [
            ...adminItems,
           
        ];
    } else if (isHelpdesk) {
        // Helpdesk gets dashboard and support only
        items = [
            ...baseItems,
            
        ];
    } else if (isToursMedia) {
        // Tours+Media gets dashboard, tours, and media
        items = [
            ...baseItems,
            
        ];
    } else if (isTours) {
        // Tours gets dashboard and tours only
        items = [
            ...baseItems,
            
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