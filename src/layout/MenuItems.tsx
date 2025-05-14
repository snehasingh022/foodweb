import {
  Uil500px,
  UilAirplay,
  UilArrowGrowth,
  UilAt,
  UilBagAlt,
  UilBookAlt,
  UilBookOpen,
  UilBookReader,
  UilChartBar,
  UilChat,
  UilCheckSquare,
  UilCircle,
  UilClipboardAlt,
  UilClock,
  UilCompactDisc,
  UilCreateDashboard,
  UilDatabase,
  UilDocumentLayoutLeft,
  UilEdit,
  UilEnvelope,
  UilExchange,
  UilExclamationOctagon,
  UilExpandArrowsAlt,
  UilFile,
  UilFileShieldAlt,
  UilHeadphones,
  UilIcons,
  UilImages,
  UilLayerGroup,
  UilMap,
  UilPresentation,
  UilQuestionCircle,
  UilSearch,
  UilServer,
  UilSetting,
  UilShoppingCart,
  UilSquareFull,
  UilTable,
  UilUsdCircle,
  UilUsersAlt,
  UilWindowSection,
  UilEllipsisV,
  UilTicket,
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
} from '@iconscout/react-unicons';
import React, { useState, useEffect } from 'react';
import { Menu } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import versions from '../demoData/changelog.json';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../authentication/AuthContext';

import { changeMenuMode, changeDirectionMode, changeLayoutMode } from '../redux/themeLayout/actionCreator';

function MenuItems() {

    const path = '/admin';
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    
    // Determine if user is helpdesk role
    const [userRole, setUserRole] = useState('');
    
    useEffect(() => {
      if (currentUser?.role) {
        setUserRole(currentUser.role);
      }
    }, [currentUser]);

    const isHelpdesk = userRole === 'helpdesk';

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
      // Check if the current route matches the base path.
      if (pathname === path) {
        setOpenKeys(['dashboard']); // active menu key.
        setOpenItems(['demo-1']); // active menu item.
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

    // Create only the dashboard and support items for helpdesk users
    const helpdeskItems = [
        // Dashboard (minimal version)
        getItem(
          <Link href={`${path}`}>
            {t('Dashboard')}
          </Link>,
          'dashboard-main',
          !topMenu && <UilCreateDashboard />,
          null,
        ),
        
        // SECTION: SUPPORT (Only section accessible to helpdesk users)
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

    // The full menu items for admin and other roles
    const adminItems = [
        // SECTION 1: MAIN MENU
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
        getItem(
          <Link href={`${path}`}>
            {t('Dashboard')}
          </Link>,
          'dashboard-main',
          !topMenu && <UilCreateDashboard />,
          null,
        ),
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
        
        // SECTION 2: TOURS
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
        
        // SECTION 3: SUPPORT
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
        
        // SECTION 4: MEDIA
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
        getItem(
          <Link href={`${path}/graphics`}>
            {t('Graphics')}
          </Link>,
          'graphics',
          !topMenu && <UilPalette />,
          null,
        ),
    ];
    
    // Select the appropriate items based on user role
    const items = isHelpdesk ? helpdeskItems : adminItems;

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
