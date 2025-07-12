import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Upload, message, Spin, Modal } from 'antd';
import { UploadOutlined, DeleteOutlined, ExclamationCircleFilled } from '@ant-design/icons';
// Import from your secondary Firebase config
import { storage as secondaryStorage } from '@/lib/firebase-secondary';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { RcFile } from 'antd/es/upload';
import Protected from '../../../components/Protected/Protected';

// Define Media file interface
interface MediaFile {
  id: string;
  name: string;
  image: string;
  fullPath: string; // Store the full storage path
}

function Media() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const { confirm } = Modal;

  const fetchMediaFiles = async () => {
    setLoading(true);
    try {
      // Create a reference to the prathaviTravelsMedia folder
      const storageRef = ref(secondaryStorage, 'prathaviTravelsMedia');
      
      // List all items in the folder
      const result = await listAll(storageRef);
      
      // Get download URLs for all items
      const mediaPromises = result.items.map(async (itemRef) => {
        const downloadURL = await getDownloadURL(itemRef);
        return {
          id: itemRef.name, // Use the file name as ID
          name: itemRef.name,
          image: downloadURL,
          fullPath: itemRef.fullPath
        };
      });
      
      const mediaData = await Promise.all(mediaPromises);
      
      // Sort by name (since we don't have creation time)
      mediaData.sort((a, b) => a.name.localeCompare(b.name));
      
      setMediaFiles(mediaData);
    } catch (error) {
      console.error("Error fetching media:", error);
      message.error("Failed to load media files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMediaFiles();
  }, []);

  const handleUpload = async (file: RcFile) => {
    setLoading(true);
    try {
      // Create a unique filename
      const fileName = `MID${Date.now()}_${file.name}`;
      const storageRef = ref(secondaryStorage, `prathaviTravelsMedia/${fileName}`);
      
      // Upload file to Firebase Storage
      await uploadBytes(storageRef, file);
      
      message.success("File uploaded successfully");
      fetchMediaFiles(); // Refresh the list
    } catch (error) {
      console.error("Error uploading file:", error);
      message.error("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirm = (id: string, fullPath: string, fileName: string) => {
    confirm({
      title: 'Are you sure you want to delete this file?',
      icon: <ExclamationCircleFilled style={{ borderColor: '#ff4d4f' }} />,
      content: `File: ${fileName}`,
      okText: 'Yes, delete it',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        handleDelete(id, fullPath);
      },
      className: 'delete-confirmation-modal',
      centered: true,
      maskClosable: true,
      width: 420,
      bodyStyle: { 
        padding: '24px',
        fontSize: '15px'
      },
      okButtonProps: {
        style: { 
          borderColor: '#ff4d4f'
        }
      },
      cancelButtonProps: {
        style: {
          borderColor: '#d9d9d9'
        }
      }
    });
  };

  const handleDelete = async (id: string, fullPath: string) => {
    try {
      // Delete from Firebase Storage using the full path
      const fileRef = ref(secondaryStorage, fullPath);
      await deleteObject(fileRef);
      
      message.success("File deleted successfully");
      setMediaFiles(mediaFiles.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error deleting file:", error);
      message.error("Failed to delete file");
    }
  };

  const handlePreview = (file: MediaFile) => {
    setPreviewImage(file.image);
    setPreviewTitle(file.name);
    setPreviewVisible(true);
  };

  const uploadProps = {
    beforeUpload: (file: RcFile) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      handleUpload(file);
      return false;
    },
    showUploadList: false,
  };

  return (
    <>
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] pt-6 bg-transparent">
        <Row gutter={25} className="mb-5">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3 p-5">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Media Management</h1>
                <p className="text-sm text-gray-500 mt-1">Managing images from prathaviTravelsMedia folder</p>
              </div>
              <div className="flex items-center gap-2">
                <Upload {...uploadProps}>
                  <Button 
                    type="primary"
                    icon={<UploadOutlined />}
                    className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                    loading={loading}
                  >
                    Upload Media
                  </Button>
                </Upload>
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
                  
                  {loading && (
                    <div className="flex justify-center items-center py-10">
                      <Spin size="large" />
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-6 p-4">
                    {mediaFiles.map((file) => (
                      <div 
                        key={file.id} 
                        className="w-[30vh] h-[30vh] border border-purple-300 bg-purple-50 dark:bg-purple-900/10 rounded-md overflow-hidden relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md flex justify-center items-center"
                      >
                        <div 
                          className="w-full h-full flex items-center justify-center p-2 overflow-hidden"
                          onClick={() => handlePreview(file)}
                        >
                          <img 
                            src={file.image} 
                            alt={file.name} 
                            className="max-w-[95%] max-h-[95%] object-contain"
                          />
                        </div>
                        <div 
                          className="absolute inset-0 bg-purple-500/60 opacity-0 hover:opacity-100 transition-opacity duration-700 flex items-center justify-center"
                        >
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={(e) => {
                              e.stopPropagation();
                              showDeleteConfirm(file.id, file.fullPath, file.name);
                            }}
                            className="text-white hover:text-red-500 hover:bg-white"
                          />
                        </div>
                      </div>
                    ))}
                    
                    <Upload {...uploadProps}>
                      <div className="w-[30vh] h-[30vh] border border-purple-300 bg-purple-50 dark:bg-purple-900/10 rounded-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-md">
                        <div className="text-4xl text-purple-400">+</div>
                      </div>
                    </Upload>
                  </div>
                  
                  {!loading && mediaFiles.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      <p>No media files found in prathaviTravelsMedia folder. Upload some files to get started.</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </main>
      
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="95%"
        style={{ maxWidth: '800px' }}
        className="responsive-modal"
      >
        <img alt={previewTitle} style={{ width: '100%', height: 'auto' }} src={previewImage} />
      </Modal>
    </>
  );
}

export default Protected(Media, ["admin", "tours+media","partner"]);