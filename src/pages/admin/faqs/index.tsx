import React from 'react';
import { Row, Col, Card } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import Protected from '../../../components/Protected/Protected';

function Faqs() {
  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Faqs',
    },
  ];

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-8 xl:px-[15px] pt-2 pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
        title="Faqs"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-[25px]">
                  <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold mb-4">Faqs Management</h2>
                  <p>Faqs listing and management will be implemented here.</p>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>
    </>
  );
}

export default Protected(Faqs, ["admin"]); 