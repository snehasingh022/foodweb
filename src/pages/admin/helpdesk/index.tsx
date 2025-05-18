import React, { useState, useEffect } from 'react';
import TicketHistoryTimeline from '@/components/TicketHistoryTimeline';
import {
  Row,
  Col,
  Card,
  Input,
  Select,
  Table,
  Button,
  Modal,
  Form,
  message,
  Popconfirm,
  Tabs,
  Space,
  Typography,
  Tag,
  Timeline,
  Spin
} from 'antd';
import { Buttons } from '../../../components/buttons';
import { UilPlus, UilEdit, UilTrash, UilSearch, UilEye } from '@iconscout/react-unicons';
import { collection, query, getDocs, doc, getDoc, deleteDoc, updateDoc, addDoc, limit, orderBy, startAfter, endBefore, limitToLast, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import moment from 'moment';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import Protected from '../../../components/Protected/Protected';

const { Text } = Typography;

interface Ticket {
  id: string;
  status: string;
  customerName?: string;
  email?: string;
  phone?: string;
  category: string;
  openMessage?: string;
  createdAt: any;
  updatedAt?: any;
  createdBy?: string;
  priority?: string;
  title?: string;
  description?: string;
  ticketId?: string;
  helpDeskID?: string;
  userDetails?: {
    name: string;
    email: string;
    phone: string;
    uid: string;
    userID: string;
  };
  responses?: {
    opened?: {
      createdAt: any;
      response?: string;
      attachmentURL?: string;
    };
    resolved?: {
      createdAt: any;
      response?: string;
    };
    reopened?: {
      createdAt: any;
      response?: string;
    };
    closed?: {
      createdAt: any;
      response?: string;
    };
  };
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
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [noteForm] = Form.useForm();
  const [noteSubmitLoading, setNoteSubmitLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState('opened');
  const [clicked, setClicked] = useState('opened');
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [resolvedMessage, setResolvedMessage] = useState('');
  const [closedMessage, setClosedMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [responseForm] = Form.useForm();

  useEffect(() => {
    fetchTickets();
    setClicked(currentTab);
  }, [currentTab]);

  // Generate ticket ID with "HID" + timestamp (8 digits)
  const generateTicketId = () => {
    const timestamp = Date.now().toString();
    // Take the last 8 digits of the timestamp
    const shortTimestamp = timestamp.slice(-8);
    return `HID${shortTimestamp}`;
  };

  // Format category string
  const formatCategory = (category: string) => {
    if (!category) return '';
    // Replace underscores with spaces
    let formatted = category.replace(/_/g, ' ');

    // Capitalize first letter of each word
    return formatted.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Function to normalize status case
  const normalizeStatus = (status: string): string => {
    if (!status) return 'Opened';

    // Handle "opened" -> "Opened", "re-opened" -> "Re-Opened", etc.
    if (status.toLowerCase() === 'opened') return 'Opened';
    if (status.toLowerCase() === 'resolved') return 'Resolved';
    if (status.toLowerCase() === 'reopened' || status.toLowerCase() === 're-opened') return 'Re-Opened';
    if (status.toLowerCase() === 'closed') return 'Closed';

    return status.charAt(0).toUpperCase() + status.slice(1);
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
        const normalizedStatus = normalizeStatus(data.status);

        // Map the ticket data, accounting for the nested userDetails
        const ticket: Ticket = {
          id: doc.id,
          status: normalizedStatus,
          customerName: data.userDetails?.name || "Unknown",
          email: data.userDetails?.email || "",
          phone: data.userDetails?.phone || "",
          category: data.category || '',
          openMessage: data.responses?.opened?.response || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy,
          priority: data.priority,
          title: data.title,
          description: data.description,
          ticketId: data.ticketId,
          helpDeskID: data.helpdeskID,
          userDetails: data.userDetails,
          responses: data.responses || {
            opened: {
              createdAt: data.createdAt,
              response: data.responses?.opened?.response || ''
            }
          }
        };

        // Filter based on the current tab, but include all tickets if searching
        const tabStatus = currentTab === 'reopened' ? 'Re-Opened' : currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

        if (
          normalizedStatus === tabStatus ||
          searchText.trim() !== '' // Always include if there's a search
        ) {
          ticketList.push(ticket);
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
          const normalizedStatus = normalizeStatus(data.status);

          // Map the ticket data, accounting for the nested userDetails
          const ticket: Ticket = {
            id: doc.id,
            status: normalizedStatus,
            customerName: data.userDetails?.name || "Unknown",
            email: data.userDetails?.email || "",
            phone: data.userDetails?.phone || "",
            category: data.category || '',
            openMessage: data.responses?.opened?.response || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            createdBy: data.createdBy,
            priority: data.priority,
            title: data.title,
            description: data.description,
            ticketId: data.ticketId,
            helpDeskID: data.helpdeskID,
            userDetails: data.userDetails,
            responses: data.responses || {
              opened: {
                createdAt: data.createdAt,
                response: data.responses?.opened?.response || ''
              }
            }
          };

          const tabStatus = currentTab === 'reopened' ? 'Re-Opened' : currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

          if (normalizedStatus === tabStatus || !statusFilter) {
            ticketList.push(ticket);
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
          const normalizedStatus = normalizeStatus(data.status);

          // Map the ticket data, accounting for the nested userDetails
          const ticket: Ticket = {
            id: doc.id,
            status: normalizedStatus,
            customerName: data.userDetails?.name || "Unknown",
            email: data.userDetails?.email || "",
            phone: data.userDetails?.phone || "",
            category: data.category || '',
            openMessage: data.responses?.opened?.response || '',
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            createdBy: data.createdBy,
            priority: data.priority,
            title: data.title,
            description: data.description,
            ticketId: data.ticketId,
            helpDeskID: data.helpdeskID,
            userDetails: data.userDetails,
            responses: data.responses || {
              opened: {
                createdAt: data.createdAt,
                response: data.responses?.opened?.response || ''
              }
            }
          };

          const tabStatus = currentTab === 'reopened' ? 'Re-Opened' : currentTab.charAt(0).toUpperCase() + currentTab.slice(1);

          if (normalizedStatus === tabStatus || !statusFilter) {
            ticketList.push(ticket);
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

  // Fetch ticket details
  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const ticketDoc = await getDoc(doc(db, 'helpdesk', ticketId));
      if (ticketDoc.exists()) {
        const data = ticketDoc.data();

        // Ensure the opened response always exists
        let responses = data.responses || {};
        if (!responses.opened) {
          responses.opened = {
            createdAt: data.createdAt,
            response: data.responses?.opened?.response || ''
          };
        }

        setCurrentTicket({
          id: ticketDoc.id,
          status: normalizeStatus(data.status),
          customerName: data.userDetails?.name || "Unknown",
          email: data.userDetails?.email || "",
          phone: data.userDetails?.phone || "",
          category: data.category || '',
          openMessage: data.responses?.opened?.response || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy,
          priority: data.priority,
          title: data.title,
          description: data.description,
          ticketId: data.ticketId,
          helpDeskID: data.helpdeskID,
          userDetails: data.userDetails,
          responses: responses
        });
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      message.error("Failed to fetch ticket details");
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
    (item.email?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
    (item.helpDeskID?.toLowerCase().includes(searchText.toLowerCase()) || false)
  );

  // Get action buttons with updated functionality
  const getActionButtons = (record: Ticket) => {
    const actions = [];

    // Only show "Resolve" button for Opened tickets
    if (record.status === 'Opened') {
      actions.push(
        <Button
          key="resolve"
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTicket(record);
            setResponseModalVisible(true);
            responseForm.setFieldsValue({ status: 'Resolved' });
          }}
        >
          Resolve
        </Button>
      );
    }

    // Only show "Close" button for Resolved and Re-Opened tickets
    if (record.status === 'Resolved' || record.status === 'Re-Opened') {
      actions.push(
        <Button
          key="close"
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTicket(record);
            setResponseModalVisible(true);
            responseForm.setFieldsValue({ status: 'Closed' });
          }}
        >
          Close
        </Button>
      );
    }

    // Always show "View" button
    actions.push(
      <Button
        key="view"
        type="text"
        icon={<EyeOutlined />}
        className="text-blue-600 hover:text-blue-800"
        onClick={() => {
          fetchTicketDetails(record.id);
          setViewModalVisible(true);
        }}
      >
      </Button>
    );

    return <div className="flex items-center gap-[15px]">{actions}</div>;
  };

  const columns = [
    {
      title: 'Ticket ID',
      dataIndex: 'helpDeskID',
      key: 'helpDeskID',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (helpDeskID: string, record: Ticket) => (
        <span className="text-[15px] font-medium">{helpDeskID || record.id}</span>
      ),
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
      render: (text: string) => <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">{formatCategory(text)}</span>,
    },
    {
      title: 'Updated Date',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (date: any) => {
        if (!date) return <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">N/A</span>;
        const jsDate = date.toDate ? date.toDate() : new Date(date);
        return (
          <span className="text-[15px] text-theme-gray dark:text-white/60 font-medium">
            {jsDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'action',
      className: 'text-dark dark:text-white/[.87] font-medium text-[15px] py-[16px]',
      render: (_: any, record: Ticket) => getActionButtons(record),
    },
  ];

  const handleSubmit = async (values: any) => {
    // This function is intentionally left empty after removing ticket creation
    message.info("Ticket creation has been disabled");
  };

  const updateTicket = async (id: string, values: any) => {
    try {
      await updateDoc(doc(db, 'helpdesk', id), values);
      message.success("Ticket updated successfully");
    } catch (error) {
      console.error("Error updating ticket:", error);
      message.error("Failed to update ticket");
    }
  };

  const handleAddNote = async (values: any) => {
    setNoteSubmitLoading(true);
    try {
      const ticketRef = doc(db, 'helpdesk', currentTicket!.id);

      // Create the appropriate response object based on status
      const responseType = values.status.toLowerCase().replace('-', '');
      const responseData = {
        [responseType]: {
          createdAt: serverTimestamp(),
          response: values.message
        }
      };

      await updateDoc(ticketRef, {
        status: values.status,
        responses: {
          ...(currentTicket!.responses || {}),
          ...responseData
        },
        updatedAt: serverTimestamp()
      });

      message.success("Response added successfully");
      setViewModalVisible(false);
      setNoteSubmitLoading(false);
      fetchTicketDetails(currentTicket!.id);
    } catch (error) {
      console.error("Error adding response:", error);
      message.error("Failed to add response");
    } finally {
      setNoteSubmitLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date instanceof Date && !isNaN(date.getTime())
      ? moment(date).format('MMMM D, YYYY h:mm A')
      : 'N/A';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'opened': return 'green';
      case 're-opened': return 'yellow';
      case 'resolved': return 'blue';
      case 'closed': return 'red';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'default';
    }
  };

  // Send email notification
  const sendEmailNotification = async (email: string, subject: string, message: string) => {
    try {
      const response = await fetch('/api/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, subject, message }),
      });

      if (response.ok) {
        console.log('Email notification sent successfully');
      } else {
        console.error('Failed to send email notification');
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  };

  // Handle response submission from the response modal
  const handleResponseSubmit = async (values: any) => {
    try {
      setSubmitLoading(true);

      const ticketRef = doc(db, 'helpdesk', currentTicket!.id);
      const responseType = values.status.toLowerCase().replace('-', '');

      // Create response update object
      const responseData = {
        [responseType]: {
          createdAt: serverTimestamp(),
          response: values.message
        }
      };

      await updateDoc(ticketRef, {
        status: values.status.toLowerCase(),
        responses: {
          ...(currentTicket!.responses || {}),
          ...responseData
        },
        updatedAt: serverTimestamp()
      });

      // Send email notification
      const emailSubject = `Your Ticket ${currentTicket!.helpDeskID || currentTicket!.id} ${values.status}`;
      const emailMessage = `Hello ${currentTicket!.customerName},\n\nYour ticket with ID ${currentTicket!.helpDeskID || currentTicket!.id} has been ${values.status.toLowerCase()}. Here is our response:\n${values.message}\n\nThank you.`;

      if (currentTicket!.email) {
        await sendEmailNotification(currentTicket!.email, emailSubject, emailMessage);
      }

      message.success(`Ticket ${values.status.toLowerCase()} successfully`);
      setResponseModalVisible(false);
      responseForm.resetFields();
      fetchTickets();
    } catch (error) {
      console.error(`Error updating ticket: ${error}`);
      message.error(`Failed to update ticket`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Add an effect to set form status when modal opens
  useEffect(() => {
    if (viewModalVisible && currentTicket) {
      noteForm.setFieldsValue({ status: currentTicket.status });
    }
  }, [viewModalVisible, currentTicket]);

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Helpdesk Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search queries..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  className="py-2 text-base font-medium"
                />
                {loading ? (
                  <div className="h-10 flex items-center justify-center">
                    <Spin size="small" />
                  </div>
                ) : (
                  <Button
                    type="primary"
                    onClick={fetchTickets}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    Refresh
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
          <Col className="mb-4" sm={24} xs={24}>
            <Card className="h-full mb-8">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-6 sm:p-[30px]">
                  <Tabs
                    defaultActiveKey="opened"
                    activeKey={currentTab}
                    onChange={setCurrentTab}
                    className="mb-6"
                    items={[
                      { key: 'opened', label: 'Opened' },
                      { key: 'resolved', label: 'Resolved' },
                      { key: 'reopened', label: 'Reopened' },
                      { key: 'closed', label: 'Closed' },
                    ]}
                  />

                  <div className="overflow-x-auto">
                    <Table
                      dataSource={filteredData}
                      columns={columns.map(col => ({
                        ...col,
                        responsive: col.dataIndex === 'helpDeskID' || col.dataIndex === 'customerName' || col.dataIndex === 'email' || col.dataIndex === 'category' || col.dataIndex === 'status' || col.key === 'action'
                          ? ['xs', 'sm', 'md', 'lg', 'xl'] as any
                          : ['sm', 'md', 'lg', 'xl'] as any,
                      }))}
                      loading={loading}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        responsive: true,
                      }}
                      className="responsive-table"
                      scroll={{ x: 'max-content' }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* View Ticket Modal - Simplified to only show details */}
      <Modal
        title={
          <div className="px-2 py-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Ticket Details</h3>
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
        className="helpdesk-view-modal"
      >
        {currentTicket && (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Ticket ID</p>
                <p className="text-base font-semibold">{currentTicket.helpDeskID || currentTicket.id}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</p>
                <Tag color={getStatusColor(currentTicket.status)} className="px-3 py-1 text-sm">
                  {currentTicket.status.toUpperCase()}
                </Tag>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Created At</p>
                <p className="text-base">{formatDate(currentTicket.createdAt)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Customer Name</p>
                <p className="text-base font-semibold">{currentTicket.customerName}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</p>
                <p className="text-base">{currentTicket.email}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</p>
                <p className="text-base">{formatCategory(currentTicket.category)}</p>
              </div>
            </div>

            <div className="mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Message</p>
              <div className="bg-white dark:bg-gray-700 p-3 rounded-md text-gray-800 dark:text-gray-200 whitespace-pre-wrap border border-gray-200 dark:border-gray-600">
                {currentTicket.openMessage}
              </div>
            </div>

            {/* Ticket History Timeline */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <p className="text-base font-medium mb-4">Ticket History</p>
              <TicketHistoryTimeline
                currentTicket={currentTicket}
                formatDate={formatDate}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Response Modal (Replaces Resolve and Close dialogs) */}
      <Modal
        title={
          <div className="px-2 py-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {currentTicket?.status === 'Opened' ? 'Resolve Ticket' : 'Close Ticket'}
            </h3>
          </div>
        }
        open={responseModalVisible}
        onCancel={() => {
          setResponseModalVisible(false);
          responseForm.resetFields();
        }}
        footer={null}
        width={500}
        className="helpdesk-response-modal"
      >
        <div className="p-4">
          {currentTicket && (
            <Form
              form={responseForm}
              layout="vertical"
              onFinish={handleResponseSubmit}
            >
              <Form.Item
                name="message"
                label="Add Response"
                rules={[{ required: true, message: 'Please enter a response' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Enter your response..."
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                name="status"
                label="Update Status"
                rules={[{ required: true, message: 'Please select a status' }]}
              >
                <Select className="w-full">
                  {currentTicket.status === 'Opened' && (
                    <Select.Option value="Resolved">Resolved</Select.Option>
                  )}
                  {(currentTicket.status === 'Resolved' || currentTicket.status === 'Re-Opened') && (
                    <Select.Option value="Closed">Closed</Select.Option>
                  )}
                </Select>
              </Form.Item>

              <Form.Item className="mb-0 flex justify-end">
                <Space>
                  <Button onClick={() => setResponseModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitLoading}
                  >
                    Submit
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          )}
        </div>
      </Modal>
    </>
  );
}

export default Protected(Helpdesk, ["admin", "helpdesk"]); 