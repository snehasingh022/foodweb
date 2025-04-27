import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Table, Button, Modal, Form, Spin, message, Space } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { db } from '../../../authentication/firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

interface CategoryType {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdAt: any; // Using any for Firestore timestamp
  updatedAt?: any;
}

interface CategoryFormValues {
  name: string;
  description: string;
}

function Categories() {
  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Categories',
    },
  ];

  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  // Fetch categories from Firestore
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const categoriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CategoryType[];
      setCategories(categoriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to fetch categories');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle add category
  const handleAddCategory = async (values: CategoryFormValues) => {
    try {
      setSubmitLoading(true);
      const slug = values.name.toLowerCase().replace(/ /g, '-');
      await addDoc(collection(db, 'categories'), {
        name: values.name,
        slug: slug,
        description: values.description,
        createdAt: serverTimestamp(),
      });
      message.success('Category added successfully');
      form.resetFields();
      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      message.error('Failed to add category');
      setSubmitLoading(false);
    }
  };

  // Handle update category
  const handleUpdateCategory = async (values: CategoryFormValues) => {
    if (!selectedCategory) return;
    try {
      setSubmitLoading(true);
      const slug = values.name.toLowerCase().replace(/ /g, '-');
      const categoryRef = doc(db, 'categories', selectedCategory.id);
      await updateDoc(categoryRef, {
        name: values.name,
        slug: slug,
        description: values.description,
        updatedAt: serverTimestamp(),
      });
      message.success('Category updated successfully');
      editForm.resetFields();
      setEditModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      message.error('Failed to update category');
      setSubmitLoading(false);
    }
  };

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      setSubmitLoading(true);
      await deleteDoc(doc(db, 'categories', selectedCategory.id));
      message.success('Category deleted successfully');
      setDeleteModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      message.error('Failed to delete category');
      setSubmitLoading(false);
    }
  };

  // Filter categories based on search text
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Table columns
  const columns = [
    {
      title: 'Category ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <span className="text-sm text-gray-600">{text}</span>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>,
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
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (createdAt: any) => (
        <span>{createdAt && createdAt.toDate ? new Date(createdAt.toDate()).toLocaleString() : 'N/A'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CategoryType) => (
        <div className="flex gap-2">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => {
              setSelectedCategory(record);
              editForm.setFieldsValue({
                name: record.name,
                description: record.description,
              });
              setEditMode(true);
              setModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              setSelectedCategory(record);
              setDeleteModalVisible(true);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditMode(false);
  };

  const handleSubmit = editMode ? handleUpdateCategory : handleAddCategory;

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
        title="Categories"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-4 sm:p-[25px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold">Category Management</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                      <Input
                        placeholder="Search categories..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full sm:w-64"
                      />
                      <Button
                        type="primary"
                        onClick={() => setModalVisible(true)}
                        icon={<PlusOutlined />}
                        className="w-full sm:w-auto"
                      >
                        Add Category
                      </Button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table
                      dataSource={filteredCategories}
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

      {/* Add/Edit Category Modal */}
      <Modal
        title={editMode ? "Edit Category" : "Add New Category"}
        open={modalVisible}
        onCancel={handleModalCancel}
        footer={null}
        width="95%"
        style={{ maxWidth: '600px' }}
        className="responsive-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="p-2"
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter description" />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end mt-4">
            <Space>
              <Button onClick={handleModalCancel}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitLoading}
              >
                {editMode ? "Update" : "Add"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Delete Category"
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={handleDeleteCategory}
        okText="Delete"
        okButtonProps={{ danger: true, loading: submitLoading }}
      >
        <p>Are you sure you want to delete this category?</p>
        <p className="text-red-500 mt-2">This action cannot be undone.</p>
      </Modal>
    </>
  );
}

export default Categories; 