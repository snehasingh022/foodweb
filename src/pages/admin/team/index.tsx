import React, { useState, useEffect } from 'react';
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Typography,
  Tag
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/router';
import { db, auth } from '../../../authentication/firebase';
import { useAuth } from '../../../authentication/AuthContext';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { UilPlus } from '@iconscout/react-unicons';
import Protected from '../../../components/Protected/Protected';

const { Text, Title } = Typography;

interface UserType {
  adminID: string;
  createdAt: any;
  email: string;
  name: string;
  roles: string[];
  status: string;
  uid: string;
  updatedAt?: any;
  key: string;
}

interface EditUserFormValues {
  name: string;
  email: string;
  roles: string[];
  status: string;
}

interface AddUserFormValues extends EditUserFormValues {
  password: string;
}

function Team() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [form] = Form.useForm<EditUserFormValues>();
  const [addForm] = Form.useForm<AddUserFormValues>();
  const [searchText, setSearchText] = useState('');

  const roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Helpdesk', value: 'helpdesk' },
    { label: 'Tours', value: 'tours' },
    { label: 'Tours + Media', value: 'tours+media' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const adminsCollection = collection(db, "admins");
      const usersQuery = query(adminsCollection, orderBy("createdAt", "desc"));
  
      const querySnapshot = await getDocs(usersQuery);
  
      if (!querySnapshot.empty) {
        const adminsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            key: doc.id,
            adminID: data.adminID || `AID${doc.id.slice(0, 6)}`,
            createdAt: data.createdAt,
            email: data.email,
            name: data.name,
            roles: Array.isArray(data.roles) ? data.roles : [data.roles].filter(Boolean),
            status: data.status,
            uid: data.uid,
            updatedAt: data.updatedAt
          } as UserType;
        });
        setUsers(adminsList);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditUser = (user: UserType) => {
    setSelectedUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      roles: Array.isArray(user.roles) ? user.roles : [user.roles].filter(Boolean),
      status: user.status
    });
    setEditModalVisible(true);
  };

  const handleDeleteUser = (user: UserType) => {
    setSelectedUser(user);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "admins", selectedUser.key));
      fetchUsers();
      setDeleteModalVisible(false);
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (values: EditUserFormValues) => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const userRef = doc(db, "admins", selectedUser.key);
      await updateDoc(userRef, {
        name: values.name,
        roles: values.roles,
        status: values.status,
        updatedAt: serverTimestamp()
      });

      fetchUsers();
      setEditModalVisible(false);
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (values: AddUserFormValues) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const adminID = `AID${Date.now().toString().slice(-6)}`;
  
      const userDocRef = doc(db, "admins", adminID);
      await setDoc(userDocRef, {
        adminID,
        createdAt: serverTimestamp(),
        email: values.email,
        name: values.name,
        roles: values.roles,
        status: values.status || 'active',
        uid: userCredential.user.uid,
        updatedAt: serverTimestamp()
      });
  
      fetchUsers();
      setAddModalVisible(false);
      addForm.resetFields();
    } catch (error: any) {
      console.error("Error adding user:", error);
      if (error.code === "auth/email-already-in-use") {
        alert("Email address is already in use. Please use a different email.");
      } else {
        alert(`Error creating user: ${error.message || error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
    (user.uid ? user.uid.toLowerCase().includes(searchText.toLowerCase()) : false) ||
    user.roles?.some(role => role.toLowerCase().includes(searchText.toLowerCase()))
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'blue';
      case 'helpdesk':
        return 'orange';
      case 'tours':
        return 'green';
      case 'tours+media':
        return 'purple';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'UID',
      dataIndex: 'uid',
      key: 'uid',
      width: 120,
      render: (text: string) => <Text copyable>{text}</Text>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>,
      sorter: (a: UserType, b: UserType) => a.name.localeCompare(b.name),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <Space size={[0, 8]} wrap>
          {(Array.isArray(roles) ? roles : []).map(role => (
            <Tag key={role} color={getRoleColor(role)}>
              {role === 'tours+media' ? 'TOURS+MEDIA' : role.toUpperCase()}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status?.toUpperCase() || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: UserType) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            className="text-green-600 hover:text-green-800"
            onClick={() => handleEditUser(record)}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            className="text-red-600 hover:text-red-800"
            onClick={() => handleDeleteUser(record)}
          />
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
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Team Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  onClick={() => setAddModalVisible(true)}
                  icon={<UilPlus />}
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                >
                  Add User
                </Button>
                <Input
                  placeholder="Search team members..."
                  prefix={<SearchOutlined />}
                  onChange={e => handleSearch(e.target.value)}
                  style={{ width: 250 }}
                  className="py-2 text-base font-"
                />
                {loading ? (
                  <div className="h-10 flex items-center justify-center">
                    <Spin size="small" />
                  </div>
                ) : (
                  <Button
                    type="primary"
                    onClick={fetchUsers}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                  >
                    Refresh
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full mb-8">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-6 sm:p-[30px]">
                  <div className="table-responsive">
                    <Table
                      columns={columns}
                      dataSource={filteredUsers}
                      pagination={{ pageSize: 10 }}
                      loading={loading}
                      bordered={false}
                      className="[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-regularBG dark:[&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:bg-[#323440] [&>div>div>div>div>div>.ant-table-content>table>thead>tr>th]:font-medium"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>

      {/* Edit User Modal */}
      <Modal
        title={<Title level={4} className="text-lg font-semibold p-4">Edit User</Title>}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: '600px' }}
        className="responsive-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateUser}
          className="p-4"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Please enter email' }]}
          >
            <Input disabled placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="roles"
            label="Roles"
            rules={[{ required: true, message: 'Please select at least one role' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select roles"
              options={roleOptions}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select
              placeholder="Select status"
              options={statusOptions}
            />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end mt-4">
            <Space>
              <Button size="large" onClick={() => setEditModalVisible(false)} className="min-w-[100px] font-medium">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" size="large" loading={loading} className="bg-primary hover:bg-primary-hover min-w-[100px] font-medium">
                Update
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add User Modal */}
      <Modal
        title={<Title level={4} className="text-lg font-semibold p-4">Add New User</Title>}
        open={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        footer={null}
        width="95%"
        style={{ maxWidth: '600px' }}
        className="responsive-modal"
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleAddUser}
          className="p-4"
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Enter name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item
            name="roles"
            label="Roles"
            rules={[{ required: true, message: 'Please select at least one role' }]}
          >
            <Select
              mode="multiple"
              placeholder="Select roles"
              options={roleOptions}
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            initialValue="active"
          >
            <Select
              placeholder="Select status"
              options={statusOptions}
            />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end mt-4">
            <Space>
              <Button size="large" onClick={() => setAddModalVisible(false)} className="min-w-[100px] font-medium">
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" size="large" loading={loading} className="bg-primary hover:bg-primary-hover min-w-[100px] font-medium">
                Add User
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title={<Title level={4} className="text-lg font-semibold p-4">Confirm Delete</Title>}
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="back" size="large" onClick={() => setDeleteModalVisible(false)} className="min-w-[100px] font-medium">
            Cancel
          </Button>,
          <Button key="submit" type="primary" danger size="large" loading={loading} onClick={confirmDelete} className="min-w-[100px] font-medium">
            Delete
          </Button>,
        ]}
        width="95%"
        style={{ maxWidth: '500px' }}
        className="responsive-modal"
      >
        <div className="p-4">
          <p>Are you sure you want to delete {selectedUser?.name}?</p>
        </div>
      </Modal>
    </>
  );
}

function TeamPage() {
  const router = useRouter();
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser !== null) {
      if (!isAdmin) {
        console.log("User is not an admin, redirecting");
        router.push('/admin/support/tickets');
      }
      setLoading(false);
    }
  }, [currentUser, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }
  return isAdmin ? <Team /> : null;
}

export default Protected(TeamPage, ["admin"]);