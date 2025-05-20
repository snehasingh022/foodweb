import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Input, Table, Button, Modal, Form, Spin, message, Space, Tooltip } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { db } from '../../../authentication/firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import Protected from '../../../components/Protected/Protected';

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
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
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
      const categoryId = `CID${Date.now().toString().slice(-6)}`;
      const slug = values.name.toLowerCase().replace(/ /g, '-');
      await setDoc(doc(db, 'categories', categoryId), {
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
    } finally {
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
      form.resetFields();
      setModalVisible(false);
      setEditMode(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      message.error('Failed to update category');
    } finally {
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
      setSelectedCategory(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      message.error('Failed to delete category');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter categories based on search text
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Function to truncate description text
  const truncateDescription = (description: string) => {
    const words = description.split(' ');
    if (words.length > 7) {
      return (
        <Tooltip title={description}>
          <span>{words.slice(0, 7).join(' ')}...</span>
        </Tooltip>
      );
    }
    return description;
  };

  // Handle edit button click
  const handleEditClick = (record: CategoryType) => {
    setSelectedCategory(record);
    setEditMode(true);
    // Set form fields with the selected category data
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setModalVisible(true);
  };

  // Handle add button click
  const handleAddClick = () => {
    setEditMode(false);
    setSelectedCategory(null);
    form.resetFields(); // Clear form for new category
    setModalVisible(true);
  };

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
      render: (description: string) => truncateDescription(description),
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
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              className="text-green-600 hover:text-green-800"
              onClick={() => handleEditClick(record)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => {
                setSelectedCategory(record);
                setDeleteModalVisible(true);
              }}
              className="text-red-600 hover:text-red-800"
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditMode(false);
    setSelectedCategory(null);
    form.resetFields();
  };

  const handleSubmit = editMode ? handleUpdateCategory : handleAddCategory;

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Category Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  onClick={handleAddClick}
                  icon={<PlusOutlined />}
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                >
                  Add Category
                </Button>
                <Input
                  placeholder="Search categories..."
                  prefix={<SearchOutlined />}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  className="py-2 text-base font"
                />
                {loading ? (
                  <div className="h-10 flex items-center justify-center">
                    <Spin size="small" />
                  </div>
                ) : (
                  <Button
                    type="primary"
                    onClick={fetchCategories}
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
        title={<div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
            {editMode ? "Edit Category" : "Add New Category"}
          </span>
        </div>}
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
        className="p-6"
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
    </Modal >

      {/* Delete Confirmation Modal */ }
      < Modal
  title = "Delete Category"
  open = { deleteModalVisible }
  onCancel = {() => setDeleteModalVisible(false)
}
onOk = { handleDeleteCategory }
okText = "Delete"
okButtonProps = {{ danger: true, loading: submitLoading }}
      >
        <p>Are you sure you want to delete this category?</p>
        <p className="text-red-500 mt-2">This action cannot be undone.</p>
      </Modal >
    </>
  );
}

export default Protected(Categories, ["admin"]);