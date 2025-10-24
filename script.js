// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const uploadProgress = document.getElementById('uploadProgress');
const validateBtn = document.getElementById('validateBtn');
const aiProcessing = document.getElementById('aiProcessing');
const aiProgress = document.getElementById('aiProgress');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');
const step4 = document.getElementById('step4');
const extractedData = document.getElementById('extractedData');
const validationResult = document.getElementById('validationResult');
const resultStatus = document.getElementById('resultStatus');
const statusText = document.getElementById('statusText');
const downloadReportBtn = document.getElementById('downloadReportBtn');
const newBillBtn = document.getElementById('newBillBtn');
const notification = document.getElementById('notification');
const helpBtn = document.getElementById('helpBtn');
const guidelinesToggle = document.getElementById('guidelinesToggle');
const guidelinesPanel = document.getElementById('guidelinesPanel');
const closePanel = document.getElementById('closePanel');
const particles = document.getElementById('particles');
const emptyState = document.getElementById('emptyState');
const billPreview = document.getElementById('billPreview');
const tabItems = document.querySelectorAll('.tab-item');
const tabContents = document.querySelectorAll('.tab-content');
const steps = document.querySelectorAll('.step');
const retryBtn = document.getElementById('retryBtn'); // Add retry button

// Gemini API configuration - using the correct model name
const API_KEY = 'AIzaSyC7D_n5PQ41TmyAtf3KAt1fKk3-CBYACHU';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

// Create particle background
function createParticles() {
    // Clear existing particles
    particles.innerHTML = '';
    
    for (let i = 0; i < 100; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random properties for a more dramatic effect
        const size = Math.random() * 5 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const opacity = Math.random() * 0.8 + 0.2;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;
        const color = Math.random() > 0.5 ? 'rgba(42, 109, 255, 0.8)' : 'rgba(0, 200, 150, 0.8)';
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}%`;
        particle.style.top = `${posY}%`;
        particle.style.opacity = opacity;
        particle.style.animationDuration = `${duration}s`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.boxShadow = `0 0 ${size * 3}px ${size * 2}px ${color}`;
        particle.style.background = color;
        
        particles.appendChild(particle);
    }
}

// Show notification
function showNotification(title, message, type = 'success') {
    const icon = notification.querySelector('i');
    const heading = notification.querySelector('h4');
    const text = notification.querySelector('p');
    
    heading.textContent = title;
    text.textContent = message;
    
    if (type === 'success') {
        icon.className = 'fas fa-check-circle';
        icon.style.color = 'var(--secondary)';
    } else if (type === 'error') {
        icon.className = 'fas fa-exclamation-triangle';
        icon.style.color = 'var(--danger)';
    } else if (type === 'warning') {
        icon.className = 'fas fa-exclamation-circle';
        icon.style.color = 'var(--warning)';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Update step progress
function updateStepProgress(step) {
    steps.forEach((s, index) => {
        if (index <= step) {
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
}

// Extract data from bill using Gemini API
async function extractDataFromBill(file) {
    return new Promise(async (resolve, reject) => {
        try {
            showNotification('Processing', 'Extracting data from your bill using AI...', 'warning');
            
            // Convert file to base64
            const reader = new FileReader();
            reader.onload = async function(e) {
                try {
                    const base64Data = e.target.result.split(',')[1]; // Remove data URL prefix
                    
                    // First, try with the complex prompt and JSON response format
                    let extractedData = await tryExtractWithComplexPrompt(file, base64Data);
                    
                    // If that fails, try with a simpler approach
                    if (!extractedData || Object.values(extractedData).every(val => val === "Not found")) {
                        console.log('Complex extraction failed, trying simple approach...');
                        extractedData = await tryExtractWithSimplePrompt(file, base64Data);
                    }
                    
                    resolve(extractedData);
                } catch (apiError) {
                    console.error('API Processing Error:', apiError);
                    reject(apiError);
                }
            };
            
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('File processing error:', error);
            reject(error);
        }
    });
}

// Try extraction with complex prompt and JSON response format
async function tryExtractWithComplexPrompt(file, base64Data) {
    const requestData = {
        contents: {
            parts: [
                {
                    text: `You are an expert at extracting information from bills and invoices. 
                    Please extract the following information from this bill/invoice and return it in valid JSON format with these exact keys:
                    {
                      "supplierName": "Full legal name of the supplier/company issuing the bill",
                      "billDate": "Date of the bill in DD/MM/YYYY format",
                      "totalAmount": "Total amount of the bill with currency symbol (e.g., ₹12,500.00)",
                      "gstin": "GST Identification Number (15-character alphanumeric) if present, otherwise 'Not found'",
                      "poNumber": "Purchase Order Number if present, otherwise 'Not found'",
                      "companyName": "Name of the company the bill is addressed to"
                    }
                    Only return the JSON object, nothing else. If any information is not found, use "Not found" as the value.
                    Make sure the JSON is properly formatted and valid.`
                },
                {
                    inline_data: {
                        mime_type: file.type,
                        data: base64Data
                    }
                }
            ]
        },
        generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: "application/json"
        }
    };
    
    return await makeApiRequest(requestData);
}

// Try extraction with simple prompt
async function tryExtractWithSimplePrompt(file, base64Data) {
    const requestData = {
        contents: {
            parts: [
                {
                    text: `Extract the following information from this bill/invoice:
                    1. Supplier Name
                    2. Bill Date
                    3. Total Amount
                    4. GSTIN
                    5. PO Number
                    6. Company Name
                    
                    Format your response as a JSON object with these exact keys. If any information is not found, use "Not found" as the value.`
                },
                {
                    inline_data: {
                        mime_type: file.type,
                        data: base64Data
                    }
                }
            ]
        },
        generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024
        }
    };
    
    return await makeApiRequest(requestData);
}

// Make API request to Gemini with retry mechanism
async function makeApiRequest(requestData, maxRetries = 3) {
    console.log('Sending request to Gemini API...');
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });
            
            console.log(`API response status (attempt ${attempt}):`, response.status);
            
            // Handle specific HTTP status codes
            if (response.status === 401) {
                throw new Error('Invalid API key. Please check your Gemini API configuration.');
            }
            
            if (response.status === 404) {
                throw new Error('Invalid model name. Please check the Gemini model configuration.');
            }
            
            if (response.status === 429) {
                throw new Error('API quota exceeded. Please try again later.');
            }
            
            if (response.status === 503) {
                const errorText = await response.text().catch(() => '');
                let errorData = {};
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // If parsing fails, use the raw text
                    errorData.error = { message: errorText };
                }
                
                if (errorData && errorData.error && errorData.error.message && errorData.error.message.includes('overloaded')) {
                    // Model is overloaded, wait and retry
                    const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
                    console.log(`Model overloaded. Retrying in ${waitTime}ms... (attempt ${attempt}/${maxRetries})`);
                    showNotification('Model Overloaded', `AI model is busy. Retrying in ${waitTime/1000} seconds... (Attempt ${attempt}/${maxRetries})`, 'warning');
                    
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                        continue; // Retry
                    } else {
                        throw new Error('Model is currently overloaded. Please try again later.');
                    }
                } else {
                    throw new Error(`Service unavailable. ${errorData.error?.message || 'Please try again later.'}`);
                }
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }
            
            const result = await response.json();
            console.log('API Response:', JSON.stringify(result, null, 2));
            
            // Check if we have a valid response
            if (!result || !result.candidates || result.candidates.length === 0) {
                throw new Error('No valid response from AI model. Please try again.');
            }
            
            // Check for blocked content
            if (result.candidates[0].finishReason === 'SAFETY') {
                throw new Error('Content was blocked due to safety concerns. Please try with a different bill.');
            }
            
            // Extract the text response with proper null checking
            if (!result.candidates[0] || !result.candidates[0].content || !result.candidates[0].content.parts || result.candidates[0].content.parts.length === 0) {
                throw new Error('No content returned from AI model. Please try again.');
            }
            
            const textResponse = result.candidates[0].content.parts[0].text || '';
            console.log('Raw API Text Response:', textResponse);
            
            // Check if we have a response
            if (!textResponse || textResponse.trim().length === 0) {
                if (attempt < maxRetries) {
                    // Wait before retrying
                    const waitTime = Math.pow(2, attempt) * 500;
                    console.log(`Empty response. Retrying in ${waitTime}ms... (attempt ${attempt}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    continue;
                } else {
                    throw new Error('Empty response from AI model. The bill may be unclear or unreadable.');
                }
            }
            
            // Try to parse as JSON directly first
            try {
                const extractedData = JSON.parse(textResponse);
                console.log('Successfully parsed JSON directly');
                return extractedData;
            } catch (directParseError) {
                console.log('Direct JSON parsing failed, trying cleanup...');
                try {
                    // Clean up the response and parse JSON
                    let cleanedResponse = textResponse
                        .replace(/```json/g, '')
                        .replace(/```javascript/g, '')
                        .replace(/```/g, '')
                        .trim();
                    
                    // Handle case where response might be wrapped in additional text
                    const jsonStart = cleanedResponse.indexOf('{');
                    const jsonEnd = cleanedResponse.lastIndexOf('}') + 1;
                    
                    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                        const jsonString = cleanedResponse.substring(jsonStart, jsonEnd);
                        const extractedData = JSON.parse(jsonString);
                        console.log('Successfully parsed cleaned JSON');
                        return extractedData;
                    } else {
                        throw new Error('No valid JSON object found in response');
                    }
                } catch (parseError) {
                    // If JSON parsing fails, try to extract data manually
                    console.error('JSON parsing failed:', parseError);
                    console.log('Attempting manual extraction...');
                    
                    // Try to extract data manually from the text
                    const extractedData = extractDataManually(textResponse);
                    console.log('Manual extraction result:', extractedData);
                    return extractedData;
                }
            }
        } catch (error) {
            // For network errors or other issues, retry if not the last attempt
            if (attempt === maxRetries) {
                throw error; // Re-throw if this was the last attempt
            }
            
            // For other errors, wait and retry
            const waitTime = Math.pow(2, attempt) * 1000;
            console.log(`Request failed. Retrying in ${waitTime}ms... (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
}

// Helper function to extract data manually if JSON parsing fails
function extractDataManually(text) {
    // Initialize with default values
    const data = {
        supplierName: "Not found",
        billDate: "Not found",
        totalAmount: "Not found",
        gstin: "Not found",
        poNumber: "Not found",
        companyName: "Not found"
    };
    
    // Check if text is valid
    if (!text || typeof text !== 'string') {
        console.warn('Invalid text input for manual extraction');
        return data;
    }
    
    try {
        // Normalize text by removing extra whitespace and handling common OCR issues
        let normalizedText = text.replace(/\s+/g, ' ').trim();
        
        // Handle common OCR issues with handwritten text
        normalizedText = normalizedText
            .replace(/\n/g, ' ') // Replace newlines with spaces
            .replace(/\s{2,}/g, ' ') // Remove multiple spaces
            .replace(/\\n/g, ' ') // Handle escaped newlines
            .replace(/\\r/g, ' ') // Handle escaped carriage returns
            .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
            .trim();
        
        // If text is empty after normalization, return default data
        if (!normalizedText) {
            return data;
        }
        
        // Try to extract each field using enhanced regex patterns for handwritten content
        // Supplier Name extraction - enhanced for handwritten text
        const supplierPatterns = [
            /(?:supplier|vendor|from)[:\s]*([^\n\r]{3,150}?)(?=\n|$)/i,
            /(?:m\/s|m\/s\.|messrs)[:\s]*([^\n\r]{3,150}?)(?=\n|$)/i,
            /(?:issued by|by)[:\s]*([^\n\r]{3,150}?)(?=\n|$)/i,
            /(?:supplier\s*name)[:\s]*([^\n\r]{3,150}?)(?=\n|$)/i,
            // More flexible patterns for handwritten content
            /(?:m\/?s)[:\s]*([A-Z][a-zA-Z\s&.,\-]{5,150}?)(?=\n|$)/i,
            /([A-Z][a-zA-Z\s&.,\-]{5,150}?)(?:\s*bill\s*no)/i,
            // Handle common variations in handwritten bills
            /(?:from)[:\s]*([A-Z][a-zA-Z\s&.,\-]{5,150}?)(?=\s*(?:date|bill|inv))/i,
            /([A-Z][a-zA-Z\s&.,\-]{8,150}?)(?:\s*date\s*:)/i,
            // More specific patterns for Indian suppliers
            /m\/s\s+([A-Z][a-zA-Z\s&.,\-()\/]{5,150}?)(?=\s*(?:date|bill|inv|gst))/i
        ];
        
        for (const pattern of supplierPatterns) {
            const supplierMatch = normalizedText.match(pattern);
            if (supplierMatch && supplierMatch[1] && supplierMatch[1].trim()) {
                let supplierName = supplierMatch[1].trim()
                    .replace(/[^\w\s\-\.&'()/]/g, '')
                    .replace(/\s{2,}/g, ' ')
                    .substring(0, 100);
                
                // Additional cleaning for handwritten text
                supplierName = supplierName
                    .replace(/^[\d\s\-\.]+/, '') // Remove leading numbers/dots
                    .replace(/[\d\-\.]+$/, '') // Remove trailing numbers/dots
                    .replace(/\s{2,}/g, ' ') // Remove multiple spaces
                    .trim();
                
                // Validate that we have a reasonable supplier name
                if (supplierName.length > 3 && !/^\d+$/.test(supplierName)) {
                    data.supplierName = supplierName;
                    break;
                }
            }
        }
        
        // Bill Date extraction - enhanced for handwritten text
        const datePatterns = [
            /(?:date|dated)[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
            /(?:date|dated)[:\s]*([0-9]{2,4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/i,
            /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
            // More flexible patterns for handwritten dates
            /(\d{1,2}[\s\/\-\.]\d{1,2}[\s\/\-\.]\d{2,4})/i,
            /(\d{1,2}[\/\-\.]\s*\d{1,2}[\/\-\.]\s*\d{2,4})/i,
            // Handle common date formats in handwritten bills
            /(?:dt|dtd)[:\s]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i,
            /([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i,
            // More specific patterns for Indian date formats
            /date\s*:\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i
        ];
        
        for (const pattern of datePatterns) {
            const dateMatch = normalizedText.match(pattern);
            if (dateMatch && dateMatch[1] && dateMatch[1].trim()) {
                let dateStr = dateMatch[1].trim()
                    .replace(/\s+/g, '') // Remove spaces in dates
                    .replace(/\\./g, '/') // Replace dots with slashes
                    .replace(/\\/g, '/') // Replace backslashes with slashes
                    .trim();
                
                // Validate date format
                if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(dateStr) || 
                    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(dateStr)) {
                    data.billDate = dateStr;
                    break;
                }
            }
        }
        
        // Total Amount extraction - enhanced for handwritten text
        const amountPatterns = [
            /(?:total|grand\s*total|amount\s*payable)[:\s]*[₹$€£]?\s*([0-9,]+\.?[0-9]*)/i,
            /(?:total|grand\s*total)[:\s]*[₹$€£]?\s*([0-9,]+\.?[0-9]*)/i,
            /[₹$€£]\s*([0-9,]+\.?[0-9]*)/i,
            // More flexible patterns for handwritten amounts
            /(?:rs\.?|inr)[:\s]*([0-9,]+\.?[0-9]*)/i,
            /([0-9,]+\.?[0-9]*)\s*(?:only|\/-)/i,
            /(?:amount)[:\s]*([0-9,]+\.?[0-9]*)/i,
            // Handle common variations in handwritten bills
            /(?:bill\s*amount)[:\s]*[₹$€£]?\s*([0-9,]+\.?[0-9]*)/i,
            /(?:net\s*amount)[:\s]*[₹$€£]?\s*([0-9,]+\.?[0-9]*)/i,
            // More specific patterns for Indian currency
            /total\s*[:\s]*[₹]?\s*([0-9,]+\.?[0-9]*)/i
        ];
        
        for (const pattern of amountPatterns) {
            const amountMatch = normalizedText.match(pattern);
            if (amountMatch && amountMatch[1] && amountMatch[1].trim()) {
                let amountStr = amountMatch[1].trim().replace(/,/g, '');
                // Validate it's a number
                if (!isNaN(parseFloat(amountStr)) && parseFloat(amountStr) > 0) {
                    data.totalAmount = `₹${amountMatch[1].trim()}`;
                    break;
                }
            }
        }
        
        // GSTIN extraction - enhanced for handwritten text
        const gstinPatterns = [
            /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1}\b/i,
            // More flexible patterns for handwritten GSTIN
            /(?:gst|gstin)[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1})/i,
            /([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1})/i,
            // Handle common variations in handwritten bills
            /(?:gst\s*in)[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1})/i,
            // More specific patterns for Indian GSTIN
            /gstin\s*:\s*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}[Z]{1}[0-9A-Z]{1})/i
        ];
        
        for (const pattern of gstinPatterns) {
            const gstinMatch = normalizedText.match(pattern);
            if (gstinMatch && gstinMatch[1]) {
                const gstin = gstinMatch[1].trim().toUpperCase();
                // Validate GSTIN format (15 characters)
                if (gstin.length === 15 && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
                    data.gstin = gstin;
                    break;
                }
            }
        }
        
        // PO Number extraction - enhanced for handwritten text
        const poPatterns = [
            /(?:po|purchase\s*order)[:\s]*([A-Z0-9\-\/]{4,20})/i,
            /(?:p\.o\.|p\.o)[:\s]*([A-Z0-9\-\/]{4,20})/i,
            /(?:order\s*no)[:\s]*([A-Z0-9\-\/]{4,20})/i,
            // More flexible patterns for handwritten PO numbers
            /([A-Z0-9]{4,20})\s*(?:dt|dated)/i,
            /(?:ref|reference)[:\s]*([A-Z0-9\-\/]{4,20})/i,
            // Handle common variations in handwritten bills
            /(?:p\.?\s*o\.?)[:\s]*([A-Z0-9\-\/]{4,20})/i,
            /(?:purchase\s*order\s*no)[:\s]*([A-Z0-9\-\/]{4,20})/i,
            // More specific patterns for Indian PO numbers
            /po\s*no\s*[:\s]*([A-Z0-9\-\/]{4,20})/i
        ];
        
        for (const pattern of poPatterns) {
            const poMatch = normalizedText.match(pattern);
            if (poMatch && poMatch[1] && poMatch[1].trim()) {
                const poNumber = poMatch[1].trim().toUpperCase();
                // Validate PO number (at least 4 characters)
                if (poNumber.length >= 4 && poNumber.length <= 20) {
                    data.poNumber = poNumber;
                    break;
                }
            }
        }
        
        // Company Name extraction (look for "To" or "Bill To" sections) - enhanced for handwritten text
        const companyPatterns = [
            /(?:to|bill\s*to)[:\s]*([^\n\r]{3,150}?)(?=\n|$)/i,
            /(?:m\/s|m\/s\.|messrs)[:\s]*([^\n\r]{3,150}?)(?=\n|$)/i,
            // More flexible patterns for handwritten company names
            /([A-Z][a-zA-Z\s&.,\-]{5,150}?)(?:\s*gst\s*in)/i,
            /(?:m\/?s)[:\s]*([A-Z][a-zA-Z\s&.,\-]{5,150}?)(?=\n|$)/i,
            // Handle common variations in handwritten bills
            /(?:to[:\s]*)([A-Z][a-zA-Z\s&.,\-]{5,150}?)(?=\s*(?:gst|bill|inv))/i,
            /([A-Z][a-zA-Z\s&.,\-]{8,150}?)(?:\s*gstin\s*:)/i,
            // More specific patterns for Indian companies
            /to\s*[:\s]*([A-Z][a-zA-Z\s&.,\-()\/]{5,150}?)(?=\s*(?:gst|bill|inv))/i
        ];
        
        for (const pattern of companyPatterns) {
            const companyMatch = normalizedText.match(pattern);
            if (companyMatch && companyMatch[1] && companyMatch[1].trim()) {
                let companyName = companyMatch[1].trim()
                    .replace(/[^\w\s\-\.&'()/]/g, '')
                    .replace(/\s{2,}/g, ' ')
                    .substring(0, 100);
                
                // Additional cleaning for handwritten text
                companyName = companyName
                    .replace(/^[\d\s\-\.]+/, '') // Remove leading numbers/dots
                    .replace(/[\d\-\.]+$/, '') // Remove trailing numbers/dots
                    .replace(/\s{2,}/g, ' ') // Remove multiple spaces
                    .trim();
                
                // Validate that we have a reasonable company name
                if (companyName.length > 3 && !/^\d+$/.test(companyName)) {
                    data.companyName = companyName;
                    break;
                }
            }
        }
    } catch (error) {
        console.error('Error in manual extraction:', error);
        // Return default data in case of error
    }
    
    return data;
}

// Function to determine if the extracted data represents a valid material purchase bill
function isMaterialPurchaseBill(billData) {
    // Check if we have the minimum required fields for a material purchase bill
    const hasSupplier = billData.supplierName && billData.supplierName !== "Not found" && billData.supplierName !== "Extraction failed";
    const hasDate = billData.billDate && billData.billDate !== "Not found" && billData.billDate !== "Extraction failed";
    const hasAmount = billData.totalAmount && billData.totalAmount !== "Not found" && billData.totalAmount !== "Extraction failed";
    
    // A valid material purchase bill should have at least supplier, date, and amount
    if (!hasSupplier || !hasDate || !hasAmount) {
        return false;
    }
    
    // Additional checks for valid data
    // Check supplier name length
    if (billData.supplierName.length < 3) {
        return false;
    }
    
    // Check date format
    const dateRegex = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/;
    if (!dateRegex.test(billData.billDate)) {
        return false;
    }
    
    // Check amount format
    const amountRegex = /[₹$€£]?\s*([0-9,]+\.?[0-9]*)/;
    if (!amountRegex.test(billData.totalAmount)) {
        return false;
    }
    
    // Check for prohibited terms
    const prohibitedTerms = ['proforma', 'estimate', 'draft', 'quotation', 'quote'];
    const billText = `${billData.supplierName} ${billData.billDate} ${billData.totalAmount} ${billData.gstin || ''} ${billData.companyName || ''}`.toLowerCase();
    
    const foundProhibitedTerm = prohibitedTerms.find(term => billText.includes(term));
    if (foundProhibitedTerm) {
        return false;
    }
    
    return true;
}

// Enhanced processBillWithAI function to check if the document is a valid bill
function processBillWithAI(file) {
    updateStepProgress(1);
    
    // Show AI processing UI
    aiProcessing.style.display = 'block';
    extractedData.style.display = 'none';
    retryBtn.style.display = 'none'; // Hide retry button initially
    
    // Hide error and manual verification notices
    const processingError = document.getElementById('processingError');
    const manualVerificationNotice = document.getElementById('manualVerificationNotice');
    if (processingError) processingError.style.display = 'none';
    if (manualVerificationNotice) manualVerificationNotice.style.display = 'none';
    
    // Validate file before processing
    const errorMessage = validateFile(file);
    if (errorMessage) {
        handleFileError(errorMessage);
        return;
    }
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        if (aiProgress) {
            aiProgress.style.width = `${progress}%`;
        }
        
        if (progress >= 25 && step1) step1.classList.add('active');
        if (progress >= 50 && step2) step2.classList.add('active');
        if (progress >= 75 && step3) step3.classList.add('active');
        if (progress >= 100 && step4) {
            step4.classList.add('active');
            clearInterval(interval);
            
            // Extract data from the uploaded file using Gemini API
            extractDataFromBill(file)
                .then(data => {
                    console.log('Extracted Data:', data);
                    
                    // Check if this is a valid material purchase bill
                    if (!isMaterialPurchaseBill(data)) {
                        // This doesn't appear to be a valid material purchase bill
                        throw new Error("This document does not appear to be a valid material purchase bill. Please upload a proper bill document with supplier name, date, and total amount.");
                    }
                    
                    // Check if we have meaningful data or if it's mostly empty
                    const hasMeaningfulData = data && (
                        (data.supplierName && data.supplierName !== "Not found") ||
                        (data.billDate && data.billDate !== "Not found") ||
                        (data.totalAmount && data.totalAmount !== "Not found")
                    );
                    
                    // Show manual verification notice if data is sparse
                    if (!hasMeaningfulData && manualVerificationNotice) {
                        manualVerificationNotice.style.display = 'block';
                    }
                    
                    // Update the UI with extracted data (with null checks)
                    const supplierNameEl = document.getElementById('supplierName');
                    if (supplierNameEl) {
                        supplierNameEl.textContent = (data && data.supplierName) || "Not found";
                    }
                    
                    const billDateEl = document.getElementById('billDate');
                    if (billDateEl) {
                        billDateEl.textContent = (data && data.billDate) || "Not found";
                    }
                    
                    const totalAmountEl = document.getElementById('totalAmount');
                    if (totalAmountEl) {
                        totalAmountEl.textContent = (data && data.totalAmount) || "Not found";
                    }
                    
                    const gstinEl = document.getElementById('gstin');
                    if (gstinEl) {
                        gstinEl.textContent = (data && data.gstin) || "Not found";
                    }
                    
                    const poNumberEl = document.getElementById('poNumber');
                    if (poNumberEl) {
                        poNumberEl.textContent = (data && data.poNumber) || "Not found";
                    }
                    
                    const companyNameEl = document.getElementById('companyName');
                    if (companyNameEl) {
                        companyNameEl.textContent = (data && data.companyName) || "Not found";
                    }
                    
                    // Update extraction status based on data (with null checks)
                    const poStatusEl = document.getElementById('poStatus');
                    const poConfidenceEl = document.getElementById('poConfidence');
                    const poConfidenceTextEl = document.querySelector('#poNumber + .data-confidence');
                    
                    if (poStatusEl && poConfidenceEl && poConfidenceTextEl) {
                        if (!data || !data.poNumber || data.poNumber === "Not found") {
                            poStatusEl.className = 'extraction-status warning';
                            poStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Not found in document</span>';
                            poConfidenceEl.style.width = '0%';
                            poConfidenceTextEl.textContent = '0% confidence';
                        } else {
                            poStatusEl.className = 'extraction-status success';
                            poStatusEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Successfully extracted</span>';
                            poConfidenceEl.style.width = '95%';
                            poConfidenceTextEl.textContent = '95% confidence';
                        }
                    }
                    
                    // Update other status indicators
                    const supplierStatusEl = document.getElementById('supplierStatus');
                    const supplierConfidenceEl = document.getElementById('supplierConfidence');
                    const supplierConfidenceTextEl = document.querySelector('#supplierName + .data-confidence');
                    
                    if (supplierStatusEl && supplierConfidenceEl && supplierConfidenceTextEl) {
                        if (data && data.supplierName && data.supplierName !== "Not found") {
                            supplierStatusEl.className = 'extraction-status success';
                            supplierStatusEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Successfully extracted</span>';
                            supplierConfidenceEl.style.width = '95%';
                            supplierConfidenceTextEl.textContent = '95% confidence';
                        } else if (!hasMeaningfulData) {
                            supplierStatusEl.className = 'extraction-status warning';
                            supplierStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Manual verification required</span>';
                            supplierConfidenceEl.style.width = '30%';
                            supplierConfidenceTextEl.textContent = '30% confidence';
                        } else {
                            supplierStatusEl.className = 'extraction-status error';
                            supplierStatusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Extraction failed</span>';
                            supplierConfidenceEl.style.width = '0%';
                            supplierConfidenceTextEl.textContent = '0% confidence';
                        }
                    }
                    
                    const dateStatusEl = document.getElementById('dateStatus');
                    const dateConfidenceEl = document.getElementById('dateConfidence');
                    const dateConfidenceTextEl = document.querySelector('#billDate + .data-confidence');
                    
                    if (dateStatusEl && dateConfidenceEl && dateConfidenceTextEl) {
                        if (data && data.billDate && data.billDate !== "Not found") {
                            dateStatusEl.className = 'extraction-status success';
                            dateStatusEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Successfully extracted</span>';
                            dateConfidenceEl.style.width = '95%';
                            dateConfidenceTextEl.textContent = '95% confidence';
                        } else if (!hasMeaningfulData) {
                            dateStatusEl.className = 'extraction-status warning';
                            dateStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Manual verification required</span>';
                            dateConfidenceEl.style.width = '30%';
                            dateConfidenceTextEl.textContent = '30% confidence';
                        } else {
                            dateStatusEl.className = 'extraction-status error';
                            dateStatusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Extraction failed</span>';
                            dateConfidenceEl.style.width = '0%';
                            dateConfidenceTextEl.textContent = '0% confidence';
                        }
                    }
                    
                    const amountStatusEl = document.getElementById('amountStatus');
                    const amountConfidenceEl = document.getElementById('amountConfidence');
                    const amountConfidenceTextEl = document.querySelector('#totalAmount + .data-confidence');
                    
                    if (amountStatusEl && amountConfidenceEl && amountConfidenceTextEl) {
                        if (data && data.totalAmount && data.totalAmount !== "Not found") {
                            amountStatusEl.className = 'extraction-status success';
                            amountStatusEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Successfully extracted</span>';
                            amountConfidenceEl.style.width = '95%';
                            amountConfidenceTextEl.textContent = '95% confidence';
                        } else if (!hasMeaningfulData) {
                            amountStatusEl.className = 'extraction-status warning';
                            amountStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Manual verification required</span>';
                            amountConfidenceEl.style.width = '30%';
                            amountConfidenceTextEl.textContent = '30% confidence';
                        } else {
                            amountStatusEl.className = 'extraction-status error';
                            amountStatusEl.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Extraction failed</span>';
                            amountConfidenceEl.style.width = '0%';
                            amountConfidenceTextEl.textContent = '0% confidence';
                        }
                    }
                    
                    const gstinStatusEl = document.getElementById('gstinStatus');
                    const gstinConfidenceEl = document.getElementById('gstinConfidence');
                    const gstinConfidenceTextEl = document.querySelector('#gstin + .data-confidence');
                    
                    if (gstinStatusEl && gstinConfidenceEl && gstinConfidenceTextEl) {
                        if (data && data.gstin && data.gstin !== "Not found") {
                            gstinStatusEl.className = 'extraction-status success';
                            gstinStatusEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Successfully extracted</span>';
                            gstinConfidenceEl.style.width = '95%';
                            gstinConfidenceTextEl.textContent = '95% confidence';
                        } else if (!hasMeaningfulData) {
                            gstinStatusEl.className = 'extraction-status warning';
                            gstinStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Manual verification required</span>';
                            gstinConfidenceEl.style.width = '30%';
                            gstinConfidenceTextEl.textContent = '30% confidence';
                        } else {
                            gstinStatusEl.className = 'extraction-status warning';
                            gstinStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Not found in document</span>';
                            gstinConfidenceEl.style.width = '0%';
                            gstinConfidenceTextEl.textContent = '0% confidence';
                        }
                    }
                    
                    const companyStatusEl = document.getElementById('companyStatus');
                    const companyConfidenceEl = document.getElementById('companyConfidence');
                    const companyConfidenceTextEl = document.querySelector('#companyName + .data-confidence');
                    
                    if (companyStatusEl && companyConfidenceEl && companyConfidenceTextEl) {
                        if (data && data.companyName && data.companyName !== "Not found") {
                            companyStatusEl.className = 'extraction-status success';
                            companyStatusEl.innerHTML = '<i class="fas fa-check-circle"></i><span>Successfully extracted</span>';
                            companyConfidenceEl.style.width = '95%';
                            companyConfidenceTextEl.textContent = '95% confidence';
                        } else if (!hasMeaningfulData) {
                            companyStatusEl.className = 'extraction-status warning';
                            companyStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Manual verification required</span>';
                            companyConfidenceEl.style.width = '30%';
                            companyConfidenceTextEl.textContent = '30% confidence';
                        } else {
                            companyStatusEl.className = 'extraction-status warning';
                            companyStatusEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Not found in document</span>';
                            companyConfidenceEl.style.width = '0%';
                            companyConfidenceTextEl.textContent = '0% confidence';
                        }
                    }
                    
                    setTimeout(() => {
                        if (aiProcessing) aiProcessing.style.display = 'none';
                        if (extractedData) extractedData.style.display = 'block';
                        if (validateBtn) validateBtn.style.display = 'flex';
                        
                        if (hasMeaningfulData) {
                            showNotification('AI Processing Complete', 'Data extracted successfully from your bill.');
                        } else {
                            showNotification('Manual Verification Required', 'The bill appears to be handwritten or unclear. Please review the extracted data carefully.', 'warning');
                        }
                        
                        // Switch to extracted data tab
                        switchTab('extracted');
                    }, 1000);
                })
                .catch(error => {
                    console.error('Error extracting data:', error);
                    
                    // Handle specific error messages
                    let errorMessage = 'Failed to extract data. Please try again.';
                    if (error.message && error.message.includes('overloaded')) {
                        errorMessage = 'AI model is currently busy. Please wait a moment and try again.';
                        if (retryBtn) {
                            retryBtn.style.display = 'block'; // Show retry button
                            retryBtn.onclick = () => processBillWithAI(file); // Set retry functionality
                        }
                    } else if (error.message && error.message.includes('API request failed')) {
                        errorMessage = 'Connection error. Please check your internet connection and try again.';
                    } else if (error.message && error.message.includes('quota')) {
                        errorMessage = 'API quota exceeded. Please try again later.';
                    } else if (error.message && error.message.includes('safety')) {
                        errorMessage = 'Content blocked for safety reasons. Please try with a different bill.';
                    } else if (error.message) {
                        errorMessage = error.message;
                    }
                    
                    // Show error in UI
                    if (processingError) {
                        processingError.style.display = 'block';
                        const errorMessageText = document.getElementById('errorMessageText');
                        if (errorMessageText) {
                            errorMessageText.textContent = errorMessage;
                        }
                    }
                    
                    showNotification('Processing Error', errorMessage, 'error');
                    
                    // Show error state in UI
                    if (aiProcessing) aiProcessing.style.display = 'none';
                    if (extractedData) extractedData.style.display = 'block';
                    if (validateBtn) validateBtn.style.display = 'flex';
                    
                    // Set all fields to error state
                    document.querySelectorAll('.extraction-status').forEach(status => {
                        if (status) {
                            status.className = 'extraction-status error';
                            status.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>Extraction failed</span>';
                        }
                    });
                    
                    document.querySelectorAll('.confidence-level').forEach(level => {
                        if (level) {
                            level.style.width = '0%';
                        }
                    });
                    
                    document.querySelectorAll('.data-confidence').forEach(conf => {
                        if (conf) {
                            conf.textContent = '0% confidence';
                        }
                    });
                    
                    document.querySelectorAll('[id$="Name"], [id$="Date"], [id$="Amount"], [id$="Number"], [id$="gstin"], [id$="companyName"]').forEach(el => {
                        if (el) {
                            el.textContent = "Extraction failed";
                        }
                    });
                });
        }
    }, 50);
}

// Validate file before processing
function validateFile(file) {
    // Check if file exists
    if (!file) {
        return 'No file selected. Please select a bill to upload.';
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        return 'File is too large. Maximum file size is 10MB.';
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
        return 'Unsupported file format. Please upload a PDF, JPG, or PNG file.';
    }
    
    // Additional check for file name to ensure it's likely a bill
    const fileName = file.name.toLowerCase();
    const billKeywords = ['bill', 'invoice', 'purchase', 'material', 'order'];
    const excludedKeywords = ['proforma', 'estimate', 'draft', 'quotation', 'quote'];
    
    // Check if file name contains excluded keywords
    const hasExcludedKeyword = excludedKeywords.some(keyword => fileName.includes(keyword));
    if (hasExcludedKeyword) {
        return 'This appears to be a Proforma Invoice, Estimate, or Draft document. Please upload a valid purchase bill.';
    }
    
    // Check if file name contains bill-related keywords
    const hasBillKeyword = billKeywords.some(keyword => fileName.includes(keyword));
    if (!hasBillKeyword) {
        // If no bill keywords, show a warning but don't reject
        console.warn('File name does not contain typical bill keywords');
    }
    
    return null; // No error
}

// Handle file validation errors
function handleFileError(errorMessage) {
    showNotification('File Error', errorMessage, 'error');
    
    // Show error state in UI
    if (aiProcessing) aiProcessing.style.display = 'none';
    if (extractedData) extractedData.style.display = 'block';
    if (validateBtn) validateBtn.style.display = 'flex';
    
    // Set all fields to error state
    document.querySelectorAll('.extraction-status').forEach(status => {
        if (status) {
            status.className = 'extraction-status error';
            status.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>File error</span>';
        }
    });
    
    document.querySelectorAll('.confidence-level').forEach(level => {
        if (level) {
            level.style.width = '0%';
        }
    });
    
    document.querySelectorAll('.data-confidence').forEach(conf => {
        if (conf) {
            conf.textContent = '0% confidence';
        }
    });
    
    document.querySelectorAll('[id$="Name"], [id$="Date"], [id$="Amount"], [id$="Number"], [id$="gstin"], [id$="companyName"]').forEach(el => {
        if (el) {
            el.textContent = errorMessage;
        }
    });
}

// Simulate validation with proper material purchase bill validation
function simulateValidation() {
    updateStepProgress(3);
    emptyState.style.display = 'none';
    validationResult.style.display = 'block';
    
    // Get the extracted data from the UI
    const supplierName = document.getElementById('supplierName').textContent;
    const billDate = document.getElementById('billDate').textContent;
    const totalAmount = document.getElementById('totalAmount').textContent;
    const gstin = document.getElementById('gstin').textContent;
    const poNumber = document.getElementById('poNumber').textContent;
    const companyName = document.getElementById('companyName').textContent;
    
    // Validate the bill
    const validationResults = validateMaterialPurchaseBill({
        supplierName,
        billDate,
        totalAmount,
        gstin,
        poNumber,
        companyName
    });
    
    // Update UI based on validation results
    updateValidationResultsUI(validationResults);
    
    // Scroll to results
    validationResult.scrollIntoView({ behavior: 'smooth' });
}

// Validate material purchase bill based on business rules
function validateMaterialPurchaseBill(billData) {
    const results = {
        isValid: true,
        isPartiallyValid: false,
        errors: [],
        warnings: [],
        passedChecks: [],
        failedChecks: [],
        requiresManualVerification: false
    };
    
    // Check if we have any data at all
    if (!billData || 
        (billData.supplierName === "Not found" || billData.supplierName === "Extraction failed") &&
        (billData.billDate === "Not found" || billData.billDate === "Extraction failed") &&
        (billData.totalAmount === "Not found" || billData.totalAmount === "Extraction failed")) {
        results.isValid = false;
        results.errors.push("No bill data could be extracted. This may not be a valid bill or the image is unclear.");
        return results;
    }
    
    // Validate Supplier Name
    if (!billData.supplierName || billData.supplierName === "Not found" || billData.supplierName === "Extraction failed") {
        results.failedChecks.push({ field: "Supplier Name", reason: "Missing or could not be extracted" });
        results.errors.push("Supplier name is missing");
    } else if (billData.supplierName.length < 3) {
        results.failedChecks.push({ field: "Supplier Name", reason: "Invalid supplier name" });
        results.errors.push("Supplier name appears to be invalid");
    } else {
        // Check for valid characters in supplier name
        const validNameRegex = /^[a-zA-Z0-9\s\-\.&'()/]+$/;
        if (!validNameRegex.test(billData.supplierName)) {
            results.warnings.push({ field: "Supplier Name", reason: "Supplier name contains unusual characters" });
            results.requiresManualVerification = true;
        } else {
            results.passedChecks.push({ field: "Supplier Name", reason: "Valid supplier name found" });
        }
    }
    
    // Validate Bill Date
    if (!billData.billDate || billData.billDate === "Not found" || billData.billDate === "Extraction failed") {
        results.failedChecks.push({ field: "Bill Date", reason: "Missing or could not be extracted" });
        results.errors.push("Bill date is missing");
    } else {
        // Check if date is in valid format and not older than 60 days
        const dateRegex = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/;
        if (!dateRegex.test(billData.billDate)) {
            results.failedChecks.push({ field: "Bill Date", reason: "Invalid date format" });
            results.errors.push("Bill date format is invalid");
        } else {
            // Parse the date and check if it's within 60 days
            const dateParts = billData.billDate.split(/[\/\-]/);
            let date;
            if (dateParts[2].length === 4) {
                // YYYY-MM-DD format
                date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
            } else {
                // DD-MM-YY or DD-MM-YYYY format
                const year = dateParts[2].length === 2 ? '20' + dateParts[2] : dateParts[2];
                date = new Date(year, dateParts[1] - 1, dateParts[0]);
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                results.failedChecks.push({ field: "Bill Date", reason: "Invalid date value" });
                results.errors.push("Bill date is not a valid date");
            } else {
                const today = new Date();
                const diffTime = today - date;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays < 0) {
                    results.failedChecks.push({ field: "Bill Date", reason: "Bill date is in the future" });
                    results.errors.push("Bill date cannot be in the future");
                } else if (diffDays > 60) {
                    results.failedChecks.push({ field: "Bill Date", reason: "Bill is older than 60 days" });
                    results.errors.push("Bill date is older than 60 days");
                } else {
                    results.passedChecks.push({ field: "Bill Date", reason: "Valid bill date within 60 days" });
                }
            }
        }
    }
    
    // Validate Total Amount
    if (!billData.totalAmount || billData.totalAmount === "Not found" || billData.totalAmount === "Extraction failed") {
        results.failedChecks.push({ field: "Total Amount", reason: "Missing or could not be extracted" });
        results.errors.push("Total amount is missing");
    } else {
        // Check if amount is a valid number
        const amountRegex = /[₹$€£]?\s*([0-9,]+\.?[0-9]*)/;
        const amountMatch = billData.totalAmount.match(amountRegex);
        if (!amountMatch) {
            results.failedChecks.push({ field: "Total Amount", reason: "Invalid amount format" });
            results.errors.push("Total amount format is invalid");
        } else {
            const amount = parseFloat(amountMatch[1].replace(/,/g, ''));
            if (isNaN(amount) || amount <= 0) {
                results.failedChecks.push({ field: "Total Amount", reason: "Invalid amount value" });
                results.errors.push("Total amount must be a positive number");
            } else if (amount > 10000000) { // 1 crore limit
                results.warnings.push({ field: "Total Amount", reason: "Amount is unusually high" });
                results.requiresManualVerification = true;
            } else {
                results.passedChecks.push({ field: "Total Amount", reason: "Valid total amount" });
            }
        }
    }
    
    // Validate GSTIN
    if (!billData.gstin || billData.gstin === "Not found" || billData.gstin === "Extraction failed") {
        results.warnings.push({ field: "GSTIN", reason: "Missing or could not be extracted" });
        results.requiresManualVerification = true;
    } else {
        // Validate GSTIN format (15 characters: 2 digits + 5 uppercase letters + 4 digits + 1 uppercase letter + 1 digit + 1 'Z' + 1 digit/letter)
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstinRegex.test(billData.gstin)) {
            results.failedChecks.push({ field: "GSTIN", reason: "Invalid GSTIN format" });
            results.errors.push("GSTIN format is invalid");
        } else {
            results.passedChecks.push({ field: "GSTIN", reason: "Valid GSTIN format" });
        }
    }
    
    // Validate Company Name
    if (!billData.companyName || billData.companyName === "Not found" || billData.companyName === "Extraction failed") {
        results.warnings.push({ field: "Company Name", reason: "Missing or could not be extracted" });
        results.requiresManualVerification = true;
    } else if (billData.companyName.length < 3) {
        results.warnings.push({ field: "Company Name", reason: "Invalid company name" });
        results.requiresManualVerification = true;
    } else {
        // Check for valid characters in company name
        const validNameRegex = /^[a-zA-Z0-9\s\-\.&'()/]+$/;
        if (!validNameRegex.test(billData.companyName)) {
            results.warnings.push({ field: "Company Name", reason: "Company name contains unusual characters" });
            results.requiresManualVerification = true;
        } else {
            results.passedChecks.push({ field: "Company Name", reason: "Valid company name found" });
        }
    }
    
    // Validate PO Number (if provided)
    if (billData.poNumber && billData.poNumber !== "Not found" && billData.poNumber !== "Extraction failed") {
        // Check if PO number has reasonable format
        if (billData.poNumber.length < 3) {
            results.warnings.push({ field: "PO Number", reason: "PO number appears too short" });
            results.requiresManualVerification = true;
        } else {
            results.passedChecks.push({ field: "PO Number", reason: "PO number found" });
        }
    } else {
        results.warnings.push({ field: "PO Number", reason: "Missing or could not be extracted" });
        results.requiresManualVerification = true;
    }
    
    // Check for prohibited terms (Proforma Invoice, Estimate, etc.)
    const prohibitedTerms = ['proforma', 'estimate', 'draft', 'quotation', 'quote'];
    const billText = `${billData.supplierName} ${billData.billDate} ${billData.totalAmount} ${billData.gstin} ${billData.companyName} ${billData.poNumber || ''}`.toLowerCase();
    
    const foundProhibitedTerm = prohibitedTerms.find(term => billText.includes(term));
    if (foundProhibitedTerm) {
        results.failedChecks.push({ field: "Bill Type", reason: `Contains prohibited term: ${foundProhibitedTerm}` });
        results.errors.push(`This appears to be a ${foundProhibitedTerm}, not a valid purchase bill`);
        results.isValid = false;
    } else {
        results.passedChecks.push({ field: "Bill Type", reason: "Not a prohibited document type" });
    }
    
    // Check for cash payments (which might need special handling)
    if (billText.includes('cash') && !billText.includes('upi')) {
        results.warnings.push({ field: "Payment Method", reason: "Cash payment detected, may require additional verification" });
        results.requiresManualVerification = true;
    }
    
    // Determine overall validation status
    if (results.errors.length > 0) {
        results.isValid = false;
    }
    
    if (results.warnings.length > 0 && results.errors.length === 0) {
        results.isPartiallyValid = true;
    }
    
    // If we have significant missing data, it's not a valid bill
    const criticalFields = ['Supplier Name', 'Bill Date', 'Total Amount'];
    const missingCriticalFields = results.failedChecks.filter(check => 
        criticalFields.includes(check.field)).length;
    
    if (missingCriticalFields >= 2) {
        results.isValid = false;
        results.errors.push("Too many critical fields missing - this may not be a valid material purchase bill");
    }
    
    // If we don't have at least 3 passed checks, it's likely not a valid bill
    if (results.passedChecks.length < 3) {
        results.isValid = false;
        if (!results.errors.includes("Too many critical fields missing - this may not be a valid material purchase bill")) {
            results.errors.push("Insufficient valid data extracted - this may not be a valid material purchase bill");
        }
    }
    
    return results;
}

// Update validation results UI based on validation results
function updateValidationResultsUI(validationResults) {
    const resultStatus = document.getElementById('resultStatus');
    const statusText = document.getElementById('statusText');
    const resultsGrid = document.querySelector('.results-grid');
    
    // Clear existing results
    if (resultsGrid) {
        resultsGrid.innerHTML = '';
    }
    
    // Update status based on validation results
    resultStatus.className = 'result-status';
    
    if (validationResults.isValid) {
        resultStatus.classList.add('status-pass');
        statusText.textContent = 'Bill Validated Successfully!';
        createConfetti();
    } else if (validationResults.isPartiallyValid) {
        resultStatus.classList.add('status-manual');
        statusText.textContent = 'Manual Verification Required';
    } else {
        resultStatus.classList.add('status-fail');
        statusText.textContent = 'Validation Failed - Invalid Bill';
    }
    
    // Create results grid
    if (resultsGrid) {
        // Passed Checks
        const passedCard = document.createElement('div');
        passedCard.className = 'result-card';
        passedCard.innerHTML = `
            <h4><i class="fas fa-check-circle" style="color: var(--secondary);"></i> Passed Checks (${validationResults.passedChecks.length})</h4>
        `;
        
        validationResults.passedChecks.forEach(check => {
            const detailItem = document.createElement('div');
            detailItem.className = 'detail-item pass';
            detailItem.innerHTML = `
                <span>${check.field}</span>
                <span><i class="fas fa-check-circle"></i></span>
            `;
            passedCard.appendChild(detailItem);
        });
        
        // Failed Checks
        const failedCard = document.createElement('div');
        failedCard.className = 'result-card';
        failedCard.innerHTML = `
            <h4><i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i> Failed Checks (${validationResults.failedChecks.length})</h4>
        `;
        
        validationResults.failedChecks.forEach(check => {
            const detailItem = document.createElement('div');
            detailItem.className = 'detail-item fail';
            detailItem.innerHTML = `
                <span>${check.field}</span>
                <span><i class="fas fa-times-circle"></i> ${check.reason}</span>
            `;
            failedCard.appendChild(detailItem);
        });
        
        // Warnings
        if (validationResults.warnings.length > 0) {
            const warningHeader = document.createElement('h4');
            warningHeader.style.marginTop = '20px';
            warningHeader.innerHTML = `<i class="fas fa-exclamation-circle" style="color: var(--warning);"></i> Warnings (${validationResults.warnings.length})</h4>`;
            failedCard.appendChild(warningHeader);
            
            validationResults.warnings.forEach(warning => {
                const detailItem = document.createElement('div');
                detailItem.className = 'detail-item warning';
                detailItem.innerHTML = `
                    <span>${warning.field}</span>
                    <span><i class="fas fa-exclamation-circle"></i> ${warning.reason}</span>
                `;
                failedCard.appendChild(detailItem);
            });
        }
        
        // Add cards to grid
        resultsGrid.appendChild(passedCard);
        resultsGrid.appendChild(failedCard);
        
        // Show manual verification message if needed
        if (validationResults.requiresManualVerification) {
            const manualVerificationNotice = document.getElementById('manualVerificationNotice');
            if (manualVerificationNotice) {
                manualVerificationNotice.style.display = 'block';
            }
        }
        
        // Show error message if bill is invalid
        if (!validationResults.isValid) {
            showNotification('Validation Failed', validationResults.errors[0] || 'This document does not appear to be a valid material purchase bill.', 'error');
        } else if (validationResults.isPartiallyValid) {
            showNotification('Manual Verification Required', 'This bill requires manual verification due to missing or questionable information.', 'warning');
        } else {
            showNotification('Validation Success', 'Bill validated successfully!', 'success');
        }
    }
    
    // Update approval information based on bill amount
    const amountText = document.getElementById('totalAmount').textContent;
    let amount = 0;
    
    if (amountText && amountText !== "Not found" && amountText !== "Extraction failed") {
        const amountMatch = amountText.match(/[₹$€£]?\s*([0-9,]+\.?[0-9]*)/);
        if (amountMatch) {
            amount = parseFloat(amountMatch[1].replace(/,/g, '')) || 0;
        }
    }
    
    updateApprovalInfo(amount);
}

// Update approval information based on bill amount
function updateApprovalInfo(amount) {
    const approvalInfo = document.querySelector('.approval-info');
    
    // Check if approvalInfo exists
    if (!approvalInfo) {
        console.warn('Approval info element not found');
        return;
    }
    
    let approvalText = '';
    let approvers = [];
    
    // Validate amount
    if (typeof amount !== 'number' || isNaN(amount)) {
        amount = 0;
    }
    
    const totalAmountEl = document.getElementById('totalAmount');
    const amountText = totalAmountEl ? totalAmountEl.textContent : '₹0.00';
    
    if (amount <= 10000 && amount > 0) {
        approvers = ['BU Head OR Segment/Zonal Head'];
        approvalText = `Based on the bill amount of <strong>${amountText}</strong>, please obtain approval from:`;
    } else if (amount > 10000 && amount <= 20000) {
        approvers = ['BU Head', 'Finance Head'];
        approvalText = `Based on the bill amount of <strong>${amountText}</strong>, please obtain approvals from:`;
    } else if (amount > 20000) {
        approvers = ['BU Head', 'Finance Head', 'K K Sir'];
        approvalText = `Based on the bill amount of <strong>${amountText}</strong>, please obtain approvals from:`;
    } else {
        // If amount is not available or invalid
        approvalText = 'Please verify the bill amount and obtain necessary approvals.';
        approvers = ['Appropriate Authority'];
    }
    
    // Update the approval info section
    approvalInfo.innerHTML = `
        <h3><i class="fas fa-info-circle"></i> Next Steps</h3>
        <p>${approvalText}</p>
        <ul style="margin-top: 10px; padding-left: 20px;">
            ${approvers.map(approver => `<li>${approver}</li>`).join('')}
        </ul>
        <p style="margin-top: 15px;">Once approved, submit the bill to the finance department for processing.</p>
    `;
}

// Create confetti effect
function createConfetti() {
    const colors = ['#2A6DFF', '#00C896', '#FF4757', '#FFA502', '#2ED573'];
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 5;
        const left = Math.random() * 100;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 2;
        
        confetti.style.backgroundColor = color;
        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.left = `${left}vw`;
        confetti.style.animation = `confettiFall ${duration}s ease-in ${delay}s forwards`;
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, (duration + delay) * 1000);
    }
}

// Switch tabs
function switchTab(tabName) {
    // Update tab items
    tabItems.forEach(item => {
        if (item.getAttribute('data-tab') === tabName) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    // Update tab contents
    tabContents.forEach(content => {
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Event Listeners
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        updateStepProgress(0);
        const file = e.target.files[0];
        
        // Validate file before processing
        const errorMessage = validateFile(file);
        if (errorMessage) {
            showNotification('File Error', errorMessage, 'error');
            return;
        }
        
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        
        fileName.textContent = file.name;
        fileSize.textContent = `${fileSizeMB} MB`;
        
        fileInfo.style.display = 'block';
        uploadArea.classList.add('active');
        
        // Show bill preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                billPreview.innerHTML = `<img src="${e.target.result}" alt="Bill Preview" style="max-width: 100%; max-height: 300px; border-radius: 10px;">`;
                billPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            billPreview.innerHTML = `
                <i class="fas fa-file-pdf" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
                <h4>PDF Document</h4>
                <p>${file.name}</p>
            `;
            billPreview.style.display = 'block';
        }
        
        // Simulate upload progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            uploadProgress.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                showNotification('Bill Uploaded Successfully', 'Your bill is ready for AI processing.');
                
                setTimeout(() => {
                    processBillWithAI(file);
                }, 1000);
            }
        }, 30);
    }
});

validateBtn.addEventListener('click', () => {
    updateStepProgress(2);
    validateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Validating...';
    validateBtn.disabled = true;
    
    setTimeout(() => {
        simulateValidation();
        validateBtn.innerHTML = '<i class="fas fa-check-circle"></i> Validate Bill';
        validateBtn.disabled = false;
        showNotification('Validation Complete', 'Bill validation results are ready.');
    }, 1500);
});

downloadReportBtn.addEventListener('click', () => {
    showNotification('Report Download', 'Your validation report is being downloaded.');
    // In a real app, this would trigger a download
});

newBillBtn.addEventListener('click', () => {
    // Reset form
    fileInput.value = '';
    fileInfo.style.display = 'none';
    uploadArea.classList.remove('active');
    uploadProgress.style.width = '0%';
    validateBtn.style.display = 'none';
    extractedData.style.display = 'none';
    validationResult.style.display = 'none';
    emptyState.style.display = 'block';
    billPreview.style.display = 'none';
    billPreview.innerHTML = `
        <i class="fas fa-file-image" style="font-size: 3rem; color: var(--primary); margin-bottom: 15px;"></i>
        <h4>Bill Preview</h4>
        <p>Upload a bill to see preview</p>
    `;
    
    // Reset processing steps
    [step1, step2, step3, step4].forEach(step => {
        step.classList.remove('active');
    });
    
    // Reset step progress
    updateStepProgress(0);
    
    // Switch back to upload tab
    switchTab('upload');
    
    showNotification('Reset Complete', 'Ready to validate a new bill.');
});

helpBtn.addEventListener('click', () => {
    showNotification('Help Center', 'Please check the guidelines panel for more information.', 'warning');
});

guidelinesToggle.addEventListener('click', () => {
    guidelinesPanel.classList.add('active');
});

closePanel.addEventListener('click', () => {
    guidelinesPanel.classList.remove('active');
});

// Tab click events
tabItems.forEach(item => {
    item.addEventListener('click', () => {
        const tabName = item.getAttribute('data-tab');
        switchTab(tabName);
    });
});

// Initialize
createParticles();
updateStepProgress(0);