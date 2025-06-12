window.addEventListener('DOMContentLoaded', () => {
    const gallery = document.getElementById('gallery');
    const images = ['0.png', '1.png', '2.png'];
    images.forEach(img => {
        const image = document.createElement('img');
        image.src = `assets/arcanos/${img}`;
        image.alt = img;
        gallery.appendChild(image);
    });
});
