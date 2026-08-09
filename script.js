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
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue;
        
        // Validación de seguridad para videos (máximo aprox. 1 minuto / 60MB)
        if (file.type.startsWith('video/') && file.size > 60 * 1024 * 1024) {
            alert(`El video "${file.name}" supera 1 minuto o es muy pesado. Por favor, elige un video más corto.`);
            continue;
        }

        selectedFiles.push(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const div = document.createElement('div');
            div.className = 'preview-item';
            
            if (file.type.startsWith('video/')) {
                div.innerHTML = `<video src="${e.target.result}" muted></video>`;
            } else {
                div.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            }
            previewContainer.appendChild(div);
        }
        reader.readAsDataURL(file);
    }
    
    if (selectedFiles.length > 0) {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = `Subir ${selectedFiles.length} archivo(s)`;
    }
}

uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = 'Subiendo recuerdos... 🚀';
    statusMessage.className = 'status-message hidden';

    let guestName = guestNameInput.value.trim() || "Fiesta";
    guestName = guestName.replace(/\s+/g, '_');

    try {
        let successCount = 0;
        let failCount = 0;
        const batchSize = 2; // Lotes seguros para procesar rápido

        for (let i = 0; i < selectedFiles.length; i += batchSize) {
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
                    return result.status === 'success';
                } catch (err) {
                    console.error("Error en archivo individual:", err);
                    return false;
                }
            });

            const results = await Promise.all(batchPromises);
            successCount += results.filter(res => res === true).length;
            failCount += results.filter(res => res === false).length;
        }

        if (successCount > 0) {
            statusMessage.textContent = `¡Listo! Se subieron ${successCount} archivos con éxito. ✨`;
            if (failCount > 0) {
                statusMessage.textContent += ` (${failCount} archivo(s) fallaron).`;
            }
            statusMessage.className = 'status-message success';
            selectedFiles = [];
            previewContainer.innerHTML = '';
            submitBtn.querySelector('span').textContent = 'Subir más recuerdos';
        } else {
            throw new Error("No se pudo subir ningún archivo.");
        }

    } catch (err) {
        console.error("Error general:", err);
        statusMessage.textContent = 'La subida tardó demasiado o falló. Intenta subir menos archivos a la vez.';
        statusMessage.className = 'status-message error';
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Reintentar';
    }
});

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
