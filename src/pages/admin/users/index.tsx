import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Input,
  Button,
  Space,
  Modal,
  message,
  Spin,
  Tooltip
} from 'antd';
import {
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons';
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';

// Define User interface
interface User {
  id: string;
  uid: string;
  userID: string;
  name: string;
  email: string;
  phone: string;
  createdAt: any;
  updatedAt: any;
  key: string;
}

function Users() {
  // State declarations
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [viewModalVisible, setViewModalVisible] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users from Firestore
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const usersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        key: doc.id,
        uid: doc.data().uid || '',
        userID: doc.data().userID || '',
        name: doc.data().name || '',
        email: doc.data().email || '',
        phone: doc.data().phone || '',
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt,
      }));

      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteDoc(doc(db, "users", selectedUser.id));
      message.success("User deleted successfully");
      setDeleteModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("Failed to delete user");
    }
  };

  // Filter users based on search text
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase()) ||
    user.phone.toLowerCase().includes(searchText.toLowerCase()) ||
    user.userID.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: User, b: User) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'User ID',
      dataIndex: 'userID',
      key: 'userID',
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => {
        if (!createdAt) return 'N/A';
        // Check if createdAt is a Firebase timestamp or a regular JS Date
        return createdAt.toDate ? new Date(createdAt.toDate()).toLocaleString() :
          (createdAt.seconds ? new Date(createdAt.seconds * 1000).toLocaleString() :
            new Date(createdAt).toLocaleString());
      },
      sorter: (a: User, b: User) => {
        if (!a.createdAt || !b.createdAt) return 0;
        const aTime = a.createdAt.toDate ? a.createdAt.toDate().getTime() :
          (a.createdAt.seconds ? a.createdAt.seconds * 1000 :
            new Date(a.createdAt).getTime());
        const bTime = b.createdAt.toDate ? b.createdAt.toDate().getTime() :
          (b.createdAt.seconds ? b.createdAt.seconds * 1000 :
            new Date(b.createdAt).getTime());
        return aTime - bTime;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Tooltip title="View">
            <Button
              type="text"
              icon={<EyeOutlined />}
              className="text-blue-600 hover:text-blue-800"
              onClick={() => {
                setSelectedUser(record);
                setViewModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => {
                setSelectedUser(record);
                setDeleteModalVisible(true);
              }}
              className="text-red-600 hover:text-red-800"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">User Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search users..."
                  prefix={<SearchOutlined />}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  className="py-2 text-base font-medium"
                />
                {loading && <Spin />}
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full mb-8">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-6 sm:p-[30px]">
                  <div className="overflow-x-auto">
                    <Table
                      dataSource={filteredUsers}
                      columns={columns}
                      pagination={{ pageSize: 10 }}
                      loading={loading}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* View User Modal */}
      <Modal
        title={<div className="px-4 py-2">User Details</div>}
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <div key="footer" className="px-4 py-2">
            <Button key="back" onClick={() => setViewModalVisible(false)}>
              Close
            </Button>
          </div>
        ]}
        centered
        bodyStyle={{ padding: '24px' }}
        width={550}
      >
        {selectedUser && (
          <div className="p-4 border rounded-md bg-white dark:bg-gray-800">
            <p className="mb-3"><strong>Name:</strong> {selectedUser.name}</p>
            <p className="mb-3"><strong>Email:</strong> {selectedUser.email}</p>
            <p className="mb-3"><strong>Phone:</strong> {selectedUser.phone}</p>
            <p className="mb-3"><strong>User ID:</strong> {selectedUser.userID}</p>
            <p className="mb-3"><strong>UID:</strong> {selectedUser.uid}</p>
            <p className="mb-3"><strong>Created At:</strong> {
              selectedUser.createdAt
                ? (selectedUser.createdAt.toDate
                  ? new Date(selectedUser.createdAt.toDate()).toLocaleString()
                  : (selectedUser.createdAt.seconds
                    ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleString()
                    : new Date(selectedUser.createdAt).toLocaleString()))
                : 'N/A'
            }</p>
            <p className="mb-1"><strong>Updated At:</strong> {
              selectedUser.updatedAt
                ? (selectedUser.updatedAt.toDate
                  ? new Date(selectedUser.updatedAt.toDate()).toLocaleString()
                  : (selectedUser.updatedAt.seconds
                    ? new Date(selectedUser.updatedAt.seconds * 1000).toLocaleString()
                    : new Date(selectedUser.updatedAt).toLocaleString()))
                : 'N/A'
            }</p>
          </div>
        )}
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        title={<div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
            Delete User
          </span>
        </div>}
        open={deleteModalVisible}
        footer={null}
        onCancel={() => setDeleteModalVisible(false)}
        centered
        bodyStyle={{ padding: '24px' }}
        width={450}
      >
        <div className="p-4 border rounded-md bg-white dark:bg-gray-800">
          <p className="mb-2">Are you sure you want to delete this user? This action cannot be undone.</p>
          {selectedUser && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
              <p className="mb-1"><strong>Name:</strong> {selectedUser.name}</p>
              <p className="mb-1"><strong>Email:</strong> {selectedUser.email}</p>
              <p className="mb-0"><strong>User ID:</strong> {selectedUser.userID}</p>
            </div>
          )}
          <div className="mt-6 flex justify-end gap-3 px-2 py-2">
            <Button onClick={() => setDeleteModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" danger onClick={handleDeleteUser}>
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default Protected(Users, ["admin"]); 