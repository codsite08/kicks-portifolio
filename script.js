document.addEventListener('DOMContentLoaded', () => {
    // ESTADO DO CARRINHO
    let carrinho = JSON.parse(localStorage.getItem('kicks_carrinho')) || [];
    let valorFrete = 0;

    // ==========================================================================
    // 1.1 PRELOADER
    // ==========================================================================
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
        preloader?.classList.add('esconder');
    }, 1200);

    // ==========================================================================
    // 1.2 CURSOR PERSONALIZADO
    // ==========================================================================
    const customCursor = document.querySelector('.custom-cursor');
    const customCursorDot = document.querySelector('.custom-cursor-dot');

    window.addEventListener('mousemove', (e) => {
        if (customCursor && customCursorDot) {
            customCursor.style.left = `${e.clientX}px`;
            customCursor.style.top = `${e.clientY}px`;
            customCursorDot.style.left = `${e.clientX}px`;
            customCursorDot.style.top = `${e.clientY}px`;
        }
    });

    document.querySelectorAll('a, button, input, .card-produto').forEach(el => {
        el.addEventListener('mouseenter', () => customCursor?.classList.add('hover'));
        el.addEventListener('mouseleave', () => customCursor?.classList.remove('hover'));
    });

    // ==========================================================================
    // 1.3 SCROLL REVEAL (INTERSECTION OBSERVER)
    // ==========================================================================
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('ativo');
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // ==========================================================================
    // 3.1 MODAL DE BUSCA EM TEMPO REAL
    // ==========================================================================
    const searchTrigger = document.querySelector('.search-trigger');
    const searchModal = document.getElementById('search-modal');
    const btnFecharSearch = document.querySelector('.btn-fechar-search');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');

    searchTrigger?.addEventListener('click', () => {
        searchModal?.classList.add('ativo');
        searchInput?.focus();
    });

    btnFecharSearch?.addEventListener('click', () => searchModal?.classList.remove('ativo'));

    searchInput?.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase().trim();
        if (termo.length === 0) {
            searchResults.innerHTML = '';
            return;
        }

        const cards = document.querySelectorAll('.card-produto');
        let htmlResultados = '';

        cards.forEach(card => {
            const nome = card.dataset.nome;
            const categoria = card.dataset.categoria;
            const preco = card.dataset.preco;
            const imagem = card.dataset.imagem;

            if (nome.toLowerCase().includes(termo) || categoria.toLowerCase().includes(termo)) {
                htmlResultados += `
                    <div class="search-item-result">
                        <img src="${imagem}" alt="${nome}">
                        <div>
                            <h4>${nome}</h4>
                            <p style="color:var(--primary); font-weight:800;">R$ ${parseFloat(preco).toFixed(2)}</p>
                        </div>
                    </div>`;
            }
        });

        searchResults.innerHTML = htmlResultados || '<p style="color:var(--text-muted);">Nenhum tênis encontrado...</p>';
    });

    // ==========================================================================
    // 3.2 MODAL QUICK VIEW
    // ==========================================================================
    const quickviewModal = document.getElementById('quickview-modal');
    const btnFecharModal = document.querySelector('.btn-fechar-modal');
    let produtoQuickViewAtual = null;

    document.querySelectorAll('.btn-quick-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const card = btn.closest('.card-produto');
            
            produtoQuickViewAtual = {
                id: card.dataset.id,
                nome: card.dataset.nome,
                categoria: card.dataset.categoria,
                preco: parseFloat(card.dataset.preco),
                imagem: card.dataset.imagem,
                descricao: card.dataset.descricao
            };

            document.getElementById('qv-img').src = produtoQuickViewAtual.imagem;
            document.getElementById('qv-categoria').textContent = produtoQuickViewAtual.categoria;
            document.getElementById('qv-nome').textContent = produtoQuickViewAtual.nome;
            document.getElementById('qv-preco').textContent = `R$ ${produtoQuickViewAtual.preco.toFixed(2)}`;
            document.getElementById('qv-descricao').textContent = produtoQuickViewAtual.descricao;

            quickviewModal?.classList.add('ativo');
        });
    });

    btnFecharModal?.addEventListener('click', () => quickviewModal?.classList.remove('ativo'));

    document.getElementById('qv-btn-add')?.addEventListener('click', () => {
        if (!produtoQuickViewAtual) return;

        const tamanhoAtivo = document.querySelector('#qv-tamanhos .btn-tamanho.ativo')?.textContent || '40';
        const idItem = `${produtoQuickViewAtual.nome}-${tamanhoAtivo}`;

        const itemExistente = carrinho.find(i => i.id === idItem);
        if (itemExistente) {
            itemExistente.quantidade += 1;
        } else {
            carrinho.push({ ...produtoQuickViewAtual, tamanho: tamanhoAtivo, quantidade: 1 });
        }

        atualizarCarrinho();
        quickviewModal?.classList.remove('ativo');
        abrirCarrinho();
        mostrarToast(`${produtoQuickViewAtual.nome} adicionado ao carrinho!`);
    });

    // ==========================================================================
    // 3.3 CÁLCULO DE FRETE NO CARRINHO
    // ==========================================================================
    const btnCalcularFrete = document.querySelector('.btn-calcular-frete');
    const freteResultado = document.getElementById('frete-resultado');

    btnCalcularFrete?.addEventListener('click', () => {
        const cep = document.getElementById('cep-input').value.replace(/\D/g, '');

        if (cep.length === 8) {
            freteResultado.textContent = 'Calculando...';
            setTimeout(() => {
                valorFrete = 25.00;
                freteResultado.innerHTML = '🚚 Frete Expresso: <strong>R$ 25,00</strong> (Entrega em 3 dias)';
                atualizarCarrinho();
            }, 800);
        } else {
            freteResultado.textContent = 'Por favor, digite um CEP válido (8 dígitos).';
        }
    });

    // ==========================================================================
    // LÓGICA DO CARRINHO E WHATSAPP
    // ==========================================================================
    const cartIcon = document.querySelector('.cart-icon');
    const cartDrawer = document.querySelector('.cart-drawer');
    const cartOverlay = document.querySelector('.cart-overlay');
    const btnFecharCarrinho = document.querySelector('.btn-fechar-carrinho');
    const cartBody = document.querySelector('.cart-body');
    const cartBadge = document.querySelector('.cart-badge');
    const cartTotalVal = document.getElementById('cart-total-val');
    const btnCheckout = document.querySelector('.btn-checkout');

    const abrirCarrinho = () => {
        cartDrawer?.classList.add('ativo');
        cartOverlay?.classList.add('ativo');
    };

    const fecharCarrinho = () => {
        cartDrawer?.classList.remove('ativo');
        cartOverlay?.classList.remove('ativo');
    };

    cartIcon?.addEventListener('click', abrirCarrinho);
    btnFecharCarrinho?.addEventListener('click', fecharCarrinho);
    cartOverlay?.addEventListener('click', fecharCarrinho);

    // SELETOR DE TAMANHO NOS CARDS
    document.querySelectorAll('.card-produto').forEach(card => {
        card.querySelectorAll('.btn-tamanho').forEach(btn => {
            btn.addEventListener('click', () => {
                card.querySelectorAll('.btn-tamanho').forEach(b => b.classList.remove('ativo'));
                btn.classList.add('ativo');
            });
        });
    });

    // ADICIONAR AO CARRINHO (PELO CARD)
    document.querySelectorAll('.btn-add-carrinho').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.card-produto');
            const nome = card.dataset.nome;
            const preco = parseFloat(card.dataset.preco);
            const imagem = card.dataset.imagem;
            const tamanho = card.querySelector('.btn-tamanho.ativo')?.textContent || '40';

            const idItem = `${nome}-${tamanho}`;
            const itemExistente = carrinho.find(i => i.id === idItem);

            if (itemExistente) {
                itemExistente.quantidade += 1;
            } else {
                carrinho.push({ id: idItem, nome, preco, imagem, tamanho, quantidade: 1 });
            }

            atualizarCarrinho();
            abrirCarrinho();
            mostrarToast(`${nome} adicionado ao carrinho!`);
        });
    });

    function atualizarCarrinho() {
        localStorage.setItem('kicks_carrinho', JSON.stringify(carrinho));

        const totalItens = carrinho.reduce((sum, item) => sum + item.quantidade, 0);
        if (cartBadge) cartBadge.textContent = totalItens;

        const subtotal = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
        const totalComFrete = subtotal + valorFrete;

        if (cartTotalVal) {
            cartTotalVal.textContent = totalComFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        }

        if (carrinho.length === 0) {
            cartBody.innerHTML = `
                <div class="carrinho-vazio">
                    <p>Seu carrinho está vazio</p>
                </div>`;
            return;
        }

        cartBody.innerHTML = carrinho.map(item => `
            <div class="cart-item">
                <img src="${item.imagem}" alt="${item.nome}">
                <div class="cart-item-info">
                    <h4>${item.nome}</h4>
                    <p>Tam: ${item.tamanho}</p>
                    <strong>${(item.preco * item.quantidade).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                </div>
                <button class="btn-remover-item" data-id="${item.id}">&times;</button>
            </div>
        `).join('');

        document.querySelectorAll('.btn-remover-item').forEach(btn => {
            btn.addEventListener('click', () => {
                carrinho = carrinho.filter(i => i.id !== btn.dataset.id);
                atualizarCarrinho();
            });
        });
    }

    // FINALIZAR WHATSAPP
    btnCheckout?.addEventListener('click', () => {
        if (carrinho.length === 0) {
            mostrarToast('Seu carrinho está vazio!');
            return;
        }

        let msg = "Olá! Gostaria de finalizar o meu pedido na KICKS:\n\n";
        carrinho.forEach(item => {
            msg += `• *${item.nome}* (Tam: ${item.tamanho}) x${item.quantidade}\n`;
        });

        const subtotal = carrinho.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
        msg += `\n*Frete:* R$ ${valorFrete.toFixed(2)}`;
        msg += `\n*Total:* R$ ${(subtotal + valorFrete).toFixed(2)}`;

        window.open(`https://wa.me/5500000000000?text=${encodeURIComponent(msg)}`, '_blank');
    });

    // 3D TILT TÊNIS HERO
    const heroImageContainer = document.querySelector('.hero-image-container');
    const sneakerImg = heroImageContainer?.querySelector('.sneaker-img');

    heroImageContainer?.addEventListener('mousemove', (e) => {
        const { left, top, width, height } = heroImageContainer.getBoundingClientRect();
        const x = (e.clientX - left) / width - 0.5;
        const y = (e.clientY - top) / height - 0.5;
        if (sneakerImg) {
            sneakerImg.style.transform = `rotate(-6deg) scale(1.08) translate(${x * 25}px, ${y * 25}px) rotateY(${x * 18}deg) rotateX(${-y * 10}deg)`;
        }
    });

    heroImageContainer?.addEventListener('mouseleave', () => {
        if (sneakerImg) sneakerImg.style.transform = 'rotate(-6deg) scale(1.05)';
    });

    // TOAST NOTIFICATION
    function mostrarToast(mensagem) {
        let container = document.getElementById('toast-container') || document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = mensagem;
        container.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    atualizarCarrinho();
});