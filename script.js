// Slider functionality
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('slider');
    if (slider) {
        const dots = document.querySelectorAll('.slider-dot');
        let currentSlide = 0;
        const slideCount = document.querySelectorAll('.slide').length;

        function goToSlide(slideIndex) {
            slider.style.transform = `translateX(-${slideIndex * 100}%)`;
            currentSlide = slideIndex;

            dots.forEach((dot, index) => {
                if (index === slideIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                goToSlide(index);
            });
        });

        setInterval(() => {
            currentSlide = (currentSlide + 1) % slideCount;
            goToSlide(currentSlide);
        }, 5000);
    }
});

// TODO: Add tournament creation logic

// TODO: Add match creation logic

// TODO: Add wallet functionality
