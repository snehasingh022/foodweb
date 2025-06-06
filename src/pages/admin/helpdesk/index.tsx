import React, { useState, useEffect } from 'react';
import TicketHistoryTimeline from '@/components/TicketHistoryTimeline';
import FirebaseFileUploader from '@/components/FirebaseFileUploader';
import {
  Row,
  Col,
  Card,
  Input,
  Table,
  Button,
  Modal,
  Form,
  message,
  Tabs,
  Space,
  Typography,
  Spin
} from 'antd';
import { collection, query, getDocs, doc, getDoc, updateDoc,limit, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import moment from 'moment';
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
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
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(10);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [firstVisible, setFirstVisible] = useState<any>(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [noteForm] = Form.useForm();
  const [currentTab, setCurrentTab] = useState('opened');
  const [clicked, setClicked] = useState('opened');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [responseForm] = Form.useForm();

  useEffect(() => {
    fetchTickets();
    setClicked(currentTab);
  }, [currentTab]);

  const formatCategory = (category: string) => {
    if (!category) return '';
    let formatted = category.replace(/_/g, ' ');
    return formatted.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const normalizeStatus = (status: string): string => {
    if (!status) return 'Opened';
    if (status.toLowerCase() === 'opened') return 'Opened';
    if (status.toLowerCase() === 'resolved') return 'Resolved';
    if (status.toLowerCase() === 'reopened' || status.toLowerCase() === 're-opened') return 'Re-Opened';
    if (status.toLowerCase() === 'closed') return 'Closed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

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
        if (
          normalizedStatus === tabStatus ||
          searchText.trim() !== '' 
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

  const fetchTicketDetails = async (ticketId: string) => {
    try {
      const ticketDoc = await getDoc(doc(db, 'helpdesk', ticketId));
      if (ticketDoc.exists()) {
        const data = ticketDoc.data();
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
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          category: data.category || '',
          helpDeskID: data.helpdeskID,
          customerName: data.userDetails?.name || "Unknown",
          email: data.userDetails?.email || "",
          phone: data.userDetails?.phone || "",
          openMessage: data.responses?.opened?.response || '',
          createdBy: data.createdBy,
          priority: data.priority,
          title: data.title,
          description: data.description,
          ticketId: data.ticketId,
          userDetails: data.userDetails,
          responses: responses
        });
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      message.error("Failed to fetch ticket details");
    }
  };

  const filteredData = tickets.filter(item =>
    (item.customerName?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
    item.id.toLowerCase().includes(searchText.toLowerCase()) ||
    (item.email?.toLowerCase().includes(searchText.toLowerCase()) || false) ||
    (item.helpDeskID?.toLowerCase().includes(searchText.toLowerCase()) || false)
  );

  // Updated ZeptoMail email sending function
  const sendZeptoMailNotification = async (email: string, subject: string, messageContent: string) => {
    try {
      const response = await fetch('https://api.zeptomail.in/v1.1/email', {
        method: 'POST',
        headers: {
          'Authorization': 'Zoho-enczapikey PHtE6r0ORui43jYq9kcF4KK7FsL1Nol/qbtkJFJDs4tGWfQFGE1SqY9/lmK3qUojUfkTQKOcm9k65LiYsb6HcW7vYzwfWmqyqK3sx/VYSPOZsbq6x00ftF8ffkXZV4Htd9Rs0iPVs9rTNA==',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: {
            address: 'noreply@wecofy.com',
            name: 'Wecofy Support Team'
          },
          to: [
            {
              email_address: {
                address: email,
                name: currentTicket?.customerName || 'Valued Customer'
              }
            }
          ],
          subject: subject,
          htmlbody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #333; margin: 0;">Wecofy Support</h1>
                  <div style="width: 50px; height: 3px; background-color: #007bff; margin: 10px auto;"></div>
                </div>
                
                <h2 style="color: #333; margin-bottom: 20px;">Ticket Update Notification</h2>
                
                <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #666;"><strong>Ticket ID:</strong> ${currentTicket?.helpDeskID || currentTicket?.id}</p>
                  <p style="margin: 10px 0 0 0; color: #666;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">RESOLVED</span></p>
                </div>
                
                <div style="margin-bottom: 25px;">
                  <h3 style="color: #333; margin-bottom: 10px;">Our Response:</h3>
                  <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; border-left: 4px solid #007bff;">
                    <p style="margin: 0; color: #333; line-height: 1.6;">${messageContent}</p>
                  </div>
                </div>
                
                <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center;">
                  <p style="color: #666; margin: 0;">Thank you for choosing Wecofy!</p>
                  <p style="color: #999; font-size: 12px; margin: 10px 0 0 0;">This is an automated message. Please do not reply to this email.</p>
                </div>
              </div>
            </div>
          `,
          track_clicks: true,
          track_opens: true
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('ZeptoMail notification sent successfully:', result);
        message.success('Email notification sent successfully!');
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to send ZeptoMail notification:', errorData);
        message.error('Failed to send email notification');
        return false;
      }
    } catch (error) {
      console.error('Error sending ZeptoMail notification:', error);
      message.error('Error sending email notification');
      return false;
    }
  };

  const getActionButtons = (record: Ticket) => {
    const actions = [];
    if (record.status === 'Opened') {
      actions.push(
        <Button
          key="resolve"
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTicket(record);
            setResponseModalVisible(true);
            setTimeout(() => {
              responseForm.setFieldsValue({
                status: 'resolved', 
                message: '',
                attachmentURL: ''
              });
            }, 100);
          }}
        >
          Resolve
        </Button>
      );
    }

    if (record.status === 'Resolved' || record.status === 'Re-Opened') {
      actions.push(
        <Button
          key="close"
          type="primary"
          size="small"
          onClick={() => {
            setCurrentTicket(record);
            setResponseModalVisible(true);
            setTimeout(() => {
              responseForm.setFieldsValue({
                status: 'closed', 
                message: '',
                attachmentURL: ''
              });
            }, 100);
          }}
        >
          Close
        </Button>
      );
    }

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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date instanceof Date && !isNaN(date.getTime())
      ? moment(date).format('MMMM D, YYYY h:mm A')
      : 'N/A';
  };

  // Updated handleResponseSubmit function
  const handleResponseSubmit = async (values: any) => {
    try {
      setSubmitLoading(true);
      if (!currentTicket) {
        message.error('No ticket selected');
        return;
      }

      const ticketRef = doc(db, 'helpdesk', currentTicket.id);
      const status = values.status || 'resolved'; 
      const responseType = status.toLowerCase().replace('-', '');

      const responseData = {
        [responseType]: {
          createdAt: serverTimestamp(),
          response: values.message,
          ...(values.attachmentURL && { attachmentURL: values.attachmentURL })
        }
      };

      // Update the ticket in Firebase
      await updateDoc(ticketRef, {
        status: status.toLowerCase(),
        responses: {
          ...(currentTicket.responses || {}),
          ...responseData
        },
        updatedAt: serverTimestamp()
      });

      // Send email notification only when ticket is resolved
      if (status.toLowerCase() === 'resolved' && currentTicket.email) {
        const emailSubject = `Your Ticket ${currentTicket.helpDeskID || currentTicket.id} Has Been Resolved`;
        
        // Send ZeptoMail notification
        await sendZeptoMailNotification(currentTicket.email, emailSubject, values.message);
      }

      const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
      message.success(`Ticket ${status.toLowerCase()} successfully`);
      
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

      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Ticket Details : {currentTicket && <Text copyable strong className="text-base mt-10 ml-2">{currentTicket.helpDeskID}</Text>}
            </h3>
          </div>
        }
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button
            key="close"
            size="large"
            onClick={() => setViewModalVisible(false)}
            className="min-w-[100px] font-medium mb-4 mr-4"
          >
            Close
          </Button>
        ]}
        width={900}
        className="ticket-detail-modal"
        bodyStyle={{ padding: "20px 24px" }}
        maskClosable={false}
      >
        {currentTicket ? (
          <div className="p-4 bg-white dark:bg-[#1b1e2b] rounded-lg shadow-sm">
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - User Details */}
              <div className="bg-regularBG dark:bg-[#323440] p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                <div className="space-y-4">
                  <div className="border-b pb-3">
                    <Text type="secondary" className="text-sm">User ID:</Text>
                    <div className="mt-1">
                      <Text strong className="text-base">{currentTicket.userDetails?.userID || currentTicket.userDetails?.uid || 'N/A'}</Text>
                    </div>
                  </div>
                  <div className="border-b pb-3">
                    <Text type="secondary" className="text-sm">Username:</Text>
                    <div className="mt-1">
                      <Text strong className="text-base">{currentTicket.userDetails?.name || currentTicket.customerName || 'N/A'}</Text>
                    </div>
                  </div>
                  <div className="border-b pb-3">
                    <Text type="secondary" className="text-sm">User Email:</Text>
                    <div className="mt-1">
                      <Text strong className="text-base">{currentTicket.userDetails?.email || currentTicket.email || 'N/A'}</Text>
                    </div>
                  </div>
                  <div className="border-b pb-3">
                    <Text type="secondary" className="text-sm">Phone Number:</Text>
                    <div className="mt-1">
                      <Text strong className="text-base">{currentTicket.userDetails?.phone || currentTicket.phone || 'N/A'}</Text>
                    </div>
                  </div>
                  <div>
                    <Text type="secondary" className="text-sm">Category:</Text>
                    <div className="mt-1">
                      <Text strong className="text-base">{formatCategory(currentTicket.category)}</Text>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-regularBG dark:bg-[#323440] p-6 rounded-lg border border-gray-100 dark:border-gray-700">
                <Text strong className="text-lg block mb-4">Ticket History</Text>
                <TicketHistoryTimeline
                  currentTicket={currentTicket}
                  formatDate={formatDate}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center items-center p-10">
            <Spin size="large" />
          </div>
        )}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {(() => {
                const status = responseForm.getFieldValue('status');
                if (status === 'resolved') return 'Resolve Ticket';
                if (status === 'closed') return 'Close Ticket';
                return 'Update Ticket';
              })()}
            </span>
          </div>
        }
        open={responseModalVisible}
        onCancel={() => {
          setResponseModalVisible(false);
          responseForm.resetFields();
        }}
        footer={null}
        width={650}
        className="helpdesk-response-modal"
      >
        <div className="p-4">
          {currentTicket && (
            <Form
              form={responseForm}
              layout="vertical"
              onFinish={handleResponseSubmit}
            >
              <Form.Item name="status" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name="message"
                label="Response Message"
                rules={[{ required: true, message: 'Please enter a response' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="Enter your response..."
                  className="w-full"
                />
              </Form.Item>

              <Form.Item
                label="Attachment"
                name="attachment"
                extra="Optional - Upload any relevant files"
              >
                <FirebaseFileUploader
                  storagePath="helpdesk/attachments"
                  accept="*"
                  maxSizeMB={10}
                  onUploadSuccess={(url) => {
                    responseForm.setFieldsValue({ attachmentURL: url });
                  }}
                  onUploadStart={() => {
                    responseForm.setFieldsValue({ attachmentURL: '' });
                  }}
                  onUploadError={(error) => {
                    console.error('Upload error:', error);
                    message.error('Failed to upload attachment');
                  }}
                />
              </Form.Item>

              <Form.Item name="attachmentURL" hidden>
                <Input />
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
                    {(() => {
                      const status = responseForm.getFieldValue('status');
                      if (status === 'resolved') return 'Resolve';
                      if (status === 'closed') return 'Close';
                      return 'Update';
                    })()}
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