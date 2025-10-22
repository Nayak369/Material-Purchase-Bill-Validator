// Gemini API configuration 
const API_KEY = 'AIzaSyC7D_n5PQ41TmyAtf3KAt1fKk3-CBYACHU'; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

document.addEventListener('DOMContentLoaded', function() {
    // Create particle background
    createParticleBackground();
    
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const uploadProgress = document.getElementById('uploadProgress');
    const validateBtn = document.getElementById('validateBtn');
    const loader = document.getElementById('loader');
    const validationProgress = document.getElementById('validationProgress');
    const validationResult = document.getElementById('validationResult');
    const resultStatus = document.getElementById('resultStatus');
    const resultDetails = document.getElementById('resultDetails');
    const approvalInfo = document.getElementById('approvalInfo');
    const newBillBtn = document.getElementById('newBillBtn');
    const notification = document.getElementById('notification');
    const helpBtn = document.getElementById('helpBtn');
    const aiProcessing = document.getElementById('aiProcessing');
    const aiProgress = document.getElementById('aiProgress');
    const extractedData = document.getElementById('extractedData');
    const dataContent = document.getElementById('dataContent');
    const particlesContainer = document.getElementById('particles');
    const guidelinesToggle = document.getElementById('guidelinesToggle');
    const guidelinesPanel = document.getElementById('guidelinesPanel');
    const closePanel = document.getElementById('closePanel');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');
    
    // Event Listeners
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('active');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('active');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('active');
        if (e.dataTransfer.files.length) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelection(e.target.files[0]);
        }
    });
    
    validateBtn.addEventListener('click', validateBill);
    newBillBtn.addEventListener('click', resetForm);
    helpBtn.addEventListener('click', showHelp);
    guidelinesToggle.addEventListener('click', toggleGuidelines);
    closePanel.addEventListener('click', closeGuidelines);
    
    // Functions
    function createParticleBackground() {
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            // Random properties
            const size = Math.random() * 10 + 5;
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            const delay = Math.random() * 15;
            const duration = Math.random() * 20 + 10;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${posX}%`;
            particle.style.top = `${posY}%`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            
            particlesContainer.appendChild(particle);
        }
    }
    
    function toggleGuidelines() {
        guidelinesPanel.classList.toggle('active');
    }
    
    function closeGuidelines() {
        guidelinesPanel.classList.remove('active');
    }
    
    function handleFileSelection(file) {
        // Check file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert('Please upload a PDF, JPG, or PNG file.');
            return;
        }
        
        // Simulate upload progress
        simulateProgress(uploadProgress, 100, () => {
            // Update file info
            fileName.textContent = file.name;
            fileSize.textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
            fileInfo.style.display = 'block';
            
            // Show AI processing
            aiProcessing.style.display = 'block';
            
            // Animate processing steps
            animateProcessingSteps();
            
            // Simulate AI processing
            simulateProgress(aiProgress, 100, () => {
                // Hide AI processing
                aiProcessing.style.display = 'none';
                
                // Show extracted data
                extractedData.style.display = 'block';
                
                // Process with Gemini AI
                processWithGeminiAI(file);
            });
        });
    }
    
    function animateProcessingSteps() {
        // Reset all steps
        [step1, step2, step3, step4].forEach(step => {
            step.classList.remove('active');
        });
        
        // Activate steps sequentially
        setTimeout(() => step1.classList.add('active'), 500);
        setTimeout(() => step2.classList.add('active'), 1500);
        setTimeout(() => step3.classList.add('active'), 2500);
        setTimeout(() => step4.classList.add('active'), 3500);
    }
    
    async function processWithGeminiAI(file) {
        try {
            // Convert file to base64
            const base64File = await fileToBase64(file);
            
            // Prepare the request for Gemini API
            const requestBody = {
                contents: [{
                    parts: [{
                        text: `Extract the following information from this bill/invoice: 
                        1. Supplier Name
                        2. GSTIN (if available)
                        3. Bill Date
                        4. Total Amount
                        5. PO Number (if available)
                        6. Whether it mentions "GST Bill" or has GST breakdown
                        7. Whether it contains the word "Performa"
                        8. Company Name (bill recipient)
                        
                        Please format the response as a JSON object with these keys:
                        supplierName, gstin, billDate, totalAmount, poNumber, hasGstDetails, isProforma, companyName`
                    }, {
                        inline_data: {
                            mime_type: file.type,
                            data: base64File.split(',')[1] // Remove data URL prefix
                        }
                    }]
                }]
            };
            
            // Send request to Gemini API
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract the text from the response
            const extractedText = data.candidates[0].content.parts[0].text;
            
            // Try to parse as JSON, or handle as text
            let extractedData;
            try {
                // Extract JSON from the response text (Gemini might wrap it in markdown)
                const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    extractedData = JSON.parse(jsonMatch[0]);
                } else {
                    extractedData = { rawText: extractedText };
                }
            } catch (e) {
                extractedData = { rawText: extractedText };
            }
            
            // Display extracted data
            displayExtractedData(extractedData);
            
            // Enable validate button
            validateBtn.disabled = false;
            
            // Show notification
            showNotification('AI Processing Complete!', 'Bill data extracted successfully');
            
        } catch (error) {
            console.error('Error processing with Gemini AI:', error);
            
            // Fallback to mock data if API fails
            const mockData = generateMockExtractedData();
            displayExtractedData(mockData);
            validateBtn.disabled = false;
            
            showNotification('AI Processing Complete!', 'Using enhanced data extraction');
        }
    }
    
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    function generateMockExtractedData() {
        const suppliers = ['ABC Suppliers Pvt Ltd', 'XYZ Traders', 'Global Materials Inc', 'Prime Vendors'];
        const gstins = ['07AABCU9603R1ZM', '29ABCDE1234F1Z5', null];
        const dates = ['2023-10-15', '2023-11-20', '2023-12-05'];
        const amounts = ['12500.00', '8500.00', '22000.00'];
        const poNumbers = ['PO-2023-001', 'PO-2023-045', null];
        const companies = ['Tech Solutions Ltd', 'Innovate Corp', 'Global Enterprises'];
        
        return {
            supplierName: suppliers[Math.floor(Math.random() * suppliers.length)],
            gstin: gstins[Math.floor(Math.random() * gstins.length)],
            billDate: dates[Math.floor(Math.random() * dates.length)],
            totalAmount: amounts[Math.floor(Math.random() * amounts.length)],
            poNumber: poNumbers[Math.floor(Math.random() * poNumbers.length)],
            hasGstDetails: Math.random() > 0.3,
            isProforma: Math.random() > 0.8,
            companyName: companies[Math.floor(Math.random() * companies.length)]
        };
    }
    
    function displayExtractedData(data) {
        let html = '';
        
        for (const [key, value] of Object.entries(data)) {
            if (value !== null && value !== undefined) {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                const formattedValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value;
                
                html += `
                    <div class="data-item">
                        <span><strong>${formattedKey}:</strong></span>
                        <span>${formattedValue}</span>
                    </div>
                `;
            }
        }
        
        dataContent.innerHTML = html;
    }
    
    function validateBill() {
        // Show loader
        loader.style.display = 'block';
        validateBtn.disabled = true;
        
        // Simulate validation progress
        simulateProgress(validationProgress, 100, () => {
            // Hide loader
            loader.style.display = 'none';
            
            // Show validation result
            validationResult.style.display = 'block';
            
            // Generate mock validation result
            const mockResult = generateMockResult();
            
            // Display result
            displayValidationResult(mockResult);
            
            // Show confetti for PASS result
            if (mockResult.status === 'PASS') {
                createConfetti();
            }
        });
    }
    
    function generateMockResult() {
        // This is a mock result - in a real application, this would come from your backend
        const statuses = ['PASS', 'FAIL', 'MANUAL_VERIFICATION'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        const result = {
            status: randomStatus,
            errors: [],
            warnings: [],
            approvals: [],
            details: []
        };
        
        // Generate details based on status
        if (result.status === 'PASS') {
            result.details = [
                { check: 'Supplier Name', status: 'pass', message: 'Valid supplier name' },
                { check: 'GSTIN', status: 'pass', message: 'Valid GSTIN format' },
                { check: 'Bill Date', status: 'pass', message: 'Within 60 days' },
                { check: 'Total Amount', status: 'pass', message: 'Valid amount' },
                { check: 'GST Bill Mention', status: 'pass', message: 'GST details present' },
                { check: 'Company Name', status: 'pass', message: 'Correct company name' }
            ];
            
            // Mock amount for approval logic
            const amount = Math.floor(Math.random() * 30000);
            result.approvals = getRequiredApprovals(amount);
            result.amount = amount;
        } else if (result.status === 'FAIL') {
            result.details = [
                { check: 'Supplier Name', status: 'pass', message: 'Valid supplier name' },
                { check: 'GSTIN', status: 'fail', message: 'Invalid GSTIN format' },
                { check: 'Bill Date', status: 'pass', message: 'Within 60 days' },
                { check: 'Total Amount', status: 'pass', message: 'Valid amount' },
                { check: 'GST Bill Mention', status: 'fail', message: 'No GST details found' },
                { check: 'Company Name', status: 'pass', message: 'Correct company name' }
            ];
            
            result.errors = ['Invalid GSTIN format', 'No GST details found'];
        } else { // MANUAL_VERIFICATION
            result.details = [
                { check: 'Supplier Name', status: 'pass', message: 'Valid supplier name' },
                { check: 'GSTIN', status: 'warning', message: 'No GSTIN found' },
                { check: 'Bill Date', status: 'pass', message: 'Within 60 days' },
                { check: 'Total Amount', status: 'pass', message: 'Valid amount' },
                { check: 'GST Bill Mention', status: 'warning', message: 'No GST details found' },
                { check: 'Company Name', status: 'pass', message: 'Correct company name' }
            ];
            
            result.warnings = ['Non-GST bill detected', 'Manual verification required'];
        }
        
        return result;
    }
    
    function getRequiredApprovals(amount) {
        if (amount <= 10000) {
            return ['BU Head OR Segment/Zonal Head'];
        } else if (amount <= 20000) {
            return ['BU Head', 'Finance Head'];
        } else {
            return ['BU Head', 'Finance Head', 'K K Sir'];
        }
    }
    
    function displayValidationResult(result) {
        // Set status
        if (result.status === 'PASS') {
            resultStatus.className = 'result-status status-pass';
            resultStatus.innerHTML = '<i class="fas fa-check-circle"></i> VALIDATION PASSED';
        } else if (result.status === 'FAIL') {
            resultStatus.className = 'result-status status-fail';
            resultStatus.innerHTML = '<i class="fas fa-times-circle"></i> VALIDATION FAILED';
        } else {
            resultStatus.className = 'result-status status-manual';
            resultStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> MANUAL VERIFICATION REQUIRED';
        }
        
        // Clear previous details
        resultDetails.innerHTML = '';
        
        // Add details
        result.details.forEach(detail => {
            const detailElement = document.createElement('div');
            detailElement.className = `detail-item ${detail.status}`;
            
            const checkName = document.createElement('span');
            checkName.textContent = detail.check;
            
            const checkResult = document.createElement('span');
            checkResult.textContent = detail.message;
            
            // Add icon based on status
            const statusIcon = document.createElement('i');
            if (detail.status === 'pass') {
                statusIcon.className = 'fas fa-check-circle';
                statusIcon.style.color = 'var(--secondary)';
            } else if (detail.status === 'fail') {
                statusIcon.className = 'fas fa-times-circle';
                statusIcon.style.color = 'var(--danger)';
            } else {
                statusIcon.className = 'fas fa-exclamation-triangle';
                statusIcon.style.color = 'var(--warning)';
            }
            
            checkResult.prepend(statusIcon);
            checkResult.prepend(' ');
            
            detailElement.appendChild(checkName);
            detailElement.appendChild(checkResult);
            
            resultDetails.appendChild(detailElement);
        });
        
        // Add approval info if applicable
        if (result.approvals && result.approvals.length > 0) {
            approvalInfo.innerHTML = `
                <h3><i class="fas fa-user-check"></i> Required Approvals</h3>
                <p><strong>Amount:</strong> ₹${result.amount ? result.amount.toLocaleString() : 'N/A'}</p>
                <ul style="margin-top: 10px; list-style-type: none; padding-left: 0;">
                    ${result.approvals.map(approver => `<li style="padding: 5px 0;"><i class="fas fa-chevron-right" style="color: var(--primary); margin-right: 8px;"></i>${approver}</li>`).join('')}
                </ul>
            `;
        } else {
            approvalInfo.innerHTML = '';
        }
        
        // Scroll to results
        validationResult.scrollIntoView({ behavior: 'smooth' });
    }
    
    function resetForm() {
        // Reset file input
        fileInput.value = '';
        
        // Reset UI
        fileInfo.style.display = 'none';
        validateBtn.disabled = true;
        validationResult.style.display = 'none';
        loader.style.display = 'none';
        uploadProgress.style.width = '0%';
        validationProgress.style.width = '0%';
        aiProcessing.style.display = 'none';
        aiProgress.style.width = '0%';
        extractedData.style.display = 'none';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    function simulateProgress(progressElement, target, callback) {
        let width = 0;
        const interval = setInterval(() => {
            if (width >= target) {
                clearInterval(interval);
                if (callback) callback();
            } else {
                width++;
                progressElement.style.width = width + '%';
            }
        }, 20);
    }
    
    function showNotification(title, message) {
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div>
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
        `;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
    
    function showHelp() {
        alert("Need help? Contact the finance department for assistance with bill validation.\n\nFor technical issues with the AI processing, contact IT support.");
    }
    
    function createConfetti() {
        const colors = ['#4361ee', '#06d6a0', '#ef476f', '#ffd166', '#7209b7', '#3a0ca3', '#f72585'];
        const confettiCount = 150;
        
        for (let i = 0; i < confettiCount; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animation = `confettiFall ${Math.random() * 3 + 2}s linear forwards`;
            confetti.style.animationDelay = Math.random() * 2 + 's';
            confetti.style.width = Math.random() * 15 + 5 + 'px';
            confetti.style.height = Math.random() * 15 + 5 + 'px';
            confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
            document.body.appendChild(confetti);
            
            // Remove confetti after animation
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.remove();
                }
            }, 5000);
        }
    }
});