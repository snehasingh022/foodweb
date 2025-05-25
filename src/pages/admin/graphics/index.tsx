import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { Row, Col, Card, Button, Modal, Select, Input, message, Spin, Tabs, Space } from 'antd';
=======
import { Row, Col, Card, Button, Modal, Select, message, Spin, Input, Tabs, Space } from 'antd';
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
import { PageHeaders } from '../../../components/page-headers/index';
import { PlusOutlined, DeleteOutlined, CloudUploadOutlined, FileImageOutlined, SearchOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import Protected from '../../../components/Protected/Protected';
<<<<<<< HEAD

// Import the main Firebase database
import { db } from '../../../authentication/firebase';
// Import the secondary Firebase storage (your updated one)
import { storage as secondaryStorage } from '../../../lib/firebase-secondary';
import { convertImageToWebP } from '../../../components/imageConverter';

import type {
  DocumentData,
  DocumentReference,
  CollectionReference
=======
// Import the graphics-specific Firebase configuration
import { graphicsDb, graphicsStorage, graphicsAnalytics } from '../../../authentication/firebase-graphics';
// Import the main Firebase database
import { db } from '../../../authentication/firebase';

// Import types for TypeScript but not the actual implementation
import type { 
  DocumentData, 
  DocumentReference, 
  CollectionReference 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
} from 'firebase/firestore';

const { Option } = Select;

interface ArchiveImage {
  id: string;
  ImageUrl: string;
  createdAt?: any;
}

interface SliderImage {
  imageUrl: string;
<<<<<<< HEAD
  redirectionURL: string;
  createdAt?: any;
}

=======
  screenName: string;
  createdAt?: any;
}

type ScreenOptions = {
  [key: string]: string;
}

>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
function Graphics() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SliderImage[]>([]);
  const [addImageModalOpen, setAddImageModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageArchives, setImageArchives] = useState<ArchiveImage[]>([]);
<<<<<<< HEAD
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [redirectionUrl, setRedirectionUrl] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [firebaseInitialized, setFirebaseInitialized] = useState(true);
  const [fileUploading, setFileUploading] = useState(false);
=======
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [archiveOrUpload, setArchiveOrUpload] = useState('upload');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12

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

<<<<<<< HEAD
=======
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

>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
  useEffect(() => {
    if (firebaseInitialized) {
      fetchSliderImages();
      fetchArchiveImages();
    }
  }, [firebaseInitialized]);

  const fetchSliderImages = async () => {
    if (!firebaseInitialized) return;
<<<<<<< HEAD

=======
    
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD

=======
    
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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

<<<<<<< HEAD
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
=======
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      // Dynamic import of Storage functions
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      // Continue using graphicsStorage for upload
      const storageRef = ref(graphicsStorage, `/adminPanel/sliderImages/${carouselName}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      throw error;
    }
  };

<<<<<<< HEAD
  // Handle file selection and auto upload
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      message.error('File size must be less than 5MB');
      return;
    }

    // Automatically start upload process
    await handleImageUpload(file);
  };

  // Handle image upload with WebP conversion
  const handleImageUpload = async (file: File) => {
    setFileUploading(true);
    setUploadedImageUrl(''); // Clear previous upload

    try {
      // Convert image to WebP
      message.info('Converting image to WebP format...');
      const webpFile = await convertImageToWebP(file);

      // Dynamic import of Firebase storage functions
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}_${webpFile.name}`;

      // Create storage reference in prathaviTravelsMedia folder
      const storageRef = ref(secondaryStorage, `prathaviTravelsMedia/${fileName}`);

      message.info('Uploading image...');

      // Upload the WebP file
      const uploadResult = await uploadBytes(storageRef, webpFile);

      // Get the download URL
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      setUploadedImageUrl(downloadUrl);
      setFileUploading(false);

      // Also add to archive for future use
      await addImageUrlToArchive(downloadUrl);

      message.success('Image uploaded successfully as WebP format!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setFileUploading(false);
      const err = error as Error;
      message.error(`Upload failed: ${err.message}`);
=======
  const handleImageUploadToArchive = async (file: File): Promise<string> => {
    try {
      // Dynamic import of functions
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      
      // Continue using graphicsStorage for upload
      const storageRef = ref(graphicsStorage, `adminPanel/archive/images/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Add to archive collection in the main database
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
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    }
  };

  const handleAddImage = async () => {
    if (!firebaseInitialized) {
      message.error('Firebase is not initialized yet');
      return;
    }
<<<<<<< HEAD

    if (!uploadedImageUrl) {
      message.error('Please upload an image first');
      return;
    }

    if (!redirectionUrl.trim()) {
      message.error('Please enter a redirection URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(redirectionUrl);
    } catch (error) {
      message.error('Please enter a valid URL (e.g., https://example.com)');
=======
    
    if (!selectedDestination) {
      message.error('Please select a destination');
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      return;
    }

    try {
      setLoading(true);
<<<<<<< HEAD

      // Dynamic import of Firestore functions
      const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');

      const newImageData = {
        imageUrl: uploadedImageUrl,
        redirectionURL: redirectionUrl,
        // createdAt: serverTimestamp(), // Uncomment if you want to track creation time
=======
      
      let imageURL = '';
      if (selectedImage) {
        // Upload to storage and get URL using graphicsStorage
        imageURL = await handleImageUpload(selectedImage);
        
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
        screenName: selectedDestination,
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      };

      // Store data in the main Firebase database for homeCarousel
      const docRef = doc(db, 'sliderImages', carouselName);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const currentData = docSnapshot.data();
<<<<<<< HEAD

        // Check if currentData.images exists, if not initialize as empty array
        const currentImages = currentData.images || [];

        // Create the updated array with the new image
        const updatedArray = [...currentImages, newImageData];
=======
        const updatedArray = [...(currentData.images || []), newImageData];
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12

        await updateDoc(docRef, {
          images: updatedArray,
        });
      } else {
<<<<<<< HEAD
        // If document doesn't exist, create it with the new image as the first element in the array
=======
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        await setDoc(docRef, {
          images: [newImageData],
        });
      }

<<<<<<< HEAD
      // Success: Close modal and show notification
      message.success('Image added successfully to carousel');

      // Close the modal and reset form
      handleModalClose();

      // Refresh the data
      await fetchSliderImages();

    } catch (error) {
      console.error('Error adding image:', error);
      message.error('Failed to add image. Please try again.');
=======
      message.success('Image added successfully');
      setAddImageModalOpen(false);
      setSelectedDestination('');
      setSelectedImage(null);
      setImagePreview(null);
      fetchSliderImages();
    } catch (error) {
      console.error('Error adding image:', error);
      message.error('Failed to add image');
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (index: number) => {
    if (!firebaseInitialized) {
      message.error('Firebase is not initialized yet');
      return;
    }
<<<<<<< HEAD

    try {
      setLoading(true);

      // Dynamic import of Firestore functions
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');

=======
    
    try {
      setLoading(true);
      
      // Dynamic import of Firestore functions
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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

<<<<<<< HEAD
  // Function to handle modal close and reset all states
  const handleModalClose = () => {
    setAddImageModalOpen(false);
    setUploadedImageUrl('');
    setRedirectionUrl('');
    setFileUploading(false);
=======
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
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
      />

=======
        
      />
      
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
      <main className="min-h-[715px] lg:min-h-[580px] px-8 xl:px-[15px] pb-[30px] bg-transparent">
        <Row gutter={25} className="mb-[25px]">
          <Col xs={24}>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div className="flex-1">
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Home Carousel Images</h1>
              </div>
              <div className="flex items-center gap-2">
<<<<<<< HEAD
                <Button
=======
                <Button 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                  <th className="px-4 py-5 font-medium text-start text-light dark:text-white/60">
                    Redirection URL
                  </th>
=======
                  <th className="px-4 py-5 font-medium text-start text-light dark:text-white/60">Screen</th>
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
                            <img
                              src={item.imageUrl}
                              alt="Slider"
=======
                            <img 
                              src={item.imageUrl} 
                              alt="Slider" 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                              className="w-24 h-24 object-cover rounded cursor-pointer"
                              onClick={() => {
                                setPreviewImage(item.imageUrl);
                                setPreviewModalOpen(true);
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center text-dark dark:text-white/[.87]">
<<<<<<< HEAD
                          <a
                            href={item.redirectionURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {item.redirectionURL}
                          </a>
=======
                          {camelCaseToTitleCase(item.screenName)}
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex justify-center">
                            <Button
<<<<<<< HEAD
                              type="text"
                              icon={<DeleteOutlined />}
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteImage(page * rowsPerPage + index)}
                            >
=======
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => handleDeleteImage(index)}
                              className="flex items-center gap-1"
                            >
                              Delete
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
<<<<<<< HEAD

=======
          
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
            <Select
              value={rowsPerPage}
=======
            <Select 
              value={rowsPerPage} 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
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
<<<<<<< HEAD
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Add Image to Carousel
            </span>
          </div>
        }
        open={addImageModalOpen}
        onCancel={handleModalClose}
        width={650}
        bodyStyle={{ padding: '24px 28px' }}
        footer={[
          <Button
            key="back"
            size="large"
            onClick={handleModalClose}
            className="min-w-[100px] font-medium mb-4"
=======
        title={<h3 className="text-lg font-semibold px-1">Add Image to Carousel</h3>}
        open={addImageModalOpen}
        onCancel={() => {
          setAddImageModalOpen(false);
          setSelectedDestination('');
          setSelectedImage(null);
          setImagePreview(null);
        }}
        width={650}
        bodyStyle={{ padding: '24px 28px' }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setAddImageModalOpen(false);
              setSelectedDestination('');
              setSelectedImage(null);
              setImagePreview(null);
            }}
            className="border border-gray-200 dark:border-white/10 mx-2"
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
<<<<<<< HEAD
            className="min-w-[160px] font-medium mb-4 mr-4"
            onClick={handleAddImage}
            disabled={!uploadedImageUrl || !redirectionUrl.trim() || fileUploading}
=======
            onClick={handleAddImage}
            className="bg-primary hover:bg-primary-hbr mx-2"
            disabled={!selectedDestination || (!imagePreview && !selectedImage)}
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
          >
            Add to Carousel
          </Button>
        ]}
      >
        <div className="mt-4 px-2">
          <div className="mb-8">
<<<<<<< HEAD
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Redirection URL *</label>
            <Input
              placeholder="Enter the URL to redirect when image is clicked (e.g., https://example.com)"
              value={redirectionUrl}
              onChange={(e) => setRedirectionUrl(e.target.value)}
              size="large"
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Make sure to include http:// or https:// in the URL
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Upload Image *</label>
            <div className="text-xs text-gray-500 mb-2">
              Images will be automatically converted to WebP format and uploaded
            </div>
          </div>

          {/* Custom File Upload Section */}
          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={fileUploading}
              />
              <label
                htmlFor="file-upload"
                className={`cursor-pointer ${fileUploading ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                {fileUploading ? (
                  <div>
                    <Spin className="text-4xl mb-2" />
                    <div className="text-dark dark:text-white/[.87] mb-1">
                      Converting & Uploading...
                    </div>
                  </div>
                ) : (
                  <div>
                    <CloudUploadOutlined className="text-4xl text-gray-400 mb-2" />
                    <div className="text-dark dark:text-white/[.87] mb-1">
                      Click to select an image
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  Supports: JPG, PNG, GIF, WEBP (Max: 5MB)
                </div>
              </label>
            </div>

            {uploadedImageUrl && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-700 dark:text-green-300 font-medium">Image uploaded successfully as WebP!</span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded preview"
                    className="w-16 h-16 object-cover rounded border border-green-200"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Ready to add to carousel</span>
                </div>
              </div>
            )}
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
=======
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
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Choose Image *</label>
          </div>
          
          {imagePreview ? (
            <div className="relative mb-6 border border-gray-200 dark:border-white/10 rounded-lg p-6">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-full max-h-56 object-contain mx-auto" 
              />
              <Button
                icon={<DeleteOutlined />}
                danger
                className="absolute top-3 right-3"
                onClick={() => {
                  setImagePreview(null);
                  setSelectedImage(null);
                }}
                shape="circle"
              />
            </div>
          ) : (
            <div 
              className="w-full bg-gray-50 dark:bg-white/10 border-2 border-dashed border-gray-300 dark:border-white/30 hover:border-primary rounded-lg flex flex-col items-center justify-center p-10 cursor-pointer transition-colors duration-300 mb-6" 
              onClick={() => setUploadDialogOpen(true)}
            >
              <FileImageOutlined className="text-5xl mb-4 text-gray-400" />
              <p className="text-gray-700 dark:text-white/80 font-medium mb-2">Click to select an image</p>
              <p className="text-sm text-gray-500 dark:text-white/60">Upload a new image or choose from archive</p>
            </div>
          )}
          
          {!imagePreview && (
            <div className="text-center mb-2">
              <Button 
                type="primary" 
                ghost
                onClick={() => setUploadDialogOpen(true)}
                className="mt-3"
                icon={<CloudUploadOutlined />}
              >
                Browse Images
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Image Upload/Archive Dialog */}
      <Modal
        title={<h3 className="text-lg font-semibold px-1">Select Image Source</h3>}
        open={uploadDialogOpen}
        onCancel={() => setUploadDialogOpen(false)}
        footer={null}
        width={720}
        bodyStyle={{ padding: '16px 24px 24px' }}
      >
        <Tabs 
          defaultActiveKey={archiveOrUpload}
          onChange={(key) => setArchiveOrUpload(key as 'upload' | 'archive')}
          className="mt-2"
          items={[
            {
              key: 'upload',
              label: (
                <span className="flex items-center">
                  <CloudUploadOutlined className="mr-2" />
                  Upload New Image
                </span>
              ),
              children: (
                <div className="flex items-center justify-center bg-gray-50 dark:bg-white/10 border-2 border-dashed border-gray-300 dark:border-white/30 hover:border-primary rounded-lg p-12 cursor-pointer transition-colors duration-300 mt-4">
                  <label htmlFor="image-upload" className="cursor-pointer text-center">
                    <CloudUploadOutlined className="text-5xl mb-5 text-gray-400" />
                    <p className="text-gray-700 dark:text-white/80 font-medium mb-2">Click to upload an image</p>
                    <p className="text-sm text-gray-500 dark:text-white/60 mb-5">PNG, JPG or JPEG (max. 2MB)</p>
                    <Button type="primary" icon={<CloudUploadOutlined />} className="bg-primary hover:bg-primary-hbr">
                      Select File
                    </Button>
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
              )
            },
            {
              key: 'archive',
              label: (
                <span className="flex items-center">
                  <FileImageOutlined className="mr-2" />
                  Choose from Archive
                </span>
              ),
              children: (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-5 px-1">
                    <h4 className="text-dark dark:text-white/[.87] font-medium">Image Archive</h4>
                    <label htmlFor="archive-upload" className="cursor-pointer">
                      <Button 
                        type="primary" 
                        ghost 
                        icon={<PlusOutlined />}
                        className="flex items-center"
                      >
                        Add to Archive
                      </Button>
                      <input
                        id="archive-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageArchiveChange}
                      />
                    </label>
                  </div>
                  <div className="border border-gray-200 dark:border-white/10 rounded-md">
                    <Input
                      placeholder="Search images..."
                      prefix={<SearchOutlined className="ml-1" />}
                      className="border-0 border-b border-gray-200 dark:border-white/10 py-2 px-3"
                    />
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-5 max-h-96 overflow-y-auto">
                      {imageArchives.length > 0 ? (
                        imageArchives.map((item, index) => (
                          <div 
                            key={index}
                            className="cursor-pointer border border-gray-200 dark:border-white/10 rounded-md p-3 h-24 flex items-center justify-center hover:border-primary transition-colors duration-200"
                            onClick={() => handleSetArchiveImage(item.ImageUrl)}
                          >
                            <img 
                              src={item.ImageUrl} 
                              alt="Archive"
                              className="max-w-full max-h-20 object-contain" 
                            />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-4 py-10 text-center text-gray-500 dark:text-white/60">
                          No images in archive. Upload your first image.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            }
          ]}
        />
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
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
        />
      </Modal>
    </>
  );
}

// Wrap the component with dynamic and Protected HOCs
const DynamicGraphics = dynamic(() => Promise.resolve(Graphics), { ssr: false });
<<<<<<< HEAD
export default Protected(DynamicGraphics, ["admin"]);
=======
export default Protected(DynamicGraphics, ["admin"]); 
>>>>>>> 5681274c2906af108c3d9270f21d0e25c6c88d12
