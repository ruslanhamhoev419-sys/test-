document.addEventListener('DOMContentLoaded', function () {
    const subsContainer = document.getElementById('subsContainer');
    const addSubBtn = document.getElementById('addSubBtn');
    const modalOverlay = document.getElementById('modalOverlay');
    const cancelBtn = document.getElementById('cancelBtn');
    const subForm = document.getElementById('subForm');
    const monthlyTotalEl = document.getElementById('monthlyTotal');
    const activeCountEl = document.getElementById('activeCount');

    let subscriptions = JSON.parse(localStorage.getItem('subscriptions')) || [];
    let editingId = null;

    function updateStats() {
        const monthlyTotal = subscriptions.reduce((sum, sub) => {
            let monthlyPrice = sub.price;
            if (sub.cycle === 'yearly') monthlyPrice = sub.price / 12;
            if (sub.cycle === 'weekly') monthlyPrice = sub.price * 4.33;
            return sum + monthlyPrice;
        }, 0);

        monthlyTotalEl.textContent = monthlyTotal.toFixed(2) + ' ₽';
        activeCountEl.textContent = subscriptions.length;
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    function renderSubscriptions() {
        subsContainer.innerHTML = '';

        if (subscriptions.length === 0) {
            subsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Пока нет ни одной подписки. Добавьте первую!</p>
                </div>
            `;
            return;
        }

        subscriptions.forEach(sub => {
            const subEl = document.createElement('div');
            subEl.className = 'subscription-item';
            subEl.style.borderLeftColor = sub.color;

            const nextDate = new Date(sub.nextDate);
            const today = new Date();
            const daysLeft = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24));

            let dateInfo = `Следующее списание: ${formatDate(sub.nextDate)}`;
            if (daysLeft < 0) {
                dateInfo = `Просрочено на ${Math.abs(daysLeft)} дн.`;
            } else if (daysLeft <= 7) {
                dateInfo = `Через ${daysLeft} дн. • ${formatDate(sub.nextDate)}`;
            }

            subEl.innerHTML = `
                <div class="sub-info">
                    <h4>${sub.name}</h4>
                    <div class="sub-meta">
                        <span><i class="fas fa-ruble-sign"></i> ${sub.price} ₽</span>
                        <span><i class="far fa-calendar"></i>
                            ${sub.cycle === 'monthly' ? 'Ежемесячно' :
                              sub.cycle === 'yearly' ? 'Ежегодно' : 'Еженедельно'}
                        </span>
                        <span><i class="far fa-clock"></i> ${dateInfo}</span>
                    </div>
                </div>
                <div class="sub-actions">
                    <button class="icon-btn edit-btn" data-id="${sub.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="icon-btn delete-btn" data-id="${sub.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;

            subsContainer.appendChild(subEl);
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', e =>
                openModal(e.target.closest('.edit-btn').dataset.id)
            );
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', e =>
                deleteSub(e.target.closest('.delete-btn').dataset.id)
            );
        });

        updateStats();
    }

    function openModal(id = null) {
        editingId = id;
        document.getElementById('modalTitle').textContent =
            id ? 'Редактировать подписку' : 'Новая подписка';

        if (id) {
            const sub = subscriptions.find(s => s.id == id);
            document.getElementById('subName').value = sub.name;
            document.getElementById('subPrice').value = sub.price;
            document.getElementById('subCycle').value = sub.cycle;
            document.getElementById('subNextDate').value = sub.nextDate;
            document.getElementById('subColor').value = sub.color;
        } else {
            subForm.reset();
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            document.getElementById('subNextDate').value =
                nextMonth.toISOString().split('T')[0];
        }

        modalOverlay.style.display = 'flex';
    }

    function closeModal() {
        modalOverlay.style.display = 'none';
        editingId = null;
        subForm.reset();
    }

    function deleteSub(id) {
        if (confirm('Удалить эту подписку?')) {
            subscriptions = subscriptions.filter(s => s.id != id);
            localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
            renderSubscriptions();
        }
    }

    addSubBtn.addEventListener('click', () => openModal());
    cancelBtn.addEventListener('click', closeModal);

    subForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const subData = {
            id: editingId || Date.now(),
            name: document.getElementById('subName').value,
            price: parseFloat(document.getElementById('subPrice').value),
            cycle: document.getElementById('subCycle').value,
            nextDate: document.getElementById('subNextDate').value,
            color: document.getElementById('subColor').value
        };

        if (editingId) {
            const index = subscriptions.findIndex(s => s.id == editingId);
            subscriptions[index] = subData;
        } else {
            subscriptions.push(subData);
        }

        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
        closeModal();
        renderSubscriptions();
    });

    modalOverlay.addEventListener('click', e => {
        if (e.target === modalOverlay) closeModal();
    });

    renderSubscriptions();
});
