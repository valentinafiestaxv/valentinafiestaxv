// PEGA AQUÍ TU URL DE GOOGLE APPS SCRIPT
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxGBJcFjnwyspm1GUlX4EYYZorBcOGRGKuSvdxDJpZdxDI6UC6PZPV1RHG8GFU0Dg-30w/exec';

const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('fileInput');
const fileNameLabel = document.getElementById('fileName');
const loader = document.getElementById('loader');
const successMessage = document.getElementById('successMessage');

// Cambiar el texto cuando eligen una foto
fileInput.addEventListener('change', function() {
    if (this.files && this.files.length > 0) {
        fileNameLabel.textContent = "¡Foto seleccionada lista! ✅";
        fileNameLabel.style.color = "#d4af37";
    } else {
        fileNameLabel.textContent = "Toca para elegir una foto 📷";
        fileNameLabel.style.color = "white";
    }
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const file = fileInput.files[0];
    if (!file) {
        alert('Por favor, selecciona una foto primero.');
        return;
    }

    // Ocultar formulario, mostrar carga
    form.style.display = 'none';
    loader.style.display = 'block';

    const reader = new FileReader();
    
    reader.onload = function(event) {
        // Extraer solo la parte base64 de la imagen
        const base64Data = event.target.result.split(',')[1];
        
        // Preparar los datos a enviar
        const formData = new URLSearchParams();
        formData.append('fileContent', base64Data);
        formData.append('filename', 'XV_Valentina_' + new Date().getTime() + '_' + file.name);
        formData.append('mimetype', file.type);

        // Enviar al Apps Script
        fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(result => {
            loader.style.display = 'none';
            if(result.result === 'success') {
                successMessage.style.display = 'block';
            } else {
                alert('Hubo un error guardando la foto. Intenta de nuevo.');
                form.style.display = 'block';
            }
        })
        .catch(error => {
            loader.style.display = 'none';
            alert('Error de conexión. Revisa tu internet.');
            form.style.display = 'block';
        });
    };
    
    // Leer el archivo como Base64
    reader.readAsDataURL(file);
});
