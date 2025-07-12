import { useSelector } from 'react-redux';
import { useMemo } from 'react';
import MenuItems from '../../layout/MenuItems';

import { Layout } from 'antd';

const { Sider } = Layout;

interface RootState {
  ChangeLayoutMode: {
    topMenu: boolean,
    menuCollapse: boolean,
  }
}

const Sidebar = () => {

  const topMenu = useSelector((state: RootState) => state.ChangeLayoutMode.topMenu);
  const collapsed = useSelector((state: RootState) => state.ChangeLayoutMode.menuCollapse);

  return (
    <>
      {!topMenu || typeof window !== 'undefined' && window.innerWidth < 1200 ? (
        <Sider
          width={collapsed ? 80 : 280}
          collapsed={collapsed}
          className="fixed h-screen bg-white dark:bg-[#1b1d2a] py-5 z-998 shadow-[0_0_20px_rgba(160,160,160,0.02)] [&.ant-layout-sider-collapsed]:xl:-ms-20 duration-[300ms]"
          style={{ 
            position: 'fixed',
            height: '100vh',
            overflowY: 'hidden'
          }}
        >
          <div 
            className="h-full" 
            style={{ 
              overflowY: 'auto', 
              height: 'calc(100vh - 40px)',
              paddingBottom: '60px'
            }}
          >
            <MenuItems />
          </div>
        </Sider>
      ) : null }
    </>
  );
};

export default Sidebar;
