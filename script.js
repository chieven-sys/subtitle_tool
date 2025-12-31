document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('image-upload');
    const subtitleInput = document.getElementById('subtitle-text');
    const resultImage = document.getElementById('result-image');
    const previewSection = document.getElementById('preview-section');
    const downloadBtn = document.getElementById('download-btn');
    const uploadText = document.querySelector('.upload-text');
    const realtimePreview = document.getElementById('realtime-preview');
    const realtimePreviewContainer = document.getElementById('realtime-preview-container');

    let uploadedImage = null;

    // Handle File Upload interaction
    dropZone.addEventListener('click', () => fileInput.click());

    // Set up download functionality - bind it once at the beginning
    downloadBtn.onclick = () => {
        // Only download if we have a generated image
        if (realtimePreview.src && realtimePreview.src.startsWith('data:image')) {
            const link = document.createElement('a');
            link.download = 'cinematic-scene.jpg';
            link.href = realtimePreview.src;
            link.click();
        } else {
            alert('请先上传图片并添加字幕内容以生成结果。');
        }
    };

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-active');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-active');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-active');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });

    // Validating file input
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('请上传图片文件。');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                uploadedImage = img;

                uploadText.textContent = `已加载: ${file.name}`;

                // Show the original image in the realtime preview container
                realtimePreview.src = e.target.result;
                realtimePreviewContainer.hidden = false;
                dropZone.classList.add('has-image');

                // Show the download button after image is loaded
                downloadBtn.hidden = false;

                // Reset result
                previewSection.hidden = true;

                // Start real-time preview if there's text content
                if (subtitleInput.value.trim()) {
                    generateRealtimePreview();
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Range Input Value Display Updates
    document.getElementById('subtitle-height').addEventListener('input', (e) => {
        document.getElementById('subtitle-height-val').textContent = e.target.value + '%';
        if (uploadedImage && subtitleInput.value.trim()) {
            generateRealtimePreview();
        }
    });

    document.getElementById('font-size').addEventListener('input', (e) => {
        document.getElementById('font-size-val').textContent = e.target.value + '%';
        if (uploadedImage && subtitleInput.value.trim()) {
            generateRealtimePreview();
        }
    });

    document.getElementById('text-color').addEventListener('input', (e) => {
        e.target.nextElementSibling.textContent = e.target.value;
        if (uploadedImage && subtitleInput.value.trim()) {
            generateRealtimePreview();
        }
    });

    document.getElementById('outline-color').addEventListener('input', (e) => {
        e.target.nextElementSibling.textContent = e.target.value;
        if (uploadedImage && subtitleInput.value.trim()) {
            generateRealtimePreview();
        }
    });

    // Listen for font weight and family changes
    document.getElementById('font-weight').addEventListener('change', () => {
        if (uploadedImage && subtitleInput.value.trim()) {
            generateRealtimePreview();
        }
    });

    document.getElementById('font-family').addEventListener('change', () => {
        if (uploadedImage && subtitleInput.value.trim()) {
            generateRealtimePreview();
        }
    });

    // Listen for subtitle text changes to update preview
    subtitleInput.addEventListener('input', () => {
        if (uploadedImage) {
            generateRealtimePreview();
        }
    });

    // Real-time preview generation function
    function generateRealtimePreview() {
        if (!uploadedImage) return;

        const text = subtitleInput.value.trim();
        if (!text) {
            // If there's no text, show the original image
            realtimePreview.src = uploadedImage.src;
            return;
        }

        const lines = text.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) {
            // If there's no text, show the original image
            realtimePreview.src = uploadedImage.src;
            return;
        }

        // Get Options
        const options = {
            subtitleHeightRatio: parseInt(document.getElementById('subtitle-height').value) / 100,
            fontSizeRatio: parseInt(document.getElementById('font-size').value) / 100,
            fontWeight: document.getElementById('font-weight').value,
            fontFamily: document.getElementById('font-family').value,
            textColor: document.getElementById('text-color').value,
            outlineColor: document.getElementById('outline-color').value
        };

        // Generate the preview image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Config
        const subtitleAreaRatio = options.subtitleHeightRatio;
        const originalWidth = uploadedImage.width;
        const originalHeight = uploadedImage.height;
        const sliceHeight = originalHeight * subtitleAreaRatio;

        // Calculate total height
        const totalHeight = originalHeight + (lines.length - 1) * sliceHeight;

        canvas.width = originalWidth;
        canvas.height = totalHeight;

        // Draw First Block (Full Image)
        ctx.drawImage(uploadedImage, 0, 0);
        drawSubtitle(ctx, lines[0], originalWidth, originalHeight, sliceHeight, options);

        // Draw Subsequent Blocks
        for (let i = 1; i < lines.length; i++) {
            const yPosition = originalHeight + (i - 1) * sliceHeight;

            // Source: take bottom slice from original image
            const sourceY = originalHeight - sliceHeight;

            ctx.drawImage(
                uploadedImage,
                0, sourceY, originalWidth, sliceHeight, // Source
                0, yPosition, originalWidth, sliceHeight // Destination
            );

            // Draw subtitle on this slice
            drawSubtitle(ctx, lines[i], originalWidth, yPosition + sliceHeight, sliceHeight, options);
        }

        // Update the realtime preview
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        realtimePreview.src = dataUrl;
    }

    function drawSubtitle(ctx, text, width, bottomY, sliceHeight, options) {
        // Draw Mask
        // Mask covers the 'subtitle area' of this slice.
        const maskY = bottomY - sliceHeight;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'; // 40% transparent black mask
        ctx.fillRect(0, maskY, width, sliceHeight);

        // Font setup
        const fontSize = width * options.fontSizeRatio;
        const fontWeight = options.fontWeight;
        const fontFamily = options.fontFamily;

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillStyle = options.textColor;

        // Shadow/Stroke for readability
        ctx.lineWidth = fontSize * 0.08;
        ctx.strokeStyle = options.outlineColor;
        ctx.lineJoin = 'round';

        // Shadow for depth
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = fontSize * 0.1;

        // Position
        const x = width / 2;
        // Vertically center in the slice
        // The slice area is from (bottomY - sliceHeight) to bottomY
        const y = bottomY - (sliceHeight / 2);

        ctx.textBaseline = 'middle';

        // Draw stroke then fill
        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);

        // Reset shadow
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
    }
});
