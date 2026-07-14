let docHistory = JSON.parse(localStorage.getItem('app_doc_history')) || [];

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('save-profile-btn').addEventListener('click', saveBusinessProfile);
    document.getElementById('logo-input').addEventListener('change', handleLogoUpload);
    document.getElementById('download-pdf-invoice').addEventListener('click', () => generatePDF('Invoice'));
    document.getElementById('download-pdf-quote').addEventListener('click', () => generatePDF('Quotation'));

    loadProfileDetails();
    renderHistoryLogList();
    generateNextSequentialNumbers();
    
    addItemRow('invoice-items-list');
    addItemRow('quote-items-list');
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('doc-date').value = today;
    document.getElementById('quote-doc-date').value = today;
});

function switchMobilePage(pageId, element) {
    document.querySelectorAll('.app-page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    element.classList.add('active');
}

function generateNextSequentialNumbers() {
    const invoices = docHistory.filter(d => d.type === 'Invoice');
    const quotes = docHistory.filter(d => d.type === 'Quotation');
    
    document.getElementById('invoice-number').value = 'INV-' + String(invoices.length + 1001);
    document.getElementById('quote-number').value = 'QT-' + String(quotes.length + 1001);
}

function addItemRow(containerId) {
    const targetContainer = document.getElementById(containerId);
    const rowId = 'row_' + Date.now() + Math.random().toString(36).substr(2, 4);

    const row = document.createElement('div');
    row.className = 'item-row';
    row.id = rowId;
    row.innerHTML = `
        <input type="text" class="item-desc" placeholder="Service / Item Name" style="flex:2;" required>
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
    const rows = document.getElementById(containerId).querySelectorAll('.item-row');
    rows.forEach(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        grandTotal += qty * price;
    });
    const outputId = containerId === 'invoice-items-list' ? 'invoice-grand-total' : 'quote-grand-total';
    document.getElementById(outputId).innerText = grandTotal.toFixed(2);
}

function generatePDF(type) {
    const isInvoice = type === 'Invoice';
    const prefix = isInvoice ? '' : 'quote-';
    
    const docNum = document.getElementById(isInvoice ? 'invoice-number' : 'quote-number').value;
    const clientName = document.getElementById(`${prefix}client-name`).value || 'Walking Customer';
    const clientPhone = document.getElementById(`${prefix}client-phone`).value || 'N/A';
    const docDate = document.getElementById(`${prefix}doc-date`).value || new Date().toLocaleDateString();
    const itemsContainer = document.getElementById(isInvoice ? 'invoice-items-list' : 'quote-items-list');
    const finalAmount = document.getElementById(isInvoice ? 'invoice-grand-total' : 'quote-grand-total').innerText;

    // Map Dynamic Document Elements
    document.getElementById('pdf-comp-name').innerText = document.getElementById('comp-name').value;
    document.getElementById('pdf-comp-details').innerText = document.getElementById('comp-details').value;
    document.getElementById('pdf-title').innerText = type;
    document.getElementById('pdf-doc-number').innerText = docNum;
    document.getElementById('pdf-client').innerText = clientName;
    document.getElementById('pdf-phone').innerText = clientPhone;
    document.getElementById('pdf-date').innerText = docDate;
    
    const savedLogo = localStorage.getItem('cooltech_logo');
    const pdfLogo = document.getElementById('pdf-logo');
    if (savedLogo) { pdfLogo.src = savedLogo; pdfLogo.style.display = 'block'; } else { pdfLogo.style.display = 'none'; }

    const pdfItems = document.getElementById('pdf-items');
    pdfItems.innerHTML = '';
    
    let itemsLogArray = [];
    const rows = itemsContainer.querySelectorAll('.item-row');
    
    rows.forEach((row, index) => {
        const desc = row.querySelector('.item-desc').value;
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const price = parseFloat(row.querySelector('.item-price').value) || 0;
        const total = qty * price;

        if(desc) {
            itemsLogArray.push({ desc, qty, price });
            const rowBg = index % 2 === 0 ? '#ffffff' : '#fcfcfc';
            pdfItems.innerHTML += `
                <tr style="background-color: ${rowBg}">
                    <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${desc}</td>
                    <td style="text-align: center; padding: 10px; border-bottom: 1px solid #e2e8f0;">${qty}</td>
                    <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e2e8f0;">${price.toFixed(2)}</td>
                    <td style="text-align: right; padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${total.toFixed(2)}</td>
                </tr>
            `;
        }
    });

    document.getElementById('pdf-total-val').innerText = finalAmount;

    // Add Software Credit Row dynamically inside the print template before rendering
    let templateRoot = document.getElementById('pdf-template').querySelector('.pdf-wrapper');
    let dynamicBranding = templateRoot.querySelector('.pdf-footer-branding');
    if (!dynamicBranding) {
        dynamicBranding = document.createElement('div');
        dynamicBranding.className = 'pdf-footer-branding';
        dynamicBranding.innerText = 'Software by MDR';
        templateRoot.appendChild(dynamicBranding);
    }

    if(itemsLogArray.length > 0) {
        saveDocumentToHistory(type, docNum, clientName, finalAmount, docDate);
    }

    const element = document.getElementById('pdf-template');
    element.style.display = 'block';
    
    // Configured configurations to maintain proportions and auto page split elegantly
    const opt = {
        margin:       [12, 12, 12, 12],
        filename:     `${docNum}_${clientName}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().from(element).set(opt).save().then(() => {
        element.style.display = 'none';
        generateNextSequentialNumbers();
    }).catch(err => {
        console.error(err);
        element.style.display = 'none';
    });
}

function saveDocumentToHistory(type, docNum, client, total, date) {
    if(docHistory.some(h => h.docNum === docNum)) return;
    docHistory.unshift({ type, docNum, client, total, date });
    localStorage.setItem('app_doc_history', JSON.stringify(docHistory));
    renderHistoryLogList();
}

function renderHistoryLogList() {
    const container = document.getElementById('history-items-container');
    container.innerHTML = '';

    if(docHistory.length === 0) {
        container.innerHTML = `<p style="text-align:center;color:#999;font-size:13px;padding:20px 0;">No documents inside history log yet.</p>`;
        return;
    }

    docHistory.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-meta">
                <h4>${item.docNum} - ${item.client}</h4>
                <p>${item.type} | ${item.date} | <strong>LKR ${item.total}</strong></p>
            </div>
            <span class="sub-badge ${item.type === 'Invoice' ? 'final' : 'estimate'}">${item.type}</span>
        `;
        container.appendChild(card);
    });
}

function saveBusinessProfile() {
    localStorage.setItem('cooltech_comp_name', document.getElementById('comp-name').value);
    localStorage.setItem('cooltech_comp_details', document.getElementById('comp-details').value);
    document.getElementById('header-title').innerText = document.getElementById('comp-name').value;
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
    if (savedDetails) document.getElementById('comp-details').value = savedDetails;
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
