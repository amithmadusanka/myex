// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Fail', err));
    });
}

// Global Application State Objects
let itemDatabase = JSON.parse(localStorage.getItem('app_item_db')) || [];

window.addEventListener('DOMContentLoaded', () => {
    // Attach trigger interactions
    document.getElementById('save-db-item-btn').addEventListener('click', saveNewProductToDB);
    document.getElementById('save-profile-btn').addEventListener('click', saveBusinessProfile);
    document.getElementById('logo-input').addEventListener('change', handleLogoUpload);
    document.getElementById('download-pdf-invoice').addEventListener('click', () => generatePDF('Invoice'));
    document.getElementById('download-pdf-quote').addEventListener('click', () => generatePDF('Quotation'));

    // Init UI Setup
    loadProfileDetails();
    renderProductDatabaseList();
    
    // Add default single rows to constructors
    addItemRow('invoice-items-list');
    addItemRow('quote-items-list');
    
    // Auto insert current date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('doc-date').value = today;
    document.getElementById('quote-doc-date').value = today;
});

// Navigation Controller Logic
function switchMobilePage(pageId, element) {
    // Hide all viewports
    document.querySelectorAll('.app-page').forEach(page => page.classList.remove('active'));
    // Deactivate navbar elements
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Render targeted items active
    document.getElementById(pageId).classList.add('active');
    element.classList.add('active');
}

// Dynamic Workspace Row Logic
function addItemRow(containerId) {
    const targetContainer = document.getElementById(containerId);
    const rowId = 'row_' + Date.now() + Math.random().toString(36).substr(2, 4);

    const row = document.createElement('div');
    row.className = 'item-row';
    row.id = rowId;
    row.innerHTML = `
        <input type="text" class="item-desc" placeholder="Item / Service Name" style="flex:2;" required>
        <input type="number" class="item-qty" placeholder="Qty" value="1" style="flex:0.5;" required>
        <input type="number" class="item-price" placeholder="Price" style="flex:1;" required>
        <button type="button" class="btn-del" onclick="document.getElementById('${rowId}').remove(); calculateContainerTotal('${containerId}');">X</button>
    `;
    targetContainer.appendChild(row);

    row.querySelector('.item-qty').addEventListener('input', () => calculateContainerTotal(containerId));
    row.querySelector('.item-price').addEventListener('input', () => calculateContainerTotal(containerId));
}

function calculateContainerTotal(containerId) {
    let grandTotal = 0;
    const container = document.getElementById(containerId);
    const rows = container.querySelectorAll('.item-row');
    
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        grandTotal += qty * price;
    });

    const outputSpanId = containerId === 'invoice-items-list' ? 'invoice-grand-total' : 'quote-grand-total';
    document.getElementById(outputSpanId).innerText = grandTotal.toFixed(2);
}

// Database Product Logic (Page 3)
function saveNewProductToDB() {
    const nameInput = document.getElementById('db-item-name');
    const priceInput = document.getElementById('db-item-price');

    if(!nameInput.value || !priceInput.value) return alert('Please enter both name and price!');

    itemDatabase.push({
        id: Date.now(),
        name: nameInput.value,
        price: parseFloat(priceInput.value).toFixed(2)
    });

    localStorage.setItem('app_item_db', JSON.stringify(itemDatabase));
    nameInput.value = '';
    priceInput.value = '';
    renderProductDatabaseList();
}

function renderProductDatabaseList() {
    const listContainer = document.getElementById('db-items-container');
    listContainer.innerHTML = '';

    if(itemDatabase.length === 0) {
        listContainer.innerHTML = `<p style="text-align:center;color:#999;font-size:13px;padding:10px;">No items inside database yet.</p>`;
        return;
    }

    itemDatabase.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'db-list-item';
        itemElement.innerHTML = `
            <div>
                <strong>${item.name}</strong><br>
                <small style="color:#e67e22;">LKR ${item.price}</small>
            </div>
            <button class="btn-del" onclick="deleteProductFromDB(${item.id})">Remove</button>
        `;
        listContainer.appendChild(itemElement);
    });
}

function deleteProductFromDB(id) {
    itemDatabase = itemDatabase.filter(item => item.id !== id);
    localStorage.setItem('app_item_db', JSON.stringify(itemDatabase));
    renderProductDatabaseList();
}

// Business Configuration Profile Logic (Page 4)
function saveBusinessProfile() {
    const compName = document.getElementById('comp-name').value;
    const compDetails = document.getElementById('comp-details').value;
    
    localStorage.setItem('cooltech_comp_name', compName);
    localStorage.setItem('cooltech_comp_details', compDetails);
    
    document.getElementById('header-title').innerText = compName;
    alert('Profile saved successfully!');
}

function loadProfileDetails() {
    const savedLogo = localStorage.getItem('cooltech_logo');
    if (savedLogo) {
        document.getElementById('logo-preview').style.backgroundImage = `url(${savedLogo})`;
        document.getElementById('logo-preview').innerHTML = '';
    }
    const savedCompName = localStorage.getItem('cooltech_comp_name');
    if (savedCompName) {
        document.getElementById('comp-name').value = savedCompName;
        document.getElementById('header-title').innerText = savedCompName;
    }
    const savedDetails = localStorage.getItem('cooltech_comp_details');
    if (savedDetails) {
        document.getElementById('comp-details').value = savedDetails;
    }
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('logo-preview').style.backgroundImage = `url(${e.target.result})`;
            document.getElementById('logo-preview').innerHTML = '';
            localStorage.setItem('cooltech_logo', e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// PDF Document Generation Engine
function generatePDF(type) {
    const isInvoice = type === 'Invoice';
    const prefix = isInvoice ? '' : 'quote-';
    
    const clientName = document.getElementById(`${prefix}client-name`).value || 'N/A';
    const clientPhone = document.getElementById(`${prefix}client-phone`).value || 'N/A';
    const docDate = document.getElementById(`${prefix}doc-date`).value || new Date().toLocaleDateString();
    const itemsContainer = document.getElementById(isInvoice ? 'invoice-items-list' : 'quote-items-list');

    document.getElementById('pdf-comp-name').innerText = document.getElementById('comp-name').value;
    document.getElementById('pdf-title').innerText = type;
    document.getElementById('pdf-client').innerText = clientName;
    document.getElementById('pdf-phone').innerText = clientPhone;
    document.getElementById('pdf-date').innerText = docDate;
    
    const savedLogo = localStorage.getItem('cooltech_logo');
    const pdfLogo = document.getElementById('pdf-logo');
    if (savedLogo) { pdfLogo.src = savedLogo; pdfLogo.style.display = 'block'; } 
    else { pdfLogo.style.display = 'none'; }

    const pdfItems = document.getElementById('pdf-items');
    pdfItems.innerHTML = '';
    
    const rows = itemsContainer.querySelectorAll('.item-row');
    rows.forEach(row => {
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

    document.getElementById('pdf-total-val').innerText = document.getElementById(isInvoice ? 'invoice-grand-total' : 'quote-grand-total').innerText;

    const element = document.getElementById('pdf-template');
    element.style.display = 'block';
    
    const opt = {
        margin:       10,
        filename:     `${type}_${clientName}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
        element.style.display = 'none';
    });
}
