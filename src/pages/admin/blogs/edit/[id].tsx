import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Protected from '../../../../components/Protected/Protected';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../authentication/firebase';
import { Spin, message } from 'antd';

function EditBlog() {
  const router = useRouter();
  const { id } = router.query;
  const [loading, setLoading] = useState(true);
  const [blog, setBlog] = useState<any>(null);

  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchBlog(id);
    }
  }, [id]);

  const fetchBlog = async (blogId: string) => {
    try {
      setLoading(true);
      const blogDoc = await getDoc(doc(db, "blogs", blogId));
      
      if (blogDoc.exists()) {
        setBlog({
          id: blogDoc.id,
          ...blogDoc.data()
        });
      } else {
        message.error("Blog not found");
        router.push('/admin/blogs');
      }
    } catch (error) {
      console.error("Error fetching blog:", error);
      message.error("Failed to fetch blog");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!blog) {
    return null;
  }

  return (
    <div>
      <h1>Edit Blog: {blog.title}</h1>
      <p>This page will be implemented to edit blog ID: {id}</p>
      <button onClick={() => router.push('/admin/blogs')}>Back to Blogs</button>
    </div>
  );
}

export default Protected(EditBlog, ["admin"]); 