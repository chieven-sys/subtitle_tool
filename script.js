document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('image-upload');
    const subtitleInput = document.getElementById('subtitle-text');
    const generateBtn = document.getElementById('generate-btn');
    const resultImage = document.getElementById('result-image');
    const previewSection = document.getElementById('preview-section');
    const downloadBtn = document.getElementById('download-btn');
    const uploadText = document.querySelector('.upload-text');

    let uploadedImage = null;

    // Handle File Upload interaction
    dropZone.addEventListener('click', () => fileInput.click());

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

                // Show preview in upload box
                const previewImg = document.getElementById('image-preview');
                previewImg.src = e.target.result;
                previewImg.hidden = false;
                dropZone.classList.add('has-image');

                // Reset result
                previewSection.hidden = true;
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Range Input Value Display Updates
    document.getElementById('subtitle-height').addEventListener('input', (e) => {
        document.getElementById('subtitle-height-val').textContent = e.target.value + '%';
    });

    document.getElementById('font-size').addEventListener('input', (e) => {
        document.getElementById('font-size-val').textContent = e.target.value + '%';
    });

    document.getElementById('text-color').addEventListener('input', (e) => {
        e.target.nextElementSibling.textContent = e.target.value;
    });

    document.getElementById('outline-color').addEventListener('input', (e) => {
        e.target.nextElementSibling.textContent = e.target.value;
    });

    // Generate Logic
    generateBtn.addEventListener('click', () => {
        if (!uploadedImage) {
            alert('请先上传一张图片。');
            return;
        }

        const text = subtitleInput.value.trim();
        if (!text) {
            alert('请输入对话内容。');
            return;
        }

        const lines = text.split('\n').filter(line => line.trim() !== '');

        if (lines.length === 0) return;

        // Get Options
        const options = {
            subtitleHeightRatio: parseInt(document.getElementById('subtitle-height').value) / 100,
            fontSizeRatio: parseInt(document.getElementById('font-size').value) / 100,
            fontWeight: document.getElementById('font-weight').value,
            fontFamily: document.getElementById('font-family').value,
            textColor: document.getElementById('text-color').value,
            outlineColor: document.getElementById('outline-color').value
        };

        generateStackedImage(uploadedImage, lines, options);
    });

    function generateStackedImage(image, lines, options) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Config
        const subtitleAreaRatio = options.subtitleHeightRatio;
        const originalWidth = image.width;
        const originalHeight = image.height;
        const sliceHeight = originalHeight * subtitleAreaRatio;

        // Calculate total height
        const totalHeight = originalHeight + (lines.length - 1) * sliceHeight;

        canvas.width = originalWidth;
        canvas.height = totalHeight;

        // Draw First Block (Full Image)
        ctx.drawImage(image, 0, 0);
        drawSubtitle(ctx, lines[0], originalWidth, originalHeight, sliceHeight, options);

        // Draw Subsequent Blocks
        for (let i = 1; i < lines.length; i++) {
            const yPosition = originalHeight + (i - 1) * sliceHeight;

            // Source: take bottom slice from original image
            const sourceY = originalHeight - sliceHeight;

            ctx.drawImage(
                image,
                0, sourceY, originalWidth, sliceHeight, // Source
                0, yPosition, originalWidth, sliceHeight // Destination
            );

            // Draw subtitle on this slice
            drawSubtitle(ctx, lines[i], originalWidth, yPosition + sliceHeight, sliceHeight, options);
        }

        // Output
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resultImage.src = dataUrl;

        // Populate Original Preview in Comparison
        const originalPreview = document.getElementById('original-preview');
        originalPreview.src = image.src;

        previewSection.hidden = false;

        // Scroll to result
        previewSection.scrollIntoView({ behavior: 'smooth' });

        // Setup download
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = 'cinematic-scene.jpg';
            link.href = dataUrl;
            link.click();
        };
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
