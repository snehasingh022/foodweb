export const convertImageToWebP = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const img = new Image();
            img.src = reader.result as string;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) return reject(new Error("Canvas context not available"));

                ctx.drawImage(img, 0, 0);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) return reject(new Error("Conversion to WebP failed"));
                        const webpFile = new File([blob], file.name.replace(/\.\w+$/, '.webp'), {
                            type: 'image/webp',
                        });
                        resolve(webpFile);
                    },
                    'image/webp',
                    0.8 // adjust quality here
                );
            };
        };

        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
};
