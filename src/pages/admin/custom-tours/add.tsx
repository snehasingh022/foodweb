import { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Input,
    Button,
    Form,
    Select,
    Upload,
    message,
    Space,
    Modal,
    Image,
    InputNumber,
    Tabs,
    Divider
} from 'antd';
import {
    UploadOutlined,
    ArrowLeftOutlined,
    DeleteOutlined,
    PlusOutlined,
    PictureOutlined,
    FileImageOutlined,
    CloudUploadOutlined,
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import { collection, getDocs, addDoc, doc, setDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, listAll } from 'firebase/storage';
import Protected from '../../../components/Protected/Protected';
import { storage } from '@/lib/firebase-secondary';
import { useRouter } from 'next/router';
import { convertImageToWebP } from '@/components/imageConverter';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

function AddCustomTour() {
    const router = useRouter();
    const [form] = Form.useForm();

    // State variables
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [imageLoading, setImageLoading] = useState(false);
    const [archiveImages, setArchiveImages] = useState<{ name: string; url: string; id: string; createdAt: any }[]>([]);

    // Modal states
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('upload');
    const [archiveOrUpload, setArchiveOrUpload] = useState<'upload' | 'archive'>('upload');


    const PageRoutes = [
        {
            path: '/admin',
            breadcrumbName: 'Dashboard',
        },
        {
            path: '/admin/custom-tours',
            breadcrumbName: 'Custom Tours',
        },
        {
            path: '',
            breadcrumbName: 'Add Custom Tour',
        },
    ];

    useEffect(() => {
        if (typeof window !== "undefined") {
            fetchArchiveImages();
        }
    }, []);

    // Fetch images from media collection in Firestore
    const fetchArchiveImages = async () => {
        try {
            const mediaQuery = query(
                collection(db, "media"),
                orderBy("createdAt", "desc")
            );
            const querySnapshot = await getDocs(mediaQuery);

            const images: {
                id: string;
                name: string;
                url: string;
                createdAt: any; // Replace with `Timestamp` if needed
            }[] = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                images.push({
                    id: doc.id,
                    name: data.name,
                    url: data.image,
                    createdAt: data.createdAt
                });
            });

            setArchiveImages(images);
        } catch (error) {
            console.error("Error fetching archive images:", error);
            message.error("Failed to fetch archive images");
        }
    };

    const handleImageUpload = async (file: File) => {
        setImageLoading(true);
        try {
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }

            const webpFile = await convertImageToWebP(file);
            const storageRef = ref(storage, `prathviTravelsMedia/media/${webpFile.name}`);
            await uploadBytes(storageRef, webpFile);
            const downloadURL = await getDownloadURL(storageRef);

            // Generate media ID
            const mediaId = `MID${Date.now()}`;

            // Save to media collection in Firestore
            await setDoc(doc(db, "media", mediaId), {
                name: webpFile.name,
                image: downloadURL,
                createdAt: serverTimestamp(),
            });
            setImageUrls([downloadURL]);


            message.success("Image uploaded successfully!");

        } catch (error) {
            console.error("Error uploading image:", error);
            message.error("Failed to upload image");
        } finally {
            setImageLoading(false);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImageUrls(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleAddFromArchive = (imageUrl: string) => {
        if (!imageUrls.includes(imageUrl)) {
            setImageUrls(prev => [...prev, imageUrl]);
            message.success("Image added from archive!");
        } else {
            message.warning("Image already selected!");
        }
    };

    const handleSubmit = async (values: any) => {
        if (typeof window === "undefined") return;

        if (imageUrls.length === 0) {
            message.error("Please add at least one image");
            return;
        }

        try {
            const tourId = `CCID${Date.now().toString().slice(-6)}`;

            const tourData = {
                componentID: tourId,
                title: values.title,
                description: values.description,
                price: values.price,
                images: imageUrls,
                location: values.location,
                locationType: values.locationType,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, "customComponents", tourId), tourData);
            message.success("Custom tour created successfully");
            router.push('/admin/custom-tours');
        } catch (error) {
            console.error("Error saving custom tour:", error);
            message.error("Failed to save custom tour");
        }
    };

    const uploadProps = {
        beforeUpload: (file: File) => {
            const isImage = file.type.startsWith('image/');
            if (!isImage) {
                message.error('You can only upload image files!');
                return false;
            }
            const isLt10M = file.size / 1024 / 1024 < 10;
            if (!isLt10M) {
                message.error('Image must be smaller than 10MB!');
                return false;
            }
            handleImageUpload(file);
            return false;
        },
        showUploadList: false,
        multiple: true,
    };

    const handleModalClose = () => {
        setImageModalOpen(false);
        setActiveTab('upload');
    };

    return (
        <>
            <PageHeaders
                className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
                title="Add Custom Tour"
                routes={PageRoutes}
            />
            <main className="min-h-[715px] lg:min-h-[580px] px-4 sm:px-8 xl:px-[15px] pb-[30px] bg-transparent">
                <Row gutter={25}>
                    <Col sm={24} xs={24}>
                        <Card className="h-full">
                            <div className="bg-white dark:bg-white/10 m-0 p-0 text-theme-gray dark:text-white/60 text-[15px] rounded-10 relative h-full">
                                <div className="p-4 sm:p-[25px]">
                                    <div className="flex justify-between items-center mb-6">
                                        <Button
                                            type="default"
                                            onClick={() => router.push('/admin/custom-tours')}
                                            icon={<ArrowLeftOutlined />}
                                            className="flex items-center"
                                        >
                                            Back to Custom Tours
                                        </Button>
                                    </div>

                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSubmit}
                                    >
                                        <div className="mb-8">
                                            <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                                                </svg>
                                                Tour Information
                                            </h3>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Tour Title</span>}
                                                        name="title"
                                                        rules={[{ required: true, message: 'Please enter tour title' }]}
                                                    >
                                                        <Input
                                                            placeholder="Enter tour title"
                                                            className="py-2"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Price (₹)</span>}
                                                        name="price"
                                                        rules={[{ required: true, message: 'Please enter price' }]}
                                                    >
                                                        <InputNumber
                                                            placeholder="Enter price"
                                                            className="py-2 w-full"
                                                            min={0}
                                                            formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Location</span>}
                                                        name="location"
                                                        rules={[{ required: true, message: 'Please enter location' }]}
                                                    >
                                                        <Input
                                                            placeholder="Enter location"
                                                            className="py-2"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Location Type</span>}
                                                        name="locationType"
                                                        rules={[{ required: true, message: 'Please select location type' }]}
                                                    >
                                                        <Select
                                                            placeholder="Select location type"
                                                            className="w-full"
                                                            dropdownStyle={{ borderRadius: '6px' }}
                                                        >
                                                            <Option value="domestic">Domestic</Option>
                                                            <Option value="international">International</Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Form.Item
                                                label={<span className="text-dark dark:text-white/[.87] font-medium">Description</span>}
                                                name="description"
                                                rules={[{ required: true, message: 'Please enter description' }]}
                                            >
                                                <TextArea
                                                    rows={4}
                                                    placeholder="Enter tour description"
                                                    className="text-base"
                                                />
                                            </Form.Item>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                                                    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z" />
                                                </svg>
                                                Tour Images
                                            </h3>

                                            {/* Single Upload Image Button */}
                                            <div className="mb-4">
                                                <Button
                                                    type="primary"
                                                    icon={<FileImageOutlined />}
                                                    onClick={() => setImageModalOpen(true)}
                                                    className="bg-primary text-white hover:bg-primary-hbr"
                                                    size="large"
                                                >
                                                    Upload Images
                                                </Button>
                                            </div>

                                            {/* Image Preview Grid */}
                                            {imageUrls.length > 0 && (
                                                <div className="mx-auto mt-4 ml-4">
                                                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                                                        {imageUrls.map((url, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-start"
                                                                style={{ marginRight: '12px', marginBottom: '8px' }}
                                                            >
                                                                <div className="rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors">
                                                                    <Image
                                                                        src={url}
                                                                        alt={`Tour image ${index + 1}`}
                                                                        className="max-h-[200px] w-auto object-contain"
                                                                        preview={true}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col items-center justify-between h-full ml-1">
                                                                    <Button
                                                                        type="primary"
                                                                        danger
                                                                        size="small"
                                                                        icon={<DeleteOutlined />}
                                                                        onClick={() => handleRemoveImage(index)}
                                                                    />
                                                                    <div className="bg-black bg-opacity-50 text-white px-2 py-0.5 rounded text-xs mt-1">
                                                                        {index + 1}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {imageUrls.length === 0 && (
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <p className="mt-2 text-gray-500">No images uploaded yet</p>
                                                    <p className="text-sm text-gray-400">Click "Upload Images" to add images</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <Space size="middle">
                                                <Button
                                                    className="px-5 h-10 shadow-none hover:bg-gray-50 dark:hover:bg-white/10"
                                                    onClick={() => router.push('/admin/custom-tours')}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
                                                >
                                                    Create Custom Tour
                                                </Button>
                                            </Space>
                                        </div>
                                    </Form>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </main>

            {/* Image Upload Modal with Tabs */}
            <Modal
                title={
                    <h3 className="text-lg font-semibold px-4 py-2">
                        Select Image
                    </h3>
                }
                open={imageModalOpen}
                onCancel={handleModalClose}
                footer={null}
                width="95%"
                style={{ maxWidth: '1000px' }}
                bodyStyle={{ padding: '16px 24px 24px' }}
                className="responsive-modal"
            >
                <Tabs
                    defaultActiveKey="upload"
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
                                    <label htmlFor="modal-image-upload" className="cursor-pointer text-center">
                                        <CloudUploadOutlined className="text-5xl mb-5 text-gray-400" />
                                        <p className="text-gray-700 dark:text-white/80 font-medium mb-2">Click to upload an image</p>
                                        <p className="text-sm text-gray-500 dark:text-white/60 mb-5">PNG, JPG or JPEG (max. 2MB)</p>
                                        <Button
                                            type="primary"
                                            icon={<CloudUploadOutlined />}
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'image/*';
                                                input.onchange = (e) => {
                                                    const file = (e.target as HTMLInputElement).files?.[0];
                                                    if (file) handleImageUpload(file);
                                                };
                                                input.click();
                                            }}
                                            className="bg-primary hover:bg-primary-hbr"
                                            loading={imageLoading}
                                        >
                                            {imageLoading ? 'Uploading...' : 'Select File'}
                                        </Button>
                                    </label>
                                </div>
                            ),
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
                                        <label htmlFor="modal-archive-upload" className="cursor-pointer">
                                            <input
                                                id="modal-archive-upload"
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(file);
                                                }}
                                            />
                                        </label>
                                    </div>

                                    <div className="border border-gray-200 dark:border-white/10 rounded-md">
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-5 max-h-96 overflow-y-auto">
                                            {archiveImages.length > 0 ? (
                                                archiveImages.map((image, index) => (
                                                    <div
                                                        key={index}
                                                        className="cursor-pointer border rounded p-2 transition-all hover:border-primary"
                                                        onClick={() => handleAddFromArchive(image.url)}
                                                    >
                                                        <img
                                                            src={image.url}
                                                            alt={image.name}
                                                            className="w-full max-h-40 object-contain"
                                                        />
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-4 text-center py-8 text-gray-500 dark:text-white/60">
                                                    <PictureOutlined className="text-4xl mb-2" />
                                                    <p>No images in archive</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ),
                        },
                    ]}
                />
            </Modal>


        </>
    );
}

export default Protected(AddCustomTour, ["admin"]);