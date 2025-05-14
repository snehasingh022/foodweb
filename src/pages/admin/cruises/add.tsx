import { useState, useEffect } from 'react';
import {
    Row,
    Col,
    Card,
    Input,
    Button,
    Form,
    Select,
    Tag,
    Divider,
    Upload,
    message,
    Space,
    Modal,
    DatePicker
} from 'antd';
import {
    UploadOutlined,
    PlusOutlined,
    ArrowLeftOutlined,
    PictureOutlined,
    LoadingOutlined
} from '@ant-design/icons';
import { PageHeaders } from '../../../components/page-headers/index';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, app } from '../../../authentication/firebase';
import { getDownloadURL, ref, uploadBytes, getStorage } from 'firebase/storage';
import { Editor } from '@tinymce/tinymce-react';
import Protected from '../../../components/Protected/Protected';
import { useRouter } from 'next/router';

// Initialize Firebase Storage
let storage: any = null;
// Storage should only be initialized on the client side
if (typeof window !== "undefined") {
    storage = getStorage(app);
}

const { Option } = Select;

function AddCruise() {
    const router = useRouter();
    const [form] = Form.useForm();

    // State variables
    const [categories, setCategories] = useState<any[]>([]);
    const [tags, setTags] = useState<any[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [keywordInput, setKeywordInput] = useState('');
    const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [categorySlug, setCategorySlug] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [tagDialogOpen, setTagDialogOpen] = useState(false);
    const [newTag, setNewTag] = useState('');
    const [tagSlug, setTagSlug] = useState('');
    const [tagDescription, setTagDescription] = useState('');
    const [imageDialogOpen, setImageDialogOpen] = useState(false);
    const [imageType, setImageType] = useState(''); // 'main' or 'seo'
    const [archive, setArchive] = useState<any[]>([]);

    const PageRoutes = [
        {
            path: '/admin',
            breadcrumbName: 'Dashboard',
        },
        {
            path: '/admin/cruises',
            breadcrumbName: 'Cruises',
        },
        {
            path: '',
            breadcrumbName: 'Add Cruise',
        },
    ];

    useEffect(() => {
        // Only fetch data on the client side
        if (typeof window !== "undefined") {
            fetchCategories();
            fetchTags();
            fetchArchive();
        }
    }, []);

    useEffect(() => {
        setCategorySlug(newCategory.toLowerCase().replace(/ /g, '-'));
    }, [newCategory]);

    useEffect(() => {
        setTagSlug(newTag.toLowerCase().replace(/ /g, '-'));
    }, [newTag]);

    const fetchCategories = async () => {
        try {
            const q = query(collection(db, "categories"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const categoriesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setCategories(categoriesData);
        } catch (error) {
            console.error("Error fetching categories:", error);
            message.error("Failed to fetch categories");
        }
    };

    const fetchTags = async () => {
        try {
            const q = query(collection(db, "tags"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const tagsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTags(tagsData);
        } catch (error) {
            console.error("Error fetching tags:", error);
            message.error("Failed to fetch tags");
        }
    };

    const fetchArchive = async () => {
        try {
            const archiveRef = collection(db, "archive");
            const querySnapshot = await getDocs(archiveRef);
            const archiveData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setArchive(archiveData);
        } catch (error) {
            console.error("Error fetching archive:", error);
        }
    };

    const handleImageUpload = async (file: File) => {
        setImageLoading(true);
        try {
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }
            const slug = form.getFieldValue('slug') || `cruise-${Date.now()}`;
            const storageRef = ref(storage, `cruise/${slug}/images/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            setImageUrl(downloadURL);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image:", error);
            message.error("Failed to upload image");
        } finally {
            setImageLoading(false);
        }
    };

    const handleArchiveImageUpload = async (file: File) => {
        try {
            if (!storage) {
                throw new Error("Firebase Storage is not available");
            }
            const storageRef = ref(storage, `/archive/images/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const archiveRef = collection(db, "archive");
            await addDoc(archiveRef, {
                ImageUrl: downloadURL,
            });

            setArchive([...archive, { ImageUrl: downloadURL }]);
            message.success("Image saved to archive successfully!");
            return downloadURL;
        } catch (error) {
            console.error("Error saving image to archive:", error);
            message.error("Error saving image to archive. Please try again.");
        }
    };

    const handleAddCategory = async () => {
        if (typeof window === "undefined" || newCategory.trim() === "") return;

        try {
            const categoriesRef = collection(db, "categories");
            const docRef = await addDoc(categoriesRef, {
                name: newCategory,
                slug: categorySlug,
                description: categoryDescription,
                createdAt: serverTimestamp(),
            });
            setCategories([
                ...categories,
                {
                    id: docRef.id,
                    name: newCategory,
                    slug: categorySlug,
                    description: categoryDescription,
                },
            ]);
            setNewCategory("");
            setCategorySlug("");
            setCategoryDescription("");
            setCategoryDialogOpen(false);
            message.success("Category added successfully!");
        } catch (error) {
            console.error("Error adding category:", error);
            message.error("Error adding category. Please try again.");
        }
    };

    const handleAddTag = async () => {
        if (typeof window === "undefined" || newTag.trim() === "") return;

        try {
            const tagsRef = collection(db, "tags");
            const docRef = await addDoc(tagsRef, {
                name: newTag,
                slug: tagSlug,
                description: tagDescription,
                createdAt: serverTimestamp(),
            });
            setTags([
                ...tags,
                {
                    id: docRef.id,
                    name: newTag,
                    slug: tagSlug,
                    description: tagDescription,
                },
            ]);
            setNewTag("");
            setTagSlug("");
            setTagDescription("");
            setTagDialogOpen(false);
            message.success("Tag added successfully!");
        } catch (error) {
            console.error("Error adding tag:", error);
            message.error("Error adding tag. Please try again.");
        }
    };
    
    const handleSetArchiveImage = (url: string) => {
        if (imageType === 'main') {
            setImageUrl(url);
        }
        setImageDialogOpen(false);
    };

    const handleOpenImageDialog = (type: string) => {
        setImageType(type);
        setImageDialogOpen(true);
    };

    const handleSlugGeneration = (e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        const slug = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        form.setFieldsValue({ slug });
    };

    const handleSubmit = async (values: any) => {
        if (typeof window === "undefined") return;

        try {
            const cruiseData = {
                title: values.title,
                slug: values.slug,
                summary: values.summary,
                content: editorContent,
                category: values.category,
                image: imageUrl,
                isFeatured: values.isFeatured || 'No',
                tags: selectedTags,
                startDate: values.startDate ? values.startDate.toDate() : null,
                endDate: values.endDate ? values.endDate.toDate() : null,
                price: values.price || 0,
                location: values.location || "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, "cruises"), cruiseData);
            message.success("Cruise created successfully");
            router.push('/admin/cruises');
        } catch (error) {
            console.error("Error saving cruise:", error);
            message.error("Failed to save cruise");
        }
    };

    return (
        <>
            <PageHeaders
                className="flex items-center justify-between px-4 sm:px-8 xl:px-[15px] pt-2 pb-4 sm:pb-6 bg-transparent sm:flex-row flex-col gap-4"
                title="Add Cruise"
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
                                            onClick={() => router.push('/admin/cruises')}
                                            icon={<ArrowLeftOutlined />}
                                            className="flex items-center"
                                        >
                                            Back to Cruises
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
                                                Basic Information
                                            </h3>
                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Title</span>}
                                                        name="title"
                                                        rules={[{ required: true, message: 'Please enter cruise title' }]}
                                                    >
                                                        <Input
                                                            placeholder="Enter cruise title"
                                                            onChange={handleSlugGeneration}
                                                            className="py-2"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Slug</span>}
                                                        name="slug"
                                                        rules={[{ required: true, message: 'Please enter cruise slug' }]}
                                                    >
                                                        <Input
                                                            placeholder="cruise-slug"
                                                            className="py-2"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Start Date</span>}
                                                        name="startDate"
                                                        rules={[{ required: true, message: 'Please select start date' }]}
                                                    >
                                                        <DatePicker 
                                                            className="w-full py-2"
                                                            format="YYYY-MM-DD"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">End Date</span>}
                                                        name="endDate"
                                                        rules={[{ required: true, message: 'Please select end date' }]}
                                                    >
                                                        <DatePicker 
                                                            className="w-full py-2"
                                                            format="YYYY-MM-DD"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Price ($)</span>}
                                                        name="price"
                                                        rules={[{ required: true, message: 'Please enter cruise price' }]}
                                                    >
                                                        <Input
                                                            type="number"
                                                            placeholder="Enter price"
                                                            className="py-2"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Location</span>}
                                                        name="location"
                                                        rules={[{ required: true, message: 'Please enter cruise location' }]}
                                                    >
                                                        <Input
                                                            placeholder="Enter cruise location"
                                                            className="py-2"
                                                        />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <Form.Item
                                                        label={<span className="text-dark dark:text-white/[.87] font-medium">Featured</span>}
                                                        name="isFeatured"
                                                        initialValue="No"
                                                    >
                                                        <Select
                                                            className="w-full"
                                                            dropdownStyle={{ borderRadius: '6px' }}
                                                        >
                                                            <Select.Option value="Yes">Yes</Select.Option>
                                                            <Select.Option value="No">No</Select.Option>
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-dark dark:text-white/[.87] font-medium">Category</span>
                                                        <Button
                                                            type="link"
                                                            icon={<PlusOutlined />}
                                                            onClick={() => setCategoryDialogOpen(true)}
                                                            size="small"
                                                            className="text-primary"
                                                        >
                                                            Add New
                                                        </Button>
                                                    </div>
                                                    <Form.Item
                                                        name="category"
                                                    >
                                                        <Select
                                                            placeholder="Select category"
                                                            className="w-full"
                                                            dropdownStyle={{ borderRadius: '6px' }}
                                                        >
                                                            {categories.map((cat) => (
                                                                <Select.Option key={cat.id} value={cat.name}>
                                                                    {cat.name}
                                                                </Select.Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                                <Col span={12}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-dark dark:text-white/[.87] font-medium">Tags</span>
                                                        <Button
                                                            type="link"
                                                            icon={<PlusOutlined />}
                                                            onClick={() => setTagDialogOpen(true)}
                                                            size="small"
                                                            className="text-primary"
                                                        >
                                                            Add New
                                                        </Button>
                                                    </div>
                                                    <Form.Item>
                                                        <Select
                                                            mode="multiple"
                                                            placeholder="Select tags"
                                                            value={selectedTags}
                                                            onChange={setSelectedTags}
                                                            style={{ width: '100%' }}
                                                            optionLabelProp="label"
                                                            className="w-full"
                                                            dropdownStyle={{ borderRadius: '6px' }}
                                                        >
                                                            {tags.map((tag) => (
                                                                <Select.Option key={tag.id} value={tag.name} label={tag.name}>
                                                                    {tag.name}
                                                                </Select.Option>
                                                            ))}
                                                        </Select>
                                                    </Form.Item>
                                                </Col>
                                            </Row>

                                            <Form.Item
                                                label={<span className="text-dark dark:text-white/[.87] font-medium">Summary</span>}
                                                name="summary"
                                            >
                                                <Input.TextArea rows={3} placeholder="Write a brief summary of the cruise" className="text-base" />
                                            </Form.Item>

                                            <Row gutter={24}>
                                                <Col span={12}>
                                                    <Form.Item label={<span className="text-dark dark:text-white/[.87] font-medium">Featured Image</span>}>
                                                        <div
                                                            className="border border-dashed border-gray-300 rounded-md p-4 text-center cursor-pointer hover:border-primary transition-colors duration-300"
                                                            onClick={() => handleOpenImageDialog('main')}
                                                        >
                                                            {imageUrl ? (
                                                                <div className="relative inline-block group">
                                                                    <img
                                                                        src={imageUrl}
                                                                        alt="cruise"
                                                                        className="mx-auto h-32 object-contain transition-opacity duration-300"
                                                                    />
                                                                    <div className="absolute inset-0 bg-black/20 flex justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded">
                                                                        <span className="text-white font-medium">Change Image</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col justify-center items-center h-32">
                                                                    <PictureOutlined style={{ fontSize: '32px', color: '#d9d9d9' }} />
                                                                    <p className="mt-2 text-gray-500">Upload Featured Image</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </div>

                                        <div className="mb-8">
                                            <h3 className="text-base text-primary dark:text-primary mb-4 font-medium flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                                    <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h13zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-13z" />
                                                    <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8zm0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5z" />
                                                </svg>
                                                Content
                                            </h3>
                                            <Form.Item>
                                                <Editor
                                                    apiKey="cluzl6f3pdaveewms6exdzpvcygpa23rgrx0whym6svjop94"
                                                    value={editorContent}
                                                    init={{
                                                        height: 400,
                                                        menubar: true,
                                                        plugins: [
                                                            'advlist autolink lists link image charmap print preview anchor',
                                                            'searchreplace visualblocks code fullscreen',
                                                            'insertdatetime media table paste code help wordcount'
                                                        ],
                                                        toolbar:
                                                            'undo redo | formatselect | bold italic backcolor | \ alignleft aligncenter alignright alignjustify | \ bullist numlist outdent indent | removeformat | help'
                                                    }}
                                                    onEditorChange={(content) => setEditorContent(content)}
                                                />
                                            </Form.Item>
                                        </div>
                                        <div className="flex justify-end mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                            <Space size="middle">
                                                <Button
                                                    className="px-5 h-10 shadow-none hover:bg-gray-50 dark:hover:bg-white/10"
                                                    onClick={() => router.push('/admin/cruises')}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    type="primary"
                                                    htmlType="submit"
                                                    className="px-5 h-10 shadow-none bg-primary hover:bg-primary-hbr"
                                                >
                                                    Create Cruise
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

            {/* Category Dialog */}
            <Modal
                title="Add New Category"
                open={categoryDialogOpen}
                onCancel={() => setCategoryDialogOpen(false)}
                onOk={handleAddCategory}
                width="95%"
                style={{ maxWidth: '500px' }}
                className="responsive-modal"
            >
                <Form layout="vertical">
                    <Form.Item label="Category Name" required>
                        <Input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter category name"
                        />
                    </Form.Item>
                    <Form.Item label="Slug">
                        <Input
                            value={categorySlug}
                            onChange={(e) => setCategorySlug(e.target.value)}
                            placeholder="category-slug"
                        />
                    </Form.Item>
                    <Form.Item label="Description">
                        <Input.TextArea
                            value={categoryDescription}
                            onChange={(e) => setCategoryDescription(e.target.value)}
                            placeholder="Category description"
                            rows={3}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Tag Dialog */}
            <Modal
                title="Add New Tag"
                open={tagDialogOpen}
                onCancel={() => setTagDialogOpen(false)}
                onOk={handleAddTag}
                width="95%"
                style={{ maxWidth: '500px' }}
                className="responsive-modal"
            >
                <Form layout="vertical">
                    <Form.Item label="Tag Name" required>
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Enter tag name"
                        />
                    </Form.Item>
                    <Form.Item label="Slug">
                        <Input
                            value={tagSlug}
                            onChange={(e) => setTagSlug(e.target.value)}
                            placeholder="tag-slug"
                        />
                    </Form.Item>
                    <Form.Item label="Description">
                        <Input.TextArea
                            value={tagDescription}
                            onChange={(e) => setTagDescription(e.target.value)}
                            placeholder="Tag description"
                            rows={3}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Image Dialog */}
            <Modal
                title="Select from Archive"
                open={imageDialogOpen}
                onCancel={() => setImageDialogOpen(false)}
                footer={null}
                width="95%"
                style={{ maxWidth: '1000px' }}
                className="responsive-modal"
            >
                <div className="flex justify-center gap-4 mb-4">
                    <Upload
                        name="image"
                        showUploadList={false}
                        beforeUpload={(file) => {
                            if (imageType === 'main') {
                                handleImageUpload(file);
                            }
                            handleArchiveImageUpload(file);
                            setImageDialogOpen(false);
                            return false;
                        }}
                    >
                        <Button icon={<UploadOutlined />} type="primary" className="bg-primary hover:bg-primary-hbr">
                            Upload New Image
                        </Button>
                    </Upload>
                </div>

                <Divider>Or Select from Archive</Divider>

                <div className="grid grid-cols-4 gap-4 mt-4 max-h-[400px] overflow-y-auto">
                    {archive.map((item, index) => (
                        <div
                            key={index}
                            className="cursor-pointer border p-2 rounded hover:border-primary"
                            onClick={() => handleSetArchiveImage(item.ImageUrl)}
                        >
                            <img
                                src={item.ImageUrl}
                                alt="Archive item"
                                className="w-full h-24 object-cover"
                            />
                        </div>
                    ))}
                </div>
            </Modal>
        </>
    );
}

export default Protected(AddCruise, ["admin"]); 