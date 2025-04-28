import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Upload, message, Spin, Modal } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import { mediaDb, mediaAnalytics, mediaStorage } from '../../../authentication/firebase-media';
import { db } from '../../../authentication/firebase'; // Import the main db from firebase.tsx
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  addDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { RcFile } from 'antd/es/upload';
import Protected from '../../../components/Protected/Protected';

// Define Media file interface
interface MediaFile {
  id: string;
  name: string;
  image: string;
  createdAt: any;
}

function Media() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');

  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Media',
    },
  ];

  const fetchMediaFiles = async () => {
    setLoading(true);
    try {
      // Query the main Firebase db's media collection instead
      const mediaRef = query(
        collection(db, "media"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(mediaRef);
      const mediaData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as MediaFile[];
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
      const fileName = `MID${Date.now()}`;
      const storageRef = ref(mediaStorage, `media/${fileName}`);
      
      // Upload file to Firebase Storage
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Add document to the main Firestore database's media collection
      await addDoc(collection(db, "media"), {
        name: file.name,
        image: downloadURL,
        createdAt: serverTimestamp(),
      });
      
      message.success("File uploaded successfully");
      fetchMediaFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
      message.error("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, imageUrl: string) => {
    try {
      // Delete from the main Firestore
      await deleteDoc(doc(db, "media", id));
      
      // Extract the file path from the URL to delete from Storage
      const fileRef = ref(mediaStorage, imageUrl);
      try {
        await deleteObject(fileRef);
      } catch (storageError) {
        console.error("Error deleting file from storage:", storageError);
      }
      
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
      <PageHeaders
        className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
        title="Media"
        routes={PageRoutes}
      />
      <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25}>
          <Col sm={24} xs={24}>
            <Card className="h-full">
              <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                <div className="p-4 sm:p-[25px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-dark dark:text-white/[.87] text-[16px] font-semibold">Media Management</h2>
                    <Upload {...uploadProps}>
                      <Button 
                        icon={<UploadOutlined />} 
                        className="bg-primary hover:bg-primary-hover text-white w-full sm:w-auto"
                        loading={loading}
                      >
                        Upload Media
                      </Button>
                    </Upload>
                  </div>
                  
                  {loading && (
                    <div className="flex justify-center items-center py-10">
                      <Spin size="large" />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {mediaFiles.map((file) => (
                      <div 
                        key={file.id} 
                        className="relative border border-gray-200 dark:border-white/10 rounded-md overflow-hidden group"
                      >
                        <div 
                          className="h-[180px] cursor-pointer bg-gray-50 dark:bg-white/10 flex items-center justify-center overflow-hidden"
                          onClick={() => handlePreview(file)}
                        >
                          <img 
                            src={file.image} 
                            alt={file.name} 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div className="p-3 flex justify-between items-center">
                          <div className="truncate text-sm" title={file.name}>
                            {file.name}
                          </div>
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => handleDelete(file.id, file.image)}
                            className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            type="primary" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(file.id, file.image);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {!loading && mediaFiles.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                      <p>No media files found. Upload some files to get started.</p>
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

export default Protected(Media, ["admin"]); 