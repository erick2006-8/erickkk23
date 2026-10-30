/**
 * PixelArek - Sistema Centralizado de Carrito de Compras de Videojuegos
 * Almacenamiento persistente en localStorage con sincronización entre pestañas.
 */

const PixelCart = (function() {
    const CART_KEY = 'pixelarek_cart';
    const COUPON_KEY = 'pixelarek_coupon';
    const WISHLIST_KEY = 'pixelarek_wishlist';

    // Lista de cupones válidos
    const COUPONS = {
        'PIXEL20': { type: 'percent', value: 20, desc: '20% de descuento gamer' },
        'GAMER10': { type: 'percent', value: 10, desc: '10% de descuento en tu compra' },
        'WELCOME': { type: 'fixed', value: 10, desc: '$10.00 USD de bienvenida' },
        'PRO5':    { type: 'percent', value: 5,  desc: '5% de descuento especial' }
    };

    // Obtener carrito de localStorage
    function getCart() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Error leyendo carrito:', e);
            return [];
        }
    }

    // Guardar carrito en localStorage
    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            notifyCartChange();
        } catch (e) {
            console.error('Error guardando carrito:', e);
        }
    }

    // Obtener cupón activo
    function getCoupon() {
        try {
            const code = localStorage.getItem(COUPON_KEY);
            if (code && COUPONS[code.toUpperCase()]) {
                return { code: code.toUpperCase(), ...COUPONS[code.toUpperCase()] };
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    // Aplicar cupón
    function applyCoupon(code) {
        if (!code) return { success: false, message: 'Ingresa un código de cupón' };
        const clean = code.trim().toUpperCase();
        if (COUPONS[clean]) {
            localStorage.setItem(COUPON_KEY, clean);
            notifyCartChange();
            return { success: true, message: `¡Cupón ${clean} aplicado con éxito! (${COUPONS[clean].desc})`, coupon: COUPONS[clean] };
        }
        return { success: false, message: 'Cupón no válido o expirado. Prueba: PIXEL20 o GAMER10' };
    }

    // Remover cupón
    function removeCoupon() {
        localStorage.removeItem(COUPON_KEY);
        notifyCartChange();
    }

    // Formatear precio
    function formatPrice(val) {
        return '$' + Number(val || 0).toFixed(2);
    }

    // Calcular totales
    function getTotals() {
        const cart = getCart();
        let count = 0;
        let subtotal = 0;

        cart.forEach(item => {
            const qty = Number(item.qty) || 1;
            const price = Number(item.price) || 0;
            count += qty;
            subtotal += qty * price;
        });

        const coupon = getCoupon();
        let discount = 0;

        if (coupon && subtotal > 0) {
            if (coupon.type === 'percent') {
                discount = (subtotal * coupon.value) / 100;
            } else if (coupon.type === 'fixed') {
                discount = Math.min(coupon.value, subtotal);
            }
        }

        const total = Math.max(0, subtotal - discount);

        return {
            count,
            subtotal,
            discount,
            coupon,
            total,
            formattedSubtotal: formatPrice(subtotal),
            formattedDiscount: formatPrice(discount),
            formattedTotal: formatPrice(total)
        };
    }

    // Añadir producto
    function addItem(product) {
        if (!product || !product.name) return;
        const cart = getCart();
        const existing = cart.find(i => i.name.toLowerCase() === product.name.toLowerCase());

        if (existing) {
            existing.qty += (Number(product.qty) || 1);
        } else {
            cart.push({
                id: product.id || 'game-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
                name: product.name,
                price: Number(product.price) || 0,
                originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
                platform: product.platform || 'Multiplataforma',
                image: product.image || '../images/fifa.png',
                edition: product.edition || 'Edición Digital Estándar',
                qty: Number(product.qty) || 1
            });
        }

        saveCart(cart);
        updateBadges();
        return getTotals();
    }

    // Actualizar cantidad
    function updateQty(idOrName, delta) {
        const cart = getCart();
        const item = cart.find(i => (i.id && i.id === idOrName) || (i.name && i.name.toLowerCase() === String(idOrName).toLowerCase()));
        if (!item) return;

        item.qty += delta;
        if (item.qty <= 0) {
            return removeItem(idOrName);
        }

        saveCart(cart);
        updateBadges();
        return getTotals();
    }

    // Establecer cantidad fija
    function setQty(idOrName, qty) {
        const cart = getCart();
        const item = cart.find(i => (i.id && i.id === idOrName) || (i.name && i.name.toLowerCase() === String(idOrName).toLowerCase()));
        if (!item) return;

        const parsedQty = parseInt(qty, 10);
        if (isNaN(parsedQty) || parsedQty <= 0) {
            return removeItem(idOrName);
        }

        item.qty = Math.min(99, parsedQty);
        saveCart(cart);
        updateBadges();
        return getTotals();
    }

    // Eliminar producto
    function removeItem(idOrName) {
        let cart = getCart();
        cart = cart.filter(i => !((i.id && i.id === idOrName) || (i.name && i.name.toLowerCase() === String(idOrName).toLowerCase())));
        saveCart(cart);
        updateBadges();
        return getTotals();
    }

    // Vaciar carrito
    function clearCart() {
        saveCart([]);
        updateBadges();
        return getTotals();
    }

    // Wishlist (Favoritos)
    function getWishlist() {
        try {
            const raw = localStorage.getItem(WISHLIST_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
    }

    function toggleWishlist(gameName) {
        const list = getWishlist();
        const index = list.indexOf(gameName);
        let added = false;
        if (index > -1) {
            list.splice(index, 1);
        } else {
            list.push(gameName);
            added = true;
        }
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
        return added;
    }

    function isInWishlist(gameName) {
        return getWishlist().includes(gameName);
    }

    // Actualizar badges en cualquier página
    function updateBadges() {
        const totals = getTotals();
        const badges = document.querySelectorAll('.cart-badge-count, #cart-count, #contador');
        badges.forEach(b => {
            b.textContent = totals.count;
            b.classList.remove('scale-125');
            void b.offsetWidth;
            b.classList.add('scale-125');
            setTimeout(() => b.classList.remove('scale-125'), 300);
        });

        // Actualizar mini drawer si existe
        if (typeof renderDrawerCart === 'function') {
            renderDrawerCart();
        }
    }

    // Notificaciones tipo Toast
    function showToast(message, type = 'success') {
        let container = document.getElementById('pixel-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pixel-toast-container';
            container.style.cssText = `
                position: fixed;
                top: 1.25rem;
                right: 1.25rem;
                z-index: 99999;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
                pointer-events: none;
                max-width: 380px;
                width: calc(100% - 2.5rem);
            `;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const icon = type === 'success' ? 'fa-circle-check text-purple-400' : (type === 'error' ? 'fa-triangle-exclamation text-red-400' : 'fa-circle-info text-cyan-400');
        
        toast.className = 'pixel-toast';
        toast.style.cssText = `
            background: rgba(17, 24, 39, 0.95);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(147, 51, 234, 0.4);
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px rgba(147, 51, 234, 0.2);
            color: #ffffff;
            padding: 0.85rem 1.15rem;
            border-radius: 0.75rem;
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            pointer-events: auto;
            transform: translateX(100px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        `;

        toast.innerHTML = `
            <i class="fa-solid ${icon} text-lg"></i>
            <div style="flex: 1; line-height: 1.4;">${message}</div>
            <button style="background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 1rem; padding: 0;" onclick="this.parentElement.remove()">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        setTimeout(() => {
            toast.style.transform = 'translateX(100px)';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 350);
        }, 3200);
    }

    // Efecto de vuelo hacia el carrito
    function flyToCart(imgSrc, sourceElement) {
        const cartTarget = document.querySelector('.cart-target-btn, #cart-link, .carrito-icono');
        if (!cartTarget || !sourceElement) {
            updateBadges();
            return;
        }

        const startRect = sourceElement.getBoundingClientRect();
        const endRect = cartTarget.getBoundingClientRect();

        const flyer = document.createElement('img');
        flyer.src = imgSrc;
        flyer.style.cssText = `
            position: fixed;
            z-index: 999999;
            left: ${startRect.left + startRect.width / 4}px;
            top: ${startRect.top + startRect.height / 4}px;
            width: ${startRect.width / 2}px;
            height: ${startRect.height / 2}px;
            object-fit: cover;
            border-radius: 0.75rem;
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.8);
            border: 2px solid #a855f7;
            pointer-events: none;
            transition: all 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
        `;

        document.body.appendChild(flyer);

        requestAnimationFrame(() => {
            flyer.style.left = (endRect.left + endRect.width / 2 - 16) + 'px';
            flyer.style.top = (endRect.top + endRect.height / 2 - 16) + 'px';
            flyer.style.width = '32px';
            flyer.style.height = '32px';
            flyer.style.opacity = '0.3';
            flyer.style.transform = 'rotate(360deg)';
        });

        setTimeout(() => {
            flyer.remove();
            updateBadges();
            cartTarget.classList.add('animate-bounce');
            setTimeout(() => cartTarget.classList.remove('animate-bounce'), 600);
        }, 700);
    }

    function notifyCartChange() {
        window.dispatchEvent(new CustomEvent('pixelcart:updated', { detail: getTotals() }));
    }

    // Escuchar cambios en otras pestañas
    window.addEventListener('storage', (e) => {
        if (e.key === CART_KEY || e.key === COUPON_KEY) {
            updateBadges();
            notifyCartChange();
        }
    });

    // Inicializar al cargar
    document.addEventListener('DOMContentLoaded', () => {
        updateBadges();
    });

    return {
        getCart,
        saveCart,
        addItem,
        removeItem,
        updateQty,
        setQty,
        clearCart,
        getTotals,
        formatPrice,
        getCoupon,
        applyCoupon,
        removeCoupon,
        getWishlist,
        toggleWishlist,
        isInWishlist,
        updateBadges,
        showToast,
        flyToCart,
        COUPONS
    };
})();
