/**
 * PixelArek - Lógica del Carrito de Compras Profesional
 * Interactúa con PixelCart (cart-store.js) para renderizado reactivo,
 * cupones de descuento, simulación de pago seguro y entrega de claves.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCartPage();

    // Comprobar si se solicitó abrir checkout directo desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'open') {
        const cart = PixelCart.getCart();
        if (cart.length > 0) {
            setTimeout(openCheckoutModal, 300);
        }
    }
});

// Inicializar la página de carrito
function initCartPage() {
    renderCart();
    renderCouponState();

    // Escuchar eventos de actualización
    window.addEventListener('pixelcart:updated', () => {
        renderCart();
        renderCouponState();
    });

    // Formateador automático de tarjeta de crédito
    const cardInput = document.getElementById('card-num');
    if (cardInput) {
        cardInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            val = val.substring(0, 16);
            let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
            e.target.value = formatted;
        });
    }

    const expInput = document.getElementById('card-exp');
    if (expInput) {
        expInput.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, '');
            val = val.substring(0, 4);
            if (val.length >= 2) {
                e.target.value = val.substring(0, 2) + '/' + val.substring(2);
            } else {
                e.target.value = val;
            }
        });
    }
}

// Corregir rutas relativas de imágenes según el nivel de directorio
function resolveImagePath(path) {
    if (!path) return '../images/fifa.png';
    if (path.startsWith('http')) return path;
    if (path.startsWith('../')) return path;
    if (path.startsWith('images/')) return '../' + path;
    if (path.startsWith('/images/')) return '..' + path;
    return '../' + path;
}

// Renderizar la lista de productos
function renderCart() {
    const cart = PixelCart.getCart();
    const totals = PixelCart.getTotals();

    const itemsContainer = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('empty-cart-state');
    const actionsBar = document.getElementById('cart-actions-bar');
    const checkoutBtn = document.getElementById('checkout-btn');

    // Header label
    const headerLabel = document.getElementById('header-items-label');
    if (headerLabel) {
        headerLabel.textContent = `${totals.count} Juego${totals.count === 1 ? '' : 's'}`;
    }

    // Actualizar resumen
    document.getElementById('summary-items-count').textContent = totals.count;
    document.getElementById('summary-subtotal').textContent = totals.formattedSubtotal;
    document.getElementById('summary-total').textContent = totals.formattedTotal;

    const discountRow = document.getElementById('summary-discount-row');
    const discountEl = document.getElementById('summary-discount');
    if (totals.discount > 0) {
        discountRow.classList.remove('hidden');
        discountEl.textContent = '-' + totals.formattedDiscount;
    } else {
        discountRow.classList.add('hidden');
    }

    // Si el carrito está vacío
    if (cart.length === 0) {
        itemsContainer.innerHTML = '';
        itemsContainer.classList.add('hidden');
        emptyState.classList.remove('hidden');
        actionsBar.classList.add('hidden');
        checkoutBtn.disabled = true;
        checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
        return;
    }

    // Si hay productos
    itemsContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');
    actionsBar.classList.remove('hidden');
    checkoutBtn.disabled = false;
    checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');

    // Generar HTML de cada fila/tarjeta de producto
    itemsContainer.innerHTML = cart.map(item => {
        const itemSubtotal = PixelCart.formatPrice(item.price * item.qty);
        const imgSrc = resolveImagePath(item.image);

        return `
            <div class="fade-in bg-gray-900/90 border border-gray-800 hover:border-purple-500/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-lg transition">
                
                <!-- Portada del Juego -->
                <div class="relative w-20 sm:w-24 aspect-[3/4] flex-shrink-0 bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
                    <img src="${imgSrc}" alt="${item.name}" class="w-full h-full object-cover">
                </div>

                <!-- Detalles del Juego -->
                <div class="flex-1 text-center sm:text-left min-w-0 space-y-1">
                    <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <span class="text-[11px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/20">
                            ${item.platform || 'Multiplataforma'}
                        </span>
                        <span class="text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                            <i class="fa-solid fa-bolt mr-1"></i> Entrega Digital
                        </span>
                    </div>

                    <h3 class="text-lg font-bold text-white truncate">${item.name}</h3>
                    <p class="text-xs text-gray-400">Edición Oficial Global · Activación Digital Instantánea</p>
                    <div class="text-xs text-gray-400 sm:pt-1">
                        Precio unitario: <span class="text-purple-300 font-bold">${PixelCart.formatPrice(item.price)}</span>
                    </div>
                </div>

                <!-- Selector de Cantidad -->
                <div class="flex items-center gap-2 bg-gray-950 border border-gray-800 rounded-xl p-1.5 shadow-inner">
                    <button 
                        onclick="PixelCart.updateQty('${item.name}', -1); renderCart();" 
                        class="w-8 h-8 rounded-lg bg-gray-900 hover:bg-purple-600 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition"
                        title="Disminuir cantidad"
                    >
                        −
                    </button>
                    <input 
                        type="number" 
                        min="1" 
                        max="99" 
                        value="${item.qty}" 
                        onchange="PixelCart.setQty('${item.name}', this.value); renderCart();" 
                        class="w-10 bg-transparent text-center text-white font-bold text-sm focus:outline-none"
                    >
                    <button 
                        onclick="PixelCart.updateQty('${item.name}', 1); renderCart();" 
                        class="w-8 h-8 rounded-lg bg-gray-900 hover:bg-purple-600 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition"
                        title="Aumentar cantidad"
                    >
                        +
                    </button>
                </div>

                <!-- Subtotal de Línea -->
                <div class="text-center sm:text-right min-w-[90px]">
                    <span class="text-xs text-gray-400 block sm:hidden">Total item:</span>
                    <strong class="text-xl font-black text-white font-display block">${itemSubtotal}</strong>
                </div>

                <!-- Botón Eliminar -->
                <button 
                    onclick="PixelCart.removeItem('${item.name}'); PixelCart.showToast('${item.name} eliminado del carrito', 'info'); renderCart();" 
                    class="text-gray-500 hover:text-red-400 p-2.5 rounded-xl hover:bg-gray-800 transition text-base"
                    title="Eliminar de la orden"
                >
                    <i class="fa-solid fa-trash-can"></i>
                </button>

            </div>
        `;
    }).join('');
}

// Estado del cupón de descuento
function renderCouponState() {
    const coupon = PixelCart.getCoupon();
    const tag = document.getElementById('applied-coupon-tag');
    const codeLabel = document.getElementById('coupon-code-label');
    const descLabel = document.getElementById('coupon-desc-label');

    if (coupon) {
        tag.classList.remove('hidden');
        codeLabel.textContent = coupon.code;
        descLabel.textContent = coupon.desc;
    } else {
        tag.classList.add('hidden');
    }
}

// Aplicar cupón desde el input
function applyPromoCoupon() {
    const input = document.getElementById('coupon-input');
    const code = input.value.trim();
    if (!code) {
        PixelCart.showToast('Por favor introduce un código de cupón', 'error');
        return;
    }

    const res = PixelCart.applyCoupon(code);
    if (res.success) {
        PixelCart.showToast(res.message, 'success');
        input.value = '';
    } else {
        PixelCart.showToast(res.message, 'error');
    }
    renderCart();
    renderCouponState();
}

// Quitar cupón
function removePromoCoupon() {
    PixelCart.removeCoupon();
    PixelCart.showToast('Cupón removido', 'info');
    renderCart();
    renderCouponState();
}

// Vaciar carrito con confirmación
function confirmClearCart() {
    if (confirm('¿Estás seguro de que deseas vaciar tu carrito de compras?')) {
        PixelCart.clearCart();
        PixelCart.showToast('Tu carrito ha sido vaciado', 'info');
        renderCart();
    }
}

// Añadir complemento (Cross-sell)
function addAddon(name, price, image, platform) {
    PixelCart.addItem({
        name,
        price,
        image,
        platform
    });
    PixelCart.showToast(`¡${name} añadido a tu orden!`, 'success');
    renderCart();
}

// Modal de Checkout
function openCheckoutModal() {
    const cart = PixelCart.getCart();
    if (cart.length === 0) {
        PixelCart.showToast('Tu carrito está vacío. Agrega juegos antes de pagar.', 'error');
        return;
    }

    const totals = PixelCart.getTotals();
    document.getElementById('modal-total-label').textContent = totals.formattedTotal;
    
    // Resetear estados del modal
    document.getElementById('checkout-form').classList.remove('hidden');
    document.getElementById('payment-processing').classList.add('hidden');
    document.getElementById('payment-success').classList.add('hidden');

    document.getElementById('checkout-modal').classList.remove('hidden');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.add('hidden');
}

// Generador de Claves Digitales de Videojuegos
function generateGameKey(gameName) {
    const prefix = gameName.replace(/[^A-Za-z]/g, '').substring(0, 4).toUpperCase() || 'PX26';
    const randomHex = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${randomHex()}-${randomHex()}-${randomHex()}`;
}

// Procesar Pago
function processPayment(e) {
    e.preventDefault();

    const buyerName = document.getElementById('buyer-name').value;
    const buyerEmail = document.getElementById('buyer-email').value;
    const cart = PixelCart.getCart();
    const totals = PixelCart.getTotals();

    // Mostrar estado de procesamiento
    document.getElementById('checkout-form').classList.add('hidden');
    document.getElementById('payment-processing').classList.remove('hidden');

    setTimeout(() => {
        // Simular éxito de pago tras 1.8s
        document.getElementById('payment-processing').classList.add('hidden');
        document.getElementById('payment-success').classList.remove('hidden');

        // Generar Order ID aleatorio
        const orderId = '#PX-' + Math.floor(100000 + Math.random() * 900000);
        document.getElementById('success-order-id').textContent = orderId;
        document.getElementById('success-email').textContent = buyerEmail;

        // Renderizar claves generadas
        const keysList = document.getElementById('generated-keys-list');
        keysList.innerHTML = cart.map(item => {
            const keys = [];
            for (let i = 0; i < item.qty; i++) {
                keys.push(generateGameKey(item.name));
            }

            return `
                <div class="bg-gray-900 border border-gray-800 p-3 rounded-xl space-y-2">
                    <div class="flex items-center justify-between text-xs">
                        <span class="font-bold text-white">${item.name} (${item.platform})</span>
                        <span class="text-purple-400 font-semibold">${item.qty} Clave${item.qty > 1 ? 's' : ''}</span>
                    </div>
                    ${keys.map(k => `
                        <div class="flex items-center justify-between bg-black/60 px-3 py-1.5 rounded-lg border border-purple-500/30">
                            <code class="text-xs text-yellow-300 font-mono tracking-wider font-bold select-all">${k}</code>
                            <button onclick="copyToClipboard('${k}', this)" class="text-xs text-gray-400 hover:text-white px-2 py-0.5 rounded bg-gray-800 hover:bg-purple-600 transition flex items-center gap-1">
                                <i class="fa-regular fa-copy"></i> <span>Copiar</span>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }).join('');

        // Guardar última orden para comprobante
        window.lastOrder = {
            orderId,
            buyerName,
            buyerEmail,
            date: new Date().toLocaleString('es-ES'),
            items: [...cart],
            totals: { ...totals }
        };

        // Vaciar el carrito tras el pago completado
        PixelCart.clearCart();
        PixelCart.removeCoupon();

    }, 1800);
}

// Copiar clave al portapapeles
function copyToClipboard(text, btnEl) {
    navigator.clipboard.writeText(text).then(() => {
        const span = btnEl.querySelector('span');
        const originalText = span.textContent;
        span.textContent = '¡Copiado!';
        btnEl.classList.add('bg-emerald-600', 'text-white');
        setTimeout(() => {
            span.textContent = originalText;
            btnEl.classList.remove('bg-emerald-600', 'text-white');
        }, 1500);
    });
}

// Descargar comprobante de compra
function downloadReceipt() {
    if (!window.lastOrder) return;
    const order = window.lastOrder;

    let receiptContent = `========================================================\n`;
    receiptContent += `         PIXELAREK VIDEO GAME STORE - RECIBO DE COMPRA\n`;
    receiptContent += `========================================================\n`;
    receiptContent += `Número de Pedido : ${order.orderId}\n`;
    receiptContent += `Fecha y Hora     : ${order.date}\n`;
    receiptContent += `Cliente          : ${order.buyerName}\n`;
    receiptContent += `Correo Entrega   : ${order.buyerEmail}\n`;
    receiptContent += `Método de Entrega: Clave Digital Instantánea (Online)\n`;
    receiptContent += `--------------------------------------------------------\n`;
    receiptContent += `PRODUCTOS ADQUIRIDOS:\n`;
    order.items.forEach((item, idx) => {
        receiptContent += `${idx + 1}. ${item.name} (${item.platform}) x${item.qty} - $${(item.price * item.qty).toFixed(2)}\n`;
    });
    receiptContent += `--------------------------------------------------------\n`;
    receiptContent += `Subtotal         : ${order.totals.formattedSubtotal}\n`;
    if (order.totals.discount > 0) {
        receiptContent += `Descuento        : -${order.totals.formattedDiscount} (${order.totals.coupon?.code || 'Cupón'})\n`;
    }
    receiptContent += `Total Pagado     : ${order.totals.formattedTotal} USD\n`;
    receiptContent += `========================================================\n`;
    receiptContent += `Instrucciones de canje:\n`;
    receiptContent += `1. Abre el launcher respectivo (Steam, PlayStation Store, Xbox Live).\n`;
    receiptContent += `2. Ve a 'Canjear Código' e introduce tu clave exactamente.\n`;
    receiptContent += `3. ¡A jugar! Soporte 24/7 en soporte@pixelarek.com\n`;
    receiptContent += `========================================================\n`;

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Comprobante_${order.orderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
}
