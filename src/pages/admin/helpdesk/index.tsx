import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Select, Table, Button, Modal, Form, message, Popconfirm } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { Buttons } from '../../../components/buttons';
import {
  UilEye,
  UilEdit,
  UilPlus,
  UilTrashAlt,
  UilSearch
} from '@iconscout/react-unicons';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit,
  startAfter,
  endBefore, 
  limitToLast,
  deleteDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import moment from 'moment';

interface Ticket {
  key: string;
  id: string;
  category: string;
  createdAt: Date;
  customerId?: string;
  customerName?: string;
  email?: string;
  openMessage?: string;
  status: string;
  userId?: string;
}

function Helpdesk() {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [visibleView, setVisibleView] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);

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

  useEffect(() => {
    fetchTickets();
  }, [statusFilter]);

  // Generate ticket ID with "HID" + timestamp
  const generateTicketId = () => {
    const timestamp = Date.now();
    return `HID${timestamp}`;
  };

  // Fetch tickets from Firebase
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'helpdesk');
      let q = query(
        ticketsRef, 
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
      }
      
      const ticketList: Ticket[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!statusFilter || data.status === statusFilter) {
          ticketList.push({
            key: doc.id,
            id: doc.id,
            category: data.category || '',
            status: data.status || 'Opened',
            createdAt: data.createdAt?.toDate() || new Date(),
            customerId: data.userId,
            customerName: data.customerName,
            email: data.email,
            openMessage: data.openMessage,
            userId: data.userId
          });
        }
      });
      
      setTickets(ticketList);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      message.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  // Handle next page
  const handleNextPage = async () => {
    if (!lastVisible) return;
    
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'helpdesk');
      const q = query(
        ticketsRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(pageSize)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
        
        const ticketList: Ticket[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!statusFilter || data.status === statusFilter) {
            ticketList.push({
              key: doc.id,
              id: doc.id,
              category: data.category || '',
              status: data.status || 'Opened',
              createdAt: data.createdAt?.toDate() || new Date(),
              customerId: data.userId,
              customerName: data.customerName,
              email: data.email,
              openMessage: data.openMessage,
              userId: data.userId
            });
          }
        });
        
        setTickets(ticketList);
        setCurrentPage(currentPage + 1);
      }
    } catch (error) {
      console.error("Error fetching next page:", error);
      message.error("Failed to fetch next page");
    } finally {
      setLoading(false);
    }
  };

  // Handle previous page
  const handlePrevPage = async () => {
    if (!firstVisible) return;
    
    setLoading(true);
    try {
      const ticketsRef = collection(db, 'helpdesk');
      const q = query(
        ticketsRef,
        orderBy('createdAt', 'desc'),
        endBefore(firstVisible),
        limitToLast(pageSize)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setFirstVisible(querySnapshot.docs[0]);
        
        const ticketList: Ticket[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!statusFilter || data.status === statusFilter) {
            ticketList.push({
              key: doc.id,
              id: doc.id,
              category: data.category || '',
              status: data.status || 'Opened',
              createdAt: data.createdAt?.toDate() || new Date(),
              customerId: data.userId,
              customerName: data.customerName,
              email: data.email,
              openMessage: data.openMessage,
              userId: data.userId
            });
          }
        });
        
        setTickets(ticketList);
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Error fetching previous page:", error);
      message.error("Failed to fetch previous page");
    } finally {
      setLoading(false);
    }
  };

  // Add new ticket
  const handleAddTicket = async (values: any) => {
    setLoading(true);
    try {
      const ticketID = generateTicketId();
      const newTicket = {
        category: values.category,
        status: 'Opened',
        createdAt: new Date(),
        updatedAt: new Date(),
        customerName: values.customerName,
        email: values.email,
        openMessage: values.openMessage
      };
      
      await setDoc(doc(db, 'helpdesk', ticketID), newTicket);
      message.success("Ticket created successfully");
      setVisible(false);
      form.resetFields();
      fetchTickets();
    } catch (error) {
      console.error("Error adding ticket:", error);
      message.error("Failed to add ticket");
    } finally {
      setLoading(false);
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (id: string) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'helpdesk', id));
      message.success("Ticket deleted successfully");
      fetchTickets();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      message.error("Failed to delete ticket");
    } finally {
      setLoading(false);
    }
  };

  // Fetch ticket details
  const fetchTicketDetails = async (id: string) => {
    setLoading(true);
    try {
      const ticketRef = doc(db, 'helpdesk', id);
      const ticketSnap = await getDoc(ticketRef);
      
      if (ticketSnap.exists()) {
        const data = ticketSnap.data();
        setCurrentTicket({
          key: ticketSnap.id,
          id: ticketSnap.id,
          category: data.category || '',
          status: data.status || 'Opened',
          createdAt: data.createdAt?.toDate() || new Date(),
          customerId: data.userId,
          customerName: data.customerName,
          email: data.email,
          openMessage: data.openMessage,
          userId: data.userId
        });
        setVisibleView(true);
      } else {
        message.error("Ticket not found");
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      message.error("Failed to fetch ticket details");
    } finally {
      setLoading(false);
    }
  };

  const onCancelView = () => {
    setVisibleView(false);
    setCurrentTicket(null);
  };

  const showModal = () => {
    setVisible(true);
  };

  const onCancel = () => {
    setVisible(false);
  };

  const handleStatusSearch = (value: string) => {
    setStatusFilter(value);
  };

  const handleSubjectSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
  };

  // Filter data based on search text
  const filteredData = tickets.filter(item => 
    (item.customerName?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
    item.id.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.email?.toLowerCase().includes(searchText.toLowerCase()) || false)
  );

  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'id',
      key: 'id',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (text: string) => <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">{text}</span>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (text: string) => <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">{text}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (text: string) => <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">{text}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (status: string) => (
        <span
          className={`text-xs font-medium inline-flex items-center justify-center min-h-[24px] px-3 rounded-[15px] ${
            status === 'Opened' ? 'text-green-500 bg-green-100' : 
            status === 'Closed' ? 'text-red-500 bg-red-100' : 
            'text-yellow-500 bg-yellow-100'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (date: Date) => (
        <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">
          {date.toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (_: any, record: Ticket) => (
        <div className="flex items-center gap-[15px]">
          <Button
            type="text"
            className="view group hover:text-success p-0 border-none"
            onClick={() => fetchTicketDetails(record.id)}
            icon={<UilEye className="w-4 text-light-extra dark:text-white/60 group-hover:text-currentColor" />}
          />
          <Popconfirm
            title="Are you sure to delete this ticket?"
            onConfirm={() => handleDeleteTicket(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              className="delete group hover:text-danger p-0 border-none"
              icon={<UilTrashAlt className="w-4 text-light-extra dark:text-white/60 group-hover:text-currentColor" />}
            />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-8 xl:px-[15px] pt-2 pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
        title="Helpdesk"
        routes={PageRoutes}
        buttons={[
          <div key="1" className="page-header-actions">
            <Buttons
              onClick={showModal}
              size="small"
              className="text-[14px] font-medium h-[32px] px-[18px] bg-primary text-white capitalize dark:text-white/[.87] rounded-md"
              type="primary"
            >
              <UilPlus className="w-[14px] h-[14px] ltr:mr-[5px] rtl:ml-[5px]" /> New Ticket
            </Buttons>
          </div>,
        ]}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="py-[16px] px-[25px] border-b border-regular dark:border-white/10 flex justify-between items-center flex-wrap gap-[15px]">
                  <h4 className="mb-0 text-lg font-medium text-dark dark:text-white/[.87]">
                    Ticket List
                  </h4>
                  <div className="flex items-center gap-[8px] flex-wrap">
                    <div className="search-box">
                      <Input
                        placeholder="Search by ID or Name"
                        onChange={handleSubjectSearch}
                        suffix={<UilSearch className="w-4 h-4 text-light dark:text-white/60" />}
                        className="px-5 h-[38px] min-w-[280px] border-normal dark:border-white/10"
                      />
                    </div>
                    <div className="status-select">
                      <Select
                        onChange={handleStatusSearch}
                        className="min-w-[180px] [&>div]:border-normal dark:[&>div]:border-white/10 [&>div]:h-[38px] [&>div>.ant-select-selection-item]:flex [&>div>.ant-select-selection-item]:items-center"
                        defaultValue=""
                      >
                        <Select.Option value="">All Status</Select.Option>
                        <Select.Option value="Opened">Opened</Select.Option>
                        <Select.Option value="Closed">Closed</Select.Option>
                        <Select.Option value="In Progress">In Progress</Select.Option>
                      </Select>
                    </div>
                    <div className="refresh-button">
                      <Button
                        className="h-[38px] px-4 bg-white dark:bg-white/10 dark:border-white/10"
                        onClick={fetchTickets}
                        icon={<UilSearch className="w-4 h-4 text-light dark:text-white/60" />}
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="p-[25px]">
                  <div className="table-responsive">
                    <Table 
                      loading={loading}
                      className="mb-0" 
                      pagination={false} 
                      dataSource={filteredData} 
                      columns={columns}
                    />
                    <div className="flex justify-end mt-5 items-center gap-3">
                      <Button 
                        onClick={handlePrevPage} 
                        disabled={currentPage === 1 || loading}
                        className="border-normal dark:border-white/10 dark:text-white/60"
                      >
                        PREVIOUS
                      </Button>
                      <Button 
                        onClick={handleNextPage} 
                        disabled={tickets.length < pageSize || loading}
                        className="border-normal dark:border-white/10 dark:text-white/60"
                      >
                        NEXT
                      </Button>
                      <Select 
                        defaultValue={10} 
                        onChange={(value) => setPageSize(value)}
                        className="w-[80px] [&>.ant-select-selector]:dark:border-white/10 [&>.ant-select-selector]:border-normal"
                      >
                        <Select.Option value={10}>10</Select.Option>
                        <Select.Option value={20}>20</Select.Option>
                        <Select.Option value={50}>50</Select.Option>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* Add Ticket Modal */}
      <Modal
        title={<h4 className="text-dark dark:text-white/[.87] text-xl font-medium mb-0">Create New Ticket</h4>}
        open={visible}
        onCancel={onCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          name="createTicket"
          onFinish={handleAddTicket}
          layout="vertical"
          className="pt-[20px]"
        >
          <Form.Item
            name="category"
            label={<span className="text-dark dark:text-white/[.87]">Category</span>}
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select a category">
              <Select.Option value="booking_issue">Booking Issue</Select.Option>
              <Select.Option value="payment_issue">Payment Issue</Select.Option>
              <Select.Option value="technical_support">Technical Support</Select.Option>
              <Select.Option value="feedback">Feedback</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="customerName"
            label={<span className="text-dark dark:text-white/[.87]">Customer Name</span>}
            rules={[{ required: true, message: 'Please enter customer name' }]}
          >
            <Input placeholder="Enter customer name" />
          </Form.Item>
          <Form.Item
            name="email"
            label={<span className="text-dark dark:text-white/[.87]">Email</span>}
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item
            name="openMessage"
            label={<span className="text-dark dark:text-white/[.87]">Message</span>}
            rules={[{ required: true, message: 'Please enter message' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter message" />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end gap-[10px]">
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* View Ticket Modal */}
      <Modal
        title={<h4 className="text-dark dark:text-white/[.87] text-xl font-medium mb-0">Ticket Details</h4>}
        open={visibleView}
        onCancel={onCancelView}
        footer={[
          <Button key="close" onClick={onCancelView}>
            Close
          </Button>
        ]}
        width={800}
      >
        {currentTicket && (
          <div className="pt-[20px]">
            <div className="mb-4">
              <h5 className="text-dark dark:text-white/[.87] text-base font-medium mb-2">Ticket ID</h5>
              <p className="text-theme-gray dark:text-white/60">{currentTicket.id}</p>
            </div>
            <div className="mb-4">
              <h5 className="text-dark dark:text-white/[.87] text-base font-medium mb-2">Customer Name</h5>
              <p className="text-theme-gray dark:text-white/60">{currentTicket.customerName}</p>
            </div>
            <div className="mb-4">
              <h5 className="text-dark dark:text-white/[.87] text-base font-medium mb-2">Email</h5>
              <p className="text-theme-gray dark:text-white/60">{currentTicket.email}</p>
            </div>
            <div className="mb-4">
              <h5 className="text-dark dark:text-white/[.87] text-base font-medium mb-2">Category</h5>
              <p className="text-theme-gray dark:text-white/60">{currentTicket.category}</p>
            </div>
            <div className="mb-4">
              <h5 className="text-dark dark:text-white/[.87] text-base font-medium mb-2">Status</h5>
              <span
                className={`text-xs font-medium inline-flex items-center justify-center min-h-[24px] px-3 rounded-[15px] ${
                  currentTicket.status === 'Opened' ? 'text-green-500 bg-green-100' : 
                  currentTicket.status === 'Closed' ? 'text-red-500 bg-red-100' : 
                  'text-yellow-500 bg-yellow-100'
                }`}
              >
                {currentTicket.status}
              </span>
            </div>
            <div className="mb-4">
              <h5 className="text-dark dark:text-white/[.87] text-base font-medium mb-2">Created At</h5>
              <p className="text-theme-gray dark:text-white/60">
                {currentTicket.createdAt.toLocaleDateString('en-US', {
                  year: 'numeric', 
                  month: 'numeric', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
            <div className="mb-4">
              <h5 className="text-dark dark:text-white/[.87] text-base font-medium mb-2">Message</h5>
              <div className="border border-regular dark:border-white/10 rounded-md p-4">
                <p className="text-theme-gray dark:text-white/60">{currentTicket.openMessage}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default Helpdesk; 