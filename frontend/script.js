document.addEventListener("DOMContentLoaded", function() {
    // Fetch existing medicines when the page is loaded
    fetchMedicines();
    
    // Add event listener for the form submission
    const form = document.getElementById("medicineForm");
    if (form) {
        form.addEventListener("submit", function(event) {
            event.preventDefault(); // Prevent page refresh on form submission
            addMedicine();
        });
    }

    // Add event listener for the calculate average price button
    const calculateAveragePriceButton = document.getElementById("calculate-average-price-button");
    if (calculateAveragePriceButton) {
        calculateAveragePriceButton.addEventListener("click", function() {
            calculateAveragePrice();
        });
    }

    const priceInput = document.getElementById("medicinePrice");
    if (priceInput) {
        priceInput.addEventListener('input', () => {
            if (priceInput.value.includes('.')) {
                const parts = priceInput.value.split('.');
                if (parts[1] && parts[1].length > 2) {
                    priceInput.value = `${parts[0]}.${parts[1].substring(0, 2)}`;
                }
            }
        });
    }

});

function fetchMedicines() {
    fetch('http://127.0.0.1:8000/medicines')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayMedicines(data.medicines);
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
            document.getElementById('medicines-container').innerHTML = `<li>Error fetching medicines. Please try again later.</li>`;
        });
}



function displayMedicines(medicines) {
    const container = document.getElementById('medicines-container');
    container.innerHTML = ''; // Clear any existing content

    if (medicines.length === 0) {
        container.innerHTML = '<li>No medicines available at the moment.</li>';
        return;
    }

    medicines.forEach(medicine => {
        const listItem = document.createElement('li');
        listItem.className = 'medicine-box'; // Added a class to style the medicine box
        const name = medicine.name || "Unknown Medicine";
        
        // Create content elements for medicine info
        const medicineInfo = document.createElement('div');
        medicineInfo.className = 'medicine-info'; // Class for styling medicine info

        // Create a label for the name and price
        const nameLabel = document.createElement('strong');
        nameLabel.textContent = `${name}`;
        medicineInfo.appendChild(nameLabel);

        const priceElement = document.createElement('div');
        priceElement.className = 'price-info';
        priceElement.textContent = `£${medicine.price != null ?  parseFloat(medicine.price).toFixed(2)  : "Price not available"}`;
        priceElement.dataset.editable = "false";
        medicineInfo.appendChild(priceElement);

        listItem.appendChild(medicineInfo);

        // Create container for edit and delete buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'edit-delete-buttons';

        // Create edit button
        const editButton = document.createElement('button');
        editButton.className = 'edit-button';

        // Add an image to the edit button
        const editIcon = document.createElement('img');
        editIcon.src = 'editButton.png'; // Path to your PNG image
        editIcon.alt = 'Edit'; // Alternative text for accessibility
        editIcon.className = 'icon'; // Class for styling the image

        editButton.appendChild(editIcon);
        editButton.addEventListener('click', () => toggleEditPrice(medicine, priceElement, editButton));
        buttonContainer.appendChild(editButton);

        // Create delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-button';

        // Add an image to the delete button
        const trashIcon = document.createElement('img');
        trashIcon.src = 'deleteButton.png'; // Path to your PNG image
        trashIcon.alt = 'Delete'; // Alternative text for accessibility
        trashIcon.className = 'icon'; // Class for styling the image

        deleteButton.appendChild(trashIcon);
        deleteButton.addEventListener('click', () => deleteMedicine(medicine.name));
        buttonContainer.appendChild(deleteButton);

        // Append the button container to the list item
        listItem.appendChild(buttonContainer);

        // Append the list item to the container
        container.appendChild(listItem);
    });
}

function toggleEditPrice(medicine, priceElement, editButton) {
    // Check if the current price element is editable or not
    if (priceElement.dataset.editable === "false") {
        // Make the price editable
        const currentPrice = parseFloat(priceElement.textContent.replace('£', '')) || 0;
        const inputField = document.createElement('input');
        inputField.type = 'number';
        inputField.value = currentPrice;
        inputField.step = '0.01';
        inputField.className = 'price-input';

        inputField.addEventListener('input', () => {
            if (inputField.value.includes('.')) {
                const parts = inputField.value.split('.');
                if (parts[1] && parts[1].length > 2) {
                    inputField.value = `${parts[0]}.${parts[1].substring(0, 2)}`;
                }
            }
        });

        // Replace the price element with an input field
        priceElement.replaceWith(inputField);
        priceElement.dataset.editable = "true";

        // Change edit button to save button
        editButton.innerHTML = ''; // Clear current content
        const saveIcon = document.createElement('img');
        saveIcon.src = 'SaveButton.png'; // Correct path to your PNG image
        saveIcon.alt = 'Save'; // Alternative text for accessibility
        saveIcon.className = 'icon'; // Class for styling the image
        editButton.appendChild(saveIcon);
          // Set the button to save the price when clicked
          editButton.onclick = () => savePrice(medicine, inputField, editButton);
    }
}

function savePrice(medicine, inputField, editButton) {
    const newPrice = parseFloat(inputField.value);

    if (!isNaN(newPrice)) {
        // Update the medicine's price in the backend
        const formData = new FormData();
        formData.append('name', medicine.name);
        formData.append('price', newPrice);

        fetch('http://127.0.0.1:8000/update', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to update medicine');
            }
            return response.json();
        })
        .then(data => {
            alert(data.message);

            // Update the displayed price and replace input field with updated price element
            const updatedPriceElement = document.createElement('div');
            updatedPriceElement.className = 'price-info';
            updatedPriceElement.textContent = `£${newPrice}`;
            updatedPriceElement.dataset.editable = "false";
            inputField.replaceWith(updatedPriceElement);

            // Change save button back to edit button
            editButton.innerHTML = ''; 
            const editIcon = document.createElement('img');
            editIcon.src = 'EditButton.png';
            editIcon.alt = 'Edit';
            editIcon.className = 'icon';
            editButton.appendChild(editIcon);
            //displayToast('Price Updated', 'Sucess')

            // Re-enable the edit functionality
            editButton.onclick = () => toggleEditPrice(medicine, updatedPriceElement, editButton);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error updating medicine. Please try again.');
        });
    } else {
        alert("Please enter a valid price.");
    }
}


// function editMedicine(medicine) {
//     // For now, simply log to the console. You can extend this to open a form for editing.
//     console.log(`Editing medicine: ${medicine.name}`);
//     alert(`Editing feature for "${medicine.name}" coming soon!`);
// }

function deleteMedicine(name) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
        return;
    }

    // Send DELETE request to the backend
    const formData = new FormData();
    formData.append("name", name);

    fetch('http://127.0.0.1:8000/delete', {
        method: 'DELETE',
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to delete medicine');
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        fetchMedicines(); // Refresh the medicines list
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Error deleting medicine. Please try again.");
    });
}

function addMedicine() {
    const name = document.getElementById("medicineName").value.trim();
    const price = parseFloat(document.getElementById("medicinePrice").value);

    if (!name || isNaN(price)) {
        displayFormMessage("Please enter valid name and price.", "error");
        return;
    }

    // Create form data object to send to backend
    const formData = new FormData();
    formData.append("name", name);
    formData.append("price", price);

    // Send POST request to the backend
    fetch('http://127.0.0.1:8000/create', {
        method: 'POST',
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to add medicine');
        }
        return response.json();
    })
    .then(data => {
        displayFormMessage(data.message || "Medicine has been added.", "success");
        fetchMedicines(); // Refresh the medicines list
        
    })
    .catch(error => {
        console.error('Error:', error);
        displayFormMessage(data.msg, "error");
        displayFormMessage(error.message || "Error adding medicine. Please try again.", "error");
    });
}

function displayFormMessage(message, type) {
    const formMessage = document.getElementById("formMessage");
    formMessage.textContent = message;
    formMessage.className = type;

    // Ensure opacity is reset if using fade-out effects
    formMessage.style.opacity = "1";

    if (type === "success") {
        formMessage.textContent = "Success, Medicine has been added";
    } else {
        formMessage.textContent = "Error";
    }

    // Message stays visible for 10 seconds, then disappears
    setTimeout(() => {
        formMessage.textContent = ""; // Clear the message
        formMessage.className = "";  // Reset the class
    }, 10000); // 10 seconds
}

// function displayToast(message, type) {
//     const toast = document.createElement('div');
//     toast.className = `toast ${type}`;
//     toast.textContent = message;

//     document.body.appendChild(toast);

//     
//     setTimeout(() => {
//         toast.remove();
//     }, 3000);
// }

function calculateAveragePrice() {
    fetch('http://127.0.0.1:8000/average-price')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch average price');
            }
            return response.json();
        })
        .then(data => {
            // Check if data has the average key
            if (data && data.average !== undefined) {
                const averagePriceResult = document.getElementById("average-price-result");
                averagePriceResult.textContent = `Average Price: £${data.average.toFixed(2)}`;
            } else {
                throw new Error('Invalid response format');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            const averagePriceResult = document.getElementById("average-price-result");
            averagePriceResult.textContent = "Error calculating average price. Please try again.";
        });
}
