const STOCK_STORAGE_KEY = 'meghawatt-stock-state';
const inventoryItems = [
    { name: 'African Tea', category: 'Hot Beverages' },
    { name: 'Herbal Teas', category: 'Hot Beverages' },
    { name: 'Ginger Tea', category: 'Hot Beverages' },
    { name: 'Masala Tea', category: 'Hot Beverages' },
    { name: 'Dawa', category: 'Hot Beverages' },
    { name: 'Hot Chocolate', category: 'Hot Beverages' },
    { name: 'Hot Coffee', category: 'Hot Beverages' },
    { name: 'Delmonte Pkt', category: 'Cold Beverages' },
    { name: 'Peek n Peel', category: 'Cold Beverages' },
    { name: 'Orchid', category: 'Cold Beverages' },
    { name: 'Soda (500ml)', category: 'Cold Beverages' },
    { name: 'Cold Milk', category: 'Cold Beverages' },
    { name: 'Keringet Water', category: 'Cold Beverages' },
    { name: 'Aquamist/Quencher', category: 'Cold Beverages' },
    { name: 'Croissants', category: 'Breakfast Snacks' },
    { name: 'Plain Toast', category: 'Breakfast Snacks' },
    { name: 'Assorted Cookies', category: 'Breakfast Snacks' },
    { name: 'Large Muffin', category: 'Breakfast Snacks' },
    { name: '2kg Cake', category: 'Breakfast Snacks' },
    { name: 'Meat Pie', category: 'Breakfast Snacks' },
    { name: 'Cake Block', category: 'Breakfast Snacks' },
    { name: 'Black Forest Cake', category: 'Breakfast Snacks' },
    { name: 'Doughnuts', category: 'Breakfast Snacks' },
    { name: 'Mandazi', category: 'Breakfast Snacks' },
    { name: 'American Pancake', category: 'Breakfast Snacks' },
    { name: 'Megawatt Bread', category: 'Breakfast Snacks' },
    { name: 'Cinnamon Rolls', category: 'Breakfast Snacks' },
    { name: 'Beef Pies', category: 'Breakfast Snacks' },
    { name: 'Chicken Pie', category: 'Breakfast Snacks' },
    { name: 'Samosa (Beef)', category: 'Breakfast Snacks' },
    { name: 'Veg Samosa', category: 'Breakfast Snacks' },
    { name: 'Baked Beans', category: 'Breakfast Snacks' },
    { name: 'Tea Scones', category: 'Breakfast Snacks' },
    { name: 'Omelette', category: 'Breakfast Snacks' },
    { name: 'Fried Egg', category: 'Breakfast Snacks' },
    { name: 'Boiled Egg', category: 'Breakfast Snacks' },
    { name: 'Nduma', category: 'Breakfast Snacks' },
    { name: 'Sweet Potato', category: 'Breakfast Snacks' },
    { name: 'Sausage', category: 'Breakfast Snacks' },
    { name: 'Deep Fried Nduma', category: 'Breakfast Snacks' },
    { name: 'Bacon', category: 'Breakfast Snacks' },
    { name: 'Lentils', category: 'Vegetarian' },
    { name: 'Green Grams', category: 'Vegetarian' },
    { name: 'Garden Peas', category: 'Vegetarian' },
    { name: 'Vegetable Curry', category: 'Vegetarian' },
    { name: 'Beans Coconut', category: 'Vegetarian' },
    { name: 'Githeri', category: 'Vegetarian' },
    { name: 'Assorted Vegetable', category: 'Vegetarian' },
    { name: 'Vegetable Pilau', category: 'Vegetarian' },
    { name: 'Plain Matoke', category: 'Vegetarian' },
    { name: 'Ugali Vegetables', category: 'Vegetarian' },
    { name: 'Chapati Vegetables', category: 'Vegetarian' },
    { name: 'Rice Vegetables', category: 'Vegetarian' },
    { name: 'Ugali Scrambled', category: 'Vegetarian' },
    { name: 'Mukimo', category: 'Vegetarian' },
    { name: 'Kachumbari', category: 'Salads' },
    { name: 'Garden Salad', category: 'Salads' },
    { name: 'Chef\'s Salad', category: 'Salads' },
    { name: 'Classic Salad', category: 'Salads' }
];

function loadStoredStock() {
    const raw = localStorage.getItem(STOCK_STORAGE_KEY);
    if (!raw) {
        return {};
    }

    try {
        return JSON.parse(raw);
    } catch (error) {
        console.warn('Stock state unreadable', error);
        return {};
    }
}

function saveStockState(state) {
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event('stock-updated'));
}

function loadInventory() {
    const saved = loadStoredStock();
    const container = document.getElementById('inventory-list');
    const summary = document.getElementById('inventory-summary');

    if (!container) {
        return;
    }

    container.innerHTML = '';
    inventoryItems.forEach(item => {
        const isAvailable = saved[item.name] !== false;
        const card = document.createElement('label');
        card.className = 'inventory-card';
        card.innerHTML = `
            <div>
                <strong>${item.name}</strong>
                <small>${item.category}</small>
            </div>
            <div>
                <span class="status-badge ${isAvailable ? '' : 'out'}">${isAvailable ? 'Available' : 'Out'}</span>
                <input type="checkbox" ${isAvailable ? 'checked' : ''}>
            </div>
        `;

        const toggle = card.querySelector('input');
        toggle.addEventListener('change', () => {
            const state = loadStoredStock();
            state[item.name] = toggle.checked;
            saveStockState(state);
            loadInventory();
        });

        container.appendChild(card);
    });

    const outOfStockCount = inventoryItems.filter(item => saved[item.name] === false).length;
    if (summary) {
        summary.textContent = `${inventoryItems.length - outOfStockCount} available • ${outOfStockCount} out of stock`;
    }
}

async function loadOrders() {
    try {
        const response = await fetch('http://localhost:5000/api/orders');
        const orders = await response.json();
        const container = document.getElementById('admin-orders-container');

        container.innerHTML = '';

        if (orders.length === 0) {
            container.innerHTML = '<p class="no-orders">☕ No active orders right now</p>';
            return;
        }

        orders.forEach(order => {
            const items = order.items.map(item => `<li>${item.name} - KES ${item.price}</li>`).join('');
            container.innerHTML += `
                <div class="order-card">
                    <div class="order-header"><span>${order.customer.name}</span></div>
                    <ul>${items}</ul>
                    <div>KES ${order.total}</div>
                    <div class="location-badge">📍 ${order.customer.location}</div>
                    <button class="complete-btn" onclick="completeOrder('${order._id}')">Mark Served</button>
                </div>`;
        });
    } catch (error) {
        console.log(error);
    }
}

async function completeOrder(id) {
    await fetch(`http://localhost:5000/api/orders/${id}`, { method: 'PUT' });
    loadOrders();
}

window.onload = () => {
    loadInventory();
    loadOrders();
};
window.addEventListener('storage', loadInventory);