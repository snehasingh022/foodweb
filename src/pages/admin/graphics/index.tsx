import dynamic from 'next/dynamic';

// The entire component is now wrapped in dynamic import with ssr: false
// This ensures Next.js doesn't try to render it on the server
export default dynamic(() => Promise.resolve(Graphics), { ssr: false });

import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Select, message, Spin } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { PlusOutlined, DeleteOutlined, CloudUploadOutlined, FileImageOutlined } from '@ant-design/icons';

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
  carouselName: string;
  screenName: string;
  createdAt?: any;
}

type ScreenOptions = {
  [key: string]: string;
}

function Graphics() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SliderImage[]>([]);
  const [currentCarousel, setCurrentCarousel] = useState('userCarousel');
  const [addImageModalOpen, setAddImageModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageArchives, setImageArchives] = useState<ArchiveImage[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [archiveOrUpload, setArchiveOrUpload] = useState('upload');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [db, setDb] = useState<any>(null);
  const [storage, setStorage] = useState<any>(null);

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

  const carousels = [
    { key: 'userCarousel', label: 'User Carousel' },
    { key: 'partnerCarousel', label: 'Partner Carousel' },
    { key: 'offerCarousel', label: 'Offer Carousel' }
  ];

  const userScreenOptions: ScreenOptions = {
    HomeScreenNavigator: 'Home Screen Navigator',
    makeupSuggestor: 'Makeup Suggestor',
    myBooking: 'My Booking',
    Account: 'Account',
    helpDeskScreen: 'Help Desk Screen',
    edit: 'Edit',
    savedLocation: 'Saved Location',
  };

  const partnerScreenOptions: ScreenOptions = {
    accounts: 'Accounts',
    helpDesk: 'Help Desk',
    notification: 'Notification',
    homeTab: 'Home Tab',
    myBooking: 'My Booking',
    payment: 'Payment',
    account: 'Account',
  };

  const currentScreenOptions = currentCarousel === 'partnerCarousel' 
    ? partnerScreenOptions 
    : userScreenOptions;

  // Initialize Firebase on client-side only
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        // Dynamically import Firebase modules
        const firebaseAuth = await import('../../../authentication/firebase');
        const fireStorage = await import('firebase/storage');
        
        if (firebaseAuth.db) {
          setDb(firebaseAuth.db);
          setStorage(fireStorage.getStorage());
          setFirebaseInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
        message.error('Failed to connect to database');
      }
    };

    initializeFirebase();
  }, []);

  useEffect(() => {
    if (firebaseInitialized) {
      fetchSliderImages();
      fetchArchiveImages();
    }
  }, [firebaseInitialized, currentCarousel]);

  const fetchSliderImages = async () => {
    if (!firebaseInitialized) return;
    
    setLoading(true);
    try {
      if (!db) {
        console.error('Firestore is not initialized');
        message.error('Database connection error');
        setLoading(false);
        return;
      }

      // Dynamic import of Firestore functions
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'sliderImages', currentCarousel);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const carouselData = docSnapshot.data();
        setData(carouselData[currentCarousel] || []);
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
      if (!db) {
        console.error('Firestore is not initialized');
        return;
      }

      // Dynamic import of Firestore functions
      const { collection, getDocs } = await import('firebase/firestore');
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

  const handleImageUpload = async (file: File, collectionId: string): Promise<string> => {
    try {
      if (!storage) {
        throw new Error('Firebase storage is not initialized');
      }

      // Dynamic import of Storage functions
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const storageRef = ref(storage, `/adminPanel/sliderImages/${collectionId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleImageUploadToArchive = async (file: File): Promise<string> => {
    try {
      if (!db || !storage) {
        throw new Error('Firebase is not fully initialized');
      }

      // Dynamic import of functions
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      const storageRef = ref(storage, `adminPanel/archive/images/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Add to archive collection
      const archiveRef = collection(db, 'archive');
      await addDoc(archiveRef, {
        ImageUrl: downloadURL,
        createdAt: serverTimestamp(),
      });

      fetchArchiveImages();
      return downloadURL;
    } catch (error) {
      console.error('Error uploading to archive:', error);
      throw error;
    }
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

    try {
      setLoading(true);
      
      if (!db) {
        throw new Error('Firestore is not initialized');
      }
      
      const sliderImageId = currentCarousel;
      
      let imageURL = '';
      if (selectedImage) {
        // Upload to storage and get URL
        imageURL = await handleImageUpload(selectedImage, sliderImageId);
        
        // Also add to archive for future use
        await handleImageUploadToArchive(selectedImage);
      } else if (imagePreview) {
        // Use selected image from archive
        imageURL = imagePreview;
      } else {
        message.error('Please select or upload an image');
        setLoading(false);
        return;
      }

      // Dynamic import of Firestore functions
      const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      
      const newImageData = {
        imageUrl: imageURL,
        carouselName: currentCarousel,
        screenName: selectedDestination,
        createdAt: serverTimestamp(),
      };

      const docRef = doc(db, 'sliderImages', sliderImageId);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const currentData = docSnapshot.data();
        const updatedArray = [...(currentData[currentCarousel] || []), newImageData];

        await updateDoc(docRef, {
          [currentCarousel]: updatedArray,
        });
      } else {
        await setDoc(docRef, {
          [currentCarousel]: [newImageData],
        });
      }

      message.success('Image added successfully');
      setAddImageModalOpen(false);
      setSelectedDestination('');
      setSelectedImage(null);
      setImagePreview(null);
      fetchSliderImages();
    } catch (error) {
      console.error('Error adding image:', error);
      message.error('Failed to add image');
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
      
      if (!db) {
        throw new Error('Firestore is not initialized');
      }
      
      // Dynamic import of Firestore functions
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      
      const docRef = doc(db, 'sliderImages', currentCarousel);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const currentData = docSnapshot.data();
        const updatedArray = currentData[currentCarousel].filter(
          (_: SliderImage, i: number) => i !== index
        );

        await updateDoc(docRef, {
          [currentCarousel]: updatedArray,
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

  const handleImageArchiveChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!firebaseInitialized) {
      message.error('Firebase is not initialized yet');
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      try {
        await handleImageUploadToArchive(file);
        message.success('Image saved to archive');
      } catch (error) {
        message.error('Failed to save image to archive');
      }
    }
  };

  const handleSetArchiveImage = (url: string) => {
    setImagePreview(url);
    setUploadDialogOpen(false);
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
        title="Graphics"
        routes={PageRoutes}
      />
      
      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25} className="mb-[25px]">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Slider Images</h1>
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

        {/* Carousel selector buttons */}
        <Row className="mb-6">
          <Col span={24}>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {carousels.map((carousel, i) => (
                <Button
                  key={i}
                  onClick={() => setCurrentCarousel(carousel.key)}
                  className={`px-4 py-2 min-w-[150px] border ${
                    currentCarousel === carousel.key 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'border-gray-300 text-gray-700 dark:border-white/10 dark:text-white/60'
                  }`}
                >
                  {carousel.label}
                </Button>
              ))}
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
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteImage(index)}
                              className="flex items-center gap-1"
                            >
                              Delete
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
        title="Add Image"
        open={addImageModalOpen}
        onCancel={() => {
          setAddImageModalOpen(false);
          setSelectedDestination('');
          setSelectedImage(null);
          setImagePreview(null);
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setAddImageModalOpen(false);
              setSelectedDestination('');
              setSelectedImage(null);
              setImagePreview(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleAddImage}
            className="bg-primary hover:bg-primary-hbr"
          >
            Add
          </Button>
        ]}
      >
        <div className="mt-4">
          <div className="mb-4">
            <label className="block text-dark dark:text-white/[.87] mb-2">Destination</label>
            <Select
              placeholder="Select destination"
              onChange={(value) => setSelectedDestination(value)}
              value={selectedDestination}
              className="w-full"
            >
              {Object.keys(currentScreenOptions).map((key) => (
                <Option key={key} value={key}>
                  {currentScreenOptions[key]}
                </Option>
              ))}
            </Select>
          </div>
          
          <div 
            className="w-full bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-md flex flex-col items-center justify-center p-4 cursor-pointer" 
            onClick={() => setUploadDialogOpen(true)}
          >
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full max-h-40 object-contain" 
              />
            ) : (
              <>
                <FileImageOutlined className="text-4xl mb-2 text-gray-400" />
                <p className="text-gray-500 dark:text-white/60">Click to upload image</p>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Image Upload/Archive Dialog */}
      <Modal
        title="Select Image"
        open={uploadDialogOpen}
        onCancel={() => setUploadDialogOpen(false)}
        footer={null}
        width={700}
      >
        <div className="mb-4 flex gap-2">
          <Button
            type={archiveOrUpload === 'upload' ? 'primary' : 'default'}
            onClick={() => setArchiveOrUpload('upload')}
            className={archiveOrUpload === 'upload' ? 'bg-primary hover:bg-primary-hbr' : ''}
          >
            Upload New
          </Button>
          <Button
            type={archiveOrUpload === 'archive' ? 'primary' : 'default'}
            onClick={() => setArchiveOrUpload('archive')}
            className={archiveOrUpload === 'archive' ? 'bg-primary hover:bg-primary-hbr' : ''}
          >
            From Archive
          </Button>
        </div>

        {archiveOrUpload === 'upload' ? (
          <div className="flex items-center justify-center bg-gray-50 dark:bg-white/10 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-lg p-8">
            <label htmlFor="image-upload" className="cursor-pointer text-center">
              <CloudUploadOutlined className="text-5xl mb-2 text-gray-400" />
              <p className="text-gray-500 dark:text-white/60 mb-2">Click to upload</p>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedImage(e.target.files[0]);
                    setImagePreview(URL.createObjectURL(e.target.files[0]));
                    setUploadDialogOpen(false);
                  }
                }}
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
            <label htmlFor="archive-upload" className="cursor-pointer border border-gray-200 dark:border-white/10 rounded-md p-2 flex items-center justify-center h-24">
              <div className="text-center">
                <PlusOutlined className="text-xl mb-1 text-gray-500" />
                <p className="text-xs text-gray-500 dark:text-white/60">Add to archive</p>
                <input
                  id="archive-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageArchiveChange}
                />
              </div>
            </label>
            
            {imageArchives.map((item, index) => (
              <div 
                key={index}
                className="cursor-pointer border border-gray-200 dark:border-white/10 rounded-md p-2 h-24 flex items-center justify-center hover:border-primary"
                onClick={() => handleSetArchiveImage(item.ImageUrl)}
              >
                <img 
                  src={item.ImageUrl} 
                  alt="Archive"
                  className="max-w-full max-h-20 object-contain" 
                />
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewModalOpen}
        title="Image Preview"
        footer={null}
        onCancel={() => setPreviewModalOpen(false)}
      >
        <img 
          src={previewImage} 
          alt="Preview" 
          className="w-full object-contain max-h-[70vh]" 
        />
      </Modal>
    </>
  );
} 