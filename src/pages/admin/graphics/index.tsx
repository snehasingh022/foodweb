import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Select, message, Spin, Tabs, Space } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { PlusOutlined, DeleteOutlined, CloudUploadOutlined, FileImageOutlined, SearchOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import Protected from '../../../components/Protected/Protected';
import FirebaseFileUploader from '../../../components/FirebaseFileUploader'; // Adjust path as needed
// Import the graphics-specific Firebase configuration
import { graphicsDb, graphicsStorage, graphicsAnalytics } from '../../../authentication/firebase-graphics';
// Import the main Firebase database
import { db } from '../../../authentication/firebase';
// Import the secondary Firebase storage
import { storage as secondaryStorage } from '../../../lib/firebase-secondary';

// Import types for TypeScript but not the actual implementation
import type {
  DocumentData,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';

const { Option } = Select;

interface ArchiveImage {
  id: string;
  ImageUrl: string;
  createdAt?: any;
}

interface SliderImage {
  imageUrl: string;
  screenName: string;
  createdAt?: any;
}

type ScreenOptions = {
  [key: string]: string;
}

function Graphics() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SliderImage[]>([]);
  const [addImageModalOpen, setAddImageModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageArchives, setImageArchives] = useState<ArchiveImage[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [archiveOrUpload, setArchiveOrUpload] = useState('upload');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>(''); // Changed from imageUrlInput and imagePreview
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [firebaseInitialized, setFirebaseInitialized] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedGraphic, setSelectedGraphic] = useState<SliderImage | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [graphicToDelete, setGraphicToDelete] = useState<SliderImage | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);

  const PageRoutes = [
    {
      path: '/admin',
      breadcrumbName: 'Dashboard',
    },
    {
      path: '',
      breadcrumbName: 'Graphics',
    },
  ];

  // Single homeCarousel constant
  const carouselName = 'homeCarousel';

  // Combined screen options
  const screenOptions: ScreenOptions = {
    HomeScreenNavigator: 'Home Screen Navigator',
    makeupSuggestor: 'Makeup Suggestor',
    myBooking: 'My Booking',
    Account: 'Account',
    helpDeskScreen: 'Help Desk Screen',
    edit: 'Edit',
    savedLocation: 'Saved Location',
    payment: 'Payment',
    notification: 'Notification',
    homeTab: 'Home Tab',
  };

  useEffect(() => {
    if (firebaseInitialized) {
      fetchSliderImages();
      fetchArchiveImages();
    }
  }, [firebaseInitialized]);

  const fetchSliderImages = async () => {
    if (!firebaseInitialized) return;

    setLoading(true);
    try {
      // Dynamic import of Firestore functions
      const { doc, getDoc } = await import('firebase/firestore');
      // Use the main Firebase database with homeCarousel
      const docRef = doc(db, 'sliderImages', carouselName);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const carouselData = docSnapshot.data();
        setData(carouselData.images || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching slider images:', error);
      message.error('Failed to load slider images');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchiveImages = async () => {
    if (!firebaseInitialized) return;

    try {
      // Dynamic import of Firestore functions
      const { collection, getDocs } = await import('firebase/firestore');
      // Use the main Firebase database
      const archiveRef = collection(db, 'archive');
      const querySnapshot = await getDocs(archiveRef);
      const archiveData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ArchiveImage[];
      setImageArchives(archiveData);
    } catch (error) {
      console.error('Error fetching archive images:', error);
    }
  };

  // Function to add image URL to archive
  const addImageUrlToArchive = async (imageUrl: string) => {
    try {
      // Dynamic import of functions
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

      // Add to archive collection in the main database
      const archiveRef = collection(db, 'archive');
      await addDoc(archiveRef, {
        ImageUrl: imageUrl,
        createdAt: serverTimestamp(),
      });

      fetchArchiveImages();
      return imageUrl;
    } catch (error) {
      console.error('Error adding URL to archive:', error);
      throw error;
    }
  };
// Also update the handleUploadSuccess function to provide better feedback
const handleUploadSuccess = async (downloadUrl: string, fileType: string) => {
  try {
    setUploadedImageUrl(downloadUrl);
    setFileUploading(false);
    
    // Also add to archive for future use
    await addImageUrlToArchive(downloadUrl);
    
    message.success('Image uploaded successfully! You can now add it to the carousel.');
  } catch (error) {
    console.error('Error adding to archive:', error);
    setUploadedImageUrl(downloadUrl); // Still set the URL even if archive fails
    setFileUploading(false);
    message.warning('Image uploaded but failed to add to archive. You can still proceed.');
  }
};

  // Handle upload start
  const handleUploadStart = () => {
    setFileUploading(true);
  };

  // Handle upload error
  const handleUploadError = (error: Error) => {
    setFileUploading(false);
    message.error(`Upload failed: ${error.message}`);
  };

  
const handleAddImage = async () => {
  if (!firebaseInitialized) {
    message.error('Firebase is not initialized yet');
    return;
  }

  if (!selectedDestination) {
    message.error('Please select a destination');
    return;
  }

  if (!uploadedImageUrl) {
    message.error('Please upload an image first');
    return;
  }

  try {
    setLoading(true);

    // Dynamic import of Firestore functions
    const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');

    const newImageData = {
      imageUrl: uploadedImageUrl,
      screenName: selectedDestination,
    };

    // Store data in the main Firebase database for homeCarousel
    const docRef = doc(db, 'sliderImages', carouselName);
    const docSnapshot = await getDoc(docRef);

    if (docSnapshot.exists()) {
      const currentData = docSnapshot.data();
      const updatedArray = [...(currentData.images || []), newImageData];

      await updateDoc(docRef, {
        images: updatedArray,
      });
    } else {
      await setDoc(docRef, {
        images: [newImageData],
      });
    }

    // Success: Close modal and show notification
    message.success('Image added successfully to carousel');
    
    // Close the modal
    setAddImageModalOpen(false);
    
    // Reset form state
    setSelectedDestination('');
    setUploadedImageUrl('');
    setFileUploading(false);
    
    // Refresh the data
    await fetchSliderImages();
    
  } catch (error) {
    console.error('Error adding image:', error);
    message.error('Failed to add image. Please try again.');
  } finally {
    setLoading(false);
  }
};



  const handleDeleteImage = async (index: number) => {
    if (!firebaseInitialized) {
      message.error('Firebase is not initialized yet');
      return;
    }

    try {
      setLoading(true);

      // Dynamic import of Firestore functions
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');

      // Use the main Firebase database with homeCarousel
      const docRef = doc(db, 'sliderImages', carouselName);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const currentData = docSnapshot.data();
        const updatedArray = currentData.images.filter(
          (_: SliderImage, i: number) => i !== index
        );

        await updateDoc(docRef, {
          images: updatedArray,
        });

        message.success('Image deleted successfully');
        setData(updatedArray);
      } else {
        message.error('Document does not exist');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      message.error('Failed to delete image');
    } finally {
      setLoading(false);
    }
  };

  const camelCaseToTitleCase = (camelCase: string): string => {
    if (!camelCase) return '';
    const result = camelCase.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  // Display loading state if Firebase is not yet initialized
  if (!firebaseInitialized) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Spin size="large" tip="Connecting to database..." />
      </div>
    );
  }

  return (
    <>
      <PageHeaders
        className="flex items-center justify-between px-8 xl:px-[15px] pt-2 pb-6 sm:pb-[30px] bg-transparent sm:flex-col"
      />

      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25} className="mb-[25px]">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Home Carousel Images</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setAddImageModalOpen(true)}
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                >
                  Add Image
                </Button>
                {loading && <Spin />}
              </div>
            </div>
          </Col>
        </Row>

        {/* Data table */}
        <Card className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/10">
                  <th className="px-4 py-5 font-medium text-start text-light dark:text-white/60">Image</th>
                  <th className="px-4 py-5 font-medium text-start text-light dark:text-white/60">Screen</th>
                  <th className="px-4 py-5 font-medium text-start text-light dark:text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-5">
                      <Spin />
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-5 text-light dark:text-white/60">
                      No images found
                    </td>
                  </tr>
                ) : (
                  data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item, index) => (
                      <tr key={index} className="border-b border-gray-200 dark:border-white/10 last:border-0">
                        <td className="px-4 py-5">
                          <div className="flex justify-center">
                            <img
                              src={item.imageUrl}
                              alt="Slider"
                              className="w-24 h-24 object-cover rounded cursor-pointer"
                              onClick={() => {
                                setPreviewImage(item.imageUrl);
                                setPreviewModalOpen(true);
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center text-dark dark:text-white/[.87]">
                          {camelCaseToTitleCase(item.screenName)}
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex justify-center">
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteImage(index)}
                            >
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-end gap-3 mt-5">
            <Button
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              className="border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/60"
            >
              Previous
            </Button>
            <span className="text-gray-600 dark:text-white/60">
              Page {page + 1} of {Math.max(1, Math.ceil(data.length / rowsPerPage))}
            </span>
            <Button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}
              className="border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/60"
            >
              Next
            </Button>
            <Select
              value={rowsPerPage}
              onChange={(value) => {
                setRowsPerPage(value);
                setPage(0);
              }}
              className="w-20"
            >
              {[10, 25, 50, 100].map((size) => (
                <Option key={size} value={size}>{size}</Option>
              ))}
            </Select>
          </div>
        </Card>
      </main>

      {/* Add Image Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Add Image to Carousel
            </span>
          </div>
        }
        open={addImageModalOpen}
        onCancel={() => {
          setAddImageModalOpen(false);
          setSelectedDestination('');
          setUploadedImageUrl('');
          setFileUploading(false);
        }}
        width={650}
        bodyStyle={{ padding: '24px 28px' }}
        footer={[
              <Button
                key="back"
            size="large"
                onClick={() => {
                  setAddImageModalOpen(false);
                  setSelectedDestination('');
                  setUploadedImageUrl('');
                  setFileUploading(false);
                }}
                className="min-w-[100px] font-medium mb-4 "
              >
                Cancel
              </Button>,
              <Button
                key="submit"
                type="primary"
                loading={loading}
                className="min-w-[160px] font-medium mb-4 mr-4"
                onClick={handleAddImage}
                disabled={!selectedDestination || !uploadedImageUrl || fileUploading}
              >
                Add to Carousel
              </Button>
        ]}
      >
        <div className="mt-4 px-2">
          <div className="mb-8">
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Select Destination Screen *</label>
            <Select
              placeholder="Select screen where image will be displayed"
              onChange={(value) => setSelectedDestination(value)}
              value={selectedDestination}
              className="w-full"
              size="large"
              showSearch
              optionFilterProp="children"
            >
              {Object.keys(screenOptions).map((key) => (
                <Option key={key} value={key}>
                  {screenOptions[key]}
                </Option>
              ))}
            </Select>
          </div>

          <div className="mb-3">
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Upload Image *</label>
          </div>

          {/* File Uploader Component */}
          <div className="mb-6">
            <FirebaseFileUploader
              storagePath="graphics/images"
              accept="image/*"
              maxSizeMB={5}
              onUploadSuccess={handleUploadSuccess}
              onUploadStart={handleUploadStart}
              onUploadError={handleUploadError}
              disabled={fileUploading}
            />
          </div>
        </div>
      </Modal>

      {/* Preview Image Modal */}
      <Modal
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        <img
          src={previewImage}
          alt="Preview"
          className="w-full h-auto max-h-[80vh] object-contain"
        />
      </Modal>
    </>
  );
}

// Wrap the component with dynamic and Protected HOCs
const DynamicGraphics = dynamic(() => Promise.resolve(Graphics), { ssr: false });
export default Protected(DynamicGraphics, ["admin"]);