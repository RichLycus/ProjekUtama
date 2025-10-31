// ChimeraAI - Blank HTML Project Script

console.log('🚀 ChimeraAI Project Loaded!');

// Add welcome animation
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add click effect to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });
    
    // Log project info
    console.log('Project is running successfully!');
    console.log('Edit files to see changes instantly with hot reload.');
});

// Example function
function greet(name) {
    return `Hello, ${name}! Welcome to your new project.`;
}

// You can call functions from browser console
window.greet = greet;
