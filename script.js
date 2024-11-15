document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('sbom-upload');
    const searchInput = document.getElementById('search-input');
    const metadataDiv = document.getElementById('metadata');
    const tableBody = document.getElementById('components-table').getElementsByTagName('tbody')[0];
    const tableHeaders = document.querySelectorAll('#components-table th');

    let sbomData = []; // Store the SBOM data globally

// Function to download the table data as CSV
function downloadCSV() {
    const table = document.getElementById("components-table");
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Loop through table rows and extract text content
    for (const element of table.rows) {
        let row = element;
        let rowData = [];
        
        // Loop through each cell in the row and extract the text
        for (const element of row.cells) {
            rowData.push(element.innerText.trim());
        }
        
        // Join the row data with commas and append to the CSV content
        csvContent += rowData.join(",") + "\r\n";
    }

    // Create a hidden link element to trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sbom-components.csv");
    
    // Programmatically click the link to start the download
    link.click();
}

// Event listener for the download CSV button
document.getElementById("download-csv").addEventListener("click", downloadCSV);


    // Function to handle the file upload
    fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];

        if (file && file.name.endsWith('.json')) {
            const reader = new FileReader();

            reader.onload = function(e) {
                sbomData = JSON.parse(e.target.result);

                // Clear previous content
                metadataDiv.innerHTML = '';
                tableBody.innerHTML = '';

                // Display metadata
                metadataDiv.innerHTML = `
                    <p><strong>BOM Format:</strong> ${sbomData.bomFormat}</p>
                    <p><strong>Spec Version:</strong> ${sbomData.specVersion}</p>
                    <p><strong>Timestamp:</strong> ${sbomData.metadata.timestamp}</p>
                    <p><strong>Serial Number:</strong> ${sbomData.serialNumber}</p>
                `;

                // Populate components table
                populateTable(sbomData.components);
            };

            reader.readAsText(file);
        } else {
            alert('Please upload a valid SBOM JSON file.');
        }
    });

    // Function to populate the table with components data
    function populateTable(components) {
        // Clear previous rows
        tableBody.innerHTML = '';

        components.forEach(component => {
            const row = tableBody.insertRow();

            // Name
            const cell1 = row.insertCell(0);
            cell1.textContent = component.name;

            // Version
            const cell2 = row.insertCell(1);
            cell2.textContent = component.version;

            // Description
            const cell3 = row.insertCell(2);
            cell3.textContent = component.description || "N/A";

            // Type
            const cell4 = row.insertCell(3);
            cell4.textContent = component.type || "N/A";

            // Bom-ref
            const cell5 = row.insertCell(4);
            cell5.textContent = component['bom-ref'] || "N/A";

            // License
            const cell6 = row.insertCell(5);
            const license = component.licenses && component.licenses[0] ? component.licenses[0].license.name : "N/A";
            cell6.textContent = license;

            // External References
            const cell7 = row.insertCell(6);
            const refs = component.externalReferences
                ? component.externalReferences
                    .map(ref => `<a href="${ref.url}" target="_blank">${ref.type}</a>`)
                    .join(', ')
                : "N/A";
            cell7.innerHTML = refs;
        });
    }

    // Search functionality
    searchInput.addEventListener('input', function() {
        const query = searchInput.value.toLowerCase();
        const filteredData = sbomData.components.filter(component => {
            return Object.values(component).some(val => 
                val && val.toString().toLowerCase().includes(query)
            );
        });

        populateTable(filteredData);
    });

    // Sorting functionality
    tableHeaders.forEach((header, index) => {
        if (header.dataset.sortable) {
            header.addEventListener('click', function() {
                const isAscending = header.classList.contains('sorted-asc');
                sortTable(index, isAscending);
            });
        }
    });

    function sortTable(columnIndex, isAscending) {
        const sortedData = [...sbomData.components].sort((a, b) => {
            const valA = Object.values(a)[columnIndex];
            const valB = Object.values(b)[columnIndex];

            // Handle undefined or null values
            const compareA = valA ? valA.toString().toLowerCase() : '';
            const compareB = valB ? valB.toString().toLowerCase() : '';

            if (compareA < compareB) return isAscending ? -1 : 1;
            if (compareA > compareB) return isAscending ? 1 : -1;
            return 0;
        });

        // Set the sorted data
        populateTable(sortedData);

        // Toggle the sorting direction
        tableHeaders.forEach(header => {
            header.classList.remove('sorted-asc', 'sorted-desc');
        });
        tableHeaders[columnIndex].classList.add(isAscending ? 'sorted-desc' : 'sorted-asc');
    }

    
});
