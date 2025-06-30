import React, { useState, useEffect } from 'react';
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
  Space,
  Typography,
  Spin,
  Image,
  Popconfirm
} from 'antd';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../authentication/firebase';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import Protected from '../../../components/Protected/Protected';

const { Text } = Typography;

interface Advertisement {
  id: string;
  title: string;
  description: string;
  images: string[];
  status: 'active' | 'inactive';
  position: number;
  createdAt: any;
  updatedAt?: any;
}

function Advertisement() {
  const [loading, setLoading] = useState(false);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [form] = Form.useForm();
  const [imageUploading, setImageUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    fetchAdvertisements();
  }, []);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      const adsRef = collection(db, 'advertisement');
      const q = query(adsRef, orderBy('position', 'asc'));
      const snapshot = await getDocs(q);
      
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Advertisement[];
      
      setAdvertisements(data);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
      message.error('Failed to fetch advertisements');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setImageUploading(true);
      const storageRef = ref(storage, `advertisements/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      setUploadedImages(prev => [...prev, downloadURL]);
      message.success('Image uploaded successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = (imageUrl: string) => {
    setUploadedImages(prev => prev.filter(url => url !== imageUrl));
  };

  const handleSubmit = async (values: any) => {
    try {
      const adData = {
        title: values.title,
        description: values.description,
        images: uploadedImages,
        status: values.status || 'active',
        position: values.position || 1,
        updatedAt: serverTimestamp()
      };

      if (editingAd) {
        // Update existing advertisement
        await updateDoc(doc(db, 'advertisement', editingAd.id), adData);
        message.success('Advertisement updated successfully');
      } else {
        // Add new advertisement
        adData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'advertisement'), adData);
        message.success('Advertisement added successfully');
      }

      setModalVisible(false);
      form.resetFields();
      setUploadedImages([]);
      setEditingAd(null);
      fetchAdvertisements();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      message.error('Failed to save advertisement');
    }
  };

  const handleEdit = (record: Advertisement) => {
    setEditingAd(record);
    setUploadedImages(record.images || []);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      status: record.status,
      position: record.position
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'advertisement', id));
      message.success('Advertisement deleted successfully');
      fetchAdvertisements();
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      message.error('Failed to delete advertisement');
    }
  };

  const handlePositionChange = async (id: string, newPosition: number) => {
    try {
      await updateDoc(doc(db, 'advertisement', id), {
        position: newPosition,
        updatedAt: serverTimestamp()
      });
      message.success('Position updated successfully');
      fetchAdvertisements();
    } catch (error) {
      console.error('Error updating position:', error);
      message.error('Failed to update position');
    }
  };

  const columns = [
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position',
      width: 100,
      render: (position: number, record: Advertisement) => (
        <Input
          type="number"
          value={position}
          onChange={(e) => handlePositionChange(record.id, parseInt(e.target.value) || 1)}
          style={{ width: 60 }}
        />
      )
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => <Text ellipsis={{ tooltip: text }}>{text}</Text>
    },
    {
      title: 'Images',
      dataIndex: 'images',
      key: 'images',
      render: (images: string[]) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {images?.slice(0, 3).map((url, index) => (
            <Image
              key={index}
              src={url}
              alt={`Ad ${index + 1}`}
              width={50}
              height={50}
              style={{ objectFit: 'cover', borderRadius: '4px' }}
            />
          ))}
          {images?.length > 3 && (
            <div style={{ 
              width: 50, 
              height: 50, 
              background: '#f0f0f0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              borderRadius: '4px'
            }}>
              +{images.length - 3}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ 
          color: status === 'active' ? '#52c41a' : '#ff4d4f',
          fontWeight: 'bold'
        }}>
          {status.toUpperCase()}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Advertisement) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="text-blue-600 hover:text-blue-800"
          />
          <Popconfirm
            title="Are you sure you want to delete this advertisement?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const filteredData = advertisements.filter(ad =>
    ad.title.toLowerCase().includes(searchText.toLowerCase()) ||
    ad.description.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Advertisement Management</h1>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search advertisements..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  style={{ width: 250 }}
                  className="py-2 text-base font-medium"
                />
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingAd(null);
                    setUploadedImages([]);
                    form.resetFields();
                    setModalVisible(true);
                  }}
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                >
                  Add Advertisement
                </Button>
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
                      dataSource={filteredData}
                      columns={columns}
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
              {editingAd ? 'Edit Advertisement' : 'Add New Advertisement'}
            </h3>
          </div>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingAd(null);
          setUploadedImages([]);
          form.resetFields();
        }}
        footer={null}
        width="80%"
        className="responsive-modal"
        centered
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="p-6"
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: 'Please enter advertisement title' }]}
              >
                <Input placeholder="Enter advertisement title" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Position"
                name="position"
                rules={[{ required: true, message: 'Please enter position' }]}
              >
                <Input type="number" placeholder="Enter position number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter advertisement description" />
          </Form.Item>

          <Form.Item
            label="Status"
            name="status"
            initialValue="active"
          >
            <Input.Group compact>
              <Button
                type={form.getFieldValue('status') === 'active' ? 'primary' : 'default'}
                onClick={() => form.setFieldsValue({ status: 'active' })}
                style={{ width: '50%' }}
              >
                Active
              </Button>
              <Button
                type={form.getFieldValue('status') === 'inactive' ? 'primary' : 'default'}
                onClick={() => form.setFieldsValue({ status: 'inactive' })}
                style={{ width: '50%' }}
              >
                Inactive
              </Button>
            </Input.Group>
          </Form.Item>

          <Form.Item label="Images">
            <div className="space-y-4">
              <div className="flex gap-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    files.forEach(file => handleImageUpload(file));
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hbr"
                />
                {imageUploading && <Spin />}
              </div>

              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative">
                      <Image
                        src={url}
                        alt={`Uploaded ${index + 1}`}
                        width="100%"
                        height={150}
                        style={{ objectFit: 'cover', borderRadius: '8px' }}
                      />
                      <Button
                        type="text"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleRemoveImage(url)}
                        className="absolute top-2 right-2 bg-white rounded-full shadow-md"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Form.Item>

          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button
              onClick={() => {
                setModalVisible(false);
                setEditingAd(null);
                setUploadedImages([]);
                form.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingAd ? 'Update' : 'Add'} Advertisement
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}

export default Protected(Advertisement, ["admin"]); 