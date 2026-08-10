const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz58Q4JqHuFF_iGwk_Rtr4NVXRhTwXH7OBGCPXNm_WRBodVwQ9H3AXWPr-vcWXFhTdfUA/exec"; 

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadForm = document.getElementById('uploadForm');
const submitBtn = document.getElementById('submitBtn');
const previewContainer = document.getElementById('previewContainer');
const statusMessage = document.getElementById('statusMessage');
const guestNameInput = document.getElementById('guestName');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');

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
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
        
        if (file.type.startsWith('video/') && file.size > 60 * 1024 * 1024) {
            alert(`El video "${file.name}" supera 1 minuto o es muy pesado. Elige un video más corto.`);
            continue;
        }

        selectedFiles.push(file);
    }
    renderPreviews();
}

// Función para renderizar las previsualizaciones con botón de borrar individual
function renderPreviews() {
    previewContainer.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            
            let mediaHTML = file.type.startsWith('video/') 
                ? `<video src="${e.target.result}" muted></video>` 
                : `<img src="${e.target.result}" alt="Preview">`;

            div.innerHTML = `
                ${mediaHTML}
                <button type="button" class="delete-btn" onclick="removeFile(${index})">✕</button>
            `;
            previewContainer.appendChild(div);
        }
        reader.readAsDataURL(file);
    });

    if (selectedFiles.length > 0) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = `Subir ${selectedFiles.length} archivo(s)`;
    } else {
        submitBtn.disabled = true;
        submitBtn.querySelector('span').textContent = 'Subir recuerdos';
    }
}

// Función para eliminar un archivo específico de la lista antes de subirlo
window.removeFile = function(index) {
    selectedFiles.splice(index, 1);
    renderPreviews();
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    submitBtn.disabled = true;
    statusMessage.className = 'status-message hidden';
    progressContainer.classList.remove('hidden');

    let guestName = guestNameInput.value.trim() || "Fiesta";
    guestName = guestName.replace(/\s+/g, '_');

    const totalFiles = selectedFiles.length;
    let uploadedCount = 0;
    let failedFiles = [];

    updateProgress(0, totalFiles);

    try {
        const batchSize = 2; 

        for (let i = 0; i < totalFiles; i += batchSize) {
            const batch = selectedFiles.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (file) => {
                try {
                    let base64Data = "";
                    
                    if (file.type.startsWith('image/')) {
                        base64Data = await resizeAndCompressImage(file, 1200, 0.75);
                    } else {
                        base64Data = await toBase64(file);
                    }

                    const base64Clean = base64Data.split(',')[1]; 

                    const formData = new URLSearchParams();
                    formData.append('base64', base64Clean);
                    formData.append('type', file.type);
                    formData.append('name', guestName);

                    const response = await fetch(SCRIPT_URL, {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    if (result.status === 'success') {
                        return { success: true, name: file.name };
                    } else {
                        return { success: false, name: file.name };
                    }
                } catch (err) {
                    console.error("Error en archivo individual:", err);
                    return { success: false, name: file.name };
                }
            });

            const results = await Promise.all(batchPromises);
            
            uploadedCount += batch.length;
            results.forEach(res => {
                if (!res.success) {
                    failedFiles.push(res.name);
                }
            });

            updateProgress(Math.min(uploadedCount, totalFiles), totalFiles);
        }

        progressContainer.classList.add('hidden');
        const successCount = totalFiles - failedFiles.length;

        if (successCount > 0 && failedFiles.length === 0) {
            statusMessage.textContent = `¡Listo! Se subieron los ${successCount} archivos con éxito. ✨`;
            statusMessage.className = 'status-message success';
            selectedFiles = [];
            previewContainer.innerHTML = '';
            submitBtn.querySelector('span').textContent = 'Subir más recuerdos';
        } else if (successCount > 0 && failedFiles.length > 0) {
            statusMessage.textContent = `Se subieron ${successCount}, pero fallaron: ${failedFiles.join(', ')}.`;
            statusMessage.className = 'status-message error';
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Reintentar fallidos';
        } else {
            statusMessage.textContent = `Error al subir los siguientes archivos: ${failedFiles.join(', ')}.`;
            statusMessage.className = 'status-message error';
            submitBtn.disabled = false;
            submitBtn.querySelector('span').textContent = 'Reintentar';
        }

    } catch (err) {
        console.error("Error general:", err);
        progressContainer.classList.add('hidden');
        statusMessage.textContent = 'Hubo un error de conexión general al procesar los archivos.';
        statusMessage.className = 'status-message error';
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Reintentar';
    }
});

function updateProgress(current, total) {
    const percentage = Math.round((current / total) * 100);
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `Subiendo archivo ${current} de ${total} (${percentage}%)`;
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

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

                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
