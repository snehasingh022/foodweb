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
    Spin
} from 'antd';
import {
    UploadOutlined,
    ArrowLeftOutlined,
    DeleteOutlined,
    PlusOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { PageHeaders } from '../../../../components/page-headers/index';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, listAll } from 'firebase/storage';
import Protected from '../../../../components/Protected/Protected';
import { storage } from '@/lib/firebase-secondary';
import { useRouter } from 'next/router';

const { Option } = Select;
const { TextArea } = Input;

interface TourData {
    componentID: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    location: string;
    locationType: string;
    createdAt: any;
    updatedAt: any;
}

function EditCustomTour() {
    const router = useRouter();
    const { id } = router.query;
    const [form] = Form.useForm();

    // State variables
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [imageLoading, setImageLoading] = useState(false);
    const [archiveImages, setArchiveImages] = useState<{ name: string; url: string }[]>([]);
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [tourData, setTourData] = useState<TourData | null>(null);
    const [saving, setSaving] = useState(false);

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
            breadcrumbName: 'Edit Custom Tour',
        },
    ];

    useEffect(() => {
        if (typeof window !== "undefined" && id) {
            fetchTourData();
            fetchArchiveImages();
        }
    }, [id]);

    const fetchTourData = async () => {
        if (!id || typeof id !== 'string') return;

        try {
            setLoading(true);
            const tourDoc = await getDoc(doc(db, "customComponents", id));

            if (tourDoc.exists()) {
                const data = tourDoc.data() as TourData;
                setTourData(data);
                setImageUrls(data.images || []);

                // Set form values
                form.setFieldsValue({
                    title: data.title,
                    description: data.description,
                    price: data.price,
                    location: data.location,
                    locationType: data.locationType,
                });
            } else {
                message.error("Tour not found");
                router.push('/admin/custom-tours');
            }
        } catch (error) {
            console.error("Error fetching tour data:", error);
            message.error("Failed to fetch tour data");
            router.push('/admin/custom-tours');
        } finally {
            setLoading(false);
        }
    };

    const fetchArchiveImages = async () => {
        try {
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }

            const archiveRef = ref(storage, 'prathviTravelsMedia');
            const result = await listAll(archiveRef);

            const imagePromises = result.items.map(async (imageRef) => {
                const url = await getDownloadURL(imageRef);
                return {
                    name: imageRef.name,
                    url: url
                };
            });

            const images = await Promise.all(imagePromises);
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

            const timestamp = Date.now();
            const storageRef = ref(storage, `prathviTravelsMedia/${timestamp}-${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            setImageUrls(prev => [...prev, downloadURL]);
            setArchiveImages(prev => [...prev, { name: `${timestamp}-${file.name}`, url: downloadURL }]);
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
        }
    };

    const handleSubmit = async (values: any) => {
        if (typeof window === "undefined" || !id || typeof id !== 'string') return;

        if (imageUrls.length === 0) {
            message.error("Please add at least one image");
            return;
        }

        try {
            setSaving(true);

            const updatedTourData = {
                ...tourData,
                title: values.title,
                description: values.description,
                price: values.price,
                images: imageUrls,
                location: values.location,
                locationType: values.locationType,
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(db, "customComponents", id), updatedTourData);
            message.success("Custom tour updated successfully");
            router.push('/admin/custom-tours');
        } catch (error) {
            console.error("Error updating custom tour:", error);
            message.error("Failed to update custom tour");
        } finally {
            setSaving(false);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spin
                    indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
                    tip="Loading tour data..."
                    size="large"
                />
            </div>
        );
    }

    return (
        <>
            <PageHeaders
                className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
                title="Edit Custom Tour"
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

                                        {tourData && (
                                            <div className="text-sm text-gray-500">
                                                Tour ID: <span className="font-mono font-medium">{tourData.componentID}</span>
                                            </div>
                                        )}
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

                                            <div className="flex gap-4 mb-4">
                                                <Upload {...uploadProps}>
                                                    <Button
                                                        icon={<UploadOutlined />}
                                                        loading={imageLoading}
                                                        className="bg-primary text-white hover:bg-primary-hbr"
                                                    >
                                                        Upload New Images
                                                    </Button>
                                                </Upload>

                                                <Button
                                                    icon={<PlusOutlined />}
                                                    onClick={() => setImageDialogOpen(true)}
                                                    className="border-primary text-primary hover:bg-primary hover:text-white"
                                                >
                                                    Select from Archive
                                                </Button>
                                            </div>

                                            <div className="mx-auto mt-4 pl-4"> {/* Added left padding */}
                                                {imageUrls.length > 0 && (
                                                    <div className="flex flex-wrap" style={{ gap: '16px 8px' }}> {/* Controlled horizontal/vertical gaps */}
                                                        {imageUrls.map((url, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex items-center"
                                                                style={{
                                                                    width: 'calc((100% - 32px) / 3)', // Exactly 3 items per row accounting for gaps
                                                                    marginRight: '4px', // Right margin between items
                                                                    marginBottom: '16px' // Bottom margin between rows
                                                                }}
                                                            >
                                                                {/* Image container with natural width */}
                                                                <div className="rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors">
                                                                    <Image
                                                                        src={url}
                                                                        alt={`Tour image ${index + 1}`}
                                                                        className="max-h-[200px] w-auto" // Natural width with constrained height
                                                                        preview={true}
                                                                        style={{ display: 'block' }} // Ensures proper image sizing
                                                                    />
                                                                </div>

                                                                {/* Delete Button + Index - now positioned absolutely */}
                                                                <div className="relative ml-1">
                                                                    <Button
                                                                        type="primary"
                                                                        danger
                                                                        size="small"
                                                                        icon={<DeleteOutlined />}
                                                                        onClick={() => handleRemoveImage(index)}
                                                                        style={{ position: 'absolute', top: '4px', left: '4px' }}
                                                                    />
                                                                    <div
                                                                        className="bg-black bg-opacity-50 text-white px-2 py-0.5 rounded text-xs"
                                                                        style={{ position: 'absolute', bottom: '4px', left: '4px' }}
                                                                    >
                                                                        {index + 1}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {imageUrls.length === 0 && (
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    <p className="mt-2 text-gray-500">No images uploaded yet</p>
                                                    <p className="text-sm text-gray-400">Upload images or select from archive</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <Space size="middle">
                                                <Button
                                                    className="px-5 h-10 shadow-none hover:bg-gray-50 dark:hover:bg-white/10"
                                                    onClick={() => router.push('/admin/custom-tours')}
                                                    disabled={saving}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    loading={saving}
                                                    className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
                                                >
                                                    {saving ? 'Updating...' : 'Update Custom Tour'}
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

            {/* Archive Images Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 px-2 py-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
                            <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z" />
                        </svg>
                        <span className="text-lg font-medium">Select Images from Archive</span>
                    </div>
                }
                open={imageDialogOpen}
                onCancel={() => setImageDialogOpen(false)}
                footer={null}
                width="90%"
                style={{ maxWidth: '1200px' }}
                className="responsive-modal"
            >
                <div className="max-h-[70vh] overflow-y-auto pl-4">
                    {archiveImages.length > 0 ? (
                        <div className="flex flex-wrap gap-x-6 gap-y-4">
                            {archiveImages.map((image, index) => {
                                const isSelected = imageUrls.includes(image.url);
                                return (
                                    <div
                                        key={index}
                                        className="relative group cursor-pointer"
                                        style={{
                                            marginRight: '16px',
                                            marginBottom: '16px'
                                        }}
                                        onClick={() => {
                                            if (isSelected) {
                                                // Remove if already selected
                                                handleRemoveImage(imageUrls.indexOf(image.url));
                                            } else {
                                                // Add if not selected
                                                handleAddFromArchive(image.url);
                                            }
                                        }}
                                    >
                                        <div className={`rounded-lg overflow-hidden border-2 transition-colors ${isSelected ? 'border-primary' : 'border-gray-200 hover:border-primary'
                                            }`}>
                                            <Image
                                                src={image.url}
                                                alt={image.name}
                                                className="max-h-[200px] w-auto"
                                                preview={false}
                                                style={{ display: 'block' }}
                                            />
                                        </div>

                                        {/* Selection indicator (always visible if selected) */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                                <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Click-to-toggle hint (only shown on hover for unselected items) */}
                                        {!isSelected && (
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                                <div className="text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                    Click to select
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="mt-4 text-gray-500">No images found in archive</p>
                            <p className="text-sm text-gray-400">Upload some images first to populate the archive</p>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}

export default Protected(EditCustomTour, ["admin"]);