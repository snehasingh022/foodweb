import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Select, Input, message, Spin, Tabs, Space } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { PlusOutlined, DeleteOutlined, CloudUploadOutlined, FileImageOutlined, SearchOutlined } from '@ant-design/icons';
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
  redirectionURL: string;
  createdAt?: any;
}

function Graphics() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SliderImage[]>([]);
  const [addImageModalOpen, setAddImageModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageArchives, setImageArchives] = useState<ArchiveImage[]>([]);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [redirectionUrl, setRedirectionUrl] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [firebaseInitialized, setFirebaseInitialized] = useState(true);
  const [fileUploading, setFileUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      setSelectedFile(file);
      setUploadedImageUrl(''); // Clear previous upload
    }
  };

  // Handle image upload with WebP conversion
  const handleImageUpload = async () => {
    if (!selectedFile) {
      message.error('Please select an image first');
      return;
    }

    setFileUploading(true);

    try {
      // Convert image to WebP
      message.info('Converting image to WebP format...');
      const webpFile = await convertImageToWebP(selectedFile);

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

    if (!redirectionUrl.trim()) {
      message.error('Please enter a redirection URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(redirectionUrl);
    } catch (error) {
      message.error('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    try {
      setLoading(true);

      // Dynamic import of Firestore functions
      const { doc, getDoc, setDoc, updateDoc, serverTimestamp } = await import('firebase/firestore');

      const newImageData = {
        imageUrl: uploadedImageUrl,
        redirectionURL: redirectionUrl,
        // createdAt: serverTimestamp(), // Uncomment if you want to track creation time
      };

      // Store data in the main Firebase database for homeCarousel
      const docRef = doc(db, 'sliderImages', carouselName);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const currentData = docSnapshot.data();

        // Check if currentData.images exists, if not initialize as empty array
        const currentImages = currentData.images || [];

        // Create the updated array with the new image
        const updatedArray = [...currentImages, newImageData];

        await updateDoc(docRef, {
          images: updatedArray,
        });
      } else {
        // If document doesn't exist, create it with the new image as the first element in the array
        await setDoc(docRef, {
          images: [newImageData],
        });
      }

      // Success: Close modal and show notification
      message.success('Image added successfully to carousel');

      // Close the modal and reset form
      handleModalClose();

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

  // Function to handle modal close and reset all states
  const handleModalClose = () => {
    setAddImageModalOpen(false);
    setUploadedImageUrl('');
    setRedirectionUrl('');
    setFileUploading(false);
    setSelectedFile(null);
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
                  <th className="px-4 py-5 font-medium text-start text-light dark:text-white/60">
                    Redirection URL
                  </th>
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
                          <a
                            href={item.redirectionURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline break-all"
                          >
                            {item.redirectionURL}
                          </a>
                        </td>
                        <td className="px-4 py-5">
                          <div className="flex justify-center">
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteImage(page * rowsPerPage + index)}
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
            disabled={!uploadedImageUrl || !redirectionUrl.trim() || fileUploading}
          >
            Add to Carousel
          </Button>
        ]}
      >
        <div className="mt-4 px-2">
          <div className="mb-8">
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
              Images will be automatically converted to WebP format for better performance
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
                <CloudUploadOutlined className="text-4xl text-gray-400 mb-2" />
                <div className="text-dark dark:text-white/[.87] mb-1">
                  {selectedFile ? selectedFile.name : 'Click to select an image'}
                </div>
                <div className="text-xs text-gray-500">
                  Supports: JPG, PNG, GIF, WEBP (Max: 5MB)
                </div>
              </label>
            </div>

            {selectedFile && !uploadedImageUrl && (
              <div className="mt-4 flex justify-center">
                <Button
                  type="primary"
                  loading={fileUploading}
                  onClick={handleImageUpload}
                  icon={<CloudUploadOutlined />}
                  disabled={fileUploading}
                >
                  {fileUploading ? 'Converting & Uploading...' : 'Upload Image'}
                </Button>
              </div>
            )}

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
        />
      </Modal>
    </>
  );
}

// Wrap the component with dynamic and Protected HOCs
const DynamicGraphics = dynamic(() => Promise.resolve(Graphics), { ssr: false });
export default Protected(DynamicGraphics, ["admin"]);