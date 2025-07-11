import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Select, Input, message, Spin, Tabs, Space, InputNumber } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { PlusOutlined, DeleteOutlined, CloudUploadOutlined, FileImageOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import Protected from '../../../components/Protected/Protected';

// Import the main Firebase database
import { db } from '../../../authentication/firebase';
// Import the secondary Firebase storage (your updated one)
import { storage as secondaryStorage } from '../../../lib/firebase-secondary';
import { convertImageToWebP } from '../../../components/imageConverter';

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
  redirectionURL?: string; // Optional link for when image is clicked
  position: number;
}

function Advertisement() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SliderImage[]>([]);
  const [addImageModalOpen, setAddImageModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageArchives, setImageArchives] = useState<ArchiveImage[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [redirectionURL, setRedirectionURL] = useState<string>('');
  const [position, setPosition] = useState<number>(1);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [firebaseInitialized, setFirebaseInitialized] = useState(true);
  const [fileUploading, setFileUploading] = useState(false);
  
  // Set preferences modal states
  const [preferencesModalOpen, setPreferencesModalOpen] = useState(false);
  const [editableImages, setEditableImages] = useState<SliderImage[]>([]);
  const [preferencesLoading, setPreferencesLoading] = useState(false);

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

  // Advertisement subcollection constant
  const advertisementCollection = 'advertisement';

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
      // Use the main Firebase database with advertisement document
      const docRef = doc(db, 'sliderImages', 'advertisement');
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const advertisementData = docSnapshot.data();
        const images = advertisementData.images || [];
        
        // Migrate old data format to new format
        const migratedImages = images.map((image: any) => {
          // If image has old enquireNowURL field, remove it
          if (image.enquireNowURL) {
            const { enquireNowURL, ...imageWithoutEnquireNow } = image;
            return imageWithoutEnquireNow;
          }
          if (image.enquireNowLink) {
            const { enquireNowLink, ...imageWithoutEnquireNow } = image;
            return imageWithoutEnquireNow;
          }
          if (image.imageLink && !image.redirectionURL) {
            return {
              ...image,
              redirectionURL: image.imageLink,
            };
          }
          return image;
        });
        
        // Sort images by position (ascending order)
        const sortedImages = migratedImages.sort((a: SliderImage, b: SliderImage) => {
          const posA = a.position || 999; // Default high position for items without position
          const posB = b.position || 999;
          return posA - posB;
        });
        
        setData(sortedImages);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching advertisement images:', error);
      message.error('Failed to load advertisement images');
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
      const { collection, addDoc } = await import('firebase/firestore');

      // Add to archive collection in the main database
      const archiveRef = collection(db, 'archive');
      await addDoc(archiveRef, {
        ImageUrl: imageUrl,
      });

      fetchArchiveImages();
      return imageUrl;
    } catch (error) {
      console.error('Error adding URL to archive:', error);
      throw error;
    }
  };

  // Get next available position
  const getNextAvailablePosition = () => {
    if (data.length === 0) return 1;
    const maxPosition = Math.max(...data.map(item => item.position || 0));
    return maxPosition + 1;
  };

  // Check if position is already taken
  const isPositionTaken = (pos: number) => {
    return data.some(item => item.position === pos);
  };

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
    }
  };

  const handleAddImage = async () => {
    if (!firebaseInitialized) {
      message.error('Firebase is not initialized yet');
      return;
    }
  
    if (!uploadedImageUrl) {
      message.error('Please upload an image first');
      return;
    }
  
    if (!position || position < 1) {
      message.error('Please enter a valid position (minimum 1)');
      return;
    }

    // Basic URL validation for Redirection URL (if provided)
    if (redirectionURL.trim()) {
      try {
        new URL(redirectionURL);
      } catch (error) {
        message.error('Please enter a valid Redirection URL (e.g., https://example.com)');
        return;
      }
    }
  
    try {
      setLoading(true);
  
      // Dynamic import of Firestore functions
      const { doc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');
  
      // Store data in the advertisement document
      const docRef = doc(db, 'sliderImages', 'advertisement');
      const docSnapshot = await getDoc(docRef);
  
      let finalImages: SliderImage[] = [];
      let wasPositionTaken = false;
  
      if (docSnapshot.exists()) {
        const currentData = docSnapshot.data();
        const currentImages = currentData.images || [];
  
        // Check if position is already taken
        wasPositionTaken = currentImages.some((img: SliderImage) => img.position === position);
  
        // If position is already taken, shift existing images' positions
        const updatedImages = currentImages.map((image: SliderImage) => {
          // If the image's position is >= the new position, increment its position
          if (image.position && image.position >= position) {
            return {
              ...image,
              position: image.position + 1
            };
          }
          return image;
        });
  
        // Create the new image data
        const newImageData: SliderImage = {
          imageUrl: uploadedImageUrl,
          position: position,
          ...(redirectionURL.trim() && { redirectionURL: redirectionURL.trim() }),
        };
  
        // Add the new image with the desired position
        finalImages = [...updatedImages, newImageData];
  
        await updateDoc(docRef, {
          images: finalImages,
        });
      } else {
        // If document doesn't exist, create it with the new image
        const newImageData: SliderImage = {
          imageUrl: uploadedImageUrl,
          position: position,
          ...(redirectionURL.trim() && { redirectionURL: redirectionURL.trim() }),
        };
  
        finalImages = [newImageData];
  
        await setDoc(docRef, {
          images: finalImages,
        });
      }
  
      // Success message
      if (wasPositionTaken) {
        message.success(`Advertisement image added at position ${position}. Other images have been shifted accordingly.`);
      } else {
        message.success(`Advertisement image added successfully at position ${position}`);
      }
  
      // Close the modal and reset form
      handleModalClose();
  
      // Refresh the data
      await fetchSliderImages();
  
    } catch (error) {
      console.error('Error adding advertisement image:', error);
      message.error('Failed to add advertisement image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageToDelete: SliderImage) => {
    if (!firebaseInitialized) {
      message.error('Firebase is not initialized yet');
      return;
    }

    try {
      setLoading(true);

      // Dynamic import of Firestore functions
      const { doc, getDoc, updateDoc } = await import('firebase/firestore');

      // Use the advertisement document
      const docRef = doc(db, 'sliderImages', 'advertisement');
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const currentData = docSnapshot.data();
        const currentImages = currentData.images || [];
        
        // Remove the image from the array
        const updatedImages = currentImages.filter(
          (item: SliderImage) => !(item.imageUrl === imageToDelete.imageUrl && item.position === imageToDelete.position)
        );

        await updateDoc(docRef, {
          images: updatedImages,
        });

        message.success('Advertisement image deleted successfully');
        
        // Refresh the data to get updated sorted list
        await fetchSliderImages();
      } else {
        message.error('Advertisement document does not exist');
      }
    } catch (error) {
      console.error('Error deleting advertisement image:', error);
      message.error('Failed to delete advertisement image');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle modal close and reset all states
  const handleModalClose = () => {
    setAddImageModalOpen(false);
    setUploadedImageUrl('');
    setRedirectionURL('');
    setPosition(getNextAvailablePosition());
    setFileUploading(false);
  };

  // Function to open modal and set default position
  const handleOpenModal = () => {
    setPosition(getNextAvailablePosition());
    setAddImageModalOpen(true);
  };

  // Function to open preferences modal
  const handleOpenPreferencesModal = () => {
    setEditableImages([...data]); // Create a copy of current data
    setPreferencesModalOpen(true);
  };

  // Function to handle position change in preferences modal
  const handlePositionChange = (imageIndex: number, newPosition: number) => {
    const updatedImages = [...editableImages];
    updatedImages[imageIndex] = {
      ...updatedImages[imageIndex],
      position: newPosition
    };
    setEditableImages(updatedImages);
  };

  // Function to save all preferences
  const handleSavePreferences = async () => {
    if (!firebaseInitialized) {
      message.error('Firebase is not initialized yet');
      return;
    }

    // Validate that all positions are unique and valid
    const positions = editableImages.map(img => img.position);
    const uniquePositions = new Set(positions);
    
    if (uniquePositions.size !== positions.length) {
      message.error('All positions must be unique');
      return;
    }

    if (positions.some(pos => !pos || pos < 1)) {
      message.error('All positions must be valid numbers (minimum 1)');
      return;
    }

    try {
      setPreferencesLoading(true);

      // Dynamic import of Firestore functions
      const { doc, updateDoc } = await import('firebase/firestore');

      // Use the advertisement document
      const docRef = doc(db, 'sliderImages', 'advertisement');

      // Sort images by position to ensure correct order
      const sortedImages = editableImages.sort((a: SliderImage, b: SliderImage) => {
        const posA = a.position || 999;
        const posB = b.position || 999;
        return posA - posB;
      });

      await updateDoc(docRef, {
        images: sortedImages,
      });

      message.success('Advertisement positions updated successfully');
      
      // Close modal and refresh data
      setPreferencesModalOpen(false);
      await fetchSliderImages();
    } catch (error) {
      console.error('Error updating advertisement preferences:', error);
      message.error('Failed to update positions');
    } finally {
      setPreferencesLoading(false);
    }
  };

  // Function to close preferences modal
  const handleClosePreferencesModal = () => {
    setPreferencesModalOpen(false);
    setEditableImages([]);
    setPreferencesLoading(false);
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
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Advertisement Images</h1>
                <p className="text-sm text-gray-500 mt-1">Images are displayed in order by position. Use "Set Preferences" to reorder all advertisement items at once.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenModal}
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                >
                  Add Advertisement
                </Button>
                <Button
                  type="default"
                  icon={<EditOutlined />}
                  onClick={handleOpenPreferencesModal}
                  className="h-10 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 inline-flex items-center justify-center rounded-[4px] px-[20px] text-gray-700 dark:text-white/[.87]"
                  disabled={data.length === 0}
                >
                  Set Preferences
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
                  <th className="px-4 py-5 font-medium text-center text-light dark:text-white/60">Position</th>
                  <th className="px-4 py-5 font-medium text-center text-light dark:text-white/60">Image</th>
                  <th className="px-4 py-5 font-medium text-left text-light dark:text-white/60">
                    Redirection URL
                  </th>
                  <th className="px-4 py-5 font-medium text-center text-light dark:text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5">
                      <Spin />
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5 text-light dark:text-white/60">
                      No advertisement images found
                    </td>
                  </tr>
                ) : (
                  data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item, index) => (
                      <tr key={`${item.position}-${index}`} className="border-b border-gray-200 dark:border-white/10 last:border-0">
                        <td className="px-4 py-5 text-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full font-semibold">
                            {item.position || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className="flex justify-center">
                            <img
                              src={item.imageUrl}
                              alt="Advertisement"
                              className="w-24 h-24 object-cover rounded cursor-pointer"
                              onClick={() => {
                                setPreviewImage(item.imageUrl);
                                setPreviewModalOpen(true);
                              }}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-5 text-left">
                          <div className="space-y-2">
                            {item.redirectionURL && (
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Redirection URL:</div>
                                <a
                                  href={item.redirectionURL}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline break-words max-w-xs inline-block text-sm"
                                >
                                  {item.redirectionURL}
                                </a>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className="flex justify-center">
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteImage(item)}
                              title="Delete Advertisement"
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

      {/* Add Advertisement Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Add Advertisement Image
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
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            className="min-w-[160px] font-medium mb-4 mr-4"
            onClick={handleAddImage}
            disabled={!uploadedImageUrl || !position || fileUploading}
          >
            Add Advertisement
          </Button>
        ]}
      >
        <div className="mt-4 px-2">
          <div className="mb-8">
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Position *</label>
            <InputNumber
              min={1}
              max={999}
              value={position}
              onChange={(value) => setPosition(value || 1)}
              size="large"
              className="w-full"
              placeholder="Enter position (1, 2, 3...)"
            />
            <div className="text-xs text-gray-500 mt-1">
              {isPositionTaken(position) && position ? (
                <span className="text-amber-600">ℹ️ Position {position} is taken. Existing advertisements will shift down automatically.</span>
              ) : (
                `Position determines the display order (lower numbers appear first). Next available: ${getNextAvailablePosition()}`
              )}
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Redirection URL (Optional)</label>
            <Input
              placeholder="Enter the URL to redirect when image is clicked (e.g., https://example.com)"
              value={redirectionURL}
              onChange={(e) => setRedirectionURL(e.target.value)}
              size="large"
              className="w-full"
            />
            <div className="text-xs text-gray-500 mt-1">
              Optional: Make sure to include http:// or https:// in the URL
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Upload Advertisement Image *</label>
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
                      Click to select an advertisement image
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
                  <span className="text-green-700 dark:text-green-300 font-medium">Advertisement image uploaded successfully as WebP!</span>
                </div>
                <div className="flex items-center gap-3">
                  <img
                    src={uploadedImageUrl}
                    alt="Uploaded preview"
                    className="w-16 h-16 object-cover rounded border border-green-200"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Ready to add to advertisements</span>
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
        />
      </Modal>

      {/* Set Preferences Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Set Advertisement Preferences
            </span>
          </div>
        }
        open={preferencesModalOpen}
        onCancel={handleClosePreferencesModal}
        width={800}
        bodyStyle={{ padding: '24px 28px' }}
        footer={[
          <Button
            key="back"
            size="large"
            onClick={handleClosePreferencesModal}
            className="min-w-[100px] font-medium mb-4"
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={preferencesLoading}
            className="min-w-[160px] font-medium mb-4 mr-4"
            onClick={handleSavePreferences}
          >
            Save Preferences
          </Button>
        ]}
      >
        <div className="mt-4 px-2">
          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Reorder your advertisement images by changing their positions. Lower numbers appear first in the carousel.
            </p>
          </div>

          <div className="space-y-4">
            {editableImages.map((image, index) => (
              <div key={`${image.imageUrl}-${index}`} className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex-shrink-0">
                  <img
                    src={image.imageUrl}
                    alt="Advertisement"
                    className="w-20 h-20 object-cover rounded border"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="space-y-2">
                    {image.redirectionURL && (
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          Redirection URL:
                        </div>
                        <div className="text-xs text-gray-500 break-all mb-2">
                          {image.redirectionURL}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <label className="block text-sm font-medium text-dark dark:text-white/[.87] mb-2">
                    Position
                  </label>
                  <InputNumber
                    min={1}
                    max={editableImages.length}
                    value={image.position}
                    onChange={(value) => handlePositionChange(index, value || 1)}
                    size="large"
                    className="w-20"
                  />
                </div>
              </div>
            ))}
          </div>

          {editableImages.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-blue-700 dark:text-blue-300 font-medium">Quick Tips:</span>
              </div>
              <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                <li>• Position 1 appears first in the advertisement carousel</li>
                <li>• Each position number must be unique</li>
                <li>• Advertisements will be automatically sorted by position</li>
              </ul>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

// Wrap the component with dynamic and Protected HOCs
const DynamicAdvertisement = dynamic(() => Promise.resolve(Advertisement), { ssr: false });
export default Protected(DynamicAdvertisement, ["admin", "tours+media"]); 