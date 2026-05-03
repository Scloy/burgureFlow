// Force scroll to top on refresh (Immediate)
window.scrollTo(0, 0);
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

window.onbeforeunload = function () {
    window.scrollTo(0, 0);
};

document.addEventListener('DOMContentLoaded', () => {
    // Double check on DOM load
    window.scrollTo(0, 0);

    console.log("BurguerFlow Semi-Blocking Loader | Frame-Perfect Mode");

    gsap.registerPlugin(ScrollTrigger);

    const video = document.getElementById('hamb-video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const container = document.querySelector('.sticky-video');
    const loader = document.getElementById('loader');
    const progress = document.querySelector('.progress');
    const statusText = document.getElementById('status-text');
    const frameCountText = document.getElementById('frame-count');
    
    container.appendChild(canvas);

    let frames = [];
    let totalFrames = 80; 
    let breakPoint = 50; // Load 50 frames before showing the site
    let framesLoaded = 0;
    let targetFrame = 0;
    let currentFrame = 0;
    let isLoaderVisible = true;

    const loadingMessages = [
        "AQUECENDO A CHAPA...",
        "CORTANDO O BACON CROCANTE...",
        "DERRETENDO O CHEDDAR...",
        "PREPARANDO O PÃO BRIOCHE...",
        "SINCRONIZANDO O FLOW..."
    ];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    // Rotate loading messages
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        if (framesLoaded < totalFrames) {
            msgIndex = (msgIndex + 1) % loadingMessages.length;
            statusText.innerText = loadingMessages[msgIndex];
        } else {
            clearInterval(msgInterval);
        }
    }, 2000);

    const extractFrames = async () => {
        const duration = video.duration;
        const interval = duration / totalFrames;

        for (let i = 0; i <= totalFrames; i++) {
            video.currentTime = i * interval;
            await new Promise(resolve => {
                const onSeeked = () => {
                    video.removeEventListener('seeked', onSeeked);
                    createImageBitmap(video).then(bitmap => {
                        frames[i] = bitmap;
                        framesLoaded++;
                        
                        // Update UI
                        const perc = Math.floor((framesLoaded / totalFrames) * 100);
                        progress.style.width = perc + "%";
                        frameCountText.innerText = `FRAME ${framesLoaded} / ${totalFrames}`;
                        
                        // BREAKPOINT: Reveal site after 50 frames
                        if (framesLoaded === breakPoint && isLoaderVisible) {
                            finishLoading();
                        }
                        
                        resolve();
                    });
                };
                video.addEventListener('seeked', onSeeked);
            });
        }
    };

    const finishLoading = () => {
        isLoaderVisible = false;
        statusText.innerText = "PRONTO PARA O FLOW";
        setTimeout(() => {
            loader.style.opacity = "0";
            setTimeout(() => loader.style.visibility = "hidden", 800);
            startFlow();
        }, 1000);
    };

    const startFlow = () => {
        ScrollTrigger.create({
            trigger: ".scroll-video-container",
            start: "top top",
            end: "bottom bottom",
            scrub: 0.1,
            onUpdate: (self) => {
                targetFrame = Math.floor(self.progress * totalFrames);
            }
        });
        requestAnimationFrame(renderLoop);
    };

    function renderLoop() {
        currentFrame += (targetFrame - currentFrame) * 0.1;
        const frameIndex = Math.round(currentFrame);
        
        // HYBRID: Use image if ready, fallback to video only if absolutely necessary
        // (Though with 50 frames already in, it will likely use frames)
        const source = frames[frameIndex] || video;

        if (source) {
            if (source === video) {
                const time = (frameIndex / totalFrames) * video.duration;
                video.currentTime = time;
            }

            const vW = (source instanceof ImageBitmap) ? source.width : video.videoWidth;
            const vH = (source instanceof ImageBitmap) ? source.height : video.videoHeight;
            
            if (vW > 0) {
                const sW = canvas.width;
                const sH = canvas.height;
                const sRatio = sW / sH;
                const vRatio = vW / vH;
                
                let dW, dH, dX, dY;
                const zoom = 1.35;
                
                if (vRatio > sRatio) {
                    dH = sH * zoom;
                    dW = dH * vRatio;
                } else {
                    dW = sW * zoom;
                    dH = dW / vRatio;
                }

                dX = (sW - dW) / 2;
                dY = (sH - dH) * 0.55; 

                ctx.clearRect(0, 0, sW, sH);
                ctx.drawImage(source, dX, dY, dW, dH);
            }
        }
        requestAnimationFrame(renderLoop);
    }

    video.addEventListener('loadedmetadata', () => {
        extractFrames();
    });

    video.load();

    // Menu animations
    gsap.from(".burger-card", {
        scrollTrigger: {
            trigger: ".burger-grid",
            start: "top 80%",
        },
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: "power2.out"
    });

    // 3. Static Fries Background (Removed Animation)
    // The background is now handled purely via CSS for better stability
});
