// Dark/Light mode toggle
const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
};
// On load, set theme
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
}
// Typing effect
function typeText(element, text, speed = 30) {
    let i = 0;
    element.textContent = '';
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}
// Scroll reveal
function revealOnScroll() {
    document.querySelectorAll('.scroll-reveal').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight - 40) {
            el.classList.add('visible');
        }
    });
}
window.addEventListener('scroll', revealOnScroll);
window.addEventListener('DOMContentLoaded', revealOnScroll);
// Loader and AJAX form
const form = document.getElementById('abstractForm');
const loader = document.getElementById('loader');
const outputSection = document.getElementById('outputSection');
form.addEventListener('submit', function(e) {
    e.preventDefault();
    loader.classList.remove('hidden');
    outputSection.innerHTML = '';
    const formData = new FormData(form);
    fetch('/predict', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        loader.classList.add('hidden');
        if (data.error) {
            outputSection.innerHTML = `<div class='bg-red-100 text-red-700 p-4 rounded-lg'>${data.error}</div>`;
            return;
        }
        // Display cards in the order of integer keys from the backend, using (section, value) tuples
        Object.keys(data).sort((a, b) => Number(a) - Number(b)).forEach((idx) => {
            const [key, value] = data[idx];
            if (value) {
                const card = document.createElement('div');
                card.className = 'floating-card fade-in p-6 mb-4 bg-white dark:bg-gray-800 shadow-lg';
                const title = document.createElement('h2');
                title.className = 'text-xl font-bold mb-2';
                title.textContent = key;
                card.appendChild(title);
                if (Array.isArray(value)) {
                    const ul = document.createElement('ul');
                    ul.className = 'list-disc pl-6';
                    value.forEach((item, i) => {
                        const li = document.createElement('li');
                        li.className = 'typing-effect text-gray-700 dark:text-gray-200 mb-1';
                        ul.appendChild(li);
                        setTimeout(() => typeText(li, item), 400 * idx + 100 * i);
                    });
                    card.appendChild(ul);
                } else {
                    const content = document.createElement('p');
                    content.className = 'typing-effect text-gray-700 dark:text-gray-200';
                    card.appendChild(content);
                    setTimeout(() => typeText(content, value), 400 * idx);
                }
                outputSection.appendChild(card);
            }
        });
        revealOnScroll();
    })
    .catch(() => {
        loader.classList.add('hidden');
        outputSection.innerHTML = `<div class='bg-red-100 text-red-700 p-4 rounded-lg'>Server error. Please try again.</div>`;
    });
});
// File upload triggers textarea clear
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', function() {
    document.getElementById('abstractInput').value = '';
});
// Scroll-to-top button
const scrollTopBtn = document.getElementById('scrollTopBtn');
window.addEventListener('scroll', () => {
    if (window.scrollY > 200) {
        scrollTopBtn.classList.remove('hidden');
    } else {
        scrollTopBtn.classList.add('hidden');
    }
});
scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
const pubmedLinkInput = document.getElementById('pubmedLinkInput');
const abstractInput = document.getElementById('abstractInput');

const clearBtn = document.getElementById('clearBtn');

clearBtn.addEventListener('click', function() {
    pubmedLinkInput.value = '';
    abstractInput.value = '';
    fileInput.value = '';
    pubmedLinkInput.disabled = false;
    abstractInput.disabled = false;
    fileInput.disabled = false;
    outputSection.innerHTML = '';
});

// Only one input method active at a time
pubmedLinkInput.addEventListener('input', function() {
    if (pubmedLinkInput.value.trim()) {
        abstractInput.disabled = true;
        fileInput.disabled = true;
    } else {
        abstractInput.disabled = false;
        fileInput.disabled = false;
    }
});
abstractInput.addEventListener('input', function() {
    if (abstractInput.value.trim()) {
        pubmedLinkInput.disabled = true;
        fileInput.disabled = true;
    } else {
        pubmedLinkInput.disabled = false;
        fileInput.disabled = false;
    }
});
function handleTxtFileToTextarea(file) {
    if (file && file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = function(e) {
            abstractInput.value = e.target.result;
            // Clear file input so only textarea is submitted
            fileInput.value = '';
            // Enable textarea for editing and submission
            abstractInput.disabled = false;
            // Trigger input event to update disabling logic
            abstractInput.dispatchEvent(new Event('input'));
        };
        reader.readAsText(file);
    }
}

fileInput.addEventListener('change', function() {
    if (fileInput.files.length > 0) {
        pubmedLinkInput.disabled = true;
        abstractInput.disabled = true;
        handleTxtFileToTextarea(fileInput.files[0]);
    } else {
        pubmedLinkInput.disabled = false;
        abstractInput.disabled = false;
    }
});

const dropArea = document.getElementById('dropArea');

dropArea.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropArea.classList.add('ring', 'ring-blue-400', 'bg-blue-100', 'dark:bg-blue-800');
});
dropArea.addEventListener('dragleave', function(e) {
    e.preventDefault();
    dropArea.classList.remove('ring', 'ring-blue-400', 'bg-blue-100', 'dark:bg-blue-800');
});
dropArea.addEventListener('drop', function(e) {
    e.preventDefault();
    dropArea.classList.remove('ring', 'ring-blue-400', 'bg-blue-100', 'dark:bg-blue-800');
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'text/plain') {
        fileInput.files = files;
        // Trigger file input change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
        handleTxtFileToTextarea(files[0]);
    } else {
        alert('Please drop a valid .txt file.');
    }
}); 