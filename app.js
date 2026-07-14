if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Fail', err));
    });
}

// Global Event Listeners
document.getElementById('add-item-btn').addEventListener('click', () => addItemRow());
document.getElementById('save-btn').addEventListener('click', saveToLocalStorage);
document.getElementById('save-settings-btn').addEventListener('click', saveBusinessProfile);
document.getElementById('download-pdf-btn').addEventListener('click', generatePDF);
document.getElementById('logo-input').addEventListener('change', loadLogo);
document.getElementById('load-saved-btn').addEventListener('click', reloadSavedDataToEditor);

window.addEventListener('DOMContentLoaded', initializeApp);

// Tab Navigation Logic
function openTab(evt, tabId) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].classList.remove("active");
    }

    document.getElementById(tabId).classList.add("active");
    evt.currentTarget.classList.add("active");
}

function addItemRow(desc = '', qty = 1, price = '') {
    const itemsList = document.getElementById('items-list');
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <input type="text" class="item-desc" placeholder="Service / Job Description" value="${desc}" required>
        <input type="number" class="item-qty" placeholder="Qty" value="${qty}" min="1" required>
        <input type="number" class="item-price" placeholder="Price" value="${price}" required>
        <button type="button" class="btn-danger" onclick="this.parentElement.remove(); calculateTotal();">X</button>
    `;
    itemsList.appendChild(row);
    
    row.querySelector('.item-qty').addEventListener('input', calculateTotal);
    row.querySelector('.item-price').addEventListener('input', calculateTotal);
    calculateTotal();
}

function calculateTotal() {
    let grandTotal = 0;
    const rows = document.querySelectorAll('.item-row');
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        grandTotal += qty * price;
    });
    document.getElementById('grand-total').innerText = grandTotal.toFixed(2);
}

function loadLogo(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logo-preview').style.backgroundImage = `url(${e.target.result})`;
            document.getElementById('logo-preview').innerText = '';
            localStorage.setItem('cooltech_logo', e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

function saveBusinessProfile() {
    const compName = document.getElementById('comp-name').value;
    localStorage.setItem('cooltech_comp_name', compName);
    alert('Business Profile updated successfully!');
}

function saveToLocalStorage() {
    const data = {
        clientName: document.getElementById('client-name').value,
        clientPhone: document.getElementById('client-phone').value,
        docDate: document.getElementById('doc-date').value,
        docType: document.querySelector('input[name="doc-type"]:checked').value,
        totalAmount: document.getElementById('grand-total').innerText,
        items: []
    };

    document.querySelectorAll('.item-row').forEach(row => {
        data.items.push({
            desc: row.querySelector('.item-desc').value,
            qty: row.querySelector('.item-qty').value,
            price: row.querySelector('.item-price').value
        });
    });

    localStorage.setItem('cooltech_saved_invoice', JSON.stringify(data));
    updateSavedRecordsTab(data);
    alert('Document saved successfully offline!');
}

function initializeApp() {
    // Load Saved Profile Data
    const savedLogo = localStorage.getItem('cooltech_logo');
    if (savedLogo) {
        document.getElementById('logo-preview').style.backgroundImage = `url(${savedLogo})`;
        document.getElementById('logo-preview').innerText = '';
    }
    
    const savedCompName = localStorage.getItem('cooltech_comp_name');
    if (savedCompName) {
        document.getElementById('comp-name').value = savedCompName;
    }

    // Load Document Logs
    const savedData = JSON.parse(localStorage.getItem('cooltech_saved_invoice'));
    if (savedData) {
        updateSavedRecordsTab(savedData);
    }
    
    addItemRow(); // Default initial item row
}

function updateSavedRecordsTab(data) {
    document.getElementById('no-data-msg').style.display = 'none';
    document.getElementById('saved-data-details').style.display = 'block';
    document.getElementById('saved-doc-type').innerText = data.docType;
    document.getElementById('saved-client-name').innerText = data.clientName || 'Unknown';
    document.getElementById('saved-total-amount').innerText = data.totalAmount;
}

function reloadSavedDataToEditor() {
    const savedData = JSON.parse(localStorage.getItem('cooltech_saved_invoice'));
    if (savedData) {
        document.getElementById('client-name').value = savedData.clientName || '';
        document.getElementById('client-phone').value = savedData.clientPhone || '';
        document.getElementById('doc-date').value = savedData.docDate || '';
        
        const radioButton = document.querySelector(`input[name="doc-type"][value="${savedData.docType}"]`);
        if (radioButton) radioButton.checked = true;

        const itemsList = document.getElementById('items-list');
        itemsList.innerHTML = ''; // Clear current rows
        
        savedData.items.forEach(item => addItemRow(item.desc, item.qty, item.price));
        
        // Switch to the create document tab automatically
        document.querySelector('[onclick*="create-tab"]').click();
    }
}

function generatePDF() {
    const docType = document.querySelector('input[name="doc-type"]:checked').value;
    
    document.getElementById('pdf-comp-name').innerText = document.getElementById('comp-name').value || 'CoolTech AC Solutions';
    document.getElementById('pdf-title').innerText = docType;
    document.getElementById('pdf-client').innerText = document.getElementById('client-name').value || 'N/A';
    document.getElementById('pdf-phone').innerText = document.getElementById('client-phone').value || 'N/A';
    document.getElementById('pdf-date').innerText = document.getElementById('doc-date').value || new Date().toLocaleDateString();
    
    const savedLogo = localStorage.getItem('cooltech_logo');
    const pdfLogo = document.getElementById('pdf-logo');
    if (savedLogo) {
        pdfLogo.src = savedLogo;
        pdfLogo.style.display = 'block';
    } else {
        pdfLogo.style.display = 'none';
    }

    const pdfItems = document.getElementById('pdf-items');
    pdfItems.innerHTML = '';
    
    document.querySelectorAll('.item-row').forEach(row => {
        const desc = row.querySelector('.item-desc').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = qty * price;

        if(desc) {
            pdfItems.innerHTML += `
                <tr>
                    <td>${desc}</td>
                    <td>${qty}</td>
                    <td>LKR ${price.toFixed(2)}</td>
                    <td>LKR ${total.toFixed(2)}</td>
                </tr>
            `;
        }
    });

    document.getElementById('pdf-total-val').innerText = document.getElementById('grand-total').innerText;

    const element = document.getElementById('pdf-template');
    element.style.display = 'block';
    
    const opt = {
        margin:       10,
        filename:     `${docType}_${document.getElementById('client-name').value || 'Customer'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
        element.style.display = 'none';
    });
}
