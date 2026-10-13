// =====================================================
// CẤU HÌNH
// =====================================================
const LETTERS = {
    grad: { env: "envelopeGrad", modal: "grad-modal" },   // Thư mừng tốt nghiệp
    love: { env: "envelopeLove", modal: "letter-modal" }  // Thư 20/10
};

// ---- NHẠC: đặt file mp3 của bạn cùng thư mục với index.html ----
const MUSIC = {
    src: "nhac.mp3",          // <-- đổi tên file nhạc của bạn ở đây
    volume: 0.7,              // 0 → 1
    autoPlayOnOpen: false,    // true = tự phát nhạc khi mở thư
    loveSrc: "music/cho-anh-chut-thoi.mp3",      // <-- NHẠC THƯ 20/10: tự phát khi mở thư, tắt khi đóng thư (đổi tên file mp3 của bạn ở đây)
    slideshowSrc: "music/di-giua-troi-ruc-ro.mp3"   // <-- bài tự phát khi xem trình chiếu (đổi đường dẫn nếu để trong thư mục khác, vd "music/hanh-trinh-ruc-ro.mp3")
};

// Bộ emoji bay lên cho từng thư
const EMOJI_SETS = {
    love: [
    "❤️", "💖", "💗", "💕", "💓", "💞", "💘", "💝",
    "🌸", "🌷", "🌹", "🌺", "🌻", "🌼", "🌱", "🪷",
    "💐", "🪻", "🪷", "🏵️", "🌿", "🍀", "🌵", "🌾",
    "🌸", "🌷", "🌹", "🌺", "🌻", "🌼", "🪻", "💮",
    "🌷", "🌹", "🌸", "🌼", "💐", "🪻", "🌺", "🌻",
    "✨", "⭐", "🌟", "💫", "🦋", "🐝", "🐞", "🍃",
    "🌹", "🌷", "🌸", "💖", "💕", "💗", "💐", "🪷"
    ],
    grad: ["🎓", "🎉", "✨", "🌸", "💖", "🎊", "🌷"]
};

const CONFETTI_COLORS = {
    grad: ["#f6c453", "#ffd976", "#a3b3e6", "#7dd3fc", "#f9a8d4", "#ffffff", "#c4b5fd"],
    love: ["#fb7185", "#f9a8d4", "#fda4af", "#ffffff", "#f43f5e", "#fbcfe8"]
};

const rand = (a, b) => a + Math.random() * (b - a);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ⚡ Chế độ "nhẹ": điện thoại / màn cảm ứng / máy ít RAM, CPU -> giảm số hạt hiệu ứng
const LITE = (
    window.matchMedia("(max-width: 820px), (pointer: coarse)").matches ||
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4)
);
const K = LITE ? 0.5 : 1;                       // hệ số giảm số lượng hạt
const cnt = (n) => Math.max(1, Math.round(n * K));

// =====================================================
// MỞ / ĐÓNG THƯ
// =====================================================
let activeType = null;   // thư đang mở ("grad" | "love" | null)
let closing = false;

function openEnvelope(type = "love") {
    if (activeType) return;
    activeType = type;
    document.body.classList.toggle("grad-open", type === "grad");

    if (type === "love") startLoveMusic();   // thư 20/10: có nhạc ngay khi mở

    const { env, modal } = LETTERS[type];
    document.getElementById(env).classList.add("open");
    if (window.envelopeOpenFx) envelopeOpenFx(type);   // hiệu ứng loé sáng + pháo tim

    // Âm thanh mở thư
    playChime(523.25, 0.1);                            // C5
    setTimeout(() => playChime(659.25, 0.1), 150);     // E5
    setTimeout(() => playChime(783.99, 0.2), 300);     // G5
    if (type === "grad") setTimeout(() => playChime(1046.5, 0.4), 480); // C6

    triggerHeartBurst(type, LITE ? 10 : 25);

    // Sau khi phong thư mở, chuyển mượt sang lá thư lớn
    setTimeout(() => {
        const section = document.getElementById("envelope-section");
        section.style.opacity = "0";
        section.style.transform = "translateY(-30px)";
        setTimeout(() => {
            section.style.display = "none";
            const modalEl = document.getElementById(modal);
            modalEl.classList.remove("is-off");   // thư đang display:none -> hiện lại
            void modalEl.offsetWidth;             // ép tính layout để transition vẫn chạy mượt
            modalEl.scrollTop = 0;
            modalEl.classList.add("show");
            document.body.classList.add("has-letter");   // ẩn nền ambient -> dừng animation phía sau

            prepareGalleryReveal(modalEl);
            // thư tốt nghiệp: pháo giấy nổ đúng lúc rèm kéo ra
            if (type === "grad") setTimeout(() => { if (activeType === "grad") celebrate(type); }, 1700);
            else celebrate(type);
            if (MUSIC.autoPlayOnOpen && !musicOn) toggleMusic();
        }, 400);
    }, 900);
}

function closeLetter() {
    if (!activeType || closing) return;
    closing = true;
    stopLoveMusic();                         // đóng thư là tắt nhạc
    closeLightbox();
    closeCinema();
    document.body.classList.remove("grad-open", "has-letter");

    const { env, modal } = LETTERS[activeType];
    const modalToHide = document.getElementById(modal);
    modalToHide.classList.remove("show");
    // sau khi hiệu ứng đóng xong -> ẩn hẳn để trình duyệt khỏi vẽ/animate ngầm
    setTimeout(() => { if (!modalToHide.classList.contains("show")) modalToHide.classList.add("is-off"); }, 800);

    const envSection = document.getElementById("envelope-section");
    envSection.style.display = "flex";
    if (window.envelopeCloseFx) envelopeCloseFx();
    setTimeout(() => {
        envSection.style.opacity = "1";
        envSection.style.transform = "translateY(0)";
    }, 50);

    setTimeout(() => {
        document.getElementById(env).classList.remove("open");
        activeType = null;
        closing = false;
    }, 500);
}

// =====================================================
// GỬI NGÀN TIM / LỜI CHÚC  (gửi xong thư VẪN MỞ)
// =====================================================
function sendWishes(type, btn) {
    // Hợp âm vui
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        setTimeout(() => playChime(f, 0.35), i * 110)
    );

    celebrate(type, true);
    triggerHeartBurst(type, 45);

    if (btn) {
        if (!btn.dataset.orig) btn.dataset.orig = btn.innerHTML;
        btn.innerHTML = type === "grad" ? "Đã gửi ngàn lời chúc ✨" : "Đã gửi ngàn tim ✨";
        clearTimeout(btn._t);
        btn._t = setTimeout(() => {
            btn.innerHTML = btn.dataset.orig;
            delete btn.dataset.orig;
        }, 2200);
    }
}

// =====================================================
// ẢNH: ẨN ẢNH THIẾU, HIỆN KHUNG GỢI Ý CHO ẢNH BẮT BUỘC
// =====================================================
function photoMissing(img) {
    const frame = img.closest(".polaroid, .gm-frame");
    if (!frame) return;
    if (frame.hasAttribute("data-required")) {
        frame.classList.add("no-photo");
    } else {
        frame.remove();
    }
}

// =====================================================
// 🖼️ KHO ẢNH: thu nhỏ ảnh gốc MỘT LẦN rồi dùng bản nhỏ cho mọi nơi
//   Vấn đề cũ: ảnh tốt nghiệp là ảnh gốc từ điện thoại (vài MB, hàng chục
//   triệu điểm ảnh). Thư viện, lightbox, cuộn film và 2 lớp nền của mỗi
//   khung phim đều giải mã LẠI ảnh gốc -> tốn RAM, nghẽn CPU -> load lâu, giật.
//   Cách mới:
//     • mỗi ảnh gốc chỉ được tải + giải mã 1 lần (lần lượt, từng ảnh một)
//     • tạo bản "xem" (cạnh dài ~1280px) + bản "thumb" (240px) và lưu lại
//     • thư viện / lightbox / phim dùng bản xem; cuộn film dùng thumb
//   Nếu trình duyệt chặn canvas (vd mở file bằng file://) thì tự dùng ảnh gốc như cũ.
// =====================================================
const PH = (() => {
    const MAX = LITE ? 1280 : 1920;     // cạnh dài tối đa của bản "xem"
    const THUMB = 240;                  // cạnh dài của thumb cuộn film
    const LIMIT = LITE ? 1 : 2;         // số ảnh xử lý cùng lúc
    const done = new Map();             // src -> kết quả
    const jobs = new Map();             // src -> công việc đang chờ / đang chạy
    const queue = [];
    let running = 0;

    const loadImg = (src) => new Promise((res, rej) => {
        const im = new Image();
        im.decoding = "async";
        im.onload = () => res(im);
        im.onerror = () => rej(new Error("load"));
        im.src = src;
    });
    const toUrl = (cv, q) => new Promise((res, rej) =>
        cv.toBlob((b) => (b ? res(URL.createObjectURL(b)) : rej(new Error("blob"))), "image/jpeg", q));

    async function build(src) {
        let im;
        try { im = await loadImg(src); } catch (e) { return { missing: true }; }
        try {
            if (im.decode) { try { await im.decode(); } catch (e) {} }
            const nw = im.naturalWidth, nh = im.naturalHeight;
            if (!nw || !nh) return { missing: true };
            const k = Math.min(1, MAX / Math.max(nw, nh));
            const w = Math.max(1, Math.round(nw * k)), h = Math.max(1, Math.round(nh * k));
            const cv = document.createElement("canvas");
            cv.width = w; cv.height = h;
            const cx = cv.getContext("2d");
            cx.imageSmoothingQuality = "high";
            cx.drawImage(im, 0, 0, w, h);
            const view = k < 1 ? await toUrl(cv, 0.82) : src;       // ảnh vốn đã nhỏ thì dùng luôn
            const t = Math.min(1, THUMB / Math.max(w, h));
            const tc = document.createElement("canvas");
            tc.width = Math.max(1, Math.round(w * t)); tc.height = Math.max(1, Math.round(h * t));
            const tx = tc.getContext("2d");
            tx.imageSmoothingQuality = "high";
            tx.drawImage(cv, 0, 0, tc.width, tc.height);
            const thumb = await toUrl(tc, 0.7);
            cv.width = cv.height = tc.width = tc.height = 0;         // trả bộ nhớ canvas ngay
            return { view, thumb, w, h };
        } catch (e) {
            return { orig: true };                                    // canvas bị chặn -> dùng ảnh gốc như cũ
        } finally {
            im.onload = im.onerror = null;
        }
    }

    function pump() {
        while (running < LIMIT && queue.length) {
            const j = queue.shift();
            running++;
            build(j.src)
                .catch(() => ({ orig: true }))
                .then((r) => { done.set(j.src, r); j.res(r); })
                .finally(() => { jobs.delete(j.src); running--; setTimeout(pump, LITE ? 40 : 10); });   // nghỉ một nhịp cho trình duyệt vẽ
        }
    }

    function ensure(src, urgent) {
        if (!src) return Promise.resolve({ missing: true });
        if (done.has(src)) return Promise.resolve(done.get(src));
        let j = jobs.get(src);
        if (!j) {
            j = { src };
            j.p = new Promise((r) => { j.res = r; });
            jobs.set(src, j);
            queue.push(j);
        }
        if (urgent) {                                                 // ảnh đang cần ngay -> chen lên đầu hàng
            const k = queue.indexOf(j);
            if (k > 0) { queue.splice(k, 1); queue.unshift(j); }
        }
        pump();
        return j.p;
    }
    return { ensure, peek: (s) => done.get(s) };
})();

// đường dẫn ảnh gốc của một khung (ảnh thư viện lưu trong data-src)
const photoSrc = (fig) => {
    const im = fig && fig.querySelector("img");
    return im ? (im.dataset.src || im.getAttribute("src") || "") : "";
};

async function loadPhoto(im, urgent) {
    const src = im.dataset.src;
    if (!src || im.dataset.done) return;
    const r = await PH.ensure(src, urgent);
    if (im.dataset.done) return;
    im.dataset.done = "1";
    if (r.missing) { photoMissing(im); return; }                     // ảnh thiếu: giữ cơ chế ẩn / hiện khung gợi ý như cũ
    im.src = r.orig ? src : r.view;
}

// Chỉ nạp ảnh khi sắp cuộn tới (chứ không nạp cả 14 ảnh ngay khi mở thư)
let photoIO = null;
function setupGalleryPhotos(modalEl) {
    const imgs = [...modalEl.querySelectorAll("img[data-src]")];
    if (!imgs.length) return;
    if (!("IntersectionObserver" in window)) { imgs.forEach((im) => loadPhoto(im, false)); return; }
    if (photoIO) photoIO.disconnect();
    photoIO = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { photoIO.unobserve(e.target); loadPhoto(e.target, true); }
    }), { root: modalEl, rootMargin: LITE ? "900px 0px" : "1400px 0px" });
    imgs.forEach((im) => { if (!im.dataset.done) photoIO.observe(im); });
}

// =====================================================
// GALLERY: hiện dần khi cuộn, nghiêng 3D theo chuột
// =====================================================
let revealIO = null;

function prepareGalleryReveal(modalEl) {
    setupGalleryPhotos(modalEl);                            // nạp ảnh thư viện theo kiểu thu nhỏ, đúng lúc cần
    if (window.gmPrepareLetter) gmPrepareLetter(modalEl);   // chữ trong thư hiện dần (xem cuối file)
    if (revealIO) revealIO.disconnect();
    const cards = modalEl.querySelectorAll(".gm-frame");
    if (!cards.length) return;

    cards.forEach((c) => {
        c.classList.remove("pop");
        c.classList.add("pre");
    });

    if (!("IntersectionObserver" in window)) {
        cards.forEach((c) => c.classList.remove("pre"));
        return;
    }

    revealIO = new IntersectionObserver((entries) => {
        let k = 0;
        entries.filter((e) => e.isIntersecting).forEach((e) => {
            const c = e.target;
            c.style.setProperty("--d", (k++ * 0.13) + "s");
            c.classList.remove("pre");
            c.classList.add("pop");
            revealIO.unobserve(c);
        });
    }, { root: modalEl, threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    // Chờ lá thư phóng ra xong rồi mới bắt đầu theo dõi
    setTimeout(() => cards.forEach((c) => revealIO.observe(c)), 450);
}

// Tự thêm băng keo + lớp ánh kim + hiệu ứng nghiêng cho mỗi ảnh
// (nên khi bạn sao chép thêm <figure> mới thì nó tự có hiệu ứng)
function enhanceCard(card) {
    const frame = card.querySelector(".photo-frame");
    if (!frame || card.dataset.enhanced) return;
    card.dataset.enhanced = "1";

    const tape = document.createElement("span");
    tape.className = "tape";
    card.prepend(tape);

    const shine = document.createElement("span");
    shine.className = "shine";
    frame.appendChild(shine);

    card.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse") return;
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--ry", ((px - 0.5) * 20).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - py) * 20).toFixed(2) + "deg");
        card.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        card.style.setProperty("--my", (py * 100).toFixed(1) + "%");
        card.classList.add("tilting");
    });

    card.addEventListener("pointerleave", () => {
        card.classList.remove("tilting");
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
    });
}

// =====================================================
// LIGHTBOX: phóng to, chuyển ảnh, vuốt, trình chiếu
// =====================================================
let lbItems = [];
let lbIndex = 0;

function galleryItems() {
    return [...document.querySelectorAll("#gradGallery .gm-frame")]
        .filter((f) => !f.classList.contains("no-photo") && f.querySelector("img"));
}

function openLightbox(figure) {
    if (figure && figure.classList.contains("no-photo")) return;
    lbItems = galleryItems();
    if (!lbItems.length) return;

    lbIndex = Math.max(0, lbItems.indexOf(figure));
    const box = document.getElementById("lightbox");
    box.classList.toggle("single", lbItems.length < 2);
    box.classList.add("show");
    renderLightbox(1);
}

function renderLightbox(dir) {
    const fig = lbItems[lbIndex];
    if (!fig) return;
    const src = fig.querySelector("img");
    const img = document.getElementById("lightboxImg");

    const known = src.currentSrc || src.src;
    if (known) img.src = known;                                       // bản xem đã nạp sẵn (blob nhỏ)
    else {                                                            // chưa nạp -> nạp ngay rồi mới hiện
        img.removeAttribute("src");
        loadPhoto(src, true).then(() => {
            if (lbItems[lbIndex] === fig) img.src = src.currentSrc || src.src;
        });
    }
    img.style.setProperty("--dir", dir || 1);
    img.classList.remove("swap");
    void img.offsetWidth;            // khởi động lại animation
    img.classList.add("swap");

    const cap = fig.querySelector("figcaption");
    document.getElementById("lightboxCap").textContent = cap ? cap.textContent : "";
    document.getElementById("lbCounter").textContent = (lbIndex + 1) + " / " + lbItems.length;

}

function stepLightbox(d) {
    if (lbItems.length < 2) return;
    lbIndex = (lbIndex + d + lbItems.length) % lbItems.length;
    renderLightbox(d);
}

// Nút "chiếu phim" trong lightbox: chuyển sang cinema từ ảnh đang xem
function toggleSlideshow() {
    openCinema(lbIndex, false);
}

// Nút "Xem trình chiếu" ngoài thư -> mở cinema
function playSlideshow(btn) {
    if (galleryItems().length) return openCinema(0, true);
    if (!btn) return;
    const label = btn.querySelector(".gp-text b") || btn;
    if (!label.dataset.orig) label.dataset.orig = label.innerHTML;
    label.innerHTML = "📷 Chưa có ảnh nào (tot-nghiep-1.jpg...)";
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { label.innerHTML = label.dataset.orig; delete label.dataset.orig; }, 2600);
}

function closeLightbox() {
    document.getElementById("lightbox").classList.remove("show");
}

document.addEventListener("keydown", (e) => {
    if (cin.on) {
        if (e.key === "Escape") closeCinema();
        else if (e.key === "ArrowRight") cinStep(1);
        else if (e.key === "ArrowLeft") cinStep(-1);
        else if (e.key === " ") { e.preventDefault(); cinToggle(); }
        return;
    }
    const open = document.getElementById("lightbox").classList.contains("show");
    if (open) {
        if (e.key === "Escape") closeLightbox();
        else if (e.key === "ArrowRight") stepLightbox(1);
        else if (e.key === "ArrowLeft") stepLightbox(-1);
        return;
    }
    if (e.key === "Escape") closeLetter();
});

// Vuốt trái/phải trên điện thoại
(function () {
    let x0 = null;
    const box = document.getElementById("lightbox");
    box.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0;
        x0 = null;
        if (Math.abs(dx) > 50) stepLightbox(dx < 0 ? 1 : -1);
    });
})();

// =====================================================
// PHÁO GIẤY + TUNG MŨ (vẽ bằng canvas)
// =====================================================
const cvs = document.getElementById("confetti-canvas");
const cctx = cvs.getContext("2d");
let W = 0, H = 0, cvDpr = 1;
let parts = [];
let rafId = null;
let lastT = 0;

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 2);
    cvDpr = dpr;
    W = window.innerWidth;
    H = window.innerHeight;
    cvs.width = W * dpr;
    cvs.height = H * dpr;
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
let _rzT;
window.addEventListener("resize", () => { clearTimeout(_rzT); _rzT = setTimeout(resizeCanvas, 120); });
resizeCanvas();

// Vẽ emoji bằng fillText mỗi khung hình rất chậm -> vẽ 1 lần ra sprite rồi drawImage
const spriteCache = new Map();
function emojiSprite(emoji, size) {
    const sz = Math.max(12, Math.round(size / 4) * 4);
    const key = emoji + sz + "@" + cvDpr;
    let sp = spriteCache.get(key);
    if (sp) return sp;
    const px = Math.ceil(sz * 1.5 * cvDpr);
    const c = document.createElement("canvas");
    c.width = c.height = px;
    const x = c.getContext("2d");
    x.font = Math.round(sz * cvDpr) + "px serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(emoji, px / 2, px / 2);
    sp = { c, w: px / cvDpr, sz };
    spriteCache.set(key, sp);
    return sp;
}

function addParticle(p) {
    p.life = 0;
    p.wob = rand(0, Math.PI * 2);
    p.wobSpeed = rand(0.08, 0.2);
    p.drag = p.drag ?? 0.985;
    p.g = p.g ?? 0.16;
    parts.push(p);
    if (!rafId) {
        lastT = performance.now();
        rafId = requestAnimationFrame(tick);
    }
}

// angle: 0 = sang phải, 90 = thẳng lên
function cannon(type, x, y, angle, spread, count, power) {
    const colors = CONFETTI_COLORS[type];
    for (let i = 0; i < count; i++) {
        const a = (angle + rand(-spread / 2, spread / 2)) * Math.PI / 180;
        const v = rand(power * 0.45, power);
        addParticle({
            x, y,
            vx: Math.cos(a) * v,
            vy: -Math.sin(a) * v,
            w: rand(6, 11), h: rand(10, 18),
            rot: rand(0, 360), vr: rand(-12, 12),
            color: colors[Math.floor(Math.random() * colors.length)],
            shape: Math.random() < 0.25 ? "circle" : "rect",
            max: rand(170, 270)
        });
    }
}

// Emoji bắn lên rồi rơi xuống (mũ tốt nghiệp, trái tim...)
function throwEmoji(emojis, count, sizeRange) {
    for (let i = 0; i < count; i++) {
        const g = 0.3;
        const v = Math.sqrt(2 * g * H * rand(0.45, 0.85));
        addParticle({
            x: rand(W * 0.15, W * 0.85),
            y: H + 20,
            vx: rand(-3.5, 3.5),
            vy: -v,
            rot: rand(0, 360), vr: rand(-9, 9),
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            size: rand(sizeRange[0], sizeRange[1]),
            shape: "emoji",
            drag: 0.998, g,
            max: 480
        });
    }
}

// Mưa giấy rơi từ trên xuống
function rain(type, ms) {
    const colors = CONFETTI_COLORS[type];
    const end = performance.now() + ms;
    const timer = setInterval(() => {
        if (performance.now() > end) return clearInterval(timer);
        for (let i = 0; i < cnt(4); i++) {
            addParticle({
                x: rand(0, W), y: -20,
                vx: rand(-1.2, 1.2), vy: rand(1, 3.5),
                w: rand(6, 10), h: rand(10, 16),
                rot: rand(0, 360), vr: rand(-8, 8),
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: Math.random() < 0.2 ? "circle" : "rect",
                max: 420
            });
        }
    }, LITE ? 90 : 70);
}

function tick(now) {
    const dt = Math.min(2.5, (now - lastT) / 16.667);
    lastT = now;
    cctx.clearRect(0, 0, W, H);

    for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        const drag = Math.pow(p.drag, dt);
        p.vx *= drag;
        p.vy = p.vy * drag + p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        p.wob += p.wobSpeed * dt;
        p.life += dt;

        if (p.y > H + 70 || p.life > p.max || p.x < -90 || p.x > W + 90) {
            parts.splice(i, 1);
            continue;
        }

        const fade = p.life > p.max - 40 ? Math.max(0, (p.max - p.life) / 40) : 1;
        cctx.save();
        cctx.globalAlpha = fade;
        cctx.translate(p.x, p.y);
        cctx.rotate(p.rot * Math.PI / 180);

        if (p.shape === "emoji") {
            const sp = p.sprite || (p.sprite = emojiSprite(p.emoji, p.size));
            cctx.drawImage(sp.c, -sp.w / 2, -sp.w / 2, sp.w, sp.w);
        } else {
            cctx.scale(1, Math.cos(p.wob));       // hiệu ứng lật giấy
            cctx.fillStyle = p.color;
            if (p.shape === "circle") {
                cctx.beginPath();
                cctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
                cctx.fill();
            } else {
                cctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            }
        }
        cctx.restore();
    }

    if (parts.length) {
        rafId = requestAnimationFrame(tick);
    } else {
        rafId = null;
        cctx.clearRect(0, 0, W, H);
    }
}

function celebrate(type, big = false) {
    const n = (reduceMotion ? 0.25 : 1) * (LITE ? 0.4 : 1);

    if (type === "grad") {
        cannon("grad", 0, H, 62, 44, Math.round(70 * n), 26);
        cannon("grad", W, H, 118, 44, Math.round(70 * n), 26);
        setTimeout(() => {
            cannon("grad", 0, H, 70, 40, Math.round(50 * n), 24);
            cannon("grad", W, H, 110, 40, Math.round(50 * n), 24);
        }, 280);
        throwEmoji(["🎓"], cnt(big ? 10 : 6), [34, 54]);
        if (big) {
            throwEmoji(["🎉", "✨", "🌟"], cnt(8), [26, 40]);
            rain("grad", 2200);
        }
    } else {
        cannon("love", W / 2, H, 90, 70, Math.round(60 * n), 26);
        throwEmoji(["💖", "❤️", "💗", "💕", "🌸"], cnt(big ? 22 : 12), [26, 48]);
        if (big) rain("love", 2200);
    }
}

// =====================================================
// TIM / EMOJI BAY LÊN
// =====================================================
function createHeartParticle(x, y, type = "love") {
    const hc = document.getElementById("hearts-container");
    if (hc.childElementCount > (LITE ? 14 : 30)) return;   // giới hạn số phần tử đang bay
    const heart = document.createElement("div");
    heart.className = "floating-heart";
    const emojis = EMOJI_SETS[type] || EMOJI_SETS.love;
    heart.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    const startX = x || (Math.random() * window.innerWidth);
    const startY = y || (window.innerHeight + 40);

    heart.style.left = startX + "px";
    heart.style.bottom = (window.innerHeight - startY) + "px";
    heart.style.fontSize = (16 + Math.random() * 22) + "px";

    const duration = 3 + Math.random() * 3;
    heart.style.animationDuration = duration + "s";

    hc.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove(), { once: true });
    setTimeout(() => heart.remove(), duration * 1000 + 600);   // phòng khi animation bị tắt
}

function triggerHeartBurst(type = "love", count = 25) {
    count = cnt(count);
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            createHeartParticle(
                window.innerWidth / 2 + (Math.random() * window.innerWidth * 0.6 - window.innerWidth * 0.3),
                window.innerHeight * 0.7 + (Math.random() * 100 - 50),
                type
            );
        }, i * 50);
    }
}

// Tim bay nhẹ ở nền
setInterval(() => {
    if (!window.__introDone) return;                                          // đợi intro xong mới thả tim
    if (document.hidden || activeType || reduceMotion) return;                // tab ẩn / đang mở thư: khỏi tạo
    createHeartParticle();
}, LITE ? 3000 : 1200);

// =====================================================
// KHỞI TẠO: đốm sáng nền, lấp lánh trong thư, hiệu ứng ảnh, vệt sao
// =====================================================
window.addEventListener("DOMContentLoaded", () => {
    // Đốm sáng lấp lánh ở nền trang
    const sparkleContainer = document.getElementById("sparkles-container");
    for (let i = 0; i < (LITE ? 0 : 20); i++) {   // điện thoại: bỏ hẳn (trùng với sao lấp lánh ở #ambient)
        const s = document.createElement("div");
        s.className = "absolute rounded-full bg-rose-300 sparkle";
        const size = 2 + Math.random() * 4;
        s.style.width = size + "px";
        s.style.height = size + "px";
        s.style.left = Math.random() * 100 + "%";
        s.style.top = Math.random() * 100 + "%";
        s.style.animationDelay = (Math.random() * 3) + "s";
        s.style.animationDuration = (2 + Math.random() * 3) + "s";
        sparkleContainer.appendChild(s);
    }

    // Sao vàng lấp lánh trong nền lá thư tốt nghiệp
    const glitter = document.getElementById("gradGlitter");
    if (glitter) {
        const gold = ["#f6c453", "#ffd976", "#a3b3e6", "#f9a8d4"];
        for (let i = 0; i < 28; i++) {
            const star = document.createElement("i");
            star.style.left = rand(0, 98) + "%";
            star.style.top = rand(0, 98) + "%";
            star.style.background = gold[i % gold.length];
            star.style.setProperty("--sz", rand(8, 18).toFixed(1) + "px");
            star.style.setProperty("--t", rand(2.5, 5).toFixed(2) + "s");
            star.style.setProperty("--dl", rand(0, 4).toFixed(2) + "s");
            glitter.appendChild(star);
        }
    }

    // Ảnh nào đã lỗi từ trước khi script này chạy thì xử lý bù
    document.querySelectorAll("img[onerror]").forEach((img) => {
        // ảnh thư viện chưa có src (nạp sau bằng data-src) thì "complete" luôn = true -> không phải ảnh lỗi
        if (img.getAttribute("src") && img.complete && img.naturalWidth === 0) photoMissing(img);
    });

    // Hiệu ứng cho từng ảnh trong gallery
    document.querySelectorAll(".gallery .polaroid").forEach(enhanceCard);
});

// =====================================================
// ÂM THANH MỞ THƯ / GỬI (Web Audio, chỉ là tiếng "ting")
// =====================================================
let audioCtx = null;

function playChime(frequency, duration) {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
        console.log("Audio autoplay prevented or not supported");
    }
}

// =====================================================
// NHẠC NỀN TỪ FILE MP3 CỦA BẠN
// =====================================================
const bgMusic = document.getElementById("bgMusic");
bgMusic.preload = "none";      // không tải nhạc khi vừa vào trang
bgMusic.loop = true;

const LABEL_PLAY = "<span>🎵 Phát Nhạc Dịu Ngọt</span>";
const LABEL_STOP = "<span>⏹ Dừng Nhạc Dịu Ngọt</span>";
let musicOn = false;
let fadeTimer = null;

function setMusicUI(on) {
    document.querySelectorAll(".music-btn").forEach((btn) => {
        btn.innerHTML = on ? LABEL_STOP : LABEL_PLAY;
        btn.classList.toggle("bg-rose-200", on);
        btn.classList.toggle("text-rose-900", on);
    });
}

function fadeAudio(audio, target, ms, done) {
    clearInterval(audio._fade);
    const stepMs = 40;
    const steps = Math.max(1, Math.round(ms / stepMs));
    const from = audio.volume;
    let i = 0;
    audio._fade = setInterval(() => {
        i++;
        audio.volume = Math.min(1, Math.max(0, from + (target - from) * (i / steps)));
        if (i >= steps) {
            clearInterval(audio._fade);
            if (done) done();
        }
    }, stepMs);
}

const fadeVolume = (target, ms, done) => fadeAudio(bgMusic, target, ms, done);

function musicError() {
    musicOn = false;
    document.querySelectorAll(".music-btn").forEach((btn) => {
        btn.innerHTML = "<span>⚠️ Không thấy file " + MUSIC.src + "</span>";
    });
    setTimeout(() => setMusicUI(false), 2800);
}

function toggleMusic() {
    if (!musicOn) {
        musicOn = true;
        setMusicUI(true);
        if (!bgMusic.getAttribute("src")) bgMusic.src = MUSIC.src;   // nạp file lần đầu bấm
        bgMusic.volume = 0;
        const p = bgMusic.play();
        if (p && p.then) {
            p.then(() => fadeVolume(MUSIC.volume, 1200)).catch(musicError);
        }
    } else {
        musicOn = false;
        setMusicUI(false);
        fadeVolume(0, 500, () => bgMusic.pause());
    }
}

// =====================================================
// 💌 NHẠC THƯ 20/10: mở thư thì phát, đóng thư thì tắt
// =====================================================
const loveMusic = new Audio();
loveMusic.loop = true;
loveMusic.preload = "none";    // chỉ tải khi mở thư 20/10

function startLoveMusic() {
    if (musicOn) { musicOn = false; setMusicUI(false); bgMusic.pause(); }   // tránh hai bài chồng nhau
    clearInterval(loveMusic._fade);
    if (!loveMusic.getAttribute("src")) loveMusic.src = MUSIC.loveSrc;
    loveMusic.currentTime = 0;
    loveMusic.volume = 0;
    syncLoveMuteBtn();
    const p = loveMusic.play();
    if (p && p.then) {
        p.then(() => fadeAudio(loveMusic, MUSIC.volume, 1500))
         .catch(() => console.warn("Không phát được nhạc: kiểm tra file " + MUSIC.loveSrc));
    }
}

function stopLoveMusic() {
    if (loveMusic.paused) return;
    fadeAudio(loveMusic, 0, 600, () => { loveMusic.pause(); loveMusic.currentTime = 0; });
}

// nút loa nhỏ trong thư: tắt/bật tiếng tạm thời (thư vẫn mở)
function loveMuteToggle() {
    loveMusic.muted = !loveMusic.muted;
    syncLoveMuteBtn();
}
function syncLoveMuteBtn() {
    const b = document.querySelector(".lm-mute");
    if (!b) return;
    b.textContent = loveMusic.muted ? "🔇" : "🔊";
    b.setAttribute("aria-label", loveMusic.muted ? "Bật nhạc" : "Tắt nhạc");
}

// =====================================================
// NHẠC RIÊNG CHO TRÌNH CHIẾU (tự phát khi bấm trình chiếu)
// =====================================================
const slideMusic = new Audio();
slideMusic.loop = true;
slideMusic.preload = "none";   // chỉ tải khi bấm trình chiếu
let bgWasPlaying = false;

function startSlideshowMusic() {
    // Tạm dừng nhạc nền (nếu đang phát) để nhường cho bài trình chiếu
    if (musicOn && !bgMusic.paused) {
        bgWasPlaying = true;
        fadeVolume(0, 400, () => bgMusic.pause());
    }
    if (!slideMusic.getAttribute("src")) slideMusic.src = MUSIC.slideshowSrc;
    slideMusic.volume = 0;
    const p = slideMusic.play();
    if (p && p.then) {
        p.then(() => fadeAudio(slideMusic, MUSIC.volume, 1200)).catch(() => {
            cinToast("⚠️ Không thấy file " + MUSIC.slideshowSrc);
        });
    }
}

function stopSlideshowMusic(reset) {
    fadeAudio(slideMusic, 0, 500, () => {
        slideMusic.pause();
        if (reset) slideMusic.currentTime = 0;
    });
    // Trả lại nhạc nền nếu trước đó đang phát
    if (bgWasPlaying) {
        bgWasPlaying = false;
        if (musicOn) {
            bgMusic.volume = 0;
            const p = bgMusic.play();
            if (p && p.then) p.then(() => fadeVolume(MUSIC.volume, 1200)).catch(() => {});
        }
    }
}

// =====================================================
// 🎞️ CINEMA: trình chiếu như một cuộn film
// =====================================================
const CINEMA = {
    slideMs: 4400,                                   // mỗi ảnh chiếu bao lâu (ms)
    title: "Khoảnh khắc tốt nghiệp",
    subtitle: "Một thước phim dành riêng cho Viễn",
    credits: [                                       // phần "hết phim" — sửa chữ thoải mái
        ["Nữ chính", "Cô Cử Nhân xinh đẹp nhất"],
        ["Đạo diễn kiêm fan số 1", "Kiên -.-"],
        ["Thể loại", "Tự hào · Hạnh phúc · Rạng rỡ"]
    ],
    endLine: "Hết phim… nhưng chương mới của em vừa mở màn ✨"
};

const $c = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let cin = { on: false, items: [], i: 0, t: 0, total: 0, playing: false, ended: false, raf: 0, last: 0, token: 0 };

function playTick() {                                // tiếng "tạch" của máy chiếu
    try {
        if (!audioCtx) playChime(1, 0.01);
        const c = audioCtx, n = Math.floor(c.sampleRate * 0.05);
        const buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
        const s = c.createBufferSource(), g = c.createGain();
        g.gain.value = 0.12; s.buffer = buf; s.connect(g); g.connect(c.destination); s.start();
    } catch (e) {}
}

function cinToast(msg) {
    const t = $c("cinToast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 3000);
}

function openCinema(start = 0, intro = true) {
    const items = galleryItems();
    if (!items.length) return;
    closeLightbox();
    cancelAnimationFrame(cin.raf);
    cin = { on: true, items, i: start, t: 0, total: 0, playing: false, ended: false, raf: 0, last: 0, token: cin.token + 1, loading: false };
    const tok = cin.token, el = $c("cinema");
    el.className = "cinema show" + (reduceMotion ? " calm" : "");
    document.body.classList.add("cin-open");
    $c("cinPP").textContent = "⏸";
    $c("cinStage").innerHTML = "";
    $c("cinEnd").classList.remove("show");
    $c("cinTitle").innerHTML = `<small>${CINEMA.subtitle}</small><h2>${CINEMA.title}</h2>`;
    // Cuộn film: tạo ô trống trước, thumb nhỏ được gắn dần (không giải mã ảnh gốc thêm lần nào nữa)
    $c("cinTrack").innerHTML = items.map((f, j) =>
        `<button class="reel-cell" data-n="${String(j + 1).padStart(2, "0")}" onclick="cinGo(${j})"><img alt="" decoding="async"></button>`).join("");
    $c("cinTimeline").innerHTML = items.map((f, j) => `<i onclick="cinGo(${j})"><b></b></i>`).join("");
    startSlideshowMusic();
    cinPrepare(tok);          // chuẩn bị ảnh ngay trong lúc đếm ngược 3-2-1

    (async () => {
        const ok = () => cin.token === tok && cin.on;
        await sleep(intro ? 900 : 600);
        if (intro) {
            const L = $c("cinLeader");
            L.classList.add("show");
            for (const n of [3, 2, 1]) {
                if (!ok()) return;
                $c("cinNum").textContent = n;
                L.classList.remove("tick"); void L.offsetWidth; L.classList.add("tick");
                playChime(n === 1 ? 880 : 440, 0.15);
                await sleep(720);
            }
            L.classList.remove("show", "tick");
            $c("cinTitle").classList.add("show");
            await sleep(2100);
            $c("cinTitle").classList.remove("show");
            await sleep(500);
        }
        if (!ok()) return;
        showSlide(start, 1);
        cin.playing = true; el.classList.add("playing");
        cin.last = performance.now();
        cin.raf = requestAnimationFrame(cinLoop);
    })();
}

// Xếp hàng xử lý ảnh theo thứ tự sẽ chiếu, rồi gắn thumb vào cuộn film khi xong từng ảnh
function cinPrepare(tok) {
    const n = cin.items.length, first = cin.i;
    for (let k = 0; k < n; k++) {
        const j = (first + k) % n, src = photoSrc(cin.items[j]);
        PH.ensure(src, k === 0).then((r) => {
            if (cin.token !== tok) return;
            const im = document.querySelectorAll(".reel-cell img")[j];
            if (!im || r.missing) return;
            im.src = r.thumb || src;
        });
    }
}

function showSlide(i, dir = 1) {
    const n = cin.items.length;
    cin.i = (i + n) % n; cin.t = 0; cin.ended = false;
    $c("cinEnd").classList.remove("show");

    const idx = cin.i, tok = cin.token, fig = cin.items[idx], src = photoSrc(fig);

    // cuộn film trượt để khung hiện tại nằm giữa (làm ngay, không chờ ảnh)
    const cells = [...document.querySelectorAll(".reel-cell")];
    cells.forEach((c, j) => c.classList.toggle("on", j === idx));
    const c = cells[idx], vw = $c("cinTrack").parentElement.clientWidth;
    if (c) $c("cinTrack").style.transform = `translateX(${vw / 2 - (c.offsetLeft + c.offsetWidth / 2)}px)`;

    [...$c("cinTimeline").children].forEach((e, j) => { e.firstChild.style.transform = "scaleX(" + (j < idx ? 1 : 0) + ")"; });
    $c("cinCount").textContent = String(idx + 1).padStart(2, "0") + " / " + String(n).padStart(2, "0");

    // nạp trước 2 ảnh kế tiếp (đã thu nhỏ) để chuyển cảnh không bị khựng
    for (let k = 1; k <= 2; k++) PH.ensure(photoSrc(cin.items[(idx + k) % n]), false);
    const nr = PH.peek(photoSrc(cin.items[(idx + 1) % n]));
    if (nr && nr.view) { const pre = new Image(); pre.decoding = "async"; pre.src = nr.view; if (pre.decode) pre.decode().catch(() => {}); }

    const r = PH.peek(src);
    if (r) { cin.loading = false; mountSlide(fig, r, idx, tok); return; }

    // ảnh chưa sẵn sàng: tạm dừng đồng hồ phim, chờ ảnh (không để màn hình đen / giật)
    cin.loading = true;
    const wt = setTimeout(() => { if (cin.token === tok && cin.loading && cin.i === idx) cinToast("Đang nạp ảnh…"); }, 600);
    PH.ensure(src, true).then((rr) => {
        clearTimeout(wt);
        if (cin.token !== tok || !cin.on || cin.i !== idx) return;
        cin.loading = false;
        mountSlide(fig, rr, idx, tok);
    });
}

function mountSlide(fig, r, idx, tok) {
    if (r.missing) { cin.t = CINEMA.slideMs; return; }                // ảnh hỏng: bỏ qua, sang ảnh kế
    const orig = photoSrc(fig);
    const url = r.orig ? orig : r.view;
    const bg = r.thumb || url;                                         // nền mờ dùng thumb 240px: giống blur mà gần như không tốn
    const cap = ((fig.querySelector("figcaption") || {}).textContent || "").trim();
    const k = idx % 2 ? -1 : 1;                                        // xoay hướng zoom xen kẽ cho đỡ nhàm
    const z = LITE ? [1.06, 1.12] : [1.1, 1.2];

    const s = document.createElement("div");
    s.className = "cin-slide";
    s.style.cssText = `--s1:${rand(z[0], z[1]).toFixed(3)};--x:${(k * rand(1, 2.5)).toFixed(2)}%;--y:${rand(-1.5, 1.5).toFixed(2)}%;--dur:${CINEMA.slideMs + 1400}ms`;
    s.innerHTML = `<img class="cin-bg" src="${bg}" alt="" decoding="async"><div class="cin-center"><div class="cin-frame"><img class="cin-pic" src="${url}" alt="" decoding="async"></div><p class="cin-cap"></p></div>`;
    const p = s.querySelector(".cin-cap");
    Array.from(cap).forEach((ch, j) => {
        const b = document.createElement("span");
        b.textContent = ch; b.style.animationDelay = (0.5 + j * 0.04) + "s";
        p.appendChild(b);
    });

    const attach = () => {
        if (cin.token !== tok || !cin.on || cin.i !== idx) return;
        const st = $c("cinStage"), old = [...st.children];
        st.appendChild(s);
        old.forEach((o) => { o.classList.add("out"); setTimeout(() => o.remove(), 1400); });
        const lk = $c("cinLeak");                                      // lóe sáng "cháy film" khi chuyển cảnh
        lk.classList.remove("go"); void lk.offsetWidth; lk.classList.add("go");
        if (old.length) playTick();
    };
    // giải mã ảnh xong rồi mới đưa lên màn hình -> không bị nháy / khựng khung hình đầu
    const pic = s.querySelector(".cin-pic");
    if (pic.decode) pic.decode().then(attach, attach); else attach();
}

function cinLoop(now) {
    if (!cin.on) return;
    const dt = Math.min(100, now - cin.last); cin.last = now;
    if (cin.playing && !cin.ended && !cin.loading) {
        cin.t += dt; cin.total += dt;
        if (now - (cin.tl || 0) > 80) {                // thanh tiến độ chỉ cần cập nhật ~12 lần/giây
            cin.tl = now;
            const b = $c("cinTimeline").children[cin.i];
            if (b) b.firstChild.style.transform = "scaleX(" + Math.min(1, cin.t / CINEMA.slideMs).toFixed(3) + ")";
        }
        if (cin.t >= CINEMA.slideMs) cin.i === cin.items.length - 1 ? endFilm() : showSlide(cin.i + 1, 1);
    }
    if (now - (cin.clk || 0) > 90) {              // đồng hồ chỉ cần cập nhật ~11 lần/giây
        cin.clk = now;
        const s = Math.floor(cin.total / 1000), fr = Math.floor((cin.total % 1000) / 41.67);   // 24 khung/giây
        $c("cinTime").textContent = [Math.floor(s / 60), s % 60, fr].map((v) => String(v).padStart(2, "0")).join(":");
    }
    cin.raf = requestAnimationFrame(cinLoop);
}

function endFilm() {
    cin.ended = true;
    let d = 0.4;
    $c("cinEnd").innerHTML = "<h2>Fin</h2>" +
        CINEMA.credits.map(([r, n]) => `<p class="role" style="animation-delay:${(d += 0.35)}s">${r}</p><p class="name" style="animation-delay:${d}s">${n}</p>`).join("") +
        `<p class="name" style="animation-delay:${d + 0.6}s;color:#f9a8d4;margin-top:10px">${CINEMA.endLine}</p>` +
        `<div class="btns"><button onclick="cinReplay()">↺ Xem lại</button><button onclick="closeCinema()">Đóng phim</button></div>`;
    $c("cinEnd").classList.add("show");
    celebrate("grad", true);
}

function cinGo(i, dir = 1) { if (cin.on) showSlide(i, dir); }
function cinStep(d) { cinGo(cin.i + d, d); }
function cinReplay() { cin.playing = true; $c("cinema").classList.remove("paused"); $c("cinPP").textContent = "⏸"; cinGo(0); }
function cinToggle() {
    if (!cin.on || !cin.playing && !cin.ended && cin.t === 0 && !$c("cinema").classList.contains("playing")) return;
    if (cin.ended) return cinReplay();
    cin.playing = !cin.playing;
    $c("cinema").classList.toggle("paused", !cin.playing);
    $c("cinPP").textContent = cin.playing ? "⏸" : "▶";
}
function cinMute(btn) { slideMusic.muted = !slideMusic.muted; btn.textContent = slideMusic.muted ? "🔇" : "🔊"; }

function closeCinema() {
    if (!cin.on) return;
    cin.on = false; cin.token++;
    cancelAnimationFrame(cin.raf);
    document.body.classList.remove("cin-open");
    setTimeout(() => { if (!cin.on) $c("cinStage").innerHTML = ""; }, 700);   // giải phóng ảnh lớn khi đóng
    $c("cinema").classList.remove("show", "playing", "paused");
    $c("cinLeader").classList.remove("show");
    $c("cinTitle").classList.remove("show");
    stopSlideshowMusic(true);
}

// Vuốt trái/phải trên điện thoại
(function () {
    let x0 = null;
    const st = $c("cinStage");
    st.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    st.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 50) { cinStep(dx < 0 ? 1 : -1); }
    });
})();


// =====================================================================
// 🌸 MÀN HÌNH PHONG THƯ v2 — hiệu ứng xinh xắn & hoành tráng
//   · tách chữ cho tiêu đề nhún nhảy      · hạt tim / hoa / bong bóng bay lên
//   · sao lấp lánh + sao băng             · dây cờ đuôi nheo
//   · phong thư nghiêng 3D theo chuột     · vệt sao theo con trỏ + bấm là nổ tim
//   · mở thư: loé sáng, sóng xung kích, chùm sáng, pháo tim
// =====================================================================
(function () {
    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    // chỉ chạy hiệu ứng nền khi đang ở màn hình phong thư và tab đang hiển thị
    const idle = () => !activeType && !document.hidden;

    const AMB_EMOJI  = ["💗", "💕", "🌸", "🌷", "✨", "⭐", "💖", "🎀", "🌟", "💞"];
    const STAR_COLOR = ["#ffd166", "#ff9ec7", "#b5c4ff", "#ffffff", "#ffb8a0", "#d6b4ff"];
    const FLAG_COLOR = ["#ffb3cf", "#ffd6a5", "#fdf3a6", "#b8f0cf", "#aee3ff", "#d3c2ff"];
    const BURST_SET = {
        grad: ["🎓", "🌟", "✨", "🎉", "📚", "💙", "🎈", "⭐"],
        love: ["💖", "💗", "🌸", "🌷", "✨", "💕", "🎀", "❤️"]
    };

    // ---------- 1. Tách chữ để từng chữ nhún nhảy ----------
    function splitLetters() {
        let wc = 0;   // số thứ tự từ (toàn trang) -> điện thoại animate theo từ thay vì từng chữ
        $$(".split").forEach((el) => {
            const text = el.textContent.normalize("NFC").trim();
            el.textContent = "";
            el.setAttribute("aria-label", text);
            let i = 0;
            const words = text.split(/\s+/);
            words.forEach((word, wi) => {
                const w = document.createElement("span");
                w.className = "word";
                w.setAttribute("aria-hidden", "true");
                w.style.setProperty("--w", wc++);
                Array.from(word).forEach((c) => {
                    const s = document.createElement("span");
                    s.className = "ch";
                    s.textContent = c;
                    s.style.setProperty("--i", i++);
                    w.appendChild(s);
                });
                el.appendChild(w);
                if (wi < words.length - 1) el.appendChild(document.createTextNode(" "));
            });
        });
    }

    // ---------- 2. Hạt bay lên (tim, hoa, bong bóng) ----------
    function spawnAmbient(seed) {
        const box = $("#ambient-items");
        if (!box || box.childElementCount > (LITE ? 7 : 28)) return;
        if (!seed && !idle()) return;
        const el = document.createElement("span");
        const bubble = Math.random() < 0.35;
        el.className = "amb" + (bubble ? " bubble" : "");
        if (!bubble) el.textContent = pick(AMB_EMOJI);
        const size = bubble ? rand(14, 46) : rand(14, 30);
        el.style.cssText =
            `--x:${rand(0, 97).toFixed(1)}%;--s:${size.toFixed(0)}px;--t:${rand(10, 18).toFixed(1)}s;` +
            `--sw:${rand(-90, 90).toFixed(0)}px;--rot:${rand(-200, 200).toFixed(0)}deg;--o:${rand(0.5, 0.9).toFixed(2)};`;
        if (seed) el.style.animationDelay = (-rand(0, 10)).toFixed(1) + "s";
        el.addEventListener("animationend", () => el.remove());
        box.appendChild(el);
    }

    // ---------- 3. Sao lấp lánh + sao băng ----------
    function seedStars() {
        const box = $("#ambient");
        if (!box) return;
        for (let i = 0; i < (LITE ? 8 : 34); i++) {
            const s = document.createElement("i");
            s.className = "tstar";
            s.textContent = Math.random() < 0.5 ? "✦" : "✧";
            s.style.cssText =
                `--x:${rand(1, 98).toFixed(1)}%;--y:${rand(2, 96).toFixed(1)}%;--s:${rand(9, 20).toFixed(0)}px;` +
                `--c:${pick(STAR_COLOR)};--t:${rand(2, 4.5).toFixed(1)}s;--d:${rand(0, 3).toFixed(1)}s;`;
            box.appendChild(s);
        }
    }

    function shootingStar() {
        if (idle()) {
            const box = $("#ambient");
            const a = rand(16, 36);
            const len = rand(420, 700);
            const rad = (a * Math.PI) / 180;
            const e = document.createElement("i");
            e.className = "shoot";
            e.style.cssText =
                `--x:${rand(0, 55).toFixed(0)}%;--y:${rand(3, 38).toFixed(0)}%;--a:${a.toFixed(0)}deg;` +
                `--dx:${(Math.cos(rad) * len).toFixed(0)}px;--dy:${(Math.sin(rad) * len).toFixed(0)}px;`;
            e.addEventListener("animationend", () => e.remove());
            box && box.appendChild(e);
        }
        setTimeout(shootingStar, rand(3500, 7500));
    }

    // ---------- 4. Dây cờ đuôi nheo ----------
    function drawBunting() {
        const svg = $("#bunting");
        if (!svg) return;
        const W = window.innerWidth;
        const sag = Math.min(34, W * 0.04);
        const step = W < 640 ? 44 : 60;
        const n = Math.max(6, Math.round(W / step));
        const y0 = -6, x0 = -10, x1 = W + 10;
        const cy = y0 + 2 * sag;
        const fw = step * 0.66, fh = fw * 1.1;

        let html = `<path d="M${x0} ${y0} Q${W / 2} ${cy} ${x1} ${y0}" fill="none" stroke="#ff9ec7" stroke-width="2.5" stroke-linecap="round"/>`;
        for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n;
            const x = x0 + (x1 - x0) * t;
            const y = y0 + 4 * t * (1 - t) * sag;
            const ang = (Math.atan2(4 * sag * (1 - 2 * t), x1 - x0) * 180) / Math.PI;
            const col = FLAG_COLOR[i % FLAG_COLOR.length];
            const delay = (i * 0.17).toFixed(2);
            html +=
                `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})">` +
                `<polygon class="flag" style="animation-delay:-${delay}s" fill="${col}" stroke="#fff" stroke-width="2" stroke-linejoin="round" ` +
                `points="${(-fw / 2).toFixed(1)},0 ${(fw / 2).toFixed(1)},0 0,${fh.toFixed(1)}"/></g>`;
        }
        svg.setAttribute("viewBox", `0 0 ${W} 150`);
        svg.innerHTML = html;
    }

    // ---------- 5. Hạt nổ / vệt chuột / sóng xung kích ----------
    function fxLayer() { return $("#fx-top"); }

    function burst(x, y, n = 14, set = AMB_EMOJI, spread = [60, 170]) {
        const layer = fxLayer();
        if (!layer) return;
        n = cnt(n);
        for (let i = 0; i < n; i++) {
            if (layer.childElementCount > 160) break;
            const el = document.createElement("span");
            el.className = "fx-p";
            el.textContent = pick(set);
            const ang = rand(0, Math.PI * 2);
            const dist = rand(spread[0], spread[1]);
            el.style.cssText =
                `--x0:${x.toFixed(0)}px;--y0:${y.toFixed(0)}px;` +
                `--x1:${(x + Math.cos(ang) * dist).toFixed(0)}px;--y1:${(y + Math.sin(ang) * dist + rand(20, 90)).toFixed(0)}px;` +
                `--r:${rand(-260, 260).toFixed(0)}deg;--s:${rand(14, 32).toFixed(0)}px;--t:${rand(800, 1500).toFixed(0)}ms;`;
            el.addEventListener("animationend", () => el.remove());
            layer.appendChild(el);
        }
    }

    function trail(x, y) {
        const layer = fxLayer();
        if (!layer || layer.childElementCount > 120) return;
        const el = document.createElement("span");
        el.className = "fx-trail";
        el.textContent = pick(["✦", "✧", "♡", "♥", "❀", "✿"]);
        el.style.cssText =
            `left:${x.toFixed(0)}px;top:${y.toFixed(0)}px;--s:${rand(11, 20).toFixed(0)}px;` +
            `--c:${pick(["#ff6fa5", "#ffb340", "#8fa4ff", "#ff8fd0", "#ffd166"])};` +
            `--dx:${rand(-26, 26).toFixed(0)}px;--r:${rand(-180, 180).toFixed(0)}deg;`;
        el.addEventListener("animationend", () => el.remove());
        layer.appendChild(el);
    }

    function shockwave(cx, cy, type) {
        const layer = fxLayer();
        if (!layer) return;
        const add = (cls, extra = "") => {
            const d = document.createElement("div");
            d.className = cls;
            d.style.cssText = `--cx:${cx.toFixed(0)}px;--cy:${cy.toFixed(0)}px;${extra}`;
            d.addEventListener("animationend", () => d.remove());
            layer.appendChild(d);
        };
        add("fx-flash");
        if (LITE) return;       // điện thoại: bỏ chùm sáng blur + 2 vòng sóng phóng to x24 (rất nặng)
        add("fx-beam");
        add("fx-ring");
        add("fx-ring r2", `--rc:${type === "grad" ? "#ffd166" : "#ff7aa8"};`);
    }

    // ---------- 6. Nghiêng 3D theo chuột + tim nhỏ khi rê vào ----------
    function initTilt() {
        $$(".envelope-wrapper").forEach((wrap) => {
            const env = $(".envelope", wrap);
            if (!env) return;
            let lastHover = 0;
            wrap.addEventListener("pointermove", (e) => {
                if (activeType || e.pointerType === "touch") return;
                const r = wrap.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                env.style.setProperty("--ry", (px * 18).toFixed(2) + "deg");
                env.style.setProperty("--rx", (-py * 14).toFixed(2) + "deg");
            });
            wrap.addEventListener("pointerleave", () => {
                env.style.setProperty("--rx", "0deg");
                env.style.setProperty("--ry", "0deg");
            });
            wrap.addEventListener("pointerenter", (e) => {
                if (activeType || e.pointerType === "touch") return;
                const now = performance.now();
                if (now - lastHover < 900) return;
                lastHover = now;
                const r = env.getBoundingClientRect();
                const type = env.classList.contains("grad") ? "grad" : "love";
                burst(r.left + r.width / 2, r.top + r.height * 0.3, 6, BURST_SET[type], [30, 110]);
            });
        });
    }

    // ---------- 7. Hook khi mở / đóng thư (được gọi từ openEnvelope / closeLetter) ----------
    window.envelopeOpenFx = function (type) {
        const env = document.getElementById(type === "grad" ? "envelopeGrad" : "envelopeLove");
        if (!env) return;
        const r = env.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.5;

        const sec = $("#envelope-section");
        sec && sec.classList.add("has-open");
        const col = env.closest(".env-col");
        col && col.classList.add("chosen");

        shockwave(cx, cy, type);
        const set = BURST_SET[type] || BURST_SET.love;
        burst(cx, cy, LITE ? 14 : 36, set, [100, 360]);
        if (!LITE) {
            setTimeout(() => burst(cx, cy - 50, 24, set, [60, 280]), 220);
            setTimeout(() => burst(cx, cy - 90, 18, set, [40, 220]), 480);
        }
    };

    window.envelopeCloseFx = function () {
        const sec = $("#envelope-section");
        sec && sec.classList.remove("has-open");
        $$(".env-col.chosen").forEach((c) => c.classList.remove("chosen"));
    };

    // ---------- Khởi tạo (chia giai đoạn để không dồn hết vào một khung hình) ----------
    //  Giai đoạn 0: dựng DOM tối thiểu (tách chữ, dây cờ) -> animation đang tạm dừng bằng CSS
    //  Giai đoạn 1: chờ font tải xong (tối đa ~1.2s) rồi mới chạy intro (class html.intro-go)
    //  Giai đoạn 2: intro xong (html.intro-done) mới bật hiệu ứng nền: sao, hạt bay, tim, sao băng...
    const root = document.documentElement;
    let introStarted = false, ambientStarted = false;

    function waitFonts(maxWait) {
        if (!document.fonts || !document.fonts.load) return Promise.resolve();
        const cssReady = window.__fcss ? Promise.resolve() : new Promise((r) => window.addEventListener("fcss", r, { once: true }));
        const loadAll = cssReady.then(() => Promise.all([
            document.fonts.load('700 1em "Dancing Script"', "Có hai bức thư nhỏ gửi đến ai đó"),
            document.fonts.load('800 1em "Baloo 2"', "Gửi cô Gái Nào Đó"),
            document.fonts.load('700 1em "Nunito"', "Mở Thư Tốt Nghiệp")
        ]));
        return Promise.race([loadAll.catch(() => {}), new Promise((r) => setTimeout(r, maxWait))]);
    }

    function startIntro() {
        if (introStarted) return;
        introStarted = true;
        // 2 lần rAF: đảm bảo trình duyệt đã vẽ xong layout (kể cả font) rồi mới bắt đầu animation
        requestAnimationFrame(() => requestAnimationFrame(() => {
            root.classList.add("intro-go");
            setTimeout(finishIntro, LITE ? 2300 : 3000);
        }));
    }

    function finishIntro() {
        if (window.__introDone) return;
        window.__introDone = true;
        root.classList.add("intro-go", "intro-done");   // mở khoá các animation lặp vô hạn
        if (reduceMotion || activeType) return;
        startAmbient();
    }

    function startAmbient() {
        if (ambientStarted) return;
        ambientStarted = true;
        const later = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 700 }) : (f) => setTimeout(f, 80);
        later(seedStars);
        // thả dần từng hạt (không bật cùng lúc) -> không bị giật khi emoji được vẽ lần đầu
        const first = LITE ? 3 : 10;
        for (let i = 0; i < first; i++) setTimeout(() => spawnAmbient(true), 300 + i * 260);
        setInterval(() => spawnAmbient(false), LITE ? 1900 : 650);
        if (!LITE) {
            setTimeout(shootingStar, 2500);   // sao băng bỏ trên điện thoại
            setTimeout(() => {
                if (!activeType) burst(window.innerWidth / 2, window.innerHeight * 0.3, 20, ["✨", "💖", "⭐", "🌸", "💗"], [90, 300]);
            }, 300);
        }
    }

    function init() {
        splitLetters();
        drawBunting();

        let rt;
        window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(drawBunting, 150); });

        if (reduceMotion) {   // tôn trọng người dùng muốn giảm chuyển động
            window.__introDone = true;
            root.classList.add("intro-go", "intro-done");
            return;
        }

        initTilt();

        // Vệt sao theo con trỏ (chỉ chuột, không chạy trên cảm ứng)
        let lastT = 0;
        window.addEventListener("pointermove", (e) => {
            if (activeType || e.pointerType === "touch" || !window.__introDone) return;
            const now = performance.now();
            if (now - lastT < 55) return;
            lastT = now;
            trail(e.clientX, e.clientY);
        }, { passive: true });

        // Bấm vào chỗ trống là nổ tim nhỏ
        window.addEventListener("pointerdown", (e) => {
            if (activeType) return;
            if (e.target.closest && e.target.closest(".envelope, .cute-btn")) return;
            burst(e.clientX, e.clientY, 12, AMB_EMOJI, [50, 150]);
        });

        // Người dùng chạm sớm thì không bắt họ chờ
        window.addEventListener("pointerdown", () => { startIntro(); }, { once: true, passive: true });

        waitFonts(LITE ? 1000 : 1300).then(startIntro);
        setTimeout(startIntro, 1500);   // chốt an toàn
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();


// =====================================================
// 🎬 THƯ TỐT NGHIỆP: bụi sáng, tiêu đề trượt nhẹ khi cuộn,
//    chữ trong thư hiện dần, nút chiếu phim "bật đèn"
// =====================================================
(function () {
    const modal = document.getElementById("grad-modal");
    if (!modal) return;
    const stage = modal.querySelector(".gm-stage");

    // 1) Bụi sáng bay lên trong chùm sáng máy chiếu
    if (!reduceMotion) {
        const box = document.createElement("div");
        box.className = "gm-bokeh";
        box.setAttribute("aria-hidden", "true");
        const COLORS = ["rgba(255,214,140,.7)", "rgba(255,150,200,.6)", "rgba(150,205,255,.55)", "rgba(255,255,255,.55)"];
        for (let i = 0; i < (LITE ? 10 : 26); i++) {
            const size = rand(6, 38);
            const dot = document.createElement("i");
            dot.style.cssText =
                "--x:" + rand(2, 98).toFixed(1) + "%;" +
                "--s:" + size.toFixed(1) + "px;" +
                "--c:" + COLORS[i % COLORS.length] + ";" +
                "--t:" + rand(16, 34).toFixed(1) + "s;" +
                "--dl:" + (-rand(0, 30)).toFixed(1) + "s;" +
                "--dx:" + rand(-60, 60).toFixed(0) + "px;" +
                "--o:" + rand(0.35, 0.85).toFixed(2) + ";" +
                "--b:" + (size > 24 ? 3 : 0.5) + "px";
            box.appendChild(dot);
        }
        modal.prepend(box);
    }

    // 2) Tiêu đề trượt xuống và mờ dần khi cuộn khỏi màn đầu
    if (stage && !reduceMotion) {
        const ttl = stage.querySelector(".gm-title");
        let ticking = false, lastP = -1;
        modal.addEventListener("scroll", () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const p = Math.min(1, Math.max(0, modal.scrollTop / (stage.offsetHeight * 0.8)));
                if (ttl && p !== lastP) {
                    lastP = p;
                    ttl.style.setProperty("--sp", p.toFixed(3));   // đặt trên chính tiêu đề (không lan ra cả màn hình)
                }
                ticking = false;
            });
        }, { passive: true });
    }

    // 3) Từng đoạn trong thư hiện dần như lấy nét ống kính
    let letterIO = null;
    window.gmPrepareLetter = function (m) {
        if (!m || (m.id !== "grad-modal" && m.id !== "letter-modal")) return;
        if (letterIO) letterIO.disconnect();
        const paras = [...m.querySelectorAll(m.id === "grad-modal" ? ".gm-letter p" : ".lm-text p")];
        if (reduceMotion || !("IntersectionObserver" in window)) {
            paras.forEach((p) => p.classList.remove("gm-rv", "gm-in"));
            return;
        }
        paras.forEach((p) => {
            p.classList.remove("gm-in");
            p.classList.add("gm-rv");
            p.style.setProperty("--rd", "0s");
        });
        letterIO = new IntersectionObserver((entries) => {
            entries.filter((e) => e.isIntersecting).forEach((e, k) => {
                e.target.style.setProperty("--rd", (k * 0.18) + "s");
                e.target.classList.add("gm-in");
                letterIO.unobserve(e.target);
            });
        }, { root: m, threshold: 0.25, rootMargin: "0px 0px -8% 0px" });
        setTimeout(() => paras.forEach((p) => letterIO.observe(p)), 450);
    };

    // 4) Nút "Xem như một thước phim": lần đầu cuộn tới thì đèn bật sáng
    const play = modal.querySelector(".gm-play");
    if (play && !reduceMotion && "IntersectionObserver" in window) {
        play.classList.add("unlit");
        const io = new IntersectionObserver((entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            play.classList.remove("unlit");
            play.classList.add("ignite");
            setTimeout(() => play.classList.remove("ignite"), 1600);
            io.disconnect();
        }, { root: modal, threshold: 0.6 });
        io.observe(play);
    }
})();


// =====================================================
// 🌸 THƯ 20/10: cánh hoa rơi
// =====================================================
(function () {
    const box = document.querySelector("#letter-modal .lm-petals");
    if (!box || reduceMotion) return;
    const TONES = ["#ffc2d8", "#ff9ec2", "#ff7eb3", "#ffd9e6", "#ffb3a7"];
    for (let i = 0; i < (LITE ? 10 : 24); i++) {
        const p = document.createElement("i");
        p.style.cssText =
            "--x:" + rand(0, 100).toFixed(1) + "%;" +
            "--s:" + rand(10, 22).toFixed(1) + "px;" +
            "--c:" + TONES[i % TONES.length] + ";" +
            "--t:" + rand(10, 20).toFixed(1) + "s;" +
            "--dl:" + (-rand(0, 20)).toFixed(1) + "s;" +
            "--sw:" + rand(40, 120).toFixed(0) + "px;" +
            "--r:" + rand(240, 600).toFixed(0) + "deg";
        box.appendChild(p);
    }
})();