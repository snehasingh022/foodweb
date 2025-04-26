import React from 'react';
import { Row, Col, Card } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';

function Helpdesk() {
  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Helpdesk',
    },
  ];

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-8 xl:px-[15px] pt-2 pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
        title="Helpdesk"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-[25px]">
                  <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold mb-4">Helpdesk Support</h2>
                  <p>Customer support management and ticket system will be implemented here.</p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>
    </>
  );
}

export default Helpdesk; 