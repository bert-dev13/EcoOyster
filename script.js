/**
 * Oyster Production Prediction System
 * Main JavaScript file for prediction calculations and UI interactions
 */

// ============================================
// Constants and Configuration
// ============================================

// Formula coefficients for oyster production prediction
// Formula: Oyster Production = 0.268(Salinity) + 0.567(Farming Technique) + 0.436(Typhoon) + 0.223(Flood) - 4.595
const SALINITY_COEFFICIENT = 0.268;
const FARMING_TECHNIQUE_COEFFICIENT = 0.567;
const TYPHOON_COEFFICIENT = 0.436;
const FLOOD_COEFFICIENT = 0.223;
const FORMULA_CONSTANT = -4.595;

// DOM Elements
const form = document.getElementById('predictionForm');
const predictBtn = document.getElementById('predictBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsSection = document.getElementById('resultsSection');
const productionValue = document.getElementById('productionValue');
const recommendationsSection = document.getElementById('recommendationsSection');
const recommendationsLoading = document.getElementById('recommendationsLoading');
const recommendationsText = document.getElementById('recommendationsText');
const recommendationsFooter = document.getElementById('recommendationsFooter');
const exportButtonsWrapper = document.getElementById('exportButtonsWrapper');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const copyClipboardBtn = document.getElementById('copyClipboardBtn');

// API Configuration
const API_BASE_URL = '/api';

// ============================================
// Utility Functions
// ============================================

/**
 * Formats a number with decimal places
 * @param {number} num - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
function formatNumber(num, decimals = 2) {
    return num.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Validates if input is a valid positive number
 * @param {string} value - Input value to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && isFinite(num);
}

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Calculates predicted oyster production using the formula:
 * Oyster Production = 0.268(Salinity) + 0.567(Farming Technique) + 0.436(Typhoon) + 0.223(Flood) - 4.595
 * 
 * @param {number} salinity - Salinity level in ppt
 * @param {number} farmingTechnique - Farming technique code (1=Raft, 2=Stake, 3=Both)
 * @param {number} typhoon - Number of typhoon events during the production period
 * @param {number} flood - Number of flood events during the production period
 * @returns {number} Predicted oyster production in metric tons
 */
function calculateOysterProduction(salinity, farmingTechnique, typhoon, flood) {
    // Ensure inputs are numbers
    const S = parseFloat(salinity) || 0;
    const FT = parseInt(farmingTechnique) || 1;
    const T = parseInt(typhoon) || 0;
    const F = parseInt(flood) || 0;
    
    // Apply the formula: Oyster Production = 0.268(Salinity) + 0.567(Farming Technique) + 0.436(Typhoon) + 0.223(Flood) - 4.595
    const production = (SALINITY_COEFFICIENT * S) 
        + (FARMING_TECHNIQUE_COEFFICIENT * FT)
        + (TYPHOON_COEFFICIENT * T)
        + (FLOOD_COEFFICIENT * F)
        + FORMULA_CONSTANT;
    
    // Debug logging (can be removed later)
    console.log('Calculation:', {
        salinity: S,
        farmingTechnique: FT,
        typhoon: T,
        flood: F,
        calculation: `${SALINITY_COEFFICIENT}*${S} + ${FARMING_TECHNIQUE_COEFFICIENT}*${FT} + ${TYPHOON_COEFFICIENT}*${T} + ${FLOOD_COEFFICIENT}*${F} + ${FORMULA_CONSTANT}`,
        result: production
    });
    
    // Ensure non-negative result
    return Math.max(0, production);
}

// ============================================
// UI Update Functions
// ============================================

/**
 * Gets the farming technique name from code
 * @param {number} techniqueCode - Farming technique code (1=Raft, 2=Stake, 3=Both)
 * @returns {string} Farming technique name
 */
function getFarmingTechniqueName(techniqueCode) {
    const techniqueMap = {
        1: "Raft method",
        2: "Stake method",
        3: "Both Raft and Stake"
    };
    return techniqueMap[techniqueCode] || "Unknown";
}

/**
 * Updates the results section with calculated values
 * @param {number} production - Predicted oyster production in metric tons
 */
function displayResults(production) {
    // Show results section with animation
    resultsSection.style.display = 'block';
    
    // Format production values
    const roundedProduction = formatNumber(production, 2); // Rounded to 2 decimal places
    const originalProduction = formatNumber(production, 3); // Original with 3 decimal places
    
    // Display rounded value as main result
    productionValue.textContent = roundedProduction;
    
    // Display original unrounded value below
    const productionValueOriginal = document.getElementById('productionValueOriginal');
    const productionValueOriginalValue = document.getElementById('productionValueOriginalValue');
    if (productionValueOriginal && productionValueOriginalValue) {
        productionValueOriginalValue.textContent = originalProduction;
        productionValueOriginal.style.display = 'block';
    }
    
    // Update production display text (use rounded value)
    const productionDisplay = document.getElementById('productionDisplay');
    const productionDisplayValue = document.getElementById('productionDisplayValue');
    if (productionDisplay && productionDisplayValue) {
        productionDisplayValue.textContent = roundedProduction;
        productionDisplay.style.display = 'block';
    }
    
    // Get and display farming technique
    const farmingTechniqueValue = document.getElementById('farmingTechniqueValue');
    if (farmingTechniqueValue) {
        const farmingTechnique = parseInt(document.getElementById('farmingTechnique').value);
        const techniqueName = getFarmingTechniqueName(farmingTechnique);
        farmingTechniqueValue.textContent = techniqueName;
    }
    
    // Store production for recommendations and export
    window.currentProduction = production;
    
    // Show export buttons
    exportButtonsWrapper.style.display = 'flex';
    
    // Fetch and display AI recommendations
    fetchRecommendations(production);
    
    // Smooth scroll to results
    setTimeout(() => {
        resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }, 100);
}

/**
 * Fetches AI recommendations from the backend API
 * @param {number} production - Predicted oyster production in metric tons
 */
async function fetchRecommendations(production) {
    // Get form values for recommendations
    const salinity = parseFloat(document.getElementById('salinity').value);
    const temperature = parseFloat(document.getElementById('temperature').value);
    const storms = parseInt(document.getElementById('storms').value) || 0;
    const severeEvents = parseInt(document.getElementById('severeEvents').value) || 0;
    const farmingTechnique = parseInt(document.getElementById('farmingTechnique').value);
    const typhoon = parseInt(document.getElementById('typhoon').value) || 0;
    const flood = parseInt(document.getElementById('flood').value) || 0;
    
    // Show recommendations section and loading state
    recommendationsSection.style.display = 'block';
    recommendationsLoading.style.display = 'flex';
    recommendationsText.style.display = 'none';
    recommendationsText.textContent = '';
    
    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                salinity: salinity,
                temperature: temperature,
                storms: storms,
                severe_events: severeEvents,
                farming_technique: farmingTechnique,
                typhoon: typhoon,
                flood: flood
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Update production value from API response if available (for consistency)
        // Note: We use client-side calculation as primary, API response is for verification
        // The API should return the same value as client-side calculation
        if (data.success && data.predicted_production !== undefined) {
            const apiProduction = parseFloat(data.predicted_production);
            console.log('API returned production:', apiProduction);
            // Use client-side calculated value instead of API value to ensure accuracy
            // const formattedProduction = formatNumber(apiProduction, 3);
            // productionValue.textContent = formattedProduction;
            // const productionDisplayValue = document.getElementById('productionDisplayValue');
            // if (productionDisplayValue) {
            //     productionDisplayValue.textContent = formattedProduction;
            // }
            // window.currentProduction = apiProduction;
        }
        
        if (data.success && data.recommendations) {
            // Hide loading, show recommendations
            recommendationsLoading.style.display = 'none';
            recommendationsText.style.display = 'block';
            
            // Format and display recommendations
            try {
                const formattedText = formatRecommendations(data.recommendations);
                recommendationsText.innerHTML = formattedText;
            } catch (formatError) {
                console.error('Error formatting recommendations:', formatError);
                recommendationsText.innerHTML = `
                    <div class="recommendations-error">
                        <p>⚠️ Error displaying recommendations.</p>
                        <p class="error-detail">${formatError.message}</p>
                        <p class="error-hint">Please try again.</p>
                    </div>
                `;
            }
            
            // Scroll recommendations into view smoothly
            setTimeout(() => {
                recommendationsSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'nearest' 
                });
            }, 300);
            
            // Show footer
            if (recommendationsFooter) {
                recommendationsFooter.style.display = 'block';
            }
        } else {
            throw new Error(data.error || 'Failed to get recommendations');
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        recommendationsLoading.style.display = 'none';
        recommendationsText.style.display = 'block';
        recommendationsText.innerHTML = `
            <div class="recommendations-error">
                <p>⚠️ Unable to fetch recommendations at this time.</p>
                <p class="error-detail">${error.message}</p>
                <p class="error-hint">Please ensure the backend server is running on port 5000.</p>
            </div>
        `;
    }
}

/**
 * Formats the AI recommendations text into structured category cards
 * @param {string} recommendations - Raw recommendations text from AI
 * @returns {string} Formatted HTML string
 */
function formatRecommendations(recommendations) {
    if (!recommendations) {
        return '<p>No recommendations available.</p>';
    }
    
    // Category mapping with icons and keywords for auto-categorization
    const categoryMap = {
        'farming technique': { 
            icon: '🌾', 
            title: 'Farming Technique Optimization', 
            color: 'var(--primary)',
            keywords: ['raft', 'stake', 'farming technique', 'method', 'cultivation', 'growing']
        },
        'salinity': { 
            icon: '💧', 
            title: 'Salinity Management', 
            color: 'var(--primary)',
            keywords: ['salinity', 'salt', 'water quality', 'ppt', 'brackish']
        },
        'weather': { 
            icon: '🌊', 
            title: 'Weather & Disaster Preparedness', 
            color: 'var(--secondary)',
            keywords: ['typhoon', 'flood', 'storm', 'weather', 'disaster', 'preparedness', 'barrier', 'protection']
        },
        'environmental': { 
            icon: '🌿', 
            title: 'Environmental Monitoring', 
            color: 'var(--primary)',
            keywords: ['monitor', 'track', 'measure', 'environmental', 'water quality', 'temperature']
        },
        'timing': { 
            icon: '📅', 
            title: 'Production Timing', 
            color: 'var(--secondary)',
            keywords: ['timing', 'schedule', 'season', 'harvest', 'planting', 'cycle']
        },
        'best practices': { 
            icon: '⭐', 
            title: 'Best Practices', 
            color: 'var(--primary)',
            keywords: ['practice', 'maintain', 'care', 'management', 'quality', 'standard']
        }
    };
    
    // Simple formatting - split by lines and categorize
    const lines = recommendations.split('\n').filter(line => line.trim());
    const categories = {};
    let currentCategory = null;
    let currentItems = [];
    
    lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // Check for category headers
        const boldHeaderMatch = trimmed.match(/^\*\*([^*]+)\*\*$/);
        const markdownHeaderMatch = trimmed.match(/^#+\s+(.+)$/);
        
        if (boldHeaderMatch || markdownHeaderMatch) {
            // Save previous category
            if (currentCategory && currentItems.length > 0) {
                if (!categories[currentCategory]) {
                    categories[currentCategory] = [];
                }
                categories[currentCategory].push(...currentItems);
            }
            
            // Extract category name
            const categoryTitle = (boldHeaderMatch ? boldHeaderMatch[1] : markdownHeaderMatch[1]).trim();
            const categoryName = categoryTitle.toLowerCase();
            
            // Find matching category
            currentCategory = null;
            for (const [key, value] of Object.entries(categoryMap)) {
                if (categoryName.includes(key) || key.includes(categoryName.split(' ')[0])) {
                    currentCategory = key;
                    break;
                }
            }
            
            // If no match, create general category
            if (!currentCategory) {
                currentCategory = 'general';
                if (!categoryMap[currentCategory]) {
                    categoryMap[currentCategory] = {
                        icon: '📋',
                        title: categoryTitle,
                        color: 'var(--primary)',
                        keywords: []
                    };
                }
            }
            
            currentItems = [];
        } else if (trimmed.match(/^[-•*]\s/) || trimmed.match(/^\d+[\.\)]\s/)) {
            // List item
            let content = trimmed.replace(/^[-•*\d\.\)]\s+/, '').trim();
            content = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
            if (content && content.length > 3) {
                currentItems.push(content);
            }
        } else if (trimmed.length > 15) {
            // Regular paragraph
            if (!currentCategory) {
                currentCategory = 'general';
                if (!categoryMap[currentCategory]) {
                    categoryMap[currentCategory] = {
                        icon: '📋',
                        title: 'Recommendations',
                        color: 'var(--primary)',
                        keywords: []
                    };
                }
            }
            currentItems.push(trimmed);
        }
    });
    
    // Save last category
    if (currentCategory && currentItems.length > 0) {
        if (!categories[currentCategory]) {
            categories[currentCategory] = [];
        }
        categories[currentCategory].push(...currentItems);
    }
    
    // Generate HTML
    if (Object.keys(categories).length === 0) {
        return '<div class="recommendation-card"><p>No recommendations available.</p></div>';
    }
    
    let html = '<div class="recommendations-grid">';
    let delay = 0;
    
    Object.entries(categories).forEach(([categoryKey, items]) => {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return;
        }
        
        const category = categoryMap[categoryKey] || categoryMap['general'];
        const categoryIcon = category.icon || '📋';
        const categoryTitle = category.title || 'Recommendations';
        
        html += `
            <div class="recommendation-category-card" style="animation-delay: ${delay * 0.1}s;">
                <div class="category-header">
                    <div class="category-icon">${categoryIcon}</div>
                    <h3 class="category-title">${categoryTitle}</h3>
                </div>
                <ul class="recommendation-list">
                    ${items.map(item => {
                        const safeItem = String(item || '').trim();
                        return safeItem ? `<li class="recommendation-item">${safeItem}</li>` : '';
                    }).filter(li => li.length > 0).join('')}
                </ul>
            </div>
        `;
        delay++;
    });
    
    html += '</div>';
    return html;
}

/**
 * Gets formatted text content from recommendations
 * @returns {string} Plain text recommendations
 */
function getRecommendationsText() {
    const recommendationsElement = document.getElementById('recommendationsText');
    if (!recommendationsElement) return '';
    
    // Get text content, preserving structure
    let text = '';
    const items = recommendationsElement.querySelectorAll('.recommendation-item');
    if (items.length > 0) {
        items.forEach(item => {
            text += '• ' + item.textContent.trim() + '\n';
        });
    } else {
        text = recommendationsElement.textContent || '';
    }
    return text.trim();
}

/**
 * Gets all input values for export
 * @returns {Object} Form data object
 */
function getFormData() {
    const farmingTechnique = parseInt(document.getElementById('farmingTechnique').value);
    return {
        salinity: document.getElementById('salinity').value,
        temperature: document.getElementById('temperature').value,
        storms: document.getElementById('storms').value,
        severeEvents: document.getElementById('severeEvents').value,
        farmingTechnique: farmingTechnique,
        farmingTechniqueName: getFarmingTechniqueName(farmingTechnique),
        typhoon: document.getElementById('typhoon').value,
        flood: document.getElementById('flood').value
    };
}

/**
 * Gets the jsPDF library, checking multiple possible locations
 * @returns {Function|null} jsPDF constructor or null if not found
 */
function getJsPDFLibrary() {
    // Try UMD module format first (most common for CDN)
    if (typeof window.jsPDF !== 'undefined') {
        if (window.jsPDF.jsPDF) {
            return window.jsPDF.jsPDF;
        }
        // Check if it's the constructor directly
        if (typeof window.jsPDF === 'function') {
            return window.jsPDF;
        }
        // Check if it has a default export
        if (window.jsPDF.default && typeof window.jsPDF.default === 'function') {
            return window.jsPDF.default;
        }
    }
    
    // Try alternative naming
    if (typeof window.jspdf !== 'undefined') {
        if (window.jspdf.jsPDF) {
            return window.jspdf.jsPDF;
        }
        if (typeof window.jspdf === 'function') {
            return window.jspdf;
        }
    }
    
    return null;
}

/**
 * Downloads results as PDF
 */
function downloadPDF() {
    // Get jsPDF library
    const jsPDF = getJsPDFLibrary();
    
    if (!jsPDF) {
        // Try waiting a bit and retrying (in case library is still loading)
        setTimeout(() => {
            const retryJsPDF = getJsPDFLibrary();
            if (!retryJsPDF) {
                alert('PDF library could not be loaded. Please:\n\n1. Check your internet connection\n2. Refresh the page\n3. Try using a different browser\n\nIf the problem persists, the PDF feature may not be available.');
                console.error('jsPDF library not found after retry. Window object keys:', Object.keys(window).filter(k => k.toLowerCase().includes('pdf')));
            } else {
                // Retry the download
                downloadPDF();
            }
        }, 500);
        return;
    }
    
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        
        // Get current data
        const production = window.currentProduction || 0;
        const formData = getFormData();
        const recommendations = getRecommendationsText();
        
        // Set up colors
        const primaryColor = [16, 185, 129]; // #10b981
        const primaryLight = [230, 247, 242]; // Light green background
        const secondaryColor = [245, 158, 11]; // #f59e0b
        const lightGray = [245, 245, 245];
        const darkGray = [64, 64, 64];
        const textGray = [102, 102, 102];
        
        // Helper function to add a section box
        function addSectionBox(y, height, fillColor = null) {
            if (fillColor) {
                doc.setFillColor(...fillColor);
                doc.rect(margin, y, contentWidth, height, 'F');
            }
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.rect(margin, y, contentWidth, height, 'S');
        }
        
        // Helper function to check page break
        function checkPageBreak(requiredHeight) {
            if (yPos + requiredHeight > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
                return true;
            }
            return false;
        }
        
        let yPos = margin;
        
        // ========== HEADER SECTION ==========
        // Header background
        doc.setFillColor(...primaryLight);
        doc.rect(0, 0, pageWidth, 45, 'F');
        
        // Header border
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(2);
        doc.line(0, 45, pageWidth, 45);
        
        // Title
        yPos = 20;
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text('Oyster Production Prediction Report', pageWidth / 2, yPos, { align: 'center' });
        
        // Subtitle
        yPos += 8;
        doc.setFontSize(11);
        doc.setTextColor(...textGray);
        doc.setFont('helvetica', 'normal');
        doc.text('Predicting Oyster Production for Aquaculture', pageWidth / 2, yPos, { align: 'center' });
        
        // Date
        yPos += 6;
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        const reportDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPos, { align: 'center' });
        
        yPos = 55;
        
        // ========== KEY METRICS SECTION ==========
        checkPageBreak(50);
        
        // Section header
        doc.setFontSize(14);
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'bold');
        doc.text('Key Metrics', margin, yPos);
        yPos += 10;
        
        // Predicted Production Box
        const productionBoxHeight = 35;
        addSectionBox(yPos, productionBoxHeight, primaryLight);
        
        doc.setFontSize(10);
        doc.setTextColor(...textGray);
        doc.setFont('helvetica', 'normal');
        doc.text('Predicted Oyster Production', margin + 5, yPos + 7);
        
        doc.setFontSize(28);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        const productionText = formatNumber(production, 2) + ' metric tons';
        const productionTextWidth = doc.getTextWidth(productionText);
        doc.text(productionText, margin + (contentWidth / 2) - (productionTextWidth / 2), yPos + 22);
        
        yPos += productionBoxHeight + 10;
        
        // Farming Technique Box
        checkPageBreak(30);
        const techniqueBoxHeight = 28;
        addSectionBox(yPos, techniqueBoxHeight, lightGray);
        
        doc.setFontSize(10);
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'bold');
        doc.text('Farming Technique', margin + 5, yPos + 8);
        
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text(formData.farmingTechniqueName, margin + contentWidth - 5 - doc.getTextWidth(formData.farmingTechniqueName), yPos + 8);
        
        doc.setFontSize(9);
        doc.setTextColor(...textGray);
        doc.setFont('helvetica', 'italic');
        doc.text('Method used for oyster cultivation', margin + 5, yPos + 20);
        
        yPos += techniqueBoxHeight + 15;
        
        // ========== INPUT PARAMETERS SECTION ==========
        checkPageBreak(80);
        
        // Section header
        doc.setFontSize(14);
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'bold');
        doc.text('Input Parameters', margin, yPos);
        yPos += 8;
        
        // Parameters box
        const paramBoxHeight = 70;
        addSectionBox(yPos, paramBoxHeight, [255, 255, 255]);
        
        const paramStartY = yPos + 5;
        let paramY = paramStartY;
        const paramLeftCol = margin + 8;
        const paramRightCol = margin + contentWidth / 2 + 10;
        const paramLineHeight = 7;
        
        doc.setFontSize(9);
        doc.setTextColor(...darkGray);
        doc.setFont('helvetica', 'normal');
        
        // Left column
        doc.setFont('helvetica', 'bold');
        doc.text('Salinity:', paramLeftCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.salinity} ppt`, paramLeftCol + 50, paramY);
        
        paramY += paramLineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Temperature:', paramLeftCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.temperature}°C`, paramLeftCol + 50, paramY);
        
        paramY += paramLineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Storms:', paramLeftCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.storms}`, paramLeftCol + 50, paramY);
        
        paramY += paramLineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Severe Events:', paramLeftCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.severeEvents}`, paramLeftCol + 50, paramY);
        
        // Right column
        paramY = paramStartY;
        doc.setFont('helvetica', 'bold');
        doc.text('Typhoons:', paramRightCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.typhoon}`, paramRightCol + 50, paramY);
        
        paramY += paramLineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Floods:', paramRightCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.flood}`, paramRightCol + 50, paramY);
        
        paramY += paramLineHeight;
        doc.setFont('helvetica', 'bold');
        doc.text('Farming Technique:', paramRightCol, paramY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.farmingTechniqueName}`, paramRightCol + 50, paramY);
        
        yPos += paramBoxHeight + 15;
        
        // ========== RECOMMENDATIONS SECTION ==========
        if (recommendations) {
            checkPageBreak(40);
            
            // Section header
            doc.setFontSize(14);
            doc.setTextColor(...darkGray);
            doc.setFont('helvetica', 'bold');
            doc.text('AI-Powered Recommendations', margin, yPos);
            yPos += 10;
            
            // Recommendations container
            yPos += 5;
            
            doc.setFontSize(10);
            doc.setTextColor(...darkGray);
            doc.setFont('helvetica', 'normal');
            
            // Split recommendations into lines
            const lines = recommendations.split('\n').filter(line => line.trim());
            const recommendationItems = [];
            
            lines.forEach((line) => {
                // Remove bullet points if present
                const cleanLine = line.replace(/^[•\-\*\d\.\)]\s+/, '').trim();
                if (cleanLine) {
                    recommendationItems.push(cleanLine);
                }
            });
            
            // Draw recommendations with proper formatting
            recommendationItems.forEach((cleanLine) => {
                checkPageBreak(15);
                
                // Bullet point
                doc.setFillColor(...primaryColor);
                doc.circle(margin + 8, yPos - 2, 1.5, 'F');
                
                // Text
                doc.setTextColor(...darkGray);
                const textX = margin + 15;
                const textWidth = contentWidth - 20;
                const splitText = doc.splitTextToSize(cleanLine, textWidth);
                
                splitText.forEach((textLine) => {
                    if (yPos > pageHeight - 45) {
                        doc.addPage();
                        yPos = margin + 5;
                    }
                    doc.text(textLine, textX, yPos);
                    yPos += 5;
                });
                
                yPos += 5; // Space between items
            });
            
            yPos += 5;
        }
        
        // ========== FOOTER ==========
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            
            // Footer line
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
            
            // Footer text
            doc.setFontSize(8);
            doc.setTextColor(...textGray);
            doc.setFont('helvetica', 'normal');
            doc.text(
                `Page ${i} of ${pageCount} | Oyster Production Prediction System | ${reportDate}`,
                pageWidth / 2,
                pageHeight - 12,
                { align: 'center' }
            );
        }
        
        // Save PDF
        const fileName = `EcoOyster_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('An error occurred while generating the PDF. Please try again.\n\nError: ' + error.message);
    }
}

/**
 * Copies results to clipboard
 */
async function copyToClipboard() {
    const production = window.currentProduction || 0;
    const formData = getFormData();
    const recommendations = getRecommendationsText();
    
    const text = `Oyster Production Prediction Report
==============================

Predicted Oyster Production: ${formatNumber(production, 2)} metric tons

Farming Technique: ${formData.farmingTechniqueName}

Input Parameters:
- Salinity: ${formData.salinity} ppt
- Temperature: ${formData.temperature}°C
- Number of Storms: ${formData.storms}
- Number of Severe Events: ${formData.severeEvents}
- Number of Typhoons: ${formData.typhoon}
- Number of Floods: ${formData.flood}
- Farming Technique: ${formData.farmingTechniqueName}

AI-Powered Recommendations:
${recommendations || 'No recommendations available.'}

Generated by Oyster Production Prediction System
Date: ${new Date().toLocaleDateString()}
`;
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Show success feedback
        const originalText = copyClipboardBtn.querySelector('span:last-child').textContent;
        copyClipboardBtn.querySelector('span:last-child').textContent = 'Copied!';
        copyClipboardBtn.style.backgroundColor = '#10b981';
        
        setTimeout(() => {
            copyClipboardBtn.querySelector('span:last-child').textContent = originalText;
            copyClipboardBtn.style.backgroundColor = '';
        }, 2000);
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert('Failed to copy to clipboard. Please try again or use the PDF download option.');
    }
}

function resetResults() {
    resultsSection.style.display = 'none';
    recommendationsSection.style.display = 'none';
    recommendationsText.textContent = '';
    exportButtonsWrapper.style.display = 'none';
    
    if (recommendationsFooter) {
        recommendationsFooter.style.display = 'none';
    }
    form.reset();
    
    // Clear stored data
    window.currentProduction = null;
    
    // Reset production display
    productionValue.textContent = '-';
    
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// Input Validation and Handling
// ============================================

/**
 * Validates all form inputs
 * @returns {boolean} True if all inputs are valid
 */
function validateForm() {
    const salinity = document.getElementById('salinity').value;
    const temperature = document.getElementById('temperature').value;
    const storms = document.getElementById('storms').value;
    const severeEvents = document.getElementById('severeEvents').value;
    const farmingTechnique = document.getElementById('farmingTechnique').value;
    const typhoon = document.getElementById('typhoon').value;
    const flood = document.getElementById('flood').value;
    
    return isValidNumber(salinity) && 
           isValidNumber(temperature) &&
           isValidNumber(storms) &&
           isValidNumber(severeEvents) &&
           farmingTechnique !== '' &&
           (parseInt(farmingTechnique) >= 1 && parseInt(farmingTechnique) <= 3) &&
           isValidNumber(typhoon) &&
           isValidNumber(flood);
}

/**
 * Handles input validation in real-time
 * @param {Event} event - Input event
 */
function handleInputValidation(event) {
    const input = event.target;
    const value = input.value.trim();
    const id = input.id;
    
    if (value === '') {
        input.classList.remove('valid', 'invalid');
        return;
    }
    
    if (id === 'salinity' || id === 'temperature') {
        if (isValidNumber(value)) {
            input.classList.add('valid');
            input.classList.remove('invalid');
        } else {
            input.classList.add('invalid');
            input.classList.remove('valid');
        }
    } else if (id === 'farmingTechnique') {
        if (value !== '' && parseInt(value) >= 1 && parseInt(value) <= 3) {
            input.classList.add('valid');
            input.classList.remove('invalid');
        } else {
            input.classList.add('invalid');
            input.classList.remove('valid');
        }
    } else if (id === 'typhoon' || id === 'flood' || id === 'storms' || id === 'severeEvents') {
        if (isValidNumber(value)) {
            input.classList.add('valid');
            input.classList.remove('invalid');
        } else {
            input.classList.add('invalid');
            input.classList.remove('valid');
        }
    }
}

// ============================================
// Event Handlers
// ============================================

/**
 * Handles form submission and triggers prediction
 * @param {Event} event - Form submit event
 */
async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate form inputs
    if (!validateForm()) {
        alert('Please enter valid values for all fields:\n\n' +
              '- Salinity: A positive number (e.g., 15.02)\n' +
              '- Temperature: A positive number (e.g., 25.5)\n' +
              '- Number of Storms: A positive number (e.g., 0, 1, 2)\n' +
              '- Number of Severe Events: A positive number (e.g., 0, 1, 2)\n' +
              '- Number of Typhoons: A positive number (e.g., 0, 1, 2)\n' +
              '- Number of Floods: A positive number (e.g., 0, 1, 2)\n' +
              '- Farming Technique: Select an option (1=Raft, 2=Stake, 3=Both)\n\n' +
              'Mangyaring maglagay ng wastong halaga para sa lahat ng patlang.');
        return;
    }
    
    // Get input values (only those used in formula)
    const salinity = parseFloat(document.getElementById('salinity').value);
    const farmingTechnique = parseInt(document.getElementById('farmingTechnique').value);
    const typhoon = parseInt(document.getElementById('typhoon').value) || 0;
    const flood = parseInt(document.getElementById('flood').value) || 0;
    
    // Disable button during calculation
    predictBtn.disabled = true;
    const buttonSpans = predictBtn.querySelectorAll('span');
    if (buttonSpans[0]) buttonSpans[0].textContent = 'Calculating...';
    if (buttonSpans[1]) buttonSpans[1].textContent = 'Kinakalkula...';
    
    try {
        // Calculate predicted production
        const predictedProduction = calculateOysterProduction(
            salinity,
            farmingTechnique,
            typhoon,
            flood
        );
        
        // Display results (this will also trigger AI recommendations fetch)
        displayResults(predictedProduction);
    } catch (error) {
        console.error('Error calculating production:', error);
        alert('An error occurred while calculating production. Please try again.\n\nMay naganap na error habang kinakalkula ang produksyon. Pakisubukan muli.');
    } finally {
        // Re-enable button
        predictBtn.disabled = false;
        const buttonSpansReset = predictBtn.querySelectorAll('span');
        if (buttonSpansReset[0]) buttonSpansReset[0].textContent = 'Compute Oyster Production';
        if (buttonSpansReset[1]) buttonSpansReset[1].textContent = 'Kalkulahin ang Produksyon ng Talaba';
    }
}

// ============================================
// Event Listeners Setup
// ============================================

/**
 * Initializes all event listeners
 */
function initializeEventListeners() {
    // Form submission
    form.addEventListener('submit', handleFormSubmit);
    
    // Reset button
    resetBtn.addEventListener('click', resetResults);
    
    // Export buttons
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', downloadPDF);
    }
    
    if (copyClipboardBtn) {
        copyClipboardBtn.addEventListener('click', copyToClipboard);
    }
    
    // Real-time input validation
    const inputs = form.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('input', handleInputValidation);
        input.addEventListener('blur', handleInputValidation);
    });
}

// ============================================
// Initialization
// ============================================

/**
 * Initializes the application when DOM is loaded
 */
function init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeEventListeners);
    } else {
        initializeEventListeners();
    }
}

// Start the application
init();

// ============================================
// Export functions for testing (if needed)
// ============================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateOysterProduction,
        formatNumber,
        isValidNumber
    };
}

