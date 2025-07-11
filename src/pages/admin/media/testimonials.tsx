import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Button, Modal, Input, message, Spin, Rate, Select, Space, Tag, Upload, Dropdown } from 'antd';
import { PageHeaders } from '../../../components/page-headers/index';
import { PlusOutlined, DeleteOutlined, EditOutlined, EyeOutlined, UploadOutlined, LinkOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import Protected from '../../../components/Protected/Protected';

// Import the main Firebase database
import { db } from '../../../authentication/firebase';
// Import the secondary Firebase storage
import { storage as secondaryStorage } from '../../../lib/firebase-secondary';
// Import image converter
import { convertImageToWebP } from '../../../components/imageConverter';

import type {
  DocumentData,
  DocumentReference,
  CollectionReference
} from 'firebase/firestore';
import type { RcFile } from 'antd/es/upload';

const { Option } = Select;
const { TextArea } = Input;

interface Testimonial {
  id: string;
  name: string;
  designation: string;
  profileURL: string;
  review: string;
  stars: string;
  status: 'active' | 'inactive';
  createdAt: any;
  updatedAt: any;
}

function Testimonials() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Testimonial[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [firebaseInitialized, setFirebaseInitialized] = useState(true);
  
  // Form states
  const [name, setName] = useState<string>('');
  const [designation, setDesignation] = useState<string>('');
  const [profileURL, setProfileURL] = useState<string>('');
  const [review, setReview] = useState<string>('');
  const [stars, setStars] = useState<number>(5);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  
  // Image upload states
  const [imageUploadLoading, setImageUploadLoading] = useState<boolean>(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');

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

  useEffect(() => {
    if (firebaseInitialized) {
      fetchTestimonials();
    }
  }, [firebaseInitialized]);

  const fetchTestimonials = async () => {
    if (!firebaseInitialized) return;

    setLoading(true);
    try {
      // Dynamic import of Firestore functions
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
      
      // Use the testimonials collection
      const testimonialsRef = collection(db, 'testimonials');
      const q = query(testimonialsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const testimonialsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Testimonial[];
      
      setData(testimonialsData);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      message.error('Failed to load testimonials');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTestimonial = async () => {
    if (!firebaseInitialized) {
      message.error('Firebase is not initialized yet');
      return;
    }
  
    if (!name.trim()) {
      message.error('Please enter a name');
      return;
    }

    if (!designation.trim()) {
      message.error('Please enter a designation');
      return;
    }

    if (!review.trim()) {
      message.error('Please enter a review');
      return;
    }

    if (!profileURL.trim()) {
      message.error('Please enter a profile URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(profileURL);
    } catch (error) {
      message.error('Please enter a valid profile URL (e.g., https://example.com)');
      return;
    }
  
    try {
      setLoading(true);
  
      // Dynamic import of Firestore functions
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
  
      // Add to testimonials collection
      const testimonialsRef = collection(db, 'testimonials');
      await addDoc(testimonialsRef, {
        name: name.trim(),
        designation: designation.trim(),
        profileURL: profileURL.trim(),
        review: review.trim(),
        stars: stars.toString(),
        status: status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
  
      message.success('Testimonial added successfully');
      
      // Close the modal and reset form
      handleModalClose();
  
      // Refresh the data
      await fetchTestimonials();
  
    } catch (error) {
      console.error('Error adding testimonial:', error);
      message.error('Failed to add testimonial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditTestimonial = async () => {
    if (!firebaseInitialized || !selectedTestimonial) {
      message.error('Firebase is not initialized yet');
      return;
    }
  
    if (!name.trim()) {
      message.error('Please enter a name');
      return;
    }

    if (!designation.trim()) {
      message.error('Please enter a designation');
      return;
    }

    if (!review.trim()) {
      message.error('Please enter a review');
      return;
    }

    if (!profileURL.trim()) {
      message.error('Please enter a profile URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(profileURL);
    } catch (error) {
      message.error('Please enter a valid profile URL (e.g., https://example.com)');
      return;
    }
  
    try {
      setLoading(true);
  
      // Dynamic import of Firestore functions
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
  
      // Update testimonial
      const testimonialRef = doc(db, 'testimonials', selectedTestimonial.id);
      await updateDoc(testimonialRef, {
        name: name.trim(),
        designation: designation.trim(),
        profileURL: profileURL.trim(),
        review: review.trim(),
        stars: stars.toString(),
        status: status,
        updatedAt: serverTimestamp(),
      });
  
      message.success('Testimonial updated successfully');
      
      // Close the modal and reset form
      handleEditModalClose();
  
      // Refresh the data
      await fetchTestimonials();
  
    } catch (error) {
      console.error('Error updating testimonial:', error);
      message.error('Failed to update testimonial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTestimonial = async (testimonialToDelete: Testimonial) => {
    if (!firebaseInitialized) {
      message.error('Firebase is not initialized yet');
      return;
    }

    try {
      setLoading(true);

      // Dynamic import of Firestore functions
      const { doc, deleteDoc } = await import('firebase/firestore');

      // Delete testimonial
      const testimonialRef = doc(db, 'testimonials', testimonialToDelete.id);
      await deleteDoc(testimonialRef);

      message.success('Testimonial deleted successfully');
      
      // Refresh the data
      await fetchTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      message.error('Failed to delete testimonial');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle modal close and reset all states
  const handleModalClose = () => {
    setAddModalOpen(false);
    setName('');
    setDesignation('');
    setProfileURL('');
    setReview('');
    setStars(5);
    setStatus('active');
    setProfileImagePreview('');
  };

  // Function to handle edit modal close and reset all states
  const handleEditModalClose = () => {
    setEditModalOpen(false);
    setSelectedTestimonial(null);
    setName('');
    setDesignation('');
    setProfileURL('');
    setReview('');
    setStars(5);
    setStatus('active');
    setProfileImagePreview('');
  };

  // Function to open edit modal and populate form
  const handleOpenEditModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setName(testimonial.name);
    setDesignation(testimonial.designation);
    setProfileURL(testimonial.profileURL);
    setReview(testimonial.review);
    setStars(parseFloat(testimonial.stars));
    setStatus(testimonial.status);
    setProfileImagePreview(testimonial.profileURL);
    setEditModalOpen(true);
  };

  // Function to open view modal
  const handleOpenViewModal = (testimonial: Testimonial) => {
    setSelectedTestimonial(testimonial);
    setViewModalOpen(true);
  };

  // Function to open add modal
  const handleOpenAddModal = () => {
    setAddModalOpen(true);
  };

  // Image upload and conversion functions
  const handleImageUpload = async (file: RcFile) => {
    setImageUploadLoading(true);
    try {
      // Dynamic import of Firebase storage functions
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      
      // Convert image to WebP
      const webpFile = await convertImageToWebP(file);
      
      // Create a unique filename for the testimonial profile
      const fileName = `TESTIMONIAL_${Date.now()}_${webpFile.name}`;
      const storageRef = ref(secondaryStorage, `prathaviTravelsMedia/${fileName}`);
      
      // Upload the WebP file to Firebase Storage
      await uploadBytes(storageRef, webpFile);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Set the profile URL and preview
      setProfileURL(downloadURL);
      setProfileImagePreview(downloadURL);
      
      message.success('Profile image uploaded and converted to WebP successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Failed to upload image. Please try again.');
    } finally {
      setImageUploadLoading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file: RcFile) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return Upload.LIST_IGNORE;
      }
      
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('Image must be smaller than 2MB!');
        return Upload.LIST_IGNORE;
      }
      
      handleImageUpload(file);
      return false;
    },
    showUploadList: false,
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
                <h1 className="text-[24px] font-medium text-dark dark:text-white/[.87]">Testimonials</h1>
                <p className="text-sm text-gray-500 mt-1">Manage customer testimonials and reviews</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleOpenAddModal}
                  className="h-10 bg-primary hover:bg-primary-hbr inline-flex items-center justify-center rounded-[4px] px-[20px] text-white dark:text-white/[.87]"
                >
                  Add Testimonial
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
                  <th className="px-4 py-5 font-medium text-left text-light dark:text-white/60">Name</th>
                  <th className="px-4 py-5 font-medium text-left text-light dark:text-white/60">Designation</th>
                  <th className="px-4 py-5 font-medium text-center text-light dark:text-white/60">Stars</th>
                  <th className="px-4 py-5 font-medium text-center text-light dark:text-white/60">Status</th>
                  <th className="px-4 py-5 font-medium text-center text-light dark:text-white/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5">
                      <Spin />
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-light dark:text-white/60">
                      No testimonials found
                    </td>
                  </tr>
                ) : (
                  data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((item, index) => (
                      <tr key={`${item.id}-${index}`} className="border-b border-gray-200 dark:border-white/10 last:border-0">
                        <td className="px-4 py-5 text-left">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.profileURL}
                              alt={item.name}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/img/avatar/default-avatar.png';
                              }}
                            />
                            <div>
                              <div className="font-medium text-dark dark:text-white/[.87]">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.designation}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-5 text-left">
                          <span className="text-gray-600 dark:text-gray-300">{item.designation}</span>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <Rate disabled allowHalf defaultValue={parseFloat(item.stars)} className="text-sm" />
                          <div className="text-xs text-gray-500 mt-1">{item.stars} stars</div>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <Tag color={item.status === 'active' ? 'green' : 'red'}>
                            {item.status === 'active' ? 'Active' : 'Inactive'}
                          </Tag>
                        </td>
                        <td className="px-4 py-5 text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              type="text"
                              icon={<EyeOutlined />}
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handleOpenViewModal(item)}
                              title="View Testimonial"
                            />
                            <Button
                              type="text"
                              icon={<EditOutlined />}
                              className="text-green-600 hover:text-green-800"
                              onClick={() => handleOpenEditModal(item)}
                              title="Edit Testimonial"
                            />
                            <Button
                              type="text"
                              icon={<DeleteOutlined />}
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteTestimonial(item)}
                              title="Delete Testimonial"
                            />
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

      {/* Add Testimonial Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Add Testimonial
            </span>
          </div>
        }
        open={addModalOpen}
        onCancel={handleModalClose}
        width={600}
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
            onClick={handleAddTestimonial}
            disabled={!name.trim() || !designation.trim() || !review.trim() || !profileURL.trim()}
          >
            Add Testimonial
          </Button>
        ]}
      >
        <div className="mt-4 px-2 space-y-6">
          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Name *</label>
            <Input
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="large"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Designation *</label>
            <Input
              placeholder="Enter designation (e.g., Family Traveller)"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              size="large"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Profile Image *</label>
            
            {/* Profile Image Preview */}
            {profileImagePreview && (
              <div className="mb-3 flex items-center gap-3">
                <img
                  src={profileImagePreview}
                  alt="Profile preview"
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/img/avatar/default-avatar.png';
                  }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {profileImagePreview.includes('TESTIMONIAL_') ? 'Uploaded Image' : 'External URL'}
                </span>
              </div>
            )}
            
            {/* Upload Button */}
            <div className="flex items-center">
              <Upload {...uploadProps}>
                <Button
                  icon={<UploadOutlined />}
                  loading={imageUploadLoading}
                  className="flex items-center gap-2"
                >
                  Upload Image (WebP)
                </Button>
              </Upload>
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              Uploaded images will be automatically converted to WebP format and stored in the media section
            </div>
          </div>

          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Review *</label>
            <TextArea
              placeholder="Enter customer review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Rating *</label>
            <div className="flex items-center gap-4 mb-2">
              <Rate
                value={stars}
                onChange={setStars}
                className="text-2xl"
                allowHalf
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">or enter:</span>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  value={stars}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 5) {
                      setStars(value);
                    }
                  }}
                  className="w-20"
                  placeholder="0-5"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stars} out of 5 stars
            </div>
          </div>

          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Status *</label>
            <Select
              value={status}
              onChange={setStatus}
              size="large"
              className="w-full"
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Edit Testimonial Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              Edit Testimonial
            </span>
          </div>
        }
        open={editModalOpen}
        onCancel={handleEditModalClose}
        width={600}
        bodyStyle={{ padding: '24px 28px' }}
        footer={[
          <Button
            key="back"
            size="large"
            onClick={handleEditModalClose}
            className="min-w-[100px] font-medium mb-4"
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            className="min-w-[160px] font-medium mb-4 mr-4"
            onClick={handleEditTestimonial}
            disabled={!name.trim() || !designation.trim() || !review.trim() || !profileURL.trim()}
          >
            Update Testimonial
          </Button>
        ]}
      >
        <div className="mt-4 px-2 space-y-6">
          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Name *</label>
            <Input
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="large"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Designation *</label>
            <Input
              placeholder="Enter designation (e.g., Family Traveller)"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              size="large"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Profile Image *</label>
            
            {/* Profile Image Preview */}
            {profileImagePreview && (
              <div className="mb-3 flex items-center gap-3">
                <img
                  src={profileImagePreview}
                  alt="Profile preview"
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/img/avatar/default-avatar.png';
                  }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {profileImagePreview.includes('TESTIMONIAL_') ? 'Uploaded Image' : 'External URL'}
                </span>
              </div>
            )}
            
            {/* Upload Button */}
            <div className="flex items-center">
              <Upload {...uploadProps}>
                <Button
                  icon={<UploadOutlined />}
                  loading={imageUploadLoading}
                  className="flex items-center gap-2"
                >
                  Upload Image (WebP)
                </Button>
              </Upload>
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              Uploaded images will be automatically converted to WebP format and stored in the media section
            </div>
          </div>

          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Review *</label>
            <TextArea
              placeholder="Enter customer review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              rows={4}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Rating *</label>
            <div className="flex items-center gap-4 mb-2">
              <Rate
                value={stars}
                onChange={setStars}
                className="text-2xl"
                allowHalf
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">or enter:</span>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  value={stars}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0 && value <= 5) {
                      setStars(value);
                    }
                  }}
                  className="w-20"
                  placeholder="0-5"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {stars} out of 5 stars
            </div>
          </div>

          <div>
            <label className="block text-dark dark:text-white/[.87] font-medium mb-3">Status *</label>
            <Select
              value={status}
              onChange={setStatus}
              size="large"
              className="w-full"
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* View Testimonial Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <span className="text-xl font-semibold text-dark dark:text-white/[.87]">
              View Testimonial
            </span>
          </div>
        }
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        width={600}
        bodyStyle={{ padding: '24px 28px' }}
        footer={[
          <Button
            key="close"
            size="large"
            onClick={() => setViewModalOpen(false)}
            className="min-w-[100px] font-medium mb-4"
          >
            Close
          </Button>
        ]}
      >
        {selectedTestimonial && (
          <div className="mt-4 px-2 space-y-6">
            <div className="flex items-center gap-4">
              <img
                src={selectedTestimonial.profileURL}
                alt={selectedTestimonial.name}
                className="w-16 h-16 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/img/avatar/default-avatar.png';
                }}
              />
              <div>
                <h3 className="text-lg font-semibold text-dark dark:text-white/[.87]">
                  {selectedTestimonial.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {selectedTestimonial.designation}
                </p>
                <Rate disabled defaultValue={parseFloat(selectedTestimonial.stars)} className="text-sm" />
                <span className="text-xs text-gray-500 ml-2">{selectedTestimonial.stars} stars</span>
              </div>
            </div>

            <div>
              <label className="block text-dark dark:text-white/[.87] font-medium mb-2">Review</label>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300">{selectedTestimonial.review}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-dark dark:text-white/[.87] font-medium mb-2">Status</label>
                <Tag color={selectedTestimonial.status === 'active' ? 'green' : 'red'}>
                  {selectedTestimonial.status === 'active' ? 'Active' : 'Inactive'}
                </Tag>
              </div>
              <div>
                <label className="block text-dark dark:text-white/[.87] font-medium mb-2">Profile URL</label>
                <a
                  href={selectedTestimonial.profileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline text-sm break-all"
                >
                  {selectedTestimonial.profileURL}
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-dark dark:text-white/[.87] font-medium mb-2">Created At</label>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {selectedTestimonial.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-dark dark:text-white/[.87] font-medium mb-2">Updated At</label>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {selectedTestimonial.updatedAt?.toDate?.()?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// Wrap the component with dynamic and Protected HOCs
const DynamicTestimonials = dynamic(() => Promise.resolve(Testimonials), { ssr: false });
export default Protected(DynamicTestimonials, ["admin", "tours+media"]); 