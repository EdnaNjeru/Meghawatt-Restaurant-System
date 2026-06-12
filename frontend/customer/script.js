let cart = [];
let cartSidebar, cartItemsContainer, cartTotalElement, overlay;
let checkoutModal, checkoutForm, checkoutItems, checkoutTotalAmount;
let itemModal, itemModalOverlay, itemModalImage, itemModalTitle, itemModalCategory, itemModalDescription, itemModalIncludes, itemModalStatus, itemModalPrice, addItemToCartButton;
let menuItems = [];
let selectedMenuItem = null;
let cartToast;
let cartToastTimer;
const STOCK_STORAGE_KEY = 'meghawatt-stock-state';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    cartSidebar = document.getElementById('cart-sidebar');
    cartItemsContainer = document.getElementById('cart-items');
    cartTotalElement = document.getElementById('cart-total');
    overlay = document.getElementById('overlay');
    checkoutModal = document.getElementById('checkout-modal');
    checkoutForm = document.getElementById('checkout-form');
    checkoutItems = document.getElementById('checkout-items');
    checkoutTotalAmount = document.getElementById('checkout-total-amount');

    itemModal = document.getElementById('item-modal');
    itemModalOverlay = document.getElementById('item-modal-overlay');
    itemModalImage = document.getElementById('item-modal-image');
    itemModalTitle = document.getElementById('item-modal-title');
    itemModalCategory = document.getElementById('item-modal-category');
    itemModalDescription = document.getElementById('item-modal-description');
    itemModalIncludes = document.getElementById('item-modal-includes');
    itemModalStatus = document.getElementById('item-modal-status');
    itemModalPrice = document.getElementById('item-modal-price');
    addItemToCartButton = document.getElementById('add-item-to-cart');
    cartToast = document.getElementById('cart-toast');

    initializeMenuCards();
    sanitizeCart();

    // Open/Close Cart
    const orderLink = document.querySelector('.order-link a');
    if (orderLink) {
        orderLink.addEventListener('click', (e) => {
            e.preventDefault();
            cartSidebar.classList.add('active');
            overlay.classList.add('active');
        });
    }

    const closeCartBtn = document.getElementById('close-cart');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    // Close cart when clicking overlay
    if (overlay) {
        overlay.addEventListener('click', () => {
            cartSidebar.classList.remove('active');
            overlay.classList.remove('active');
            checkoutModal.classList.remove('active');
            closeItemModal();
        });
    }

    // Checkout button click
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Your cart is empty. Please add items first.');
                return;
            }
            openCheckoutModal();
        });
    }

    // Close checkout modal
    const closeCheckoutBtn = document.getElementById('close-checkout');
    if (closeCheckoutBtn) {
        closeCheckoutBtn.addEventListener('click', () => {
            checkoutModal.classList.remove('active');
            overlay.classList.remove('active');
        });
    }

    const closeItemModalBtn = document.getElementById('close-item-modal');
    if (closeItemModalBtn) {
        closeItemModalBtn.addEventListener('click', closeItemModal);
    }

    if (itemModalOverlay) {
        itemModalOverlay.addEventListener('click', closeItemModal);
    }

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }

    window.addEventListener('storage', refreshStockState);
    window.addEventListener('focus', refreshStockState);
});

function initializeMenuCards() {
    const cards = Array.from(document.querySelectorAll('.menu-card'));
    menuItems = cards.map(card => {
        const title = card.querySelector('h3');
        const price = card.querySelector('.price');
        const name = normalizeMenuName(title ? title.textContent : card.textContent);
        const priceValue = parseInt((price ? price.textContent : '0').replace(/[^0-9]/g, ''), 10) || 0;
        const section = card.closest('.menu-category');
        const category = section ? section.id : 'general';
        const details = getItemDetails(name, category);
        const item = {
            name,
            price: priceValue,
            category,
            description: details.description,
            includes: details.includes,
            image: createMenuItemImage(name, category),
            inStock: getStoredStockStatus(name, true)
        };

        card.onclick = null;
        card.setAttribute('data-item-name', name);
        card.addEventListener('click', () => openItemModal(item));
        updateMenuCardState(card, item);
        return item;
    });
}

function refreshStockState() {
    menuItems.forEach(item => {
        item.inStock = getStoredStockStatus(item.name, true);
        const card = Array.from(document.querySelectorAll('.menu-card')).find(entry => entry.getAttribute('data-item-name') === item.name);
        if (card) {
            updateMenuCardState(card, item);
        }
    });
    sanitizeCart();
}

function normalizeMenuName(text) {
    return text.replace(/[⭐✦]/g, '').replace(/\s+/g, ' ').trim();
}

function getStoredStockStatus(name, fallback = true) {
    const raw = localStorage.getItem(STOCK_STORAGE_KEY);
    if (!raw) {
        return fallback;
    }

    try {
        const state = JSON.parse(raw);
        if (Object.prototype.hasOwnProperty.call(state, name)) {
            return state[name];
        }
    } catch (error) {
        console.warn('Could not read stock state', error);
    }

    return fallback;
}

function updateMenuCardState(card, item) {
    card.classList.toggle('out-of-stock', !item.inStock);
    card.classList.toggle('selected', false);
    card.setAttribute('aria-disabled', item.inStock ? 'false' : 'true');

    const existingBadge = card.querySelector('.stock-pill');
    if (!item.inStock) {
        if (!existingBadge) {
            const badge = document.createElement('span');
            badge.className = 'stock-pill';
            badge.textContent = 'Out of stock';
            card.appendChild(badge);
        }
    } else if (existingBadge) {
        existingBadge.remove();
    }
}

function openItemModal(item) {
    selectedMenuItem = item;
    const cards = document.querySelectorAll('.menu-card');
    cards.forEach(card => {
        card.classList.toggle('selected', card.getAttribute('data-item-name') === item.name);
    });

    if (!itemModal || !itemModalImage || !itemModalTitle || !itemModalDescription || !itemModalIncludes || !itemModalStatus || !itemModalPrice || !addItemToCartButton) {
        return;
    }

    itemModalImage.src = item.image;
    itemModalImage.alt = item.name;
    itemModalTitle.textContent = item.name;
    itemModalCategory.textContent = formatCategory(item.category);
    itemModalDescription.textContent = item.description;
    itemModalIncludes.textContent = `Includes: ${item.includes}`;
    itemModalPrice.textContent = `KES ${item.price.toFixed(2)}`;
    itemModalStatus.textContent = item.inStock ? 'Available now' : 'Temporarily unavailable';
    itemModalStatus.className = `item-modal-status ${item.inStock ? 'available' : 'unavailable'}`;
    addItemToCartButton.disabled = !item.inStock;
    addItemToCartButton.textContent = item.inStock ? (isItemInCart(item.name) ? 'Added to Order' : 'Add to Order') : 'Unavailable';
    addItemToCartButton.onclick = () => {
        if (!item.inStock) {
            return;
        }
        addToCart(item.name, item.price);
        closeItemModal();
    };

    itemModal.classList.add('active');
    itemModalOverlay.classList.add('active');
}

function closeItemModal() {
    if (!itemModal || !itemModalOverlay) {
        return;
    }

    itemModal.classList.remove('active');
    itemModalOverlay.classList.remove('active');
    document.querySelectorAll('.menu-card').forEach(card => card.classList.remove('selected'));
    selectedMenuItem = null;
}

function isItemInCart(name) {
    return cart.some(entry => entry.name === name);
}

function updateAddedToCartState() {
    const cartNames = new Set(cart.map(item => item.name));
    document.querySelectorAll('.menu-card').forEach(card => {
        const itemName = card.getAttribute('data-item-name');
        const isAdded = itemName && cartNames.has(itemName);
        card.classList.toggle('added-to-cart', isAdded);

        const existingBadge = card.querySelector('.cart-badge');
        if (isAdded) {
            if (!existingBadge) {
                const badge = document.createElement('span');
                badge.className = 'cart-badge';
                badge.textContent = 'Added ✓';
                card.appendChild(badge);
            }
        } else if (existingBadge) {
            existingBadge.remove();
        }
    });
}

function showCartFeedback(name) {
    if (!cartToast) {
        return;
    }

    cartToast.textContent = `${name} added to cart`;
    cartToast.classList.add('active');

    if (cartToastTimer) {
        clearTimeout(cartToastTimer);
    }

    cartToastTimer = setTimeout(() => {
        cartToast.classList.remove('active');
    }, 1800);
}

function createMenuItemImage(name, category) {
    const emoji = getEmojiForCategory(category, name);
    const safeName = name.replace(/&/g, '&amp;');
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340">
            <rect width="600" height="340" rx="24" fill="#fff7e6"/>
            <rect x="24" y="24" width="552" height="292" rx="18" fill="#ffffff" stroke="#d4af37" stroke-width="3"/>
            <circle cx="300" cy="140" r="90" fill="#ffe7a3"/>
            <text x="300" y="150" text-anchor="middle" font-size="76">${emoji}</text>
            <text x="300" y="260" text-anchor="middle" font-size="24" font-family="Poppins, Arial, sans-serif" fill="#003366">${safeName}</text>
        </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getEmojiForCategory(category, name) {
    const normalized = name.toLowerCase();
    if (normalized.includes('tea') || normalized.includes('coffee') || normalized.includes('coffee') || normalized.includes('chocolate')) {
        return '☕';
    }
    if (normalized.includes('juice') || normalized.includes('water') || normalized.includes('soda') || normalized.includes('milk')) {
        return '🥤';
    }
    if (normalized.includes('cake') || normalized.includes('cookie') || normalized.includes('muffin') || normalized.includes('bread') || normalized.includes('pastry') || normalized.includes('doughnut') || normalized.includes('mandazi') || normalized.includes('pancake') || normalized.includes('scone')) {
        return '🥐';
    }
    if (normalized.includes('salad') || normalized.includes('vegetable') || normalized.includes('peas') || normalized.includes('lentils') || normalized.includes('githeri') || normalized.includes('mukimo')) {
        return '🥗';
    }
    if (normalized.includes('pie') || normalized.includes('samosa') || normalized.includes('egg') || normalized.includes('sausage') || normalized.includes('bacon')) {
        return '🥟';
    }
    return category === 'cold-beverages' ? '🧊' : '🍽️';
}

function getItemDetails(name, category) {
    const details = {
        'African Tea': { description: 'A fragrant, comforting tea served with a smooth finish.', includes: 'Freshly brewed tea and a warm serving cup.' },
        'Herbal Teas': { description: 'A calming herbal blend with floral and earthy notes.', includes: 'A premium herbal infusion and a hint of honey.' },
        'Ginger Tea': { description: 'Bold ginger flavor with a bright and warming finish.', includes: 'Fresh ginger and a comforting cup.' },
        'Masala Tea': { description: 'Classic masala chai blended with aromatic spices.', includes: 'Spiced chai and a hint of milk.' },
        'Dawa': { description: 'A signature wellness drink with honey, lemon and ginger.', includes: 'Honey, lemon and fresh ginger.' },
        'Hot Chocolate': { description: 'Velvety cocoa with a rich creamy texture.', includes: 'Creamy hot chocolate and whipped topping.' },
        'Hot Coffee': { description: 'Rich, bold coffee made for slow sipping.', includes: 'Freshly brewed coffee and milk.' },
        'Delmonte Pkt': { description: 'A tropical fruit blend with bright citrus notes.', includes: 'Juice blend and ice chips.' },
        'Peek n Peel': { description: 'Crisp fruit flavor with a refreshing finish.', includes: 'Fruit beverage and chilled garnish.' },
        'Orchid': { description: 'An exotic drink crafted for a light refreshment.', includes: 'A chilled house blend and citrus garnish.' },
        'Soda (500ml)': { description: 'Ice-cold soda served crisp and refreshing.', includes: 'Chilled soda and a straw.' },
        'Cold Milk': { description: 'Cold creamy milk served well chilled.', includes: 'Fresh dairy milk and ice.' },
        'Keringet Water': { description: 'Pure mineral water for easy hydration.', includes: 'Bottled mineral water.' },
        'Aquamist/Quencher': { description: 'A cool, crisp drink for quick refreshment.', includes: 'Chilled water and a fresh serving.' },
        'Croissants': { description: 'Buttery, flaky croissants baked fresh for the morning rush.', includes: 'Butter pastry and a side of jam.' },
        'Plain Toast': { description: 'Simple and comforting toast served warm.', includes: 'Fresh toast and butter.' },
        'Assorted Cookies': { description: 'A mini selection of baked cookies with different flavors.', includes: 'Assorted cookies and tea pairing.' },
        'Large Muffin': { description: 'A soft bakery muffin with a tender crumb.', includes: 'Fresh muffin and butter.' },
        '2kg Cake': { description: 'A celebration cake available in assorted flavors.', includes: 'Cake slices and party-ready presentation.' },
        'Meat Pie': { description: 'Flaky pastry filled with seasoned meat.', includes: 'Savory pie filling and crisp crust.' },
        'Cake Block': { description: 'A dense, rich cake block for sharing.', includes: 'Cake slices and a premium topping.' },
        'Black Forest Cake': { description: 'A classic layered cake with rich chocolate and cherries.', includes: 'Chocolate layers and cherry garnish.' },
        'Doughnuts': { description: 'Soft and sweet doughnuts baked to perfection.', includes: 'Fresh doughnuts and jam dip.' },
        'Mandazi': { description: 'A golden fried pastry with a light, sweet bite.', includes: 'Freshly fried mandazi.' },
        'American Pancake': { description: 'Fluffy pancakes served warm and golden.', includes: 'Pancakes and syrup.' },
        'Megawatt Bread': { description: 'Our signature loaf made fresh for every service.', includes: 'Signature bread and butter.' },
        'Cinnamon Rolls': { description: 'Soft spirals with a sweet cinnamon finish.', includes: 'Warm cinnamon rolls and glaze.' },
        'Beef Pies': { description: 'Savory beef-filled pastry with a crisp shell.', includes: 'Beef pie filling and flaky pastry.' },
        'Chicken Pie': { description: 'Tender chicken filling wrapped in buttery pastry.', includes: 'Chicken filling and golden crust.' },
        'Samosa (Beef)': { description: 'Crispy fried samosas made with seasoned beef.', includes: 'Crispy pastry and beef filling.' },
        'Veg Samosa': { description: 'Vegetarian samosas with warm spices and crunch.', includes: 'Crispy pastry and veggie filling.' },
        'Baked Beans': { description: 'Hearty baked beans served warm and savory.', includes: 'Beans and seasoning.' },
        'Tea Scones': { description: 'Light tea scones with a delicate crumb.', includes: 'Scones and butter.' },
        'Omelette': { description: 'A fluffy omelette prepared fresh to order.', includes: 'Eggs and herbs.' },
        'Fried Egg': { description: 'A classic fried egg cooked to your preference.', includes: 'Egg and seasoning.' },
        'Boiled Egg': { description: 'A simple boiled egg for a quick bite.', includes: 'Soft-boiled egg.' },
        'Nduma': { description: 'A local favorite packed with flavor and texture.', includes: 'Freshly prepared nduma and sides.' },
        'Sweet Potato': { description: 'Warm, filling sweet potato served fresh.', includes: 'Roasted sweet potato and seasoning.' },
        'Sausage': { description: 'Savory sausage served hot and juicy.', includes: 'Cooked sausage and a side of sauce.' },
        'Deep Fried Nduma': { description: 'Crisp fried nduma with a satisfying crunch.', includes: 'Crispy nduma and seasoning.' },
        'Bacon': { description: 'Crispy bacon with a smoky finish.', includes: 'Crispy bacon strips.' },
        'Lentils': { description: 'Protein-rich lentils simmered with herbs and spice.', includes: 'Lentils and a savory sauce.' },
        'Green Grams': { description: 'Tender green grams cooked with rich flavor.', includes: 'Green grams and seasoning.' },
        'Garden Peas': { description: 'Fresh garden peas in a rich tomato-based sauce.', includes: 'Garden peas and a light gravy.' },
        'Vegetable Curry': { description: 'Aromatic vegetable curry with seasonal vegetables.', includes: 'Mixed vegetables and curry sauce.' },
        'Beans Coconut': { description: 'Creamy beans simmered with coconut for richness.', includes: 'Beans, coconut and spices.' },
        'Githeri': { description: 'A hearty Kenyan staple of beans and maize.', includes: 'Beans, maize and seasoning.' },
        'Assorted Vegetable': { description: 'A colorful medley of fresh vegetables.', includes: 'Seasonal vegetables and herbs.' },
        'Vegetable Pilau': { description: 'Fragrant rice cooked with vegetables and spices.', includes: 'Vegetable pilau and garnish.' },
        'Plain Matoke': { description: 'Traditional matoke with a soft, comforting texture.', includes: 'Fresh matoke and seasoning.' },
        'Ugali Vegetables': { description: 'A hearty plate with ugali and vegetable sides.', includes: 'Ugali, vegetables and sauce.' },
        'Chapati Vegetables': { description: 'Soft chapati served with fresh vegetable sides.', includes: 'Chapati and vegetable accompaniment.' },
        'Rice Vegetables': { description: 'Simple rice served with a fresh vegetable medley.', includes: 'Rice and vegetables.' },
        'Ugali Scrambled': { description: 'Ugali served with scrambled eggs and seasoning.', includes: 'Ugali and scrambled eggs.' },
        'Mukimo': { description: 'Mashed green vegetables and potatoes with a rich finish.', includes: 'Mukimo and a fresh garnish.' },
        'Kachumbari': { description: 'A fresh tomato and onion salad with a crisp bite.', includes: 'Fresh vegetables and a light dressing.' },
        'Garden Salad': { description: 'Mixed greens topped with a crisp seasonal finish.', includes: 'Leafy greens and dressing.' },
        'Chef\'s Salad': { description: 'A premium salad made with the freshest ingredients.', includes: 'Mixed greens, toppings and dressing.' },
        'Classic Salad': { description: 'A hearty salad with a choice of meat or fish.', includes: 'Salad greens and your protein of choice.' }
    };

    return details[name] || {
        description: `A freshly prepared ${category.replace(/-/g, ' ')} favorite from Meghawatt.`,
        includes: 'Made fresh daily with house ingredients.'
    };
}

function formatCategory(category) {
    const labels = {
        'hot-beverages': 'Hot Beverages',
        'cold-beverages': 'Cold Beverages',
        breakfast: 'Breakfast Snacks',
        vegetarian: 'Vegetarian',
        salads: 'Salads'
    };
    return labels[category] || 'House Special';
}

// Add Item Function
function addToCart(name, price) {
    const item = menuItems.find(entry => entry.name === name);
    if (item && !item.inStock) {
        alert(`${name} is currently out of stock.`);
        return;
    }

    cart.push({ name, price });
    updateCartUI();
    showCartFeedback(name);
}

// Remove Item Function
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function sanitizeCart() {
    const removedItems = [];
    cart = cart.filter(item => {
        const isAvailable = getStoredStockStatus(item.name, true);
        if (!isAvailable) {
            removedItems.push(item.name);
        }
        return isAvailable;
    });

    if (removedItems.length > 0) {
        updateCartUI();
    }
}

// Update the Cart Display
function updateCartUI() {
    if (!cartItemsContainer || !cartTotalElement) {
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-msg">Your tray is empty.</p>';
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <div>
                    <h4>${item.name}</h4>
                    <small>KES ${item.price}</small>
                </div>
                <span class="remove-item" onclick="removeFromCart(${index})">&times;</span>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    }

    cartTotalElement.innerText = `KES ${total.toFixed(2)}`;
    const orderLink = document.querySelector('.order-link a');
    if (orderLink) {
        orderLink.innerText = `📋 My Order (${cart.length})`;
    }

    updateAddedToCartState();
}

// Open Checkout Modal
function openCheckoutModal() {
    if (!checkoutModal || !checkoutItems || !checkoutTotalAmount) {
        return;
    }

    checkoutItems.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price;
        const itemElement = document.createElement('div');
        itemElement.className = 'checkout-item';
        itemElement.innerHTML = `
            <span>${item.name}</span>
            <span>KES ${item.price}</span>
        `;
        checkoutItems.appendChild(itemElement);
    });

    checkoutTotalAmount.innerText = `KES ${total.toFixed(2)}`;
    checkoutModal.classList.add('active');
    overlay.classList.add('active');
}

// Handle Checkout Form Submission
function handleCheckoutSubmit(e) {
    e.preventDefault();

    if (cart.length === 0) {
        alert('Your cart is empty. Please add items first.');
        return;
    }

    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;
    const location = document.getElementById('customer-location').value;
    const notes = document.getElementById('customer-notes').value;
    const total = cart.reduce((sum, item) => sum + item.price, 0);

    const order = {
        id: Date.now(),
        customer: {
            name: name,
            phone: phone,
            location: location
        },
        items: cart,
        notes: notes,
        total: total,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
    })
    .then(response => response.json())
    .then(data => {
        alert(`Order placed successfully!\n\nOrder ID: ${data.id}`);
        cart = [];
        updateCartUI();
        checkoutModal.classList.remove('active');
        overlay.classList.remove('active');
        cartSidebar.classList.remove('active');
        checkoutForm.reset();
    })
    .catch(error => {
        console.log(error);
        alert('Could not place order');
    });
}

