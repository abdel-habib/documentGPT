const dropZone                  = document.getElementById('drop-zone');
const fileInput                 = document.getElementById('file-input');
const uploadButton              = document.getElementById('upload-button');
const fileList                  = document.getElementById('file-list');
const attachmentSvg             = document.getElementById('attachment-svg');
const chatZone                  = document.getElementById('chat-zone');
const workspaceContainer        = document.getElementById('directory-container');
const chatContainer             = document.getElementById('chat-container');
const directoryDropdown         = document.getElementById('directory-menu');
const generateEmbeddingsButton  = document.getElementById('generate-embeddings');
const documentSearch            = document.getElementById('documents-search');
const topKInput                 = document.getElementById('top-k-input');
const searchResults             = document.getElementById('search-results');
const filesDirectories          = []


// Resize chat input
function resizeTextarea(textarea) {
    textarea.style.height = 'auto'; // Reset height to calculate the new size
    textarea.style.height = `${textarea.scrollHeight}px`; // Set height to scrollHeight
}

// Send chat message
function sendMessage() {
    const inputText = document.getElementById('chat-input-text');
    const message = inputText.value;
    inputText.value = ''; // Clear input field

    inputText.style.height = 'auto'; // Reset textarea height

    // Append user message to chat
    const userMessage = `<div class="user-message"><span>${message}</span></div>`;
    chatZone.innerHTML += userMessage;

    // handle views
    dropZone.style.display = 'none';
    chatZone.classList.remove('d-none');
}

// Fullscreen chat toggle
function fullScreenChat() {
    chatContainer.classList.toggle('col-lg-3');
    chatContainer.classList.toggle('col-lg-12');
    workspaceContainer.classList.toggle('d-none');
}

// Handle file upload logic
function handleFiles(files) {
    const formData = new FormData();
    
    for (const file of files) {
        if (file.type === 'application/pdf') {
            formData.append('files', file);
            const fileItem = document.createElement('span');
            fileItem.textContent = `${file.name}`;
            fileList.appendChild(fileItem);
            attachmentSvg.style.display = 'block';

        } else {
            alert('Only PDF files are allowed.');
        }
    }

    uploadFiles(formData);
}

function uploadFiles(formData) {
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.ok ? console.log('Files uploaded successfully!') : alert('Error uploading files.'))
    .catch(error => {
        console.error('Error:', error);
        alert('Error uploading files.');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Close search results when clicking outside
    document.addEventListener('click', event => {
        if (!event.target.closest('.document-search-wrapper')) {
            searchResults.classList.add('d-none');
        }
    });

    // Event listeners for file input and drop zone
    dropZone.addEventListener('click', () => fileInput.click());
    uploadButton.addEventListener('click', () => fileInput.click());
    
    dropZone.addEventListener('dragover', event => {
        event.preventDefault();
    });
    
    dropZone.addEventListener('drop', event => {
        event.preventDefault();
        handleFiles(event.dataTransfer.files);
    });

    fileInput.addEventListener('change', () => handleFiles(fileInput.files));

    // Directory selection handling
    directoryDropdown.addEventListener('change', async () => {
        const selectedValue = directoryDropdown.value;

        if (selectedValue) {
            try {
                const response = await fetch('/get-pdfs-preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ selectedOption: selectedValue })
                });

                if (response.ok) {
                    const data = await response.json();
                    const foldersGrid = document.getElementById('folders-grid');
                    foldersGrid.innerHTML = ''; // Clear existing folder grid

                    foldersGrid.classList.remove('d-none');

                    data.pdf_files.forEach(element => {
                        const pdfHtml = `
                            <div class="folder-box">
                                <span class="folder-image" style="background-image: url(${element.data_url})"></span>
                                <span class="folder-name">${element.file_name}</span>
                            </div>`;
                        foldersGrid.innerHTML += pdfHtml;

                        filesDirectories.push(element.file_path);
                    });
                } else {
                    console.error('Failed to fetch PDFs:', response.status);
                }
            } catch (error) {
                console.error('Error:', error);
            }
        }
    });

    // Bind resize function to textarea input
    document.getElementById('chat-input-text').addEventListener('input', event => resizeTextarea(event.target));

    // Generate embeddings
    generateEmbeddingsButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/generate-embeddings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ "files_directories": filesDirectories })
            });

            if (response.ok) {
                // const data = await response.json();
                console.log('Embeddings generated');
            } else {
                console.error('Failed to generate embeddings:', response.status);
            }
        } catch (error) {
            console.error('Error:', error);
        }

        }

    );

    // Search for text in documents
    documentSearch.addEventListener('keypress', async () => {
        const searchText = documentSearch.value;
        const top_k = topKInput.value

        // only search when the user presses the enter key
        if (event.key !== 'Enter') return;

        // only search when there is a search text
        if (!searchText || top_k < 1) return;

        try {
            const response = await fetch('/search-documents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ "query": searchText, "top_k": topKInput.value })
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data);

                searchResults.innerHTML = ''; // Clear existing search results
                searchResults.classList.remove('d-none');

                data.forEach(result => {
                    searchResults.innerHTML  += `
                        <div class="result-box">
                            <span>
                                <p class="pdf-name">PDF File: ${result.file_name}</p>
                                <p class="similarity-score">Similarity Score: ${result.similarity}</p>
                            </span>
                            <p>${result.text}</p>
                        </div>
                    `;
                });
            } else {
                console.error('Failed to search documents:', response.status);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    });

    documentSearch.addEventListener('input', () => {
        // Check if the input field is empty
        if (documentSearch.value.trim() === '') {
            searchResults.classList.add('d-none');
        }
    });
    
});
