// Fix gallery image paths to use gallery subdirectory
function fixGalleryPaths() {
    document.querySelectorAll('.gallery-image img').forEach(img => {
        if (img.src && !img.src.includes('gallery/')) {
            const filename = img.src.split('/').pop();
            img.src = `images/gallery/${filename}`;
        }
    });
}
fixGalleryPaths();
window.addEventListener('load', fixGalleryPaths);
document.addEventListener('DOMContentLoaded', fixGalleryPaths);

// Portfolio section initialized
// (ScrollStack implementation removed - using grid layout instead)

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Contact form submission handler
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value
        };

        // ここにフォーム送信処理を実装
        // 例: fetch APIを使ってサーバーに送信
        console.log('Form submitted:', formData);

        // 送信完了メッセージ
        alert('お問い合わせありがとうございます。\n2営業日以内にご返信いたします。');

        // フォームをリセット
        contactForm.reset();
    });
}

// Handwriting animation for hero title
const heroTitle = document.querySelector('.hero-title');
if (heroTitle) {
    // Save original HTML to preserve br elements
    const originalHTML = heroTitle.innerHTML;
    heroTitle.innerHTML = '';

    let charIndex = 0;
    const speed = 80; // milliseconds per character

    function animateTitle() {
        // Parse original HTML to get text content while preserving structure
        const div = document.createElement('div');
        div.innerHTML = originalHTML;
        const textWithStructure = div.textContent;

        if (charIndex < textWithStructure.length) {
            const char = textWithStructure[charIndex];

            const span = document.createElement('span');
            span.textContent = char;
            span.style.opacity = '0';
            span.style.animation = `fadeInWriting 0.5s ease-out forwards`;
            span.style.animationDelay = `${charIndex * 0.05}s`;
            span.style.display = 'inline';

            // Handle line breaks
            if (char === '\n') {
                heroTitle.appendChild(document.createElement('br'));
            } else {
                heroTitle.appendChild(span);
            }

            charIndex++;
            setTimeout(animateTitle, speed);
        }
    }

    // Start animation when page loads
    if (document.readyState === 'complete') {
        animateTitle();
    } else {
        window.addEventListener('load', animateTitle);
    }
}

// Portfolio card description expansion
function setupDescriptionListeners() {
    document.querySelectorAll('.portfolio-card-description').forEach(description => {
        description.addEventListener('click', function(e) {
            const isExpanded = this.classList.toggle('expanded');

            // Apply styles directly to ensure they work
            if (isExpanded) {
                this.style.display = 'block';
                this.style.webkitLineClamp = 'unset';
                this.style.overflow = 'visible';
            } else {
                this.style.display = '';
                this.style.webkitLineClamp = '';
                this.style.overflow = '';
            }
        });
    });
}

// Handle both DOMContentLoaded and already-loaded cases
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDescriptionListeners);
} else {
    setupDescriptionListeners();
}

