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
  Form, 
  message 
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import Protected from '../../../components/Protected/Protected';

// Define Tag interface
interface Tag {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: any;
  updatedAt: any;
  key: string;
}

function Tags() {
  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Tags',
    },
  ];

  // State declarations
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [editMode, setEditMode] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // Fetch tags from Firestore
  const fetchTags = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "tags"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const tagsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        key: doc.id,
        name: doc.data().name || '',
        slug: doc.data().slug || '',
        description: doc.data().description || '',
        createdAt: doc.data().createdAt,
        updatedAt: doc.data().updatedAt,
      }));
      
      setTags(tagsData);
    } catch (error) {
      console.error("Error fetching tags:", error);
      message.error("Failed to fetch tags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  // Handle tag name change and generate slug
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    form.setFieldsValue({ slug });
  };

  const handleEditNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    editForm.setFieldsValue({ slug });
  };

  // Add new tag
  const handleAddTag = async (values: any) => {
    try {
      await addDoc(collection(db, "tags"), {
        name: values.name,
        slug: values.slug,
        description: values.description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      message.success("Tag added successfully");
      setAddModalVisible(false);
      form.resetFields();
      fetchTags();
    } catch (error) {
      console.error("Error adding tag:", error);
      message.error("Failed to add tag");
    }
  };

  // Edit tag
  const handleEditTag = async (values: any) => {
    if (!selectedTag) return;
    
    try {
      const tagRef = doc(db, "tags", selectedTag.id);
      await updateDoc(tagRef, {
        name: values.name,
        slug: values.slug,
        description: values.description,
        updatedAt: serverTimestamp(),
      });
      
      message.success("Tag updated successfully");
      setEditModalVisible(false);
      editForm.resetFields();
      fetchTags();
    } catch (error) {
      console.error("Error updating tag:", error);
      message.error("Failed to update tag");
    }
  };

  // Delete tag
  const handleDeleteTag = async () => {
    if (!selectedTag) return;
    
    try {
      await deleteDoc(doc(db, "tags", selectedTag.id));
      message.success("Tag deleted successfully");
      setDeleteModalVisible(false);
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      message.error("Failed to delete tag");
    }
  };

  // Filter tags based on search text
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchText.toLowerCase()) ||
    tag.slug.toLowerCase().includes(searchText.toLowerCase()) ||
    tag.description.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table columns
  const columns = [
    {
      title: 'Tag Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Tag, b: Tag) => a.name.localeCompare(b.name),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => createdAt ? new Date(createdAt.toDate()).toLocaleString() : 'N/A',
      sorter: (a: Tag, b: Tag) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return a.createdAt.toDate().getTime() - b.createdAt.toDate().getTime();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: Tag) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />} 
            onClick={() => {
              setSelectedTag(record);
              editForm.setFieldsValue({
                name: record.name,
                slug: record.slug,
                description: record.description,
              });
              setEditMode(true);
              setModalVisible(true);
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Edit
          </Button>
          <Button 
            type="primary" 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => {
              setSelectedTag(record);
              setDeleteModalVisible(true);
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditMode(false);
    form.resetFields();
  };

  const handleSubmit = async (values: any) => {
    if (editMode) {
      await handleEditTag(values);
    } else {
      await handleAddTag(values);
    }
    setModalVisible(false);
  };

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
        
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-4 sm:p-[25px]">
                  <div className="flex flex-row sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold">Tag Management</h2>
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="Search tags..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-64"
                      />
                      <Button
                        type="primary"
                        onClick={() => setModalVisible(true)}
                        icon={<PlusOutlined />}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Add Tag
                      </Button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table
                      dataSource={filteredTags}
                      columns={columns.map(col => ({
                        ...col,
                        responsive: col.dataIndex === 'name' || col.key === 'action' 
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

      {/* Add/Edit Tag Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              {editMode ? "Edit Tag" : "Add New Tag"}
            </span>
          </div>
        }
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width="95%"
        style={{ maxWidth: '600px' }}
        className="responsive-modal"
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="px-6 pt-4"
        >
          <div className="mb-6">
            <h3 className="text-base text-gray-500 dark:text-gray-400 mb-4">Tag Information</h3>
            
            <Form.Item
              label={<span className="text-dark dark:text-white/[.87] font-medium">Tag Name</span>}
              name="name"
              rules={[{ required: true, message: 'Please enter tag name!' }]}
            >
              <Input 
                prefix={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-gray-400" viewBox="0 0 16 16">
                  <path d="M3.5 2a.5.5 0 0 0-.5.5v5a.5.5 0 0 0 .5.5h5a.5.5 0 0 0 .5-.5v-5a.5.5 0 0 0-.5-.5h-5zm1 .5H8v4H4.5v-4zM11 1a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h10zm-1 2H2v9h8v-9z"/>
                </svg>}
                placeholder="Enter tag name" 
                onChange={handleNameChange}
                className="py-2" 
              />
            </Form.Item>
            
            <Form.Item
              label={<span className="text-dark dark:text-white/[.87] font-medium">Slug</span>}
              name="slug"
              rules={[{ required: true, message: 'Please enter tag slug!' }]}
              tooltip="The slug is used in the URL. It must be unique and contain only lowercase letters, numbers, and hyphens."
            >
              <Input 
                prefix={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="text-gray-400" viewBox="0 0 16 16">
                  <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9q-.13 0-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z"/>
                  <path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z"/>
                </svg>}
                placeholder="tag-slug" 
                className="py-2"
              />
            </Form.Item>
            
            <Form.Item
              label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
              name="description"
              rules={[{ required: true, message: 'Please enter tag description!' }]}
            >
              <Input.TextArea 
                placeholder="Enter a description for this tag" 
                rows={4} 
                className="text-base"
              />
            </Form.Item>
          </div>
          
          <div className="flex justify-end mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Space size="middle">
              <Button 
                onClick={handleModalCancel}
                className="px-5 h-10 shadow-none hover:bg-gray-50 dark:hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                className="px-5 h-10 shadow-none"
              >
                {editMode ? "Update Tag" : "Add Tag"}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={handleDeleteTag}
        okText="Delete"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to delete this tag? This action cannot be undone.</p>
      </Modal>
    </>
  );
}

export default Protected(Tags, ["admin"]); 