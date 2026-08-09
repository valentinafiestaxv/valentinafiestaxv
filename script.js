const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz58Q4JqHuFF_iGwk_Rtr4NVXRhTwXH7OBGCPXNm_WRBodVwQ9H3AXWPr-vcWXFhTdfUA/exec"; 

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const previewContainer = document.getElementById('previewContainer');
const statusMessage = document.getElementById('statusMessage');
const guestNameInput = document.getElementById('guestName');

let selectedFiles = [];

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

function handleFiles(files) {
    for (let file of files) {
        if (file.type && !file.type.startsWith('image/')) continue;
        selectedFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            div.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            previewContainer.appendChild(div);
        }
        reader.readAsDataURL(file);
    }
    
    if (selectedFiles.length > 0) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = `Subir ${selectedFiles.length} foto(s)`;
    }
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Subiendo recuerdos... 📸';
    statusMessage.className = 'status-message hidden';

    let guestName = guestNameInput.value.trim() || "Fiesta";
    guestName = guestName.replace(/\s+/g, '_');

    try {
        let successCount = 0;

        // Subimos en bloques de 5 en 5 simultáneamente para volar sin saturar
        const batchSize = 5;
        for (let i = 0; i < selectedFiles.length; i += batchSize) {
            const batch = selectedFiles.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (file) => {
                try {
                    // Comprimimos la imagen antes de pasarla a Base64
                    const compressedBase64 = await resizeAndCompressImage(file, 1200, 0.75);
                    const base64Clean = compressedBase64.split(',')[1]; 

                    const formData = new URLSearchParams();
                    formData.append('base64', base64Clean);
                    formData.append('type', 'image/jpeg'); // Forzamos jpeg comprimido
                    formData.append('name', guestName);

                    const response = await fetch(SCRIPT_URL, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    return result.status === 'success';
                } catch (err) {
                    console.error("Error en archivo individual:", err);
                    return false;
                }
            });

            const results = await Promise.all(batchPromises);
            successCount += results.filter(Boolean).length;
        }

        if (successCount > 0) {
            statusMessage.textContent = `¡Listo! Se subieron ${successCount} fotos exitosamente. ✨`;
            statusMessage.className = 'status-message success';
            selectedFiles = [];
            previewContainer.innerHTML = '';
            submitBtn.querySelector('span').textContent = 'Subir más fotos';
        } else {
            throw new Error("No se pudo subir ninguna foto.");
        }

    } catch (err) {
        console.error("Error general:", err);
        statusMessage.textContent = 'Hubo un error al subir las fotos. Revisa tu conexión.';
        statusMessage.className = 'status-message error';
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Reintentar';
    }
});

// Función mágica para comprimir y reducir la foto antes de enviarla
const resizeAndCompressImage = (file, maxDimension, quality) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxDimension) {
                        height = Math.round((height * maxDimension) / width);
                        width = maxDimension;
                    }
                } else {
                    if (height > maxDimension) {
                        width = Math.round((width * maxDimension) / height);
                        height = maxDimension;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Exporta a JPEG comprimido
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
