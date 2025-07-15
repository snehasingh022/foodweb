'use client';
import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase-secondary'; // Adjust the import based on your Firebase setup
import Image from 'next/image';
import { message } from 'antd';

interface FirebaseFileUploaderProps {
  partnerUID: string;
  storagePath?: string;
  accept?: string;
  maxSizeMB?: number;
  onUploadSuccess?: (downloadUrl: string, fileType: string) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: Error) => void;
  disabled?: boolean;
}

export const FirebaseFileUploader = (props: FirebaseFileUploaderProps) => {
  const {
    partnerUID,
    storagePath = `partners/${partnerUID}/attachments`,
    accept = '*',
    maxSizeMB = 10,
    onUploadSuccess,
    onUploadStart,
    onUploadError,
    disabled = false,
  } = props;


  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageFile = (file: File) => file.type.startsWith('image/');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file size
      if (maxSizeMB && selectedFile.size > maxSizeMB * 1024 * 1024) {
        setError(`File size exceeds ${maxSizeMB}MB limit`);
        return;
      }

      setFile(selectedFile);
      setError(null);
      
      // Create preview URL for images only
      if (isImageFile(selectedFile)) {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreviewUrl(null);
      }
    }
  };
  const convertImageToWebP = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new (window.Image as { new(): HTMLImageElement })();
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') return reject('Invalid file');
      img.src = reader.result;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('Canvas not supported');

      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const webpFile = new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });
          resolve(webpFile);
        } else {
          reject('Failed to convert to WebP');
        }
      }, 'image/webp');
    };

    img.onerror = () => reject('Failed to load image');

    reader.readAsDataURL(file);
  });
};


const uploadFile = async (fileToUpload: File) => {
  if (!partnerUID) {
    console.warn('Partner UID is required to generate storage path!');
    message.warning('Upload failed: Partner UID missing');
    return;
  }

  setUploading(true);
  onUploadStart?.();

  try {
    const timestamp = Date.now();
    let file = fileToUpload;

    if (fileToUpload.type.startsWith('image/') && fileToUpload.type !== 'image/webp') {
      file = await convertImageToWebP(fileToUpload);
    }

    const fileExtension = file.name.split('.').pop();
    const originalName = file.name.split('.').slice(0, -1).join('.');
    const filename = `${originalName}_${timestamp}.${fileExtension}`;
    const storageRef = ref(storage, `${storagePath}/${filename}`);

    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);

    setDownloadUrl(url);
    setFile(null);
    onUploadSuccess?.(url, file.type);

    // ✅ Toast for success
    message.success('File uploaded successfully!');
  } catch (err) {
    console.error('Upload failed:', err);
    const error = err as Error;
    setError('Upload failed. Please try again.');
    onUploadError?.(error);
    message.error('File upload failed');
  } finally {
    setUploading(false);
  }
};



  const handleRemove = () => {
    setFile(null);
    setPreviewUrl(null);
    setDownloadUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Auto-upload when file is selected
  useEffect(() => {
    if (file) {
      uploadFile(file);
    }
  }, [file]);

  // In your FirebaseFileUploader component:
const getFileIcon = (fileType: string) => {
  if (!fileType) return '📁';
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.startsWith('video/')) return '🎬';
  if (fileType.startsWith('audio/')) return '🎵';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('msword')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('zip') || fileType.includes('compressed')) return '🗜️';
  if (fileType.includes('text')) return '📝';
  return '📁';
};

  return (
    <div className="w-full max-w-md space-y-3 p-4 border rounded-md shadow-sm bg-white">
      {/* Hidden file input */}
      <input
        type="file"
        onChange={handleFileChange}
        ref={fileInputRef}
        accept={accept}
        disabled={disabled || uploading}
        className="hidden"
        id="file-upload"
      />
      
      {/* Upload area */}
      {!downloadUrl && (
        <label 
          htmlFor="file-upload"
          className={`block w-full p-4 border-2 border-dashed rounded-md cursor-pointer text-center ${
            disabled || uploading 
              ? 'border-gray-300 bg-gray-100 cursor-not-allowed' 
              : 'border-blue-300 hover:border-blue-500 hover:bg-blue-50'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-2">
            {uploading ? (
              <>
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Uploading...</span>
              </>
            ) : (
              <>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-8 w-8 text-blue-500" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">
                  {disabled ? 'Upload disabled' : 'Click to upload any file'}
                </span>
                <span className="text-xs text-gray-500">
                  Max size: {maxSizeMB}MB • All file types
                </span>
              </>
            )}
          </div>
        </label>
      )}

      {/* File info and preview */}
      {(file || downloadUrl) && (
        <div className="relative group p-3 border rounded-md bg-gray-50">
          {/* Image preview */}
          {previewUrl && (
            <div className="relative h-40 w-full mb-3 rounded-md overflow-hidden">
              <Image
                src={previewUrl}
                alt="File preview"
                fill
                className="object-contain"
              />
            </div>
          )}
          
          {/* File info */}
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {file ? getFileIcon(file.type) : getFileIcon('')}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file?.name || downloadUrl?.split('/').pop()}
              </p>
              <p className="text-xs text-gray-500">
                {file ? `${Math.round(file.size / 1024)} KB` : 'Uploaded'}
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {downloadUrl && (
              <>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                  title="Download"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 text-gray-700" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" 
                    />
                  </svg>
                </a>
                <button
                  onClick={handleRemove}
                  className="p-1.5 bg-white rounded-full shadow-md hover:bg-gray-100"
                  title="Remove"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4 text-red-500" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                    />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-red-600 text-xs p-2 bg-red-50 rounded-md flex items-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
};
export default FirebaseFileUploader;